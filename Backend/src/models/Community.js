// d:\projects\QCONNECT(V2.0)\Backend\src\models\Community.js
import mongoose from "mongoose";

const communitySchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, default: "" },
    aiAccountId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
);

// Note: slug index is created automatically from { unique: true } on the field definition above.

/**
 * Community model for subject-based groups (e.g., Physics, Mathematics).
 */
const Community = mongoose.model("Community", communitySchema);

export default Community;
