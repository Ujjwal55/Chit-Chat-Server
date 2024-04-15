import mongoose from "mongoose";
import { IChatMessageDocument } from "../types/chat.interface";
import { IConversationMessageDocument } from "../types/conversation.interface";

const conversationSchema = new mongoose.Schema<IConversationMessageDocument>({
    content: {
        type: String
    },
    attachments: [{
        type: String,
    }],
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
        required: true
    }
}, {
    timestamps: true
})

export const Conversation = mongoose.model("Conversation", conversationSchema);