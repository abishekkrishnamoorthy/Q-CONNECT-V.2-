// d:\projects\QCONNECT(V2.0)\Backend\src\services\cloudinary.service.js
import { v2 as cloudinary } from "cloudinary";
import { config } from "../config/index.js";

cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret
});

/**
 * Uploads a profile image buffer to Cloudinary.
 * @param {{buffer:Buffer,mimetype:string,userId:string}} input
 * @returns {Promise<{url:string,publicId:string}>}
 */
export async function uploadProfileImage(input) {
  const dataUri = `data:${input.mimetype};base64,${input.buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: "qconnect/profile-pics",
    public_id: `user_${input.userId}_${Date.now()}`,
    resource_type: "image",
    overwrite: true
  });

  return { url: result.secure_url, publicId: result.public_id };
}

/**
 * Deletes a Cloudinary image by public id.
 * @param {string} publicId
 * @returns {Promise<void>}
 */
export async function deleteProfileImage(publicId) {
  if (!publicId) {
    return;
  }
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}
