const PAGE_SIZE = 5;

function encodeCursor(payload) {
  return btoa(JSON.stringify(payload));
}

function decodeCursor(cursor) {
  try {
    return JSON.parse(atob(cursor));
  } catch {
    return null;
  }
}

const MOCK_POSTS = [
  {
    _id: "p12",
    createdAt: "2026-04-21T12:15:00.000Z",
    type: "ai",
    aiType: "news",
    author: { name: "QConnect AI", role: "ai_account" },
    community: "Science Daily",
    timeAgo: "2m",
    content: { text: "NASA confirms new exoplanet with signs of water vapor in its atmosphere.", media: [] },
    meta: { allowAI: false, allowHuman: false, poll: null, quizId: null },
    quizPreview: null,
    tags: ["space", "news"],
    stats: { likes: 128, comments: 33, saves: 54 }
  },
  {
    _id: "p11",
    createdAt: "2026-04-21T11:50:00.000Z",
    type: "question",
    aiType: null,
    author: { name: "Arjun Kumar", role: "user" },
    community: "JEE Physics",
    timeAgo: "8m",
    content: { text: "Can someone explain magnetic flux intuitively with one real-life example?", media: [] },
    meta: { allowAI: true, allowHuman: true, poll: null, quizId: null },
    quizPreview: null,
    tags: ["physics", "jee"],
    stats: { likes: 14, comments: 18, saves: 6 }
  },
  {
    _id: "p10",
    createdAt: "2026-04-21T11:10:00.000Z",
    type: "thought",
    aiType: null,
    author: { name: "Sana Rao", role: "user" },
    community: "Exam Prep",
    timeAgo: "22m",
    content: { text: "What should we revise tonight before mock test?", media: [] },
    meta: {
      allowAI: false,
      allowHuman: true,
      quizId: null,
      poll: {
        question: "Pick one",
        options: ["Electrostatics", "Trigonometry", "Organic chemistry"],
        optionVotes: [32, 27, 11],
        totalVotes: 70
      }
    },
    quizPreview: null,
    tags: ["revision", "poll"],
    stats: { likes: 40, comments: 12, saves: 19 }
  },
  {
    _id: "p09",
    createdAt: "2026-04-21T10:20:00.000Z",
    type: "quiz",
    aiType: null,
    author: { name: "Ritika Sen", role: "user" },
    community: "Math Club",
    timeAgo: "45m",
    content: { text: "Quick algebra challenge for everyone.", media: [] },
    meta: { allowAI: false, allowHuman: true, poll: null, quizId: "quiz_293" },
    quizPreview: {
      firstQuestion: "If x + 3 = 9, what is x?",
      options: ["6", "9", "3"]
    },
    tags: ["quiz", "math"],
    stats: { likes: 61, comments: 23, saves: 28 }
  },
  {
    _id: "p08",
    createdAt: "2026-04-21T09:30:00.000Z",
    type: "image",
    aiType: null,
    author: { name: "Megha Patel", role: "user" },
    community: "Chem Lab",
    timeAgo: "1h",
    content: {
      text: "Uploaded my reaction mechanism notes. Please review slide 3.",
      media: [{ url: "note-1" }, { url: "note-2" }, { url: "note-3" }]
    },
    meta: { allowAI: false, allowHuman: true, poll: null, quizId: null },
    quizPreview: null,
    tags: ["chemistry", "notes"],
    stats: { likes: 37, comments: 9, saves: 22 }
  },
  {
    _id: "p07",
    createdAt: "2026-04-21T08:55:00.000Z",
    type: "short",
    aiType: null,
    author: { name: "Vikram Shah", role: "user" },
    community: "Code Guild",
    timeAgo: "1h",
    content: {
      text: "60-second trick to optimize nested loops in JS.",
      media: [{ url: "short-1" }]
    },
    meta: { allowAI: false, allowHuman: true, poll: null, quizId: null },
    quizPreview: null,
    tags: ["javascript", "dsa"],
    stats: { likes: 77, comments: 31, saves: 42 }
  },
  {
    _id: "p06",
    createdAt: "2026-04-21T08:10:00.000Z",
    type: "ai",
    aiType: "fact",
    author: { name: "QConnect AI", role: "ai_account" },
    community: "Daily Facts",
    timeAgo: "2h",
    content: { text: "Did you know? Honey never spoils due to its low water activity.", media: [] },
    meta: { allowAI: false, allowHuman: false, poll: null, quizId: null },
    quizPreview: null,
    tags: ["fact", "science"],
    stats: { likes: 189, comments: 20, saves: 90 }
  }
];

function sortPosts(posts) {
  return [...posts].sort((a, b) => {
    if (a.createdAt === b.createdAt) {
      return a._id < b._id ? 1 : -1;
    }
    return new Date(a.createdAt) < new Date(b.createdAt) ? 1 : -1;
  });
}

function applyTabFilter(posts, tab) {
  if (tab === "questions") return posts.filter((post) => post.type === "question");
  if (tab === "quiz") return posts.filter((post) => post.type === "quiz");
  if (tab === "ai") return posts.filter((post) => post.type === "ai");
  return posts;
}

function applyCursor(posts, cursor) {
  if (!cursor) {
    return posts;
  }

  const parsed = decodeCursor(cursor);
  if (!parsed?.createdAt || !parsed?._id) {
    return posts;
  }

  return posts.filter((post) => {
    if (post.createdAt < parsed.createdAt) return true;
    if (post.createdAt === parsed.createdAt && post._id < parsed._id) return true;
    return false;
  });
}

export async function fetchPosts({ tab, cursor = null, tag = null }) {
  const normalizedTag = tag?.toLowerCase() || null;

  let list = sortPosts(MOCK_POSTS);
  list = applyTabFilter(list, tab);

  if (normalizedTag) {
    list = list.filter((post) => post.tags.some((postTag) => postTag.toLowerCase() === normalizedTag));
  }

  list = applyCursor(list, cursor);

  const slice = list.slice(0, PAGE_SIZE + 1);
  const hasMore = slice.length > PAGE_SIZE;
  const visiblePosts = hasMore ? slice.slice(0, PAGE_SIZE) : slice;

  const nextCursor = hasMore
    ? encodeCursor({
        createdAt: visiblePosts[visiblePosts.length - 1].createdAt,
        _id: visiblePosts[visiblePosts.length - 1]._id
      })
    : null;

  await new Promise((resolve) => setTimeout(resolve, 380));

  return {
    posts: visiblePosts.map((post) => ({
      _id: post._id,
      type: post.type,
      aiType: post.aiType,
      author: post.author,
      community: post.community,
      timeAgo: post.timeAgo,
      content: post.content,
      meta: post.meta,
      quizPreview: post.quizPreview,
      tags: post.tags,
      stats: post.stats
    })),
    nextCursor
  };
}

