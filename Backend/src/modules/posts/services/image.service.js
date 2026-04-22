// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\services\image.service.js
import Post from "../models/post.model.js";

/**
 * Creates an image-type post.
 * Assigns sequential order index to media items if not supplied.
 *
 * @param {string} authorId
 * @param {object} data - validated data from post.validator.js
 * @returns {Promise<object>} saved post document
 */
export async function createImagePost(authorId, data) {
  // Ensure media items have sequential order values
  const media = data.content.media.map((item, idx) => ({
    ...item,
    order: item.order ?? idx
  }));

  const post = new Post({
    author:      authorId,
    type:        "image",
    visibility:  data.visibility,
    communityId: data.communityId ?? null,
    tempRoomId:  data.tempRoomId  ?? null,
    tags:        data.tags ?? [],
    content: {
      text:  data.content.text ?? null,
      media,
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
