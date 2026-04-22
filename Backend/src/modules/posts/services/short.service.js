// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\services\short.service.js
import Post from "../models/post.model.js";

/**
 * Creates a short-video-type post.
 * Belt-and-suspenders duration check after validator.
 *
 * @param {string} authorId
 * @param {object} data - validated data from post.validator.js
 * @returns {Promise<object>} saved post document
 */
export async function createShortPost(authorId, data) {
  const duration = data.meta?.duration;
  if (duration > 120) {
    const err = new Error("Short video duration must be ≤ 120 seconds");
    // @ts-expect-error custom code
    err.code = "VALIDATION_ERROR";
    // @ts-expect-error custom statusCode
    err.statusCode = 400;
    throw err;
  }

  const post = new Post({
    author:      authorId,
    type:        "short",
    visibility:  data.visibility,
    communityId: data.communityId ?? null,
    tempRoomId:  data.tempRoomId  ?? null,
    tags:        data.tags ?? [],
    content: {
      text:      data.content.text ?? null,
      media:     data.content.media,
      thumbnail: null
    },
    meta: {
      allowAI:    false,
      allowHuman: true,
      duration,
      quizId:     null,
      poll:       null
    }
  });

  await post.save();
  return post;
}
