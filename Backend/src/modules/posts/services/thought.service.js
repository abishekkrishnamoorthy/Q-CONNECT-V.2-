// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\services\thought.service.js
import Post from "../models/post.model.js";
import PollVote from "../models/pollVote.model.js";

/**
 * Creates a thought-type post (text-only or with poll).
 * Poll votes are NEVER embedded in the post — they go to PollVote collection.
 *
 * @param {string} authorId
 * @param {object} data - validated data from post.validator.js
 * @returns {Promise<object>} saved post document
 */
export async function createThoughtPost(authorId, data) {
  const poll = data.meta?.poll
    ? {
        question:   data.meta.poll.question,
        options:    data.meta.poll.options,
        totalVotes: 0  // always starts at 0
      }
    : null;

  const post = new Post({
    author:      authorId,
    type:        "thought",
    visibility:  data.visibility,
    communityId: data.communityId ?? null,
    tempRoomId:  data.tempRoomId  ?? null,
    tags:        data.tags ?? [],
    content: {
      text:      data.content.text,
      media:     data.content.media ?? [],
      thumbnail: null
    },
    meta: {
      allowAI:    false,
      allowHuman: true,
      duration:   null,
      quizId:     null,
      poll
    }
  });

  await post.save();
  return post;
}

/**
 * Casts a vote on a poll.
 * Duplicate vote → DB unique index fires code 11000 → DUPLICATE_VOTE error.
 *
 * @param {string} postId
 * @param {string} userId
 * @param {number} optionIndex
 * @returns {Promise<{totalVotes: number, yourVote: number}>}
 */
export async function voteOnPoll(postId, userId, optionIndex) {
  // Confirm post is a thought with an active poll
  const post = await Post.findById(postId).setOptions({ includeDeleted: false });
  if (!post) {
    const err = new Error("Post not found");
    // @ts-expect-error custom code
    err.code = "NOT_FOUND";
    // @ts-expect-error custom statusCode
    err.statusCode = 404;
    throw err;
  }
  if (post.type !== "thought" || !post.meta?.poll) {
    const err = new Error("This post does not have a poll");
    // @ts-expect-error custom code
    err.code = "NOT_FOUND";
    // @ts-expect-error custom statusCode
    err.statusCode = 404;
    throw err;
  }
  if (optionIndex < 0 || optionIndex >= post.meta.poll.options.length) {
    const err = new Error("Invalid poll option index");
    // @ts-expect-error custom code
    err.code = "VALIDATION_ERROR";
    // @ts-expect-error custom statusCode
    err.statusCode = 400;
    throw err;
  }

  try {
    await PollVote.create({ postId, userId, optionIndex });
  } catch (e) {
    if (e.code === 11000) {
      const dup = new Error("You have already voted on this poll.");
      // @ts-expect-error custom code
      dup.code = "DUPLICATE_VOTE";
      // @ts-expect-error custom statusCode
      dup.statusCode = 400;
      throw dup;
    }
    throw e;
  }

  // Increment denormalized counter using $inc
  const updated = await Post.findByIdAndUpdate(
    postId,
    { $inc: { "meta.poll.totalVotes": 1 } },
    { new: true, setOptions: { includeDeleted: false } }
  );

  return {
    totalVotes: updated.meta.poll.totalVotes,
    yourVote:   optionIndex
  };
}

/**
 * Returns per-option vote breakdown and whether the current user has voted.
 *
 * @param {string} postId
 * @param {string} userId
 * @returns {Promise<object>}
 */
export async function getPollResults(postId, userId) {
  const post = await Post.findById(postId);
  if (!post || !post.meta?.poll) {
    const err = new Error("Poll not found");
    // @ts-expect-error custom code
    err.code = "NOT_FOUND";
    // @ts-expect-error custom statusCode
    err.statusCode = 404;
    throw err;
  }

  const { options, totalVotes } = post.meta.poll;

  // Aggregate votes per option
  const agg = await PollVote.aggregate([
    { $match: { postId: post._id } },
    { $group: { _id: "$optionIndex", count: { $sum: 1 } } }
  ]);

  const countMap = {};
  for (const row of agg) countMap[row._id] = row.count;

  const optionBreakdown = options.map((text, idx) => ({
    text,
    votes: countMap[idx] ?? 0
  }));

  // Check if current user has voted
  const userVote = await PollVote.findOne({ postId: post._id, userId }).lean();

  return {
    options:    optionBreakdown,
    totalVotes,
    yourVote:   userVote ? userVote.optionIndex : null
  };
}
