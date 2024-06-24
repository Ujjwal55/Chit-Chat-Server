import { Request, Response, response } from "express"
import { User } from "../models/user.model";
import bcrypt from "bcryptjs"
import jwt, { Secret } from "jsonwebtoken"
import { generateAccessToken } from "../services/user.service";
import { IAccessRefreshToken, ICustomRequest, IJWTPayload } from "../types/UserModel";
import { sendEmail } from "../services/email.service";
import crypto from "crypto"
import { Token } from "../models/token";
import { TokenOptions } from "../constants/token.constants";
import { Friendship } from "../models/friends.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import mongoose from "mongoose";
import { uploadOnCloudinary } from "../services/cloudinary.service";

export const registerUser = asyncHandler(async (req: any, res: Response) => {
    const { userName, password, fullName, email } = req.body;
    if (!userName || !password || !fullName || !email) {
        throw new ApiError(400, "All fields are required");
    }
    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters long");
    }
    const existingUser = await User.findOne({
        $or: [
            { userName },
            { email }
        ]
    });
    if (existingUser) {
        throw new ApiError(409, "User already exists");
    }
    const imageURL = req?.file?.path;
    const userProfileURL = await uploadOnCloudinary(imageURL);
    const newUser = new User({
        email,
        password,
        fullName,
        userName: userName?.toLowerCase(),
        profileImageURL: userProfileURL?.url || ""
    });
    const token = await new Token({
        userId: newUser._id,
        token: crypto.randomBytes(32).toString("hex")
    }).save();
    const url = `${process.env.BASE_URL}/users/${newUser._id}/verify/${token.token}`;
    await sendEmail(newUser.email, "Please Verify your email", url);
    await newUser.save();
    const { accessToken, refreshToken } = await generateAccessToken(newUser._id) as IAccessRefreshToken;
    res.status(201).cookie("refreshToken", refreshToken, TokenOptions).cookie("chat-auth", accessToken, TokenOptions).json({ message: "Verification Email Successfully Sent!" });
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, userName } = req.body;
    if (!userName && !email) {
        throw new ApiError(400, "Username or email is required!");
    }
    const user = await User.findOne({
        $or: [{ userName }, { email }]
    });
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    // const isPasswordValid = await bcrypt.compare(password, user.password);
    // if (!isPasswordValid) {
    //     throw new ApiError(401, "Invalid credentials");
    // }
    const { accessToken, refreshToken } = await generateAccessToken(user._id) as IAccessRefreshToken;
    res.status(200).cookie("refreshToken", refreshToken, TokenOptions).cookie("chat-auth", accessToken, TokenOptions).json({ user, accessToken });
});

// for verifying the email
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const user = await User.findOne({ _id: req.params.id });
    if (!user) {
        throw new ApiError(400, "Invalid Token");
    }
    const token = await Token.findOne({ userId: user._id, token: req.params.token });
    if (!token) {
        throw new ApiError(400, "Invalid Token");
    }
    await User.updateOne({ _id: user.id }, { $set: { isVerified: true } });
    res.status(200).json({ message: "Email verified successfully" });
});

export const getUserProfile = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const id = req?.user?._id;
    const user = await User.findById(id).select("-password -refreshToken");
    res.status(200).json({ user });
});

export const getUserProfileById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await User.findById(id).select("-password -refreshToken");
    res.status(200).json({ user });
});

export const updateUserProfile = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const id = req?.user?._id;
    const { fullName, email, oldPassword, password } = req.body;
    const imageURL = req?.file?.path;
    console.log("fullllllllll", fullName, email, oldPassword, password, imageURL);
    const userProfileURL = await uploadOnCloudinary(imageURL);
    const user = await User.findById(id);
    if(!user) {
        throw new ApiError(404, "User not found")
    }
    if (oldPassword && password) {
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            throw new ApiError(400, "Password don't match")
        }
        user.password = password;
    }
    if(fullName) user.fullName = fullName;
    if(email) user.email = email;
    if(userProfileURL) user.profileImageURL = userProfileURL?.url
    
    const updatedUser = await user.save();
    return res.status(200).json({ user: updatedUser });
});

export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
    const savedRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!savedRefreshToken) {
        throw new ApiError(401, "Refresh token not found");
    }
    const decodedToken = jwt.verify(savedRefreshToken, process.env.REFRESH_TOKEN_SECRET as Secret) as IJWTPayload;
    const user = await User.findById(decodedToken.id).select("-password");
    if (!user) {
        throw new ApiError(401, "User not found");
    }
    if (user.refreshToken !== savedRefreshToken) {
        throw new ApiError(403, "Refresh token is not valid");
    }
    const tokens = await generateAccessToken(user._id);
    if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
        throw new ApiError(500, "Could not generate tokens");
    }
    res.status(200).cookie("accessToken", tokens.accessToken, TokenOptions).cookie("refreshToken", tokens.refreshToken, TokenOptions).json({ user });
});

export const searchUser = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const userId = req.user?._id;
    let { searchTerm } = req.params;
    searchTerm = searchTerm?.toString().toLowerCase();
    if (!searchTerm) {
        throw new ApiError(400, "Search term is required");
    }
    const searchResult = await User.aggregate([
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
            },
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
                                            { $eq: ['$from', new mongoose.Types.ObjectId(userId)] },
                                            { $eq: ['$to', '$$userId'] }
                                        ]
                                    },
                                    {
                                        $and: [
                                            { $eq: ['$to', new mongoose.Types.ObjectId(userId)] },
                                            { $eq: ['$from', '$$userId'] }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                ],
                as: 'friendRequest'
            }
        },
        {
            $addFields: {
                friendShipStatus: {
                    $cond: {
                        if: { $gt: [{ $size: '$friendRequest'}, 0]},
                        then: {
                            $arrayElemAt: ['$friendRequest.status', 0]
                        },
                        else: null
                    }
                }
            }
        },
        {
            $project: {
                _id: 1,
                userName: 1,
                fullName: 1,
                email: 1,
                profilePicture: 1,
                friendShipStatus: 1
            }
        }
    ]);
    res.status(200).json(searchResult);
});

export const logoutUser = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, {
        $set: {
            refreshToken: ""
        }
    }, {
        new: true
    });
    res.status(200).cookie("refreshToken", "", { ...TokenOptions, maxAge: 0 }).cookie("chat-auth", "", { ...TokenOptions, maxAge: 0 }).json({ message: "User logged out" });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.status(200).json({ message: "User deleted" });
});

export const getNotifications = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const friendshipRequests = await Friendship.find({ to: req.user?._id, status: "pending" }).populate("from", "fullName userName profileImgURL").select("from");
    res.status(200).json(friendshipRequests);
});