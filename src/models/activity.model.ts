import mongoose from "mongoose";
import { IActivityLogDocument } from "../types/activity.interface";

const activitySchema = new mongoose.Schema<IActivityLogDocument>({
    description: {
        type: String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }
}, {
    timestamps: true
})

export const Activity = mongoose.model("Activity", activitySchema);