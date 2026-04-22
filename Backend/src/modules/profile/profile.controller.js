// d:\projects\QCONNECT(V2.0)\Backend\src\modules\profile\profile.controller.js
import { checkUsernameAvailability, getSuggestedTopics, setupUserProfile, getUserProfile } from "./profile.service.js";
import { usernameQuerySchema, suggestTopicsSchema, setupProfileSchema } from "./profile.validation.js";

export async function checkUsernameController(req, res) {
  const { query } = usernameQuerySchema.parse(req);
  const result = await checkUsernameAvailability(query.username, req.user?.id);
  res.json({ available: result.available });
}

export async function suggestTopicsController(req, res) {
  const { body } = suggestTopicsSchema.parse(req);
  const topics = getSuggestedTopics(body.selectedDomains);
  res.json({ topics });
}

export async function setupProfileController(req, res) {
  let interests = [];
  try {
    if (req.body.interests) {
      interests = JSON.parse(req.body.interests);
    }
  } catch {
    const error = new Error("Invalid interests format");
    // @ts-expect-error custom status
    error.statusCode = 400;
    throw error;
  }

  const { body } = setupProfileSchema.parse({
    body: {
      ...req.body,
      interests
    }
  });

  const user = await setupUserProfile(req.user.id, body, req.file);
  res.json({ user });
}

export async function meController(req, res) {
  const user = await getUserProfile(req.user.id);
  res.json({ user });
}
