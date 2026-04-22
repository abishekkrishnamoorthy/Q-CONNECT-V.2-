// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\services\question.service.js
import { EventEmitter } from "node:events";
import Post from "../models/post.model.js";

/**
 * Internal event bus for cross-module communication.
 * AI integration layer listens to "ai.question.created".
 */
export const postEventBus = new EventEmitter();

/**
 * Creates a question-type post.
 * Emits "ai.question.created" if allowAI is true.
 *
 * @param {string} authorId
 * @param {object} data - validated data from post.validator.js
 * @returns {Promise<object>} saved post document
 */
export async function createQuestionPost(authorId, data) {
  const { allowAI, allowHuman } = data.meta;

  const post = new Post({
    author:      authorId,
    type:        "question",
    visibility:  data.visibility,
    communityId: data.communityId ?? null,
    tempRoomId:  data.tempRoomId  ?? null,
    tags:        data.tags ?? [],
    content: {
      text:      data.content.text,
      media:     [],
      thumbnail: null
    },
    meta: {
      allowAI,
      allowHuman,
      duration: null,
      quizId:   null,
      poll:     null
    }
  });

  await post.save();

  // Emit event for AI layer — fire-and-forget, never block the response
  if (allowAI) {
    postEventBus.emit("ai.question.created", {
      postId:      String(post._id),
      communityId: data.communityId ?? null,
      text:        data.content.text
    });
  }

  return post;
}
