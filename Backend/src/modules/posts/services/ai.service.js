// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\services\ai.service.js
import Post from "../models/post.model.js";

/**
 * Creates an AI-type post.
 * Caller MUST have role "ai_account" — enforced by middleware AND double-checked here.
 *
 * @param {string} systemAccountId - ObjectId of the AI user account
 * @param {object} data - validated data from post.validator.js
 * @param {string} callerRole - role of the calling user (from req.user)
 * @returns {Promise<object>} saved post document
 */
export async function createAIPost(systemAccountId, data, callerRole) {
  if (callerRole !== "ai_account") {
    const err = new Error("Only AI accounts can create AI posts");
    // @ts-expect-error custom code
    err.code = "FORBIDDEN";
    // @ts-expect-error custom statusCode
    err.statusCode = 403;
    throw err;
  }

  const post = new Post({
    author:      systemAccountId,
    type:        "ai",
    aiType:      data.aiType,
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
      poll:       null
    }
  });

  await post.save();
  return post;
}
