// d:\projects\QCONNECT(V2.0)\Backend\src\jobs\statsFlush.job.js
// Stats Flush Cron Job — Step 11
// Schedule: every 5 minutes
// In MongoDB-backed stats mode this is a structured no-op.
// MongoDB $inc already keeps stats consistent on every interaction.
// Wired with the exact interface from the spec so Redis can be plugged in
// later without changing any service code.
//
// Redis plug-in path (future):
//   1. Import redis client
//   2. SCAN keys matching "post:stats:*:likes"
//   3. Extract postId from each key
//   4. Call flushStatsToDB(postId) from post.stats.js
//   5. Do NOT delete Redis keys after flush
import cron from "node-cron";
import { flushStatsToDB } from "../modules/posts/post.stats.js";

/**
 * Scans and flushes stats for all active posts to MongoDB.
 * No-op in MongoDB-only mode; logs confirm the job is running.
 *
 * @returns {Promise<void>}
 */
async function runStatsFlush() {
  try {
    // MongoDB mode: stats are already in MongoDB via $inc.
    // This hook is preserved for Redis plug-in compatibility.
    // eslint-disable-next-line no-console
    console.log("[statsFlush] Stats flush tick — MongoDB mode (no-op).");

    // Future Redis mode example (uncomment when Redis is added):
    // const keys = await redis.keys("post:stats:*:likes");
    // const postIds = keys.map(k => k.split(":")[2]);
    // await Promise.all(postIds.map(id => flushStatsToDB(id)));
    // console.log(`[statsFlush] Flushed stats for ${postIds.length} posts`);

    // Suppress unused import warning in MongoDB-only mode
    void flushStatsToDB;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[statsFlush] Error during stats flush:", err);
  }
}

/**
 * Registers and starts the stats flush cron job.
 * Call once at server startup.
 *
 * @returns {cron.ScheduledTask}
 */
export function startStatsFlushJob() {
  const task = cron.schedule("*/5 * * * *", runStatsFlush, {
    name:     "statsFlush",
    timezone: "UTC"
  });
  // eslint-disable-next-line no-console
  console.log("[statsFlush] Cron job registered — runs every 5 minutes.");
  return task;
}
