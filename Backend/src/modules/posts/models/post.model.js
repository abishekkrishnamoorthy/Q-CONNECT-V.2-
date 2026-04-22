// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\models\post.model.js
import mongoose from "mongoose";

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const mediaItemSchema = new mongoose.Schema(
  {
    url:       { type: String, required: true },
    type:      { type: String, enum: ["image", "video", "file"], required: true },
    caption:   { type: String, maxlength: 200, default: null },
    order:     { type: Number, default: 0 },
    sizeBytes: { type: Number, default: null }
  },
  { _id: false }
);

const pollSchema = new mongoose.Schema(
  {
    question:   { type: String, default: null },
    options:    { type: [String], default: [] },
    totalVotes: { type: Number, default: 0 }
  },
  { _id: false }
);

const contentSchema = new mongoose.Schema(
  {
    text:      { type: String, default: null },
    media:     { type: [mediaItemSchema], default: [] },
    thumbnail: { type: String, default: null }
  },
  { _id: false }
);

const metaSchema = new mongoose.Schema(
  {
    allowAI:    { type: Boolean, default: false },
    allowHuman: { type: Boolean, default: true },
    duration:   { type: Number, default: null },
    quizId:     { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", default: null },
    poll:       { type: pollSchema, default: null }
  },
  { _id: false }
);

const statsSchema = new mongoose.Schema(
  {
    likes:    { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    saves:    { type: Number, default: 0 }
  },
  { _id: false }
);

// ── Main Post Schema ──────────────────────────────────────────────────────────

const postSchema = new mongoose.Schema(
  {
    author:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type:        {
      type: String,
      enum: ["image", "short", "thought", "question", "quiz", "ai"],
      required: true,
      index: true
    },
    visibility:  {
      type: String,
      enum: ["public", "private", "community", "tempRoom"],
      default: "public"
    },
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      default: null,
      sparse: true
    },
    tempRoomId:  {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TempRoom",
      default: null,
      sparse: true
    },
    status:    { type: String, enum: ["active", "deleted"], default: "active", index: true },
    deletedAt: { type: Date, default: null },
    editedAt:  { type: Date, default: null },
    tags:      { type: [String], default: [] },
    content:   { type: contentSchema, default: () => ({}) },
    meta:      { type: metaSchema, default: () => ({}) },
    stats:     { type: statsSchema, default: () => ({}) },
    aiType:    {
      type: String,
      // null is valid (all non-AI posts); Mongoose skips enum check for null on non-required fields
      enum: ["news", "fact", "quiz", "fun_question"],
      default: null
    }
  },
  { timestamps: true }
);

// ── Compound Indexes (matching DB_SCHEMA_REFERENCE exactly) ──────────────────
postSchema.index({ status: 1, visibility: 1, communityId: 1, createdAt: -1 });
postSchema.index({ status: 1, visibility: 1, tempRoomId: 1, createdAt: -1 });
postSchema.index({ author: 1, status: 1, createdAt: -1 });
postSchema.index({ type: 1, status: 1, createdAt: -1 });
postSchema.index({ type: 1, aiType: 1, createdAt: -1 });
postSchema.index({ tags: 1, status: 1 });

// ── Pre-save Hook — mutual exclusivity ───────────────────────────────────────
postSchema.pre("save", function (next) {
  if (this.communityId && this.tempRoomId) {
    const err = new Error("Post cannot belong to both a community and a temp room");
    // @ts-expect-error custom code
    err.code = "CONTEXT_CONFLICT";
    // @ts-expect-error custom statusCode
    err.statusCode = 422;
    return next(err);
  }
  if (this.visibility === "community" && !this.communityId) {
    const err = new Error("communityId is required when visibility is 'community'");
    // @ts-expect-error custom code
    err.code = "VALIDATION_ERROR";
    // @ts-expect-error custom statusCode
    err.statusCode = 400;
    return next(err);
  }
  if (this.visibility === "tempRoom" && !this.tempRoomId) {
    const err = new Error("tempRoomId is required when visibility is 'tempRoom'");
    // @ts-expect-error custom code
    err.code = "VALIDATION_ERROR";
    // @ts-expect-error custom statusCode
    err.statusCode = 400;
    return next(err);
  }
  next();
});

// ── Pre-find Middleware — auto soft-delete filter ─────────────────────────────
function applyActiveFilter(next) {
  // @ts-expect-error query context
  const opts = this.getOptions();
  if (!opts.includeDeleted) {
    // @ts-expect-error query context
    this.where({ status: "active" });
  }
  next();
}

postSchema.pre("find", applyActiveFilter);
postSchema.pre("findOne", applyActiveFilter);
postSchema.pre("findOneAndUpdate", applyActiveFilter);
postSchema.pre("countDocuments", applyActiveFilter);

/**
 * Unified post document model for all post types.
 */
const Post = mongoose.model("Post", postSchema);

export default Post;
