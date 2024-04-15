import mongoose from "mongoose";

export interface IActivityLogDocument extends Document {
    description: string;
    user: mongoose.Types.ObjectId;
}