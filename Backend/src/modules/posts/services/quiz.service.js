// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\services\quiz.service.js
import Post from "../models/post.model.js";
import Quiz from "../models/quiz.model.js";
import QuizAttempt from "../models/quizAttempt.model.js";

/**
 * Creates a quiz-type post that references an existing Quiz document.
 * Verifies quiz exists, is owned by the author, and is active.
 *
 * @param {string} authorId
 * @param {object} data - validated data from post.validator.js
 * @returns {Promise<object>} saved post document
 */
export async function createQuizPost(authorId, data) {
  const quizId = data.meta.quizId;

  // 1. Verify quiz exists
  const quiz = await Quiz.findById(quizId).lean();
  if (!quiz) {
    const err = new Error("Quiz not found");
    // @ts-expect-error custom code
    err.code = "QUIZ_NOT_FOUND";
    // @ts-expect-error custom statusCode
    err.statusCode = 404;
    throw err;
  }

  // 2. Verify quiz belongs to this author
  if (String(quiz.author) !== String(authorId)) {
    const err = new Error("You can only link quizzes that you created");
    // @ts-expect-error custom code
    err.code = "QUIZ_OWNERSHIP";
    // @ts-expect-error custom statusCode
    err.statusCode = 403;
    throw err;
  }

  // 3. Verify quiz is active
  if (quiz.status !== "active") {
    const err = new Error("Quiz is closed and cannot be linked to a new post");
    // @ts-expect-error custom code
    err.code = "QUIZ_NOT_FOUND";
    // @ts-expect-error custom statusCode
    err.statusCode = 404;
    throw err;
  }

  const post = new Post({
    author:      authorId,
    type:        "quiz",
    visibility:  data.visibility,
    communityId: data.communityId ?? null,
    tempRoomId:  data.tempRoomId  ?? null,
    tags:        data.tags ?? [],
    content: {
      text:      data.content?.text ?? null,
      media:     [],
      thumbnail: null
    },
    meta: {
      allowAI:    false,
      allowHuman: true,
      duration:   null,
      quizId,
      poll:       null
    }
  });

  await post.save();

  // Back-link: update the Quiz document so quiz.postId points to the new post
  // This completes the two-step create flow: quiz created → post created → quiz linked
  await Quiz.findByIdAndUpdate(quizId, { $set: { postId: post._id } });

  return post;
}

/**
 * Creates a new Quiz document (not the post — post is created separately).
 *
 * @param {string} authorId
 * @param {{title:string, questions:object[], timeLimit?:number|null, communityId?:string|null}} data
 * @returns {Promise<object>} saved quiz document
 */
export async function createQuiz(authorId, data) {
  if (!data.questions || data.questions.length === 0) {
    const err = new Error("Quiz must have at least 1 question");
    // @ts-expect-error custom code
    err.code = "VALIDATION_ERROR";
    // @ts-expect-error custom statusCode
    err.statusCode = 400;
    throw err;
  }

  // postId starts as null — back-linked when the quiz-type Post is created (Step 2 of flow)
  const quiz = new Quiz({
    postId:      null,
    author:      authorId,
    communityId: data.communityId ?? null,
    title:       data.title,
    questions:   data.questions,
    timeLimit:   data.timeLimit ?? null
  });

  await quiz.save();
  return quiz;
}

/**
 * Attempts a quiz. One attempt per user enforced at DB level.
 * Scores the attempt and increments quiz.totalAttempts.
 *
 * @param {string} quizId
 * @param {string} userId
 * @param {number[]} answers - selected optionIndex per question
 * @param {number} timeTaken - seconds
 * @returns {Promise<{score:number, totalQ:number, passed:boolean, breakdown:object[]}>}
 */
export async function attemptQuiz(quizId, userId, answers, timeTaken) {
  // 1. Fetch quiz
  const quiz = await Quiz.findById(quizId).lean();
  if (!quiz) {
    const err = new Error("Quiz not found");
    // @ts-expect-error custom code
    err.code = "QUIZ_NOT_FOUND";
    // @ts-expect-error custom statusCode
    err.statusCode = 404;
    throw err;
  }

  // 2. Confirm quiz is active
  if (quiz.status !== "active") {
    const err = new Error("This quiz is closed");
    // @ts-expect-error custom code
    err.code = "QUIZ_NOT_FOUND";
    // @ts-expect-error custom statusCode
    err.statusCode = 404;
    throw err;
  }

  const totalQ = quiz.questions.length;

  // 3. Score the attempt
  let score = 0;
  const breakdown = quiz.questions.map((q, idx) => {
    const userAnswer = answers[idx] ?? -1;
    const isCorrect = userAnswer === q.correct;
    if (isCorrect) score++;
    return {
      questionIndex: idx,
      yourAnswer:    userAnswer,
      correct:       q.correct,
      isCorrect,
      explanation:   q.explanation ?? null
    };
  });

  // 4. Try insert QuizAttempt — duplicate key = already attempted
  try {
    await QuizAttempt.create({
      quizId,
      userId,
      answers,
      score,
      totalQ,
      timeTaken: timeTaken ?? 0
    });
  } catch (e) {
    if (e.code === 11000) {
      const dup = new Error("You have already attempted this quiz.");
      // @ts-expect-error custom code
      dup.code = "DUPLICATE_ATTEMPT";
      // @ts-expect-error custom statusCode
      dup.statusCode = 400;
      throw dup;
    }
    throw e;
  }

  // 5. Increment totalAttempts
  await Quiz.findByIdAndUpdate(quizId, { $inc: { totalAttempts: 1 } });

  return { score, totalQ, passed: score === totalQ, breakdown };
}

/**
 * Returns quiz leaderboard — top 50 by score desc then timeTaken asc.
 *
 * @param {string} quizId
 * @returns {Promise<object[]>}
 */
export async function getQuizLeaderboard(quizId) {
  const entries = await QuizAttempt.find({ quizId })
    .sort({ score: -1, timeTaken: 1 })
    .limit(50)
    .populate("userId", "name profile.username profile.profileImage")
    .lean();

  return entries.map((e, idx) => ({
    rank:      idx + 1,
    userId:    e.userId,
    score:     e.score,
    totalQ:    e.totalQ,
    timeTaken: e.timeTaken
  }));
}
