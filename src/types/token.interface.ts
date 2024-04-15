import mongoose from "mongoose";

export interface ITokenDocument extends Document {
    userId: mongoose.Types.ObjectId;
    token: String;
    createdAt: Date;
}