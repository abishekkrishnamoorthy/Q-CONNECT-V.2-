// d:\projects\QCONNECT(V2.0)\Backend\src\modules\posts\post.validator.js
import { z } from "zod";

// ── Helpers ───────────────────────────────────────────────────────────────────

const objectIdStr = () =>
  z.string().regex(/^[a-f\d]{24}$/i, "Must be a valid ObjectId");

const baseTags = z
  .array(z.string().max(30, "Each tag must be at most 30 chars"))
  .max(10, "Maximum 10 tags")
  .optional()
  .default([]);

// ── Base fields shared by all post types ──────────────────────────────────────

const baseSchema = z.object({
  visibility:  z.enum(["public", "private", "community", "tempRoom"]),
  communityId: objectIdStr().optional(),
  tempRoomId:  objectIdStr().optional(),
  tags:        baseTags
});

// Cross-field refinement — applied to every type schema
function withContextRefinement(schema) {
  return schema
    .refine(
      (d) => !(d.communityId && d.tempRoomId),
      { message: "communityId and tempRoomId cannot both be set", path: ["communityId"] }
    )
    .refine(
      (d) => !(d.visibility === "community" && !d.communityId),
      { message: "communityId is required when visibility is 'community'", path: ["communityId"] }
    )
    .refine(
      (d) => !(d.visibility === "tempRoom" && !d.tempRoomId),
      { message: "tempRoomId is required when visibility is 'tempRoom'", path: ["tempRoomId"] }
    );
}

// ── Media item schema (reusable) ──────────────────────────────────────────────

const mediaItemSchema = z.object({
  url:       z.string().url("Media url must be a valid URL"),
  type:      z.enum(["image", "video", "file"]),
  caption:   z.string().max(200).optional().nullable(),
  order:     z.number().int().min(0).optional().default(0),
  sizeBytes: z.number().int().positive().optional().nullable()
});

// ── Per-type schemas ──────────────────────────────────────────────────────────

// image post
const imageSchema = withContextRefinement(
  baseSchema.extend({
    type: z.literal("image"),
    content: z.object({
      text:  z.string().max(500).optional().nullable(),
      media: z
        .array(mediaItemSchema.extend({ type: z.literal("image") }))
        .min(1, "At least 1 image required")
        .max(10, "Maximum 10 images")
    })
  })
);

// short (video) post
const shortSchema = withContextRefinement(
  baseSchema.extend({
    type: z.literal("short"),
    content: z.object({
      text:  z.string().max(300).optional().nullable(),
      media: z
        .array(mediaItemSchema.extend({ type: z.literal("video") }))
        .length(1, "Exactly 1 video required")
    }),
    meta: z.object({
      duration: z.number().int().min(1).max(120, "Duration must be ≤ 120 seconds")
    })
  })
);

// thought post (text-only or with poll)
const pollOptionSchema = z
  .string()
  .min(1)
  .max(100, "Each poll option must be at most 100 chars");

const thoughtSchema = withContextRefinement(
  baseSchema.extend({
    type: z.literal("thought"),
    content: z.object({
      text:  z.string().min(1).max(280, "Thought text must be ≤ 280 chars"),
      media: z.array(mediaItemSchema).max(4, "Maximum 4 media items").optional().default([])
    }),
    meta: z
      .object({
        poll: z
          .object({
            question: z.string().min(1).max(150, "Poll question must be ≤ 150 chars"),
            options:  z
              .array(pollOptionSchema)
              .min(2, "Poll must have at least 2 options")
              .max(6, "Poll can have at most 6 options")
          })
          .optional()
          .nullable()
      })
      .optional()
  })
);

// question post
const questionSchema = withContextRefinement(
  baseSchema.extend({
    type: z.literal("question"),
    content: z.object({
      text: z.string().min(1).max(2000, "Question text must be ≤ 2000 chars")
    }),
    meta: z
      .object({
        allowAI:    z.boolean(),
        allowHuman: z.boolean()
      })
      .refine((m) => m.allowAI || m.allowHuman, {
        message: "At least one of allowAI or allowHuman must be true",
        path: ["allowAI"]
      })
  })
);

// quiz post (links to an already-existing Quiz document)
const quizPostSchema = withContextRefinement(
  baseSchema.extend({
    type: z.literal("quiz"),
    content: z.object({
      text: z.string().max(500).optional().nullable()
    }).optional(),
    meta: z.object({
      quizId: objectIdStr()
    })
  })
);

// ai post
const aiPostSchema = withContextRefinement(
  baseSchema.extend({
    type: z.literal("ai"),
    content: z.object({
      text:  z.string().min(1).max(3000, "AI post text must be ≤ 3000 chars"),
      media: z.array(mediaItemSchema).optional().default([])
    }),
    aiType: z.enum(["news", "fact", "quiz", "fun_question"])
  })
);

// ── Schema map ────────────────────────────────────────────────────────────────

const TYPE_SCHEMA_MAP = {
  image:    imageSchema,
  short:    shortSchema,
  thought:  thoughtSchema,
  question: questionSchema,
  quiz:     quizPostSchema,
  ai:       aiPostSchema
};

/**
 * Validates raw request body against the schema for the declared post type.
 * Returns cleaned, parsed data or throws a ZodError caught by errorMiddleware.
 *
 * @param {unknown} body
 * @returns {object} validated + coerced data
 */
export function validatePost(body) {
  const raw = /** @type {Record<string, unknown>} */ (body);
  const type = raw?.type;

  if (!type || !TYPE_SCHEMA_MAP[type]) {
    const err = new Error(`Unknown or missing post type: "${type}"`);
    // @ts-expect-error custom statusCode
    err.statusCode = 400;
    // @ts-expect-error custom code
    err.code = "INVALID_POST_TYPE";
    throw err;
  }

  return TYPE_SCHEMA_MAP[type].parse(body);
}

export { TYPE_SCHEMA_MAP };
