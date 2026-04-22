# 📦 Post Module — Complete Implementation Prompt
> **Scope:** Educational Social Platform · Post Creation System  
> **Stack:** Node.js · Express · MongoDB (Mongoose) · Redis · Zod  
> **Audience:** AI coding assistant or developer implementing from scratch  
> **Mode:** Follow every section in order. Do not skip or reorder steps.

---

## 🧭 Context & Goal

You are implementing the **Post Module** for an intelligent educational social platform. This module handles all post types in a unified MongoDB collection, with type-specific validation, Redis-backed counters, cursor-based pagination, and controlled AI interaction.

The architect has already reviewed this design. You are implementing the **corrected, production-ready version**. Follow this document exactly.

---

## 📁 Directory Structure to Create

```
src/
└── posts/
    ├── post.routes.js
    ├── post.controller.js
    ├── post.validator.js          ← shared validation (pre-type)
    ├── post.service.js            ← orchestrator only
    ├── post.middleware.js         ← auth injection, soft-delete filter
    │
    ├── services/
    │   ├── image.service.js
    │   ├── short.service.js
    │   ├── thought.service.js     ← includes poll logic
    │   ├── question.service.js
    │   ├── quiz.service.js
    │   └── ai.service.js
    │
    └── models/
        ├── post.model.js
        ├── comment.model.js
        ├── like.model.js
        ├── save.model.js
        ├── pollVote.model.js      ← extracted from post document
        ├── quiz.model.js
        └── quizAttempt.model.js
```

---

## 🗄️ STEP 1 — Schemas (Implement in exact order)

### 1A. `post.model.js`

Implement a Mongoose schema with **all of the following fields and rules**:

```
Fields:
  author         ObjectId → ref: "User"    required, indexed
  type           String   → enum: ["image","short","thought","question","quiz","ai"]   required, indexed
  visibility     String   → enum: ["public","private","community","tempRoom"]   default: "public"
  communityId    ObjectId → ref: "Community"   default: null   sparse index
  tempRoomId     ObjectId → ref: "TempRoom"    default: null   sparse index
  status         String   → enum: ["active","deleted"]   default: "active"   indexed
  deletedAt      Date     → default: null
  editedAt       Date     → default: null
  tags           [String] → max 10 items, each max 30 chars

  content:
    text         String   → max length enforced per type in validator (not schema)
    media        Array of:
      url        String   required if media item present
      type       String   enum: ["image","video","file"]
      caption    String   optional, max 200 chars
      order      Number   default: 0
      sizeBytes  Number   optional

  meta:
    allowAI      Boolean  default: false   (question posts only)
    allowHuman   Boolean  default: true    (question posts only)
    duration     Number   (short video only, seconds, max 120)
    quizId       ObjectId ref: "Quiz"      (quiz posts only)
    poll:
      question   String
      options    [String] min 2, max 6 items
      totalVotes Number   default: 0       (denormalized counter, safe)

  stats:
    likes        Number   default: 0   (Redis is source of truth; this is persisted snapshot)
    comments     Number   default: 0
    saves        Number   default: 0

  aiType         String   enum: ["news","fact","quiz","fun_question"]   default: null
                          only relevant when type === "ai"
```

**Pre-save hook — mutual exclusivity:**
```
Before saving, validate:
  - communityId and tempRoomId CANNOT both be non-null
  - If both are set → throw ValidationError: "Post cannot belong to both a community and a temp room"
  - If visibility === "community" → communityId must be set
  - If visibility === "tempRoom"  → tempRoomId must be set
```

**Pre-find middleware — auto soft-delete filter:**
```
Add a pre('find') and pre('findOne') hook that automatically appends
{ status: "active" } to every query UNLESS the query explicitly sets
{ includeDeleted: true } in options. This prevents deleted posts from
leaking into any query that forgets to filter manually.
```

**Indexes to create (compound):**
```js
// Feed queries
{ status: 1, visibility: 1, communityId: 1, createdAt: -1 }
{ status: 1, visibility: 1, tempRoomId: 1, createdAt: -1 }

// Author's posts
{ author: 1, status: 1, createdAt: -1 }

// Type filtering
{ type: 1, status: 1, createdAt: -1 }

// AI posts
{ type: 1, aiType: 1, createdAt: -1 }

// Tags
{ tags: 1, status: 1 }
```

---

### 1B. `pollVote.model.js`

```
Fields:
  postId      ObjectId → ref: "Post"   required
  userId      ObjectId → ref: "User"   required
  optionIndex Number   → required, min: 0
  createdAt   Date     → auto

Indexes:
  Compound unique: { postId: 1, userId: 1 }   ← prevents duplicate votes at DB level
  Single: { postId: 1 }                        ← for counting votes per option
```

---

### 1C. `comment.model.js`

```
Fields:
  postId      ObjectId → ref: "Post"   required, indexed
  author      ObjectId → ref: "User"   required, indexed
  text        String   → required, max 1000 chars
  parentId    ObjectId → ref: "Comment"   default: null   (threaded replies)
  isAIReply   Boolean  → default: false
  status      String   → enum: ["active","deleted"]   default: "active"
  deletedAt   Date     → default: null
  createdAt / updatedAt auto

Indexes:
  { postId: 1, status: 1, createdAt: 1 }
  { parentId: 1, status: 1 }
```

---

### 1D. `like.model.js`

```
Fields:
  postId    ObjectId → ref: "Post"   required
  userId    ObjectId → ref: "User"   required
  createdAt Date     → auto

Indexes:
  Compound unique: { postId: 1, userId: 1 }
  Single: { userId: 1 }
```

---

### 1E. `save.model.js`

```
Fields:
  postId    ObjectId → ref: "Post"   required
  userId    ObjectId → ref: "User"   required
  createdAt Date     → auto

Indexes:
  Compound unique: { postId: 1, userId: 1 }
  Single: { userId: 1, createdAt: -1 }
```

---

### 1F. `quiz.model.js`

```
Fields:
  postId       ObjectId → ref: "Post"      required (links quiz to its post)
  author       ObjectId → ref: "User"      required
  communityId  ObjectId → ref: "Community" default: null
  title        String   required, max 150 chars
  questions    Array of:
    text       String   required
    options    [String] min 2, max 6
    correct    Number   required (index into options)
    explanation String  optional
  timeLimit    Number   seconds, default: null (no limit)
  totalAttempts Number  default: 0
  status       String   enum: ["active","closed"]   default: "active"
  createdAt / updatedAt auto

Indexes:
  { postId: 1 }    unique
  { author: 1, createdAt: -1 }
  { communityId: 1, createdAt: -1 }
```

---

### 1G. `quizAttempt.model.js`

```
Fields:
  quizId     ObjectId → ref: "Quiz"   required, indexed
  userId     ObjectId → ref: "User"   required, indexed
  answers    [Number] → array of selected option indexes (one per question)
  score      Number   → calculated on submission (correct count)
  totalQ     Number   → snapshot of question count at attempt time
  timeTaken  Number   → seconds
  completedAt Date    → auto

Indexes:
  Compound unique: { quizId: 1, userId: 1 }   ← one attempt per user per quiz
  { quizId: 1, score: -1 }                    ← leaderboard queries
```

---

## ✅ STEP 2 — Shared Validator (`post.validator.js`)

This runs **before** any type-specific service. Implement Zod schemas for each post type.

### Base fields (all types share these):
```
visibility   required, enum ["public","private","community","tempRoom"]
communityId  optional ObjectId string
tempRoomId   optional ObjectId string
tags         optional array, max 10 strings each max 30 chars
```

### Type-specific Zod schemas:

**image post:**
```
content.media   required, min 1 item, max 10 items
                each item: { url: string URL, type: "image", caption?: string max 200, order: number }
content.text    optional, max 500 chars
```

**short post (video):**
```
content.media   required, exactly 1 item, type must be "video"
meta.duration   required, number, max 120 (seconds)
content.text    optional, max 300 chars
```

**thought post:**
```
content.text    required, max 280 chars
content.media   optional, max 4 items
meta.poll       optional:
  question      required if poll present, max 150 chars
  options       required if poll present, min 2, max 6 strings each max 100 chars
```

**question post:**
```
content.text    required, max 2000 chars
meta.allowAI    required boolean
meta.allowHuman required boolean
               Refine: at least one of allowAI or allowHuman must be true
```

**quiz post:**
```
quizId          required valid ObjectId string  (quiz must already exist)
content.text    optional, max 500 chars (description)
```

**ai post:**
```
content.text    required, max 3000 chars
aiType          required, enum ["news","fact","quiz","fun_question"]
               Role check: request must come from an AI system account
```

**Cross-field refinement (all types):**
```
If visibility === "community" → communityId must be present
If visibility === "tempRoom"  → tempRoomId must be present
communityId and tempRoomId must not both be present
```

Export: one `validatePost(body)` function that:
1. Reads `body.type`
2. Selects the matching Zod schema
3. Parses and returns cleaned data or throws ZodError

---

## 🔧 STEP 3 — Type-Specific Services

Each service receives **already-validated data** from the validator. It handles only type-specific business logic.

### `image.service.js`
```
Function: createImagePost(authorId, validatedData)
Logic:
  - Assign order index to media items (0, 1, 2...) if not provided
  - Build and save Post document
  - Return saved post
```

### `short.service.js`
```
Function: createShortPost(authorId, validatedData)
Logic:
  - Confirm duration <= 120 (belt-and-suspenders after validator)
  - Build and save Post document
  - Return saved post
```

### `thought.service.js` (includes poll logic)
```
Function: createThoughtPost(authorId, validatedData)
Logic:
  - If poll present: embed poll.question and poll.options in meta.poll
    Set meta.poll.totalVotes = 0
    Do NOT embed any votes array (votes go to PollVote collection)
  - Build and save Post document
  - Return saved post

Function: voteOnPoll(postId, userId, optionIndex)
Logic:
  1. Find post, confirm type === "thought" and poll exists
  2. Confirm optionIndex is within range of poll.options array
  3. Attempt insert into PollVote collection:
     { postId, userId, optionIndex }
     If duplicate key error (code 11000) → throw "Already voted"
  4. On success: increment meta.poll.totalVotes by 1 using $inc
  5. Return updated vote count
```

### `question.service.js`
```
Function: createQuestionPost(authorId, validatedData)
Logic:
  - Build post with meta.allowAI and meta.allowHuman flags
  - If allowAI is true: emit internal event "ai.question.created" with postId
    (AI integration layer listens to this event to prepare response queue)
  - Build and save Post document
  - Return saved post
```

### `quiz.service.js`
```
Function: createQuizPost(authorId, validatedData)
Logic:
  1. Verify Quiz with quizId exists in Quiz collection
  2. Verify quiz.author === authorId (prevent referencing another user's quiz)
  3. Verify quiz status === "active"
  4. Build Post document with meta.quizId set
  5. Save Post
  6. Return saved post

Function: attemptQuiz(quizId, userId, answers, timeTaken)
Logic:
  1. Fetch Quiz document
  2. Confirm quiz.status === "active"
  3. Check PollVote-style: try insert QuizAttempt { quizId, userId }
     If duplicate → throw "Already attempted"
  4. Score the attempt: count correct answers by comparing answers[i] to quiz.questions[i].correct
  5. Save QuizAttempt with score, totalQ, timeTaken
  6. Increment quiz.totalAttempts by 1
  7. Return { score, totalQ, correctAnswers details }
```

### `ai.service.js`
```
Function: createAIPost(systemAccountId, validatedData)
Logic:
  - Confirm caller has role "ai_account" (enforce in middleware, double-check here)
  - Set isAI = false (field removed per architect review)
    Set aiType = validatedData.aiType
    Set type = "ai"
  - Build and save Post document
  - Return saved post
```

---

## 🎛️ STEP 4 — Post Service Orchestrator (`post.service.js`)

This is a **thin orchestrator**. It does not contain type logic.

```
Function: createPost(authorId, rawBody)
  1. Call validatePost(rawBody) → get validatedData or throw
  2. Switch on validatedData.type:
     "image"    → imageService.createImagePost(authorId, validatedData)
     "short"    → shortService.createShortPost(authorId, validatedData)
     "thought"  → thoughtService.createThoughtPost(authorId, validatedData)
     "question" → questionService.createQuestionPost(authorId, validatedData)
     "quiz"     → quizService.createQuizPost(authorId, validatedData)
     "ai"       → aiService.createAIPost(authorId, validatedData)
     default    → throw "Unknown post type"
  3. Return created post

Function: getFeed(userId, query)
  → See STEP 6 (Feed logic)

Function: getPostById(postId)
  → Find post by _id, status: "active", populate author (name, avatar only)
  → Merge Redis stats (see STEP 5)
  → Return merged post

Function: editPost(postId, userId, updateBody)
  1. Find post where _id === postId AND author === userId AND status === "active"
  2. If not found → throw 404
  3. Only allow editing: content.text, tags, meta.poll.question (if no votes yet)
  4. Set editedAt = Date.now()
  5. Save and return updated post

Function: deletePost(postId, userId)
  1. Find post where _id === postId AND author === userId AND status === "active"
  2. Set status = "deleted", deletedAt = Date.now()
  3. Save
  4. Delete associated Redis keys for stats
  5. Return { success: true }

Function: reportPost(postId, reporterId, reason)
  → Insert into a ModerationReport collection (create this model):
    { postId, reporterId, reason, status: "pending", createdAt }
  → Return { success: true }
```

---

## ⚡ STEP 5 — Redis Stats Layer

**Do not store real-time counts in the Post document.** Use Redis as the source of truth for live engagement counts.

### Key naming convention:
```
post:stats:{postId}:likes
post:stats:{postId}:comments
post:stats:{postId}:saves
```

### Functions to implement in `post.stats.js`:

```
async function incrementStat(postId, field)
  → INCR post:stats:{postId}:{field}

async function decrementStat(postId, field)
  → DECR post:stats:{postId}:{field}  (floor at 0)

async function getStats(postId)
  → GET all three keys
  → Return { likes: N, comments: N, saves: N }

async function mergeStatsIntoPost(postDoc)
  → Call getStats(postDoc._id)
  → Override postDoc.stats with Redis values
  → If Redis returns null (key not set) → fall back to postDoc.stats (MongoDB snapshot)
  → Return merged plain object

async function flushStatsToDB(postId)
  → Called by a scheduled job (every 5 minutes via cron)
  → Read Redis stats
  → Update Post document stats fields with $set
  → Do NOT delete Redis keys after flush (keep as cache)
```

### Like/Unlike flow:
```
Like:
  1. Try insert Like document { postId, userId }
  2. If duplicate key error → throw "Already liked"
  3. On success → incrementStat(postId, "likes")
  4. Return { liked: true, count: await getStats(postId).likes }

Unlike:
  1. Delete Like document { postId, userId }
  2. If deleted count === 0 → throw "Not liked"
  3. On success → decrementStat(postId, "likes")
  4. Return { liked: false, count: await getStats(postId).likes }
```

Same pattern for Save/Unsave.

---

## 📄 STEP 6 — Feed Logic (Cursor-Based Pagination)

**Never use offset pagination.** Use cursor-based (createdAt + _id).

```
Function: getFeed(userId, { cursor, limit, type, communityId, tempRoomId, visibility })

Defaults: limit = 20, max limit = 50

Build query:
  { status: "active" }
  + visibility filter based on user's joined communities
  + if type provided → add { type }
  + if communityId → add { communityId }
  + if tempRoomId  → add { tempRoomId }
  + if cursor provided:
      decode cursor (base64 of JSON { createdAt, _id })
      add { $or: [
        { createdAt: { $lt: cursorCreatedAt } },
        { createdAt: cursorCreatedAt, _id: { $lt: cursorId } }
      ]}

Sort: { createdAt: -1, _id: -1 }
Limit: limit + 1  (fetch one extra to detect if next page exists)

After fetch:
  hasNextPage = results.length > limit
  posts = results.slice(0, limit)
  nextCursor = hasNextPage
    ? base64(JSON.stringify({ createdAt: last.createdAt, _id: last._id }))
    : null

For each post → mergeStatsIntoPost(post)

Return: { posts, nextCursor, hasNextPage }
```

---

## 🌐 STEP 7 — Complete API Endpoints (`post.routes.js`)

Implement every endpoint below. Auth middleware attaches `req.user`.

### Post CRUD
```
POST   /api/posts
  → Body: { type, visibility, content, meta, tags, communityId?, tempRoomId? }
  → Calls: postService.createPost(req.user._id, req.body)
  → Response 201: { data: post }

GET    /api/posts/feed
  → Query: { cursor?, limit?, type?, communityId?, visibility? }
  → Calls: postService.getFeed(req.user._id, req.query)
  → Response 200: { data: { posts, nextCursor, hasNextPage } }

GET    /api/posts/:id
  → Calls: postService.getPostById(req.params.id)
  → Response 200: { data: post }

PATCH  /api/posts/:id
  → Body: { content?, tags? }
  → Calls: postService.editPost(req.params.id, req.user._id, req.body)
  → Response 200: { data: updatedPost }

DELETE /api/posts/:id
  → Calls: postService.deletePost(req.params.id, req.user._id)
  → Response 200: { data: { success: true } }

POST   /api/posts/:id/report
  → Body: { reason: string max 500 chars }
  → Calls: postService.reportPost(req.params.id, req.user._id, req.body.reason)
  → Response 201: { data: { success: true } }
```

### Engagement
```
POST   /api/posts/:id/like
  → Calls: likeService.like(req.params.id, req.user._id)
  → Response 200: { data: { liked: true, count: N } }

DELETE /api/posts/:id/like
  → Calls: likeService.unlike(req.params.id, req.user._id)
  → Response 200: { data: { liked: false, count: N } }

POST   /api/posts/:id/save
  → Calls: saveService.save(req.params.id, req.user._id)
  → Response 200: { data: { saved: true } }

DELETE /api/posts/:id/save
  → Calls: saveService.unsave(req.params.id, req.user._id)
  → Response 200: { data: { saved: false } }
```

### Comments
```
GET    /api/posts/:id/comments
  → Query: { cursor?, limit?, parentId? }
  → Cursor-based pagination same as feed
  → Response 200: { data: { comments, nextCursor, hasNextPage } }

POST   /api/posts/:id/comments
  → Body: { text, parentId? }
  → Validates: text max 1000 chars, postId exists and active
  → On success → incrementStat(postId, "comments")
  → Response 201: { data: comment }

DELETE /api/posts/:id/comments/:commentId
  → Soft delete: only comment.author OR post.author can delete
  → On success → decrementStat(postId, "comments")
  → Response 200: { data: { success: true } }
```

### Poll
```
PATCH  /api/posts/:id/vote
  → Body: { optionIndex: number }
  → Calls: thoughtService.voteOnPoll(req.params.id, req.user._id, optionIndex)
  → Response 200: { data: { totalVotes: N, yourVote: optionIndex } }

GET    /api/posts/:id/vote
  → Returns: { data: { options: [{ text, votes }], totalVotes, yourVote: index|null } }
  → Aggregate PollVote by optionIndex for this postId
  → Check if current user has voted
```

### Community / Room Feeds
```
GET    /api/posts/community/:communityId
  → Query: { cursor?, limit?, type? }
  → Shorthand for getFeed with communityId scoped
  → Response 200: { data: { posts, nextCursor, hasNextPage } }

GET    /api/posts/room/:tempRoomId
  → Same as above for temp room scope
```

### Quiz
```
POST   /api/quiz
  → Body: { title, questions[], timeLimit?, communityId? }
  → Creates Quiz document (not the Post — post is separate)
  → Response 201: { data: quiz }

POST   /api/quiz/:id/attempt
  → Body: { answers: [number], timeTaken: number }
  → Calls: quizService.attemptQuiz(quizId, req.user._id, answers, timeTaken)
  → Response 201: { data: { score, totalQ, passed, breakdown } }

GET    /api/quiz/:id/leaderboard
  → Aggregates QuizAttempt by quizId, sorts by score desc then timeTaken asc
  → Limit 50
  → Response 200: { data: { leaderboard: [{ userId, score, timeTaken, rank }] } }
```

---

## 🛡️ STEP 8 — Middleware (`post.middleware.js`)

```
requireAuth
  → Verifies JWT access token from Authorization header
  → Attaches decoded user to req.user
  → 401 if missing or invalid

requireOwner(model)
  → Finds document by req.params.id in given model
  → Confirms document.author.toString() === req.user._id.toString()
  → 403 if mismatch, 404 if not found

requireAIAccount
  → Checks req.user.role === "ai_account"
  → 403 if not AI role

attachPostToRequest
  → Finds Post by req.params.id (active only)
  → Attaches to req.post
  → 404 if not found
```

---

## ❗ STEP 9 — Error Handling

All errors must follow this exact response shape:
```json
{
  "error": {
    "code": "DUPLICATE_VOTE",
    "message": "You have already voted on this poll.",
    "details": []
  },
  "meta": {
    "requestId": "uuid-v4"
  }
}
```

Error codes to implement:
```
VALIDATION_ERROR      → 400  Zod parse failure
DUPLICATE_LIKE        → 400  User already liked
DUPLICATE_VOTE        → 400  User already voted on poll
DUPLICATE_ATTEMPT     → 400  User already attempted quiz
NOT_LIKED             → 400  Unlike when not liked
UNAUTHORIZED          → 401  No/invalid token
FORBIDDEN             → 403  Action not permitted
NOT_FOUND             → 404  Post/Quiz/Comment not found
CONTEXT_CONFLICT      → 422  Both communityId and tempRoomId set
QUIZ_NOT_FOUND        → 404  Quiz referenced in post does not exist
QUIZ_OWNERSHIP        → 403  Quiz belongs to another user
INVALID_POST_TYPE     → 400  Unknown type in switch
RATE_LIMIT_EXCEEDED   → 429  Too many requests
```

---

## 🔢 STEP 10 — Index Registration

After all models are defined, call this once at app startup to ensure all indexes are registered in MongoDB:

```js
// In app.js or a separate db.init.js
await Post.ensureIndexes();
await PollVote.ensureIndexes();
await Like.ensureIndexes();
await Save.ensureIndexes();
await Comment.ensureIndexes();
await Quiz.ensureIndexes();
await QuizAttempt.ensureIndexes();
```

---

## 🕐 STEP 11 — Cron Job (Stats Flush)

Implement in `jobs/statsFlush.job.js`:

```
Schedule: every 5 minutes (cron: "*/5 * * * *")

Logic:
  1. Scan Redis keys matching "post:stats:*:likes"
  2. Extract postId from each key
  3. For each postId: call flushStatsToDB(postId)
  4. Log: "Flushed stats for N posts"

Use node-cron or agenda.
Do NOT delete Redis keys after flush.
```

---

## 📋 STEP 12 — Validation Summary Table

| Post Type | Required Fields           | Optional Fields              | Hard Limits                     |
|-----------|---------------------------|------------------------------|---------------------------------|
| image     | content.media (min 1)     | content.text, tags           | max 10 media items              |
| short     | content.media (1 video)   | content.text                 | duration ≤ 120s                 |
| thought   | content.text              | media, poll, tags            | text ≤ 280 chars                |
| question  | content.text, allowAI/Human | tags                       | text ≤ 2000 chars, one flag true |
| quiz      | meta.quizId               | content.text, tags           | quiz must exist and be owned    |
| ai        | content.text, aiType      | tags, communityId            | role must be "ai_account"       |

---

## 🔄 STEP 13 — Data Flow Summary

```
Request arrives at POST /api/posts
    │
    ▼
requireAuth middleware
    │  attaches req.user
    ▼
post.controller.js → calls postService.createPost(userId, body)
    │
    ▼
post.validator.js → validatePost(body)
    │  Zod schema selected by type
    │  Cross-field refinements applied
    │  Returns cleaned data or throws VALIDATION_ERROR
    ▼
post.service.js → switch(type) → routes to type service
    │
    ▼
[type].service.js
    │  Type-specific logic
    │  DB operations
    │  Event emissions (question → AI queue)
    │  Returns saved post document
    ▼
post.controller.js → return 201 { data: post }


Request arrives at POST /api/posts/:id/like
    │
    ▼
requireAuth → attachPostToRequest
    │
    ▼
like.service.like(postId, userId)
    │  try insert Like doc
    │  on duplicate key → throw DUPLICATE_LIKE
    │  on success → Redis INCR likes
    │  return { liked: true, count }
    ▼
200 { data: { liked: true, count: N } }
```

---

## 🧪 STEP 14 — Testing Checklist

After implementation, verify these scenarios manually or with tests:

```
□ Image post created with 3 media items → success
□ Image post with no media → VALIDATION_ERROR
□ Short video with duration 130s → VALIDATION_ERROR (max 120)
□ Thought post with poll, user votes → success, PollVote inserted
□ Same user votes again → DUPLICATE_VOTE (11000 caught)
□ Question post with allowAI=false, allowHuman=false → VALIDATION_ERROR
□ Quiz post referencing another user's quiz → QUIZ_OWNERSHIP error
□ Quiz attempted twice by same user → DUPLICATE_ATTEMPT
□ Post with both communityId and tempRoomId → CONTEXT_CONFLICT
□ visibility="community" but no communityId → VALIDATION_ERROR
□ Like a post → Redis key incremented
□ Unlike a post → Redis key decremented, not below 0
□ Unlike a post not liked → NOT_LIKED error
□ Fetch feed with cursor → correct next page, no duplicates
□ Deleted post not appearing in feed → confirmed by pre-find hook
□ AI post creation by non-AI account → FORBIDDEN
□ Stats flush cron → MongoDB stats updated from Redis
```

---

## 📦 Dependencies Required

```json
{
  "mongoose": "^8.x",
  "zod": "^3.x",
  "ioredis": "^5.x",
  "node-cron": "^3.x",
  "uuid": "^9.x",
  "jsonwebtoken": "^9.x"
}
```

---

## 🚫 Implementation Rules (Do Not Break)

1. **Never embed poll votes in the Post document** — always PollVote collection
2. **Never use offset pagination** — always cursor-based
3. **Never expose deleted posts** — pre-find hook enforces this automatically
4. **Never write stats directly to Post on each interaction** — Redis first, flush periodically
5. **Never allow communityId and tempRoomId simultaneously** — pre-save hook + validator
6. **Never skip the shared validator** — even if a service has its own checks
7. **Never reference a Quiz not owned by the post author** — verified in quiz.service.js
8. **Always use compound unique indexes for PollVote, Like, Save, QuizAttempt** — no app-level race condition workarounds
9. **Always return stats merged from Redis, not raw MongoDB counts**, on single post fetch
10. **AI posts only from accounts with role "ai_account"** — double-checked in middleware and service

---

*End of implementation prompt. Follow every step in order. Do not add unrequested abstractions.*
