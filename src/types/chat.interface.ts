import mongoose, { model } from "mongoose";

export interface IChatMessageDocument extends Document {
    name: string;
    creator?: mongoose.Types.ObjectId;
    groupChat: boolean;
    sender: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
    members: [mongoose.Types.ObjectId];
}