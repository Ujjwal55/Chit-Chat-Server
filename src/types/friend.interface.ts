import mongoose from "mongoose";
import {Request} from "express"
import { ICustomRequest, IUserModel } from "./UserModel";

export interface IFriendshipDocument extends Document {
    from: mongoose.Types.ObjectId;
    to: mongoose.Types.ObjectId;
    status: "pending" | "accepted" | "rejected";
    createdAt: Date;
    updatedAt: Date;
}

export interface ISendFriendRequest extends Request {
    user?: IUserModel;
    body: {
        friendId: mongoose.Types.ObjectId;
    }
}

export interface IResponseFriendRequest extends Request {
    user?: IUserModel;
    body: {
        friendshipId: mongoose.Types.ObjectId;
        response: string;
    }
}