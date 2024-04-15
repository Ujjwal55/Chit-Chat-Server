import mongoose from "mongoose";
import { IChatMessageDocument } from "../types/chat.interface";

const chatSchema = new mongoose.Schema<IChatMessageDocument>({
    name: {
        type: String,
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    groupChat: {
        type: Boolean,
        default: false
    },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
}, {
    timestamps: true
})

export const Chat = mongoose.model("Chat", chatSchema);