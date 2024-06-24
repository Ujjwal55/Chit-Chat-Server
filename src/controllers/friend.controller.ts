import { Request, Response } from "express";
import { User } from "../models/user.model";
import bcrypt from "bcryptjs";
import jwt, { Secret } from "jsonwebtoken";
import { generateAccessToken } from "../services/user.service";
import { IAccessRefreshToken, ICustomRequest, IJWTPayload } from "../types/UserModel";
import { Friendship } from "../models/friends.model";
import mongoose from "mongoose";
import { emitEvent } from "../services/socket.service";
import { NEW_REQUEST, REFETCH_CHATS } from "../constants/event.constants";
import { IResponseFriendRequest, ISendFriendRequest } from "../types/friend.interface";
import { Chat } from "../models/chat.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

export const sendFriendRequest = asyncHandler(async (req: ISendFriendRequest, res: Response) => {
    const userId = req.user?._id;
    const { friendId } = req.body;

    const existingRequest = await Friendship.findOne({$or: [
       {from: userId, to: friendId},
       {from: friendId, to: userId}
    ]});

    if (existingRequest) {
        throw new ApiError(400, "Friend request already sent or accepted");
    }
    
    // Creating new friend request
    const friendship = new Friendship({
        from: userId,
        to: friendId,
        status: "pending",
    });

    emitEvent(req, NEW_REQUEST, [friendId], {});
    await friendship.save();

    res.status(201).json({ message: "Friend request sent successfully" });
});

export const getFriendRequests = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const userId = req.user?._id;
    const friendRequests = await Friendship.find({ to: userId, status: "pending" }).populate("from");
    res.status(200).json({data: friendRequests});
});

export const respondToFriendRequest = asyncHandler(async (req: IResponseFriendRequest, res: Response) => {
    const { friendshipId, response } = req.body;

    const friendship = await Friendship.findById(friendshipId);

    if (!friendship) {
        throw new ApiError(404, "Friendship request not found");
    }

    await friendship.save();

    if (response === "accept") {
        await Promise.all([
            Friendship.updateOne({ _id: friendship._id }, { status: "accepted" }),
            Chat.create({members: [friendship.from, friendship.to]})
        ]);
        emitEvent(req, REFETCH_CHATS, [friendship.from, friendship.to], {});
    } else {
        // If the response is reject, delete the friend request
        await Friendship.deleteOne({ _id: friendship._id });
    }

    res.status(200).json({ message: `Friendship request ${response === "accept" ? "accepted" : "rejected"}` });
});

export const getFriends = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const id = req.user?._id;
    const friends = await Friendship.find({ $or: [{ from: id }, { to: id }] }).populate("from to");
    if (friends.length === 0) {
        res.status(200).json({ friends: [] });
    }
    res.status(200).json({ friends });
});

export const removeFriend = asyncHandler(async (req: Request, res: Response) => {
    const { userId, friendId } = req.body;

    const friendship = await Friendship.findOne({ user: userId, friend: friendId });

    if (!friendship) {
        throw new ApiError(404, "Friendship not found");
    }

    await Friendship.deleteOne({ _id: friendship._id });
    await User.findByIdAndUpdate(userId, { $pull: { friends: friendship._id } });

    res.status(200).json({ message: "Friend removed successfully" });
});

export const searchFriend = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const userId = req.user?._id;
    let { searchTerm } = req.params;
    searchTerm = searchTerm?.toString().toLowerCase();
    if (!searchTerm) {
        throw new ApiError(400, "Search term is required");
    }
    const friendsList = await User.aggregate([
        {
            $match: {
                $and: [
                    { _id: { $ne: userId } },
                    {
                        $or: [
                            { userName: { $regex: searchTerm, $options: "i" } },
                            { fullName: { $regex: searchTerm, $options: "i" } }
                        ]
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "friendships",
                let: { userId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $or: [
                                   {
                                    $and: [
                                        {
                                            $eq: ["$from", userId],
                                        },
                                        {
                                            $eq: ["$to", "$$userId"]
                                        },
                                        {
                                            $eq: ["$status", "accepted"]
                                        }
                                    ],
                                   },
                                   {
                                    $and: [
                                        {
                                            $eq: ["$from", "$$userId"],
                                        },
                                        {
                                            $eq: ["$to", userId]
                                        },
                                        {
                                            $eq: ["$status", "accepted"]
                                        }
                                    ],
                                   }
                                ],
                            }
                        }
                    }
                ],
                as: "friendship"
            }
        },
        {
            $match: {
                "friendship": { $ne: [] }
            }
        },
        {
            $lookup: {
                from: "chats",
                let: { userId: "$_id" },
                pipeline: [
                    {
                        $match: {
                            groupChat: false,
                            $expr: {
                                $and: [
                                    {
                                        $in: [
                                            userId, "$members"
                                        ]
                                    },
                                    {
                                        $in: [
                                            "$$userId", "$members"
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "members",
                            foreignField: "_id",
                            as: "memberDetails"
                        }
                    },
                    {
                        $addFields: {
                            members: "$memberDetails"
                        }
                    },
                    {
                        $project: {
                            memberDetails: 0
                        }
                    }
                ],
                as: "chatDetails"
            }
        },
        {
            $addFields: {
                chat: {
                    $cond: {
                        if: { $gt: [ { $size: "$chatDetails" }, 0 ] },
                        then: {
                            exists: true,
                            details: { $arrayElemAt: ["$chatDetails", 0]}
                        },
                        else: {
                            exists: false,
                            details: null
                        }                        
                    }
                }
            }
        },
        {
            $project: {                  
                _id: 1,
                userName: 1,
                email: 1,
                fullName: 1,
                profilePicture: 1,
                chat: 1
            }
        }
    ])
    res.status(200).json({data: friendsList});
});
