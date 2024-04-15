import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";


export interface IUserModel extends Document {
    _id: mongoose.Types.ObjectId;
    userName: string;
    email: string;
    fullName: string;
    password: string;
    isVerified: false;
    profileImageURL: string;
    lastLogin: Date;
    friends: mongoose.Types.ObjectId[];
    activityLogs: mongoose.Types.ObjectId[];
    refreshToken: string;
    generateAccessToken: () => string;
    generateRefreshToken: () => string;
}

export interface IUserVerificationModel extends Document {
    userId: string;
    uniqueString: string;
    createdAt: Date;
    expiresAt: Date;
}

export interface IAccessRefreshToken{
    accessToken: string;
    refreshToken: string;
}

export interface IJWTPayload extends JwtPayload{
    _id: string;
    email: string;
}

export interface ICustomRequest extends Request{
    user?: IUserModel
} 