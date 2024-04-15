import mongoose from "mongoose";
import { IFriendshipDocument } from "../types/friend.interface";

const friendshipSchema = new mongoose.Schema<IFriendshipDocument>(
    {
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted"],
            default: "pending",
        },
    },
    { timestamps: true }
);


export const Friendship = mongoose.model("Friendship", friendshipSchema);