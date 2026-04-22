# 🗄️ Database Schema Reference & Example Data
> **Platform:** Educational Social Platform — Post Module  
> **DB:** MongoDB (Mongoose)  
> **Purpose:** Exact schema definitions + realistic sample documents for every post type  
> **Use this file as:** Ground truth for implementation, testing, and AI code generation

---

## 📐 Collection Index

| Collection | Purpose | Key Constraint |
|---|---|---|
| `posts` | Unified post store (all types) | Compound indexes on status+visibility+communityId |
| `pollvotes` | Poll vote records | Unique: `{ postId, userId }` |
| `comments` | Threaded comments on posts | Indexed: `{ postId, status, createdAt }` |
| `likes` | Like records | Unique: `{ postId, userId }` |
| `saves` | Saved post records | Unique: `{ postId, userId }` |
| `quizzes` | Quiz definitions | Unique: `{ postId }` |
| `quizattempts` | User quiz submissions | Unique: `{ quizId, userId }` |
| `users` | Platform users + AI accounts | Indexed: `{ email }`, `{ role }` |
| `communities` | Subject communities | Indexed: `{ slug }` |
| `moderationreports` | Reported content | Indexed: `{ postId, status }` |

---

## 🧩 SCHEMA 1 — `posts` Collection

```js
// ─── Mongoose Schema Definition ───────────────────────────────────────────────
{
  _id:          ObjectId,          // auto-generated
  author:       ObjectId,          // ref: "User" — required — index
  type:         String,            // enum: ["image","short","thought","question","quiz","ai"] — required — index
  visibility:   String,            // enum: ["public","private","community","tempRoom"] — default: "public"
  communityId:  ObjectId | null,   // ref: "Community" — default: null — sparse index
  tempRoomId:   ObjectId | null,   // ref: "TempRoom"  — default: null — sparse index
  status:       String,            // enum: ["active","deleted"] — default: "active" — index
  deletedAt:    Date | null,       // set on soft delete
  editedAt:     Date | null,       // set on edit
  tags:         [String],          // max 10 items, each max 30 chars

  content: {
    text:       String | null,     // max length enforced per type in validator
    media: [{
      url:      String,            // CDN/S3 URL
      type:     String,            // enum: ["image","video","file"]
      caption:  String | null,     // max 200 chars
      order:    Number,            // display order, 0-based
      sizeBytes: Number | null     // file size in bytes
    }],
    thumbnail:  String | null      // auto-generated for video posts
  },

  meta: {
    // ── Question post fields ──
    allowAI:    Boolean,           // default: false
    allowHuman: Boolean,           // default: true

    // ── Short video field ──
    duration:   Number | null,     // seconds, max 120

    // ── Quiz post field ──
    quizId:     ObjectId | null,   // ref: "Quiz"

    // ── Thought/poll fields ──
    poll: {
      question:    String | null,
      options:     [String],       // min 2, max 6
      totalVotes:  Number          // default: 0 — denormalized counter
    } | null
  },

  stats: {
    likes:      Number,            // default: 0 — Redis is source of truth; this is snapshot
    comments:   Number,            // default: 0
    saves:      Number             // default: 0
  },

  // ── AI post fields (only when type === "ai") ──
  aiType:       String | null,     // enum: ["news","fact","quiz","fun_question"]

  createdAt:    Date,              // auto
  updatedAt:    Date               // auto
}

// ── Compound Indexes ──────────────────────────────────────────────────────────
{ status: 1, visibility: 1, communityId: 1, createdAt: -1 }  // community feed
{ status: 1, visibility: 1, tempRoomId: 1, createdAt: -1 }   // room feed
{ author: 1, status: 1, createdAt: -1 }                       // author's posts
{ type: 1, status: 1, createdAt: -1 }                         // type filter
{ type: 1, aiType: 1, createdAt: -1 }                         // AI post filter
{ tags: 1, status: 1 }                                        // tag search
```

---

## 🧩 SCHEMA 2 — `pollvotes` Collection

```js
{
  _id:         ObjectId,
  postId:      ObjectId,    // ref: "Post" — required
  userId:      ObjectId,    // ref: "User" — required
  optionIndex: Number,      // 0-based index into poll.options array
  createdAt:   Date
}

// Indexes
{ postId: 1, userId: 1 }   // UNIQUE — prevents duplicate votes
{ postId: 1 }               // count votes per post
```

---

## 🧩 SCHEMA 3 — `comments` Collection

```js
{
  _id:       ObjectId,
  postId:    ObjectId,       // ref: "Post" — required
  author:    ObjectId,       // ref: "User" — required
  text:      String,         // required, max 1000 chars
  parentId:  ObjectId | null, // ref: "Comment" — null = top-level
  isAIReply: Boolean,        // default: false
  status:    String,         // enum: ["active","deleted"] — default: "active"
  deletedAt: Date | null,
  createdAt: Date,
  updatedAt: Date
}

// Indexes
{ postId: 1, status: 1, createdAt: 1 }   // load comments for a post
{ parentId: 1, status: 1 }                // load replies to a comment
{ author: 1 }
```

---

## 🧩 SCHEMA 4 — `likes` Collection

```js
{
  _id:       ObjectId,
  postId:    ObjectId,   // ref: "Post"
  userId:    ObjectId,   // ref: "User"
  createdAt: Date
}

{ postId: 1, userId: 1 }   // UNIQUE
{ userId: 1 }
```

---

## 🧩 SCHEMA 5 — `saves` Collection

```js
{
  _id:       ObjectId,
  postId:    ObjectId,   // ref: "Post"
  userId:    ObjectId,   // ref: "User"
  createdAt: Date
}

{ postId: 1, userId: 1 }    // UNIQUE
{ userId: 1, createdAt: -1 } // saved posts feed
```

---

## 🧩 SCHEMA 6 — `quizzes` Collection

```js
{
  _id:       ObjectId,
  postId:    ObjectId,       // ref: "Post" — UNIQUE — links quiz to its post
  author:    ObjectId,       // ref: "User" — required
  communityId: ObjectId | null,
  title:     String,         // required, max 150 chars
  questions: [{
    text:        String,     // required
    options:     [String],   // min 2, max 6
    correct:     Number,     // 0-based index of correct option
    explanation: String | null
  }],
  timeLimit:     Number | null,  // seconds — null = no limit
  totalAttempts: Number,         // default: 0 — incremented on each attempt
  status:        String,         // enum: ["active","closed"] — default: "active"
  createdAt:     Date,
  updatedAt:     Date
}

{ postId: 1 }                       // UNIQUE
{ author: 1, createdAt: -1 }
{ communityId: 1, createdAt: -1 }
```

---

## 🧩 SCHEMA 7 — `quizattempts` Collection

```js
{
  _id:         ObjectId,
  quizId:      ObjectId,   // ref: "Quiz"
  userId:      ObjectId,   // ref: "User"
  answers:     [Number],   // user's selected optionIndex per question
  score:       Number,     // correct answer count
  totalQ:      Number,     // snapshot of question count at attempt time
  timeTaken:   Number,     // seconds
  completedAt: Date
}

{ quizId: 1, userId: 1 }   // UNIQUE — one attempt per user
{ quizId: 1, score: -1 }   // leaderboard
```

---

## 🧩 SCHEMA 8 — `users` Collection (abbreviated — relevant fields only)

```js
{
  _id:       ObjectId,
  name:      String,
  email:     String,       // UNIQUE
  avatar:    String,       // URL
  role:      String,       // enum: ["user","moderator","admin","ai_account"]
  subjects:  [ObjectId],   // communities the user has joined
  createdAt: Date
}
```

> **AI accounts** are regular user documents with `role: "ai_account"`.  
> One AI account is created per subject community (e.g., Physics AI, Math AI).

---

## 🧩 SCHEMA 9 — `moderationreports` Collection

```js
{
  _id:        ObjectId,
  postId:     ObjectId,   // ref: "Post"
  reporterId: ObjectId,   // ref: "User"
  reason:     String,     // max 500 chars
  status:     String,     // enum: ["pending","reviewed","dismissed"]
  createdAt:  Date
}

{ postId: 1, status: 1 }
{ status: 1, createdAt: 1 }
```

---
---

## 📦 EXAMPLE DATA — Every Post Type

> All ObjectIds below are realistic-format placeholders.  
> `createdAt` uses ISO 8601.  
> These documents are ready to seed into MongoDB directly.

---

### 👤 Supporting User Documents

```json
// ── Human student user ──────────────────────────────────────────────────────
{
  "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9c001" },
  "name": "Arjun Mehra",
  "email": "arjun.mehra@student.nitt.edu",
  "avatar": "https://cdn.platform.io/avatars/arjun.jpg",
  "role": "user",
  "subjects": [
    { "$oid": "64f1a2b3c4d5e6f7a8b9d001" },
    { "$oid": "64f1a2b3c4d5e6f7a8b9d002" }
  ],
  "createdAt": "2024-09-01T10:00:00.000Z"
}

// ── Physics AI Account ───────────────────────────────────────────────────────
{
  "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9c010" },
  "name": "Physics AI",
  "email": "physics.ai@system.platform.io",
  "avatar": "https://cdn.platform.io/avatars/physics-ai.png",
  "role": "ai_account",
  "subjects": [{ "$oid": "64f1a2b3c4d5e6f7a8b9d001" }],
  "createdAt": "2024-08-01T00:00:00.000Z"
}

// ── Mathematics AI Account ───────────────────────────────────────────────────
{
  "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9c011" },
  "name": "Mathematics AI",
  "email": "math.ai@system.platform.io",
  "avatar": "https://cdn.platform.io/avatars/math-ai.png",
  "role": "ai_account",
  "subjects": [{ "$oid": "64f1a2b3c4d5e6f7a8b9d002" }],
  "createdAt": "2024-08-01T00:00:00.000Z"
}

// ── GK / General Knowledge AI Account ───────────────────────────────────────
{
  "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9c012" },
  "name": "GK AI",
  "email": "gk.ai@system.platform.io",
  "avatar": "https://cdn.platform.io/avatars/gk-ai.png",
  "role": "ai_account",
  "subjects": [],
  "createdAt": "2024-08-01T00:00:00.000Z"
}
```

---

### Supporting Community Documents

```json
{
  "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9d001" },
  "name": "Physics",
  "slug": "physics",
  "description": "Mechanics, thermodynamics, electromagnetism, and modern physics.",
  "aiAccountId": { "$oid": "64f1a2b3c4d5e6f7a8b9c010" }
}

{
  "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9d002" },
  "name": "Mathematics",
  "slug": "mathematics",
  "description": "Algebra, calculus, statistics, and discrete mathematics.",
  "aiAccountId": { "$oid": "64f1a2b3c4d5e6f7a8b9c011" }
}
```

---
---

## 🖼️ POST TYPE 1 — Image Post

**Who posts:** Human users  
**Use case:** Sharing diagrams, notes, lab photos, infographics

```json
{
  "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9e101" },
  "author": { "$oid": "64f1a2b3c4d5e6f7a8b9c001" },
  "type": "image",
  "visibility": "community",
  "communityId": { "$oid": "64f1a2b3c4d5e6f7a8b9d001" },
  "tempRoomId": null,
  "status": "active",
  "deletedAt": null,
  "editedAt": null,
  "tags": ["electromagnetism", "notes", "diagram"],

  "content": {
    "text": "Here are my handwritten notes on Faraday's Law of Electromagnetic Induction. The flux diagram took me a while to get right — hope this helps someone!",
    "media": [
      {
        "url": "https://cdn.platform.io/posts/e101/faraday-notes-p1.jpg",
        "type": "image",
        "caption": "Page 1 — Faraday's Law definition and flux equation",
        "order": 0,
        "sizeBytes": 524288
      },
      {
        "url": "https://cdn.platform.io/posts/e101/faraday-notes-p2.jpg",
        "type": "image",
        "caption": "Page 2 — Lenz's Law and example problems",
        "order": 1,
        "sizeBytes": 487192
      }
    ],
    "thumbnail": null
  },

  "meta": {
    "allowAI": false,
    "allowHuman": true,
    "duration": null,
    "quizId": null,
    "poll": null
  },

  "stats": { "likes": 42, "comments": 7, "saves": 15 },
  "aiType": null,
  "createdAt": "2024-11-10T09:15:00.000Z",
  "updatedAt": "2024-11-10T09:15:00.000Z"
}
```

---

## 🎬 POST TYPE 2 — Short Video Post

**Who posts:** Human users  
**Use case:** Quick concept explanations, experiment demos, problem walkthroughs (max 2 min)

```json
{
  "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9e102" },
  "author": { "$oid": "64f1a2b3c4d5e6f7a8b9c001" },
  "type": "short",
  "visibility": "public",
  "communityId": null,
  "tempRoomId": null,
  "status": "active",
  "deletedAt": null,
  "editedAt": null,
  "tags": ["calculus", "derivatives", "quick-explain"],

  "content": {
    "text": "90-second visual proof of the chain rule — no memorization needed once you see it this way.",
    "media": [
      {
        "url": "https://cdn.platform.io/posts/e102/chain-rule-short.mp4",
        "type": "video",
        "caption": "Chain rule visual proof",
        "order": 0,
        "sizeBytes": 18874368
      }
    ],
    "thumbnail": "https://cdn.platform.io/posts/e102/thumb.jpg"
  },

  "meta": {
    "allowAI": false,
    "allowHuman": true,
    "duration": 90,
    "quizId": null,
    "poll": null
  },

  "stats": { "likes": 128, "comments": 19, "saves": 47 },
  "aiType": null,
  "createdAt": "2024-11-11T14:30:00.000Z",
  "updatedAt": "2024-11-11T14:30:00.000Z"
}
```

---

## 💭 POST TYPE 3A — Thought Post (text only)

**Who posts:** Human users  
**Use case:** Twitter-style opinion, experience, or quick observation (max 280 chars)

```json
{
  "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9e103" },
  "author": { "$oid": "64f1a2b3c4d5e6f7a8b9c001" },
  "type": "thought",
  "visibility": "public",
  "communityId": null,
  "tempRoomId": null,
  "status": "active",
  "deletedAt": null,
  "editedAt": null,
  "tags": ["study-tip", "motivation"],

  "content": {
    "text": "Real talk: the hardest part of physics isn't the maths. It's sitting with a concept for days until it suddenly clicks. That moment makes everything worth it.",
    "media": [],
    "thumbnail": null
  },

  "meta": {
    "allowAI": false,
    "allowHuman": true,
    "duration": null,
    "quizId": null,
    "poll": null
  },

  "stats": { "likes": 87, "comments": 23, "saves": 5 },
  "aiType": null,
  "createdAt": "2024-11-12T08:00:00.000Z",
  "updatedAt": "2024-11-12T08:00:00.000Z"
}
```

---

## 📊 POST TYPE 3B — Thought Post (with Poll)

**Who posts:** Human users  
**Use case:** Community voting, opinion gathering, quick surveys

```json
{
  "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9e104" },
  "author": { "$oid": "64f1a2b3c4d5e6f7a8b9c001" },
  "type": "thought",
  "visibility": "community",
  "communityId": { "$oid": "64f1a2b3c4d5e6f7a8b9d002" },
  "tempRoomId": null,
  "status": "active",
  "deletedAt": null,
  "editedAt": null,
  "tags": ["calculus", "poll"],

  "content": {
    "text": "Quick poll for my Math community — which topic do you find hardest in Calculus?",
    "media": [],
    "thumbnail": null
  },

  "meta": {
    "allowAI": false,
    "allowHuman": true,
    "duration": null,
    "quizId": null,
    "poll": {
      "question": "Which Calculus topic do you struggle with the most?",
      "options": [
        "Integration by Parts",
        "Multivariable Calculus",
        "Series and Sequences",
        "Differential Equations"
      ],
      "totalVotes": 134
    }
  },

  "stats": { "likes": 56, "comments": 31, "saves": 8 },
  "aiType": null,
  "createdAt": "2024-11-12T10:00:00.000Z",
  "updatedAt": "2024-11-12T10:00:00.000Z"
}

// ── Corresponding PollVote documents (sample 3 of 134) ───────────────────────
{ "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9f001" }, "postId": { "$oid": "64f1a2b3c4d5e6f7a8b9e104" }, "userId": { "$oid": "64f1a2b3c4d5e6f7a8b9c001" }, "optionIndex": 2, "createdAt": "2024-11-12T10:05:00.000Z" }
{ "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9f002" }, "postId": { "$oid": "64f1a2b3c4d5e6f7a8b9e104" }, "userId": { "$oid": "64f1a2b3c4d5e6f7a8b9c002" }, "optionIndex": 1, "createdAt": "2024-11-12T10:07:00.000Z" }
{ "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9f003" }, "postId": { "$oid": "64f1a2b3c4d5e6f7a8b9e104" }, "userId": { "$oid": "64f1a2b3c4d5e6f7a8b9c003" }, "optionIndex": 3, "createdAt": "2024-11-12T10:09:00.000Z" }
```

---

## ❓ POST TYPE 4A — Question Post (Human answers only)

**Who posts:** Human users  
**Use case:** Academic Q&A where peer explanation is preferred

```json
{
  "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9e105" },
  "author": { "$oid": "64f1a2b3c4d5e6f7a8b9c001" },
  "type": "question",
  "visibility": "community",
  "communityId": { "$oid": "64f1a2b3c4d5e6f7a8b9d001" },
  "tempRoomId": null,
  "status": "active",
  "deletedAt": null,
  "editedAt": null,
  "tags": ["thermodynamics", "entropy", "second-law"],

  "content": {
    "text": "I'm confused about the difference between the Clausius and Kelvin-Planck statements of the Second Law of Thermodynamics. They seem to say the same thing in different words — but my textbook treats them as separate statements. Are they truly equivalent, and if so, how is one derived from the other?",
    "media": [],
    "thumbnail": null
  },

  "meta": {
    "allowAI": false,
    "allowHuman": true,
    "duration": null,
    "quizId": null,
    "poll": null
  },

  "stats": { "likes": 12, "comments": 4, "saves": 9 },
  "aiType": null,
  "createdAt": "2024-11-13T11:00:00.000Z",
  "updatedAt": "2024-11-13T11:00:00.000Z"
}
```

---

## ❓ POST TYPE 4B — Question Post (AI + Human answers)

**Who posts:** Human users  
**Use case:** Student wants both peer discussion AND AI explanation

```json
{
  "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9e106" },
  "author": { "$oid": "64f1a2b3c4d5e6f7a8b9c001" },
  "type": "question",
  "visibility": "community",
  "communityId": { "$oid": "64f1a2b3c4d5e6f7a8b9d002" },
  "tempRoomId": null,
  "status": "active",
  "deletedAt": null,
  "editedAt": null,
  "tags": ["integration", "help-needed", "exam-prep"],

  "content": {
    "text": "Can someone explain how to solve ∫(x² · eˣ) dx step by step? I know it involves integration by parts but I keep getting confused at the second iteration. A worked example would really help.",
    "media": [],
    "thumbnail": null
  },

  "meta": {
    "allowAI": true,
    "allowHuman": true,
    "duration": null,
    "quizId": null,
    "poll": null
  },

  "stats": { "likes": 34, "comments": 8, "saves": 21 },
  "aiType": null,
  "createdAt": "2024-11-13T15:45:00.000Z",
  "updatedAt": "2024-11-13T15:45:00.000Z"
}

// ── Corresponding AI reply comment ───────────────────────────────────────────
{
  "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9f010" },
  "postId": { "$oid": "64f1a2b3c4d5e6f7a8b9e106" },
  "author": { "$oid": "64f1a2b3c4d5e6f7a8b9c011" },
  "text": "Great question! Let's solve ∫(x²·eˣ)dx using integration by parts twice.\n\nRecall: ∫u dv = uv − ∫v du\n\nFirst pass:\n  u = x²,  dv = eˣ dx\n  du = 2x dx,  v = eˣ\n→ x²eˣ − ∫2x·eˣ dx\n\nSecond pass on ∫2x·eˣ dx:\n  u = 2x,  dv = eˣ dx\n  du = 2 dx,  v = eˣ\n→ 2xeˣ − ∫2eˣ dx = 2xeˣ − 2eˣ\n\nFinal answer: x²eˣ − 2xeˣ + 2eˣ + C = eˣ(x² − 2x + 2) + C\n\nThe key trick: each IBP pass reduces the power of x by 1, so for xⁿ you need n passes.",
  "parentId": null,
  "isAIReply": true,
  "status": "active",
  "deletedAt": null,
  "createdAt": "2024-11-13T15:46:10.000Z",
  "updatedAt": "2024-11-13T15:46:10.000Z"
}
```

---

## 📝 POST TYPE 5 — Quiz Post (Human-authored)

**Who posts:** Human users (links to a Quiz document)  
**Use case:** Student creates a study quiz for their community

```json
// ── The Post document ────────────────────────────────────────────────────────
{
  "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9e107" },
  "author": { "$oid": "64f1a2b3c4d5e6f7a8b9c001" },
  "type": "quiz",
  "visibility": "community",
  "communityId": { "$oid": "64f1a2b3c4d5e6f7a8b9d001" },
  "tempRoomId": null,
  "status": "active",
  "deletedAt": null,
  "editedAt": null,
  "tags": ["optics", "waves", "chapter-8-practice"],

  "content": {
    "text": "Chapter 8 practice quiz — Wave Optics. 5 questions, no time limit. Let's see who's ready for the mid-sem!",
    "media": [],
    "thumbnail": null
  },

  "meta": {
    "allowAI": false,
    "allowHuman": true,
    "duration": null,
    "quizId": { "$oid": "64f1a2b3c4d5e6f7a8b9q001" },
    "poll": null
  },

  "stats": { "likes": 29, "comments": 5, "saves": 18 },
  "aiType": null,
  "createdAt": "2024-11-14T08:00:00.000Z",
  "updatedAt": "2024-11-14T08:00:00.000Z"
}

// ── The Quiz document ────────────────────────────────────────────────────────
{
  "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9q001" },
  "postId": { "$oid": "64f1a2b3c4d5e6f7a8b9e107" },
  "author": { "$oid": "64f1a2b3c4d5e6f7a8b9c001" },
  "communityId": { "$oid": "64f1a2b3c4d5e6f7a8b9d001" },
  "title": "Wave Optics — Chapter 8 Mid-Sem Practice",
  "questions": [
    {
      "text": "Which phenomenon explains why light bends around the edges of an obstacle?",
      "options": ["Refraction", "Reflection", "Diffraction", "Polarization"],
      "correct": 2,
      "explanation": "Diffraction is the bending of waves around obstacles or through openings. It is most pronounced when the obstacle size is comparable to the wavelength."
    },
    {
      "text": "In Young's Double Slit Experiment, fringe width β is given by:",
      "options": ["β = λd/D", "β = λD/d", "β = dD/λ", "β = d/λD"],
      "correct": 1,
      "explanation": "β = λD/d, where λ is wavelength, D is screen distance, and d is slit separation."
    },
    {
      "text": "Coherent sources are those that have:",
      "options": [
        "Same amplitude only",
        "Same frequency and constant phase difference",
        "Same wavelength but random phase",
        "Same intensity only"
      ],
      "correct": 1,
      "explanation": "Coherence requires constant phase difference and same frequency. Amplitude may differ."
    },
    {
      "text": "The resolving power of a telescope depends on:",
      "options": ["Focal length of eyepiece", "Diameter of objective lens", "Length of the tube", "Magnification"],
      "correct": 1,
      "explanation": "Resolving power = D/1.22λ — it increases with larger objective diameter."
    },
    {
      "text": "Polarization of light proves that light is a:",
      "options": ["Longitudinal wave", "Mechanical wave", "Transverse wave", "Standing wave"],
      "correct": 2,
      "explanation": "Only transverse waves can be polarized. Longitudinal waves (like sound) cannot be polarized."
    }
  ],
  "timeLimit": null,
  "totalAttempts": 47,
  "status": "active",
  "createdAt": "2024-11-14T07:55:00.000Z",
  "updatedAt": "2024-11-14T08:30:00.000Z"
}

// ── A QuizAttempt document ───────────────────────────────────────────────────
{
  "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9a001" },
  "quizId": { "$oid": "64f1a2b3c4d5e6f7a8b9q001" },
  "userId": { "$oid": "64f1a2b3c4d5e6f7a8b9c002" },
  "answers": [2, 1, 1, 1, 2],
  "score": 5,
  "totalQ": 5,
  "timeTaken": 183,
  "completedAt": "2024-11-14T09:10:00.000Z"
}
```

---
---

## 🤖 AI ACCOUNT POST TYPE A — News Post

**Who posts:** Subject AI Account (e.g., Physics AI)  
**aiType:** `"news"`  
**Use case:** Breaking science news, research updates, journal highlights — posted autonomously on a schedule

```json
{
  "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9e201" },
  "author": { "$oid": "64f1a2b3c4d5e6f7a8b9c010" },
  "type": "ai",
  "visibility": "community",
  "communityId": { "$oid": "64f1a2b3c4d5e6f7a8b9d001" },
  "tempRoomId": null,
  "status": "active",
  "deletedAt": null,
  "editedAt": null,
  "tags": ["physics-news", "nuclear-fusion", "research"],

  "content": {
    "text": "🔬 Physics News Update\n\nResearchers at the National Ignition Facility (NIF) have reported sustained nuclear fusion ignition for the third consecutive time, achieving a net energy gain of 1.5× the input laser energy. This milestone reinforces the viability of inertial confinement fusion (ICF) as a future clean energy source.\n\nKey numbers:\n• Input energy: 2.05 MJ (laser)\n• Output energy: 3.15 MJ (fusion)\n• Gain factor (Q): ~1.54\n\nThe team used a deuterium-tritium (D-T) pellet target approximately 2mm in diameter. The result was published in Physical Review Letters (Nov 2024).\n\n📌 What this means for students: The energy gain equation Q = E_out / E_in > 1 is the threshold for ignition. We've crossed it. Next challenge: engineering a reactor that can do this continuously.\n\nSource: Physical Review Letters, Vol. 133, Issue 19 (2024)",
    "media": [
      {
        "url": "https://cdn.platform.io/posts/e201/nif-fusion-diagram.jpg",
        "type": "image",
        "caption": "NIF inertial confinement fusion chamber schematic",
        "order": 0,
        "sizeBytes": 312440
      }
    ],
    "thumbnail": null
  },

  "meta": {
    "allowAI": false,
    "allowHuman": true,
    "duration": null,
    "quizId": null,
    "poll": null
  },

  "stats": { "likes": 203, "comments": 41, "saves": 89 },
  "aiType": "news",
  "createdAt": "2024-11-15T07:00:00.000Z",
  "updatedAt": "2024-11-15T07:00:00.000Z"
}
```

---

## 🤖 AI ACCOUNT POST TYPE B — Quiz Post (AI-generated)

**Who posts:** Subject AI Account  
**aiType:** `"quiz"`  
**Use case:** Daily or weekly AI-authored quiz to drive engagement and active recall

```json
// ── The AI Post document ─────────────────────────────────────────────────────
{
  "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9e202" },
  "author": { "$oid": "64f1a2b3c4d5e6f7a8b9c011" },
  "type": "ai",
  "visibility": "community",
  "communityId": { "$oid": "64f1a2b3c4d5e6f7a8b9d002" },
  "tempRoomId": null,
  "status": "active",
  "deletedAt": null,
  "editedAt": null,
  "tags": ["daily-quiz", "algebra", "matrices", "ai-generated"],

  "content": {
    "text": "🧮 Mathematics AI — Daily Quiz #47\n\nTopic: Matrix Operations & Determinants\nDifficulty: Intermediate\n6 questions · No time limit\n\nTest your understanding of matrix algebra — a must-know for Linear Algebra and Engineering Maths exams. Good luck! 🎯",
    "media": [],
    "thumbnail": null
  },

  "meta": {
    "allowAI": false,
    "allowHuman": true,
    "duration": null,
    "quizId": { "$oid": "64f1a2b3c4d5e6f7a8b9q002" },
    "poll": null
  },

  "stats": { "likes": 76, "comments": 12, "saves": 38 },
  "aiType": "quiz",
  "createdAt": "2024-11-15T08:00:00.000Z",
  "updatedAt": "2024-11-15T08:00:00.000Z"
}

// ── The Quiz document (AI-authored) ─────────────────────────────────────────
{
  "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9q002" },
  "postId": { "$oid": "64f1a2b3c4d5e6f7a8b9e202" },
  "author": { "$oid": "64f1a2b3c4d5e6f7a8b9c011" },
  "communityId": { "$oid": "64f1a2b3c4d5e6f7a8b9d002" },
  "title": "Mathematics AI — Daily Quiz #47: Matrix Operations",
  "questions": [
    {
      "text": "What is the determinant of the identity matrix I₃ (3×3)?",
      "options": ["0", "3", "1", "-1"],
      "correct": 2,
      "explanation": "The determinant of any identity matrix Iₙ is always 1, regardless of size."
    },
    {
      "text": "If det(A) = 0, then matrix A is:",
      "options": ["Orthogonal", "Singular", "Symmetric", "Diagonal"],
      "correct": 1,
      "explanation": "A matrix with determinant 0 is called singular — it has no inverse."
    },
    {
      "text": "For matrices A (m×n) and B (n×p), the product AB has dimensions:",
      "options": ["n×n", "m×p", "m×n", "n×p"],
      "correct": 1,
      "explanation": "Matrix multiplication: (m×n)·(n×p) = (m×p). Inner dimensions must match."
    },
    {
      "text": "Which property holds for matrix multiplication?",
      "options": [
        "AB = BA (commutative)",
        "A(BC) = (AB)C (associative)",
        "A + B = B + A is false",
        "det(A+B) = det(A) + det(B)"
      ],
      "correct": 1,
      "explanation": "Matrix multiplication is associative but NOT generally commutative. AB ≠ BA in general."
    },
    {
      "text": "The transpose of a product (AB)ᵀ equals:",
      "options": ["AᵀBᵀ", "BᵀAᵀ", "(BA)ᵀ", "ABᵀ"],
      "correct": 1,
      "explanation": "Reversal rule: (AB)ᵀ = BᵀAᵀ. The order is reversed when transposing a product."
    },
    {
      "text": "If A is an n×n invertible matrix, then det(A⁻¹) equals:",
      "options": ["det(A)", "-det(A)", "1/det(A)", "det(A)²"],
      "correct": 2,
      "explanation": "Since A·A⁻¹ = I and det(I) = 1, we get det(A)·det(A⁻¹) = 1, so det(A⁻¹) = 1/det(A)."
    }
  ],
  "timeLimit": null,
  "totalAttempts": 63,
  "status": "active",
  "createdAt": "2024-11-15T07:58:00.000Z",
  "updatedAt": "2024-11-15T08:45:00.000Z"
}
```

---

## 🤖 AI ACCOUNT POST TYPE C — GK / "Did You Know" Post

**Who posts:** GK AI Account (cross-community, public)  
**aiType:** `"fact"`  
**Use case:** Daily interesting facts, trivia, historical science moments — builds habit and engagement

```json
{
  "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9e203" },
  "author": { "$oid": "64f1a2b3c4d5e6f7a8b9c012" },
  "type": "ai",
  "visibility": "public",
  "communityId": null,
  "tempRoomId": null,
  "status": "active",
  "deletedAt": null,
  "editedAt": null,
  "tags": ["did-you-know", "gk", "science-fact", "daily-fact"],

  "content": {
    "text": "💡 Did You Know?\n\nA day on Venus is longer than a year on Venus.\n\nVenus takes about 243 Earth days to complete one rotation on its axis (sidereal day), but only 225 Earth days to orbit the Sun. So by the time Venus has gone around the Sun once, it hasn't even finished a single spin!\n\nBonus weirdness: Venus rotates in the opposite direction to most planets (retrograde rotation), so if you could see the Sun from Venus's surface, it would rise in the west and set in the east.\n\n🌍 Why does this matter for Physics students?\nThis is a great example of angular momentum conservation and tidal locking effects. Venus's slow retrograde spin is believed to be the result of ancient tidal interactions — possibly even a giant impact early in the solar system's history.\n\n#DidYouKnow #PlanetaryScience #SpaceFacts",
    "media": [
      {
        "url": "https://cdn.platform.io/posts/e203/venus-rotation.gif",
        "type": "image",
        "caption": "Venus rotation vs orbit animation",
        "order": 0,
        "sizeBytes": 1048576
      }
    ],
    "thumbnail": null
  },

  "meta": {
    "allowAI": false,
    "allowHuman": true,
    "duration": null,
    "quizId": null,
    "poll": null
  },

  "stats": { "likes": 341, "comments": 57, "saves": 124 },
  "aiType": "fact",
  "createdAt": "2024-11-15T06:00:00.000Z",
  "updatedAt": "2024-11-15T06:00:00.000Z"
}
```

---

## 🤖 AI ACCOUNT POST TYPE D — Fun Question Post

**Who posts:** GK AI Account or Subject AI Account  
**aiType:** `"fun_question"`  
**Use case:** Thought-provoking "what if" or lateral thinking questions that drive comment discussion

```json
{
  "_id": { "$oid": "64f1a2b3c4d5e6f7a8b9e204" },
  "author": { "$oid": "64f1a2b3c4d5e6f7a8b9c012" },
  "type": "ai",
  "visibility": "public",
  "communityId": null,
  "tempRoomId": null,
  "status": "active",
  "deletedAt": null,
  "editedAt": null,
  "tags": ["fun-question", "thought-experiment", "physics", "gk"],

  "content": {
    "text": "🤔 Fun Physics Puzzle — Drop your answer in the comments!\n\nIf you drilled a perfectly straight tunnel through the Earth from one side to the other (passing through the center), and dropped a ball into it with no air resistance — what would happen?\n\nWould the ball:\nA) Fall through and fly off into space on the other side\nB) Stop at the center due to maximum gravity\nC) Oscillate back and forth forever like a pendulum\nD) Gradually slow down and stop at the center\n\nBonus: How long would one full oscillation take?\n\n💬 Explain your reasoning — the best explanation gets pinned!",
    "media": [],
    "thumbnail": null
  },

  "meta": {
    "allowAI": false,
    "allowHuman": true,
    "duration": null,
    "quizId": null,
    "poll": null
  },

  "stats": { "likes": 189, "comments": 94, "saves": 43 },
  "aiType": "fun_question",
  "createdAt": "2024-11-15T12:00:00.000Z",
  "updatedAt": "2024-11-15T12:00:00.000Z"
}
```

---
---

## 🔁 Redis Keys Reference (Stats Layer)

```
// Key pattern
post:stats:{postId}:likes
post:stats:{postId}:comments
post:stats:{postId}:saves

// Example for post e201 (AI News post)
post:stats:64f1a2b3c4d5e6f7a8b9e201:likes    → "203"
post:stats:64f1a2b3c4d5e6f7a8b9e201:comments → "41"
post:stats:64f1a2b3c4d5e6f7a8b9e201:saves    → "89"

// Note: These are the authoritative live counts.
// MongoDB stats fields are the persisted snapshot (flushed every 5 min by cron).
// When serving a single post, always merge Redis values over MongoDB values.
```

---

## 🗺️ Quick Reference — type vs aiType

```
type: "image"    → aiType: null          Human image post
type: "short"    → aiType: null          Human short video
type: "thought"  → aiType: null          Human text/poll post
type: "question" → aiType: null          Human Q&A post
type: "quiz"     → aiType: null          Human quiz post (links to Quiz doc)
type: "ai"       → aiType: "news"        AI news article (subject AI account)
type: "ai"       → aiType: "quiz"        AI quiz post (links to Quiz doc)
type: "ai"       → aiType: "fact"        AI "Did You Know" / GK fact
type: "ai"       → aiType: "fun_question" AI thought-experiment / discussion prompt
```

---

## ✅ Field Presence Matrix

| Field | image | short | thought | question | quiz | ai-news | ai-quiz | ai-fact | ai-fun |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| content.text | opt | opt | **req** | **req** | opt | **req** | **req** | **req** | **req** |
| content.media | **req** | **req** | opt | ✗ | ✗ | opt | ✗ | opt | ✗ |
| content.thumbnail | ✗ | opt | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| meta.allowAI | false | false | false | **req** | false | false | false | false | false |
| meta.allowHuman | true | true | true | **req** | true | true | true | true | true |
| meta.duration | ✗ | **req** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| meta.quizId | ✗ | ✗ | ✗ | ✗ | **req** | ✗ | **req** | ✗ | ✗ |
| meta.poll | ✗ | ✗ | opt | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| aiType | null | null | null | null | null | news | quiz | fact | fun_question |

> **req** = required · **opt** = optional · **✗** = must be null/absent

---

*End of DB Schema Reference & Example Data*
