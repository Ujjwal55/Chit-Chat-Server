import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt, { Secret } from "jsonwebtoken";
import { IJWTPayload, IUserModel, IUserVerificationModel } from "../types/UserModel";
import { ITokenDocument } from "../types/token.interface";

const tokenSchema = new mongoose.Schema<ITokenDocument>({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        expires: 3600000 // 1 hour
    }
})

export const Token = mongoose.model("Token", tokenSchema);