import mongoose from "mongoose";

export interface IConversationMessageDocument extends Document {
    content: string;
    attachments: [string],
    sender: mongoose.Types.ObjectId,
    chat: mongoose.Types.ObjectId
}