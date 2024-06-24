import {Request, Response} from "express"
import { Chat } from "../models/chat.model";
import { ICustomRequest } from "../types/UserModel";
import { Conversation } from "../models/conversation.model";
import { emitEvent } from "../services/socket.service";
import { ALERT, NEW_ATTACHEMENT, NEW_MESSAGE, NEW_MESSAGE_ALERT, REFETCH_CHATS } from "../constants/event.constants";
import mongoose, { ObjectId } from "mongoose";
import { User } from "../models/user.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { uploadMultipleFilesOnCloudinary } from "../services/cloudinary.service";


export const newGroupChat = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const senderId = req.user?._id;
    const { name, members } = req.body;
    if (members.length < 3) {
        throw new ApiError(400, "More than 2 members are required to form a group chat");
    }
    const allMembers = members.concat(senderId);
    const newChat = await Chat.create({ name, members: allMembers, creator: senderId, groupChat: true });
    emitEvent(req, ALERT, allMembers, { chat: newChat, action: "new_group_chat" });
    emitEvent(req, REFETCH_CHATS, allMembers, {});
    res.status(201).json({ message: "Group chat created successfully" });
});

export const getChats = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const userId = req.user?._id;
    const userChats = await Chat.find({members: {
        $in: userId
    }}, {
        name: 1,
        members: 1,
        groupChat: 1
    }).populate("members")
    res.status(200).json({data: userChats});
});

export const addMembers = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const { chatId, members } = req.body;
    const userId = req.user?._id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
        throw new ApiError(404, "Chat not found");
    } else if (!chat.groupChat) {
        throw new ApiError(400, "Chat is not a group chat");
    } else if (userId?.toString() !== chat.creator?.toString()) {
        throw new ApiError(403, "You are not the creator of this chat");
    }

    const validMembers = await User.find({ _id: { $in: members } }, '_id');
    if (validMembers.length !== members.length) {
        throw new ApiError(400, "Invalid members");
    }

    const validMemberIds = validMembers.map(member => member._id);
    const uniqueMembers = Array.from(new Set([...chat.members.map(m => m.toString()), ...validMemberIds.map(m => m.toString())])).map(m => new mongoose.Types.ObjectId(m));

    chat.members = uniqueMembers as [mongoose.Types.ObjectId];
    if (chat.members.length > 256) {
        throw new ApiError(400, "Cannot have more than 256 members in a group chat");
    }

    await chat.save();
    const allUsersName = await User.find({ _id: { $in: uniqueMembers } }, { fullName: 1, _id: 0 });
    const allUsersNameString = allUsersName.map(user => user.fullName).join(', ');
    emitEvent(req, ALERT, chat.members, `${allUsersNameString} has been added to group`);
    emitEvent(req, REFETCH_CHATS, chat.members, {});
    res.status(200).json({ message: "Members added successfully" });
});

export const removeMember = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const { chatId, removedUserId } = req.body;
    const userId = req.user?._id;
    const [chat, removedUserName] = await Promise.all([Chat.findById(chatId), User.findById(removedUserId)])

    if (!chat) {
        throw new ApiError(404, "Chat not found");
    } else if (!chat.groupChat) {
        throw new ApiError(400, "Chat is not a group chat");
    }

    if (userId?.toString() !== chat.creator?.toString()) {
        throw new ApiError(403, "You are not the creator of this chat");
    }

    if (removedUserId?.toString() === chat.creator?.toString()) {
        throw new ApiError(400, "Cannot remove the creator of the chat");
    }

    chat.members = chat.members.filter(member => member.toString() !== removedUserId) as [mongoose.Types.ObjectId];
    await chat.save();
    emitEvent(req, ALERT, chat.members, `${removedUserName} has been removed from group`);
    emitEvent(req, REFETCH_CHATS, chat.members, {});
    res.status(200).json({ message: "Member removed successfully" });
});

export const leaveGroup = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const chatId = req.params.id;
    const { userToLeave } = req.body;
    const [chat, userName] = await Promise.all([Chat.findById(chatId), User.findById(userToLeave)])
    if (!chat) {
        throw new ApiError(404, "Chat not found");
    } else if (!chat.groupChat) {
        throw new ApiError(400, "Chat is not a group chat");
    }
    const remainingMembers = chat.members.filter(member => member.toString() !== userToLeave) as [mongoose.Types.ObjectId];
    if (userToLeave?.toString() === chat.creator?.toString()) {
        const randomMember = Math.floor(Math.random() * remainingMembers.length);
        chat.creator = remainingMembers[randomMember];
    }
    chat.members = remainingMembers;
    await chat.save();
    emitEvent(req, ALERT, chat.members, `${userName} has left group`);
    emitEvent(req, REFETCH_CHATS, chat.members, {});
    res.status(200).json({ message: "Member left successfully" });
});

export const getUserGroups = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const userId = req.user?._id;
    const groups = await Chat.aggregate([
        {
            $match: {
                creator: userId,
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "members",
                foreignField: "_id",
                as: "membersInfo"
            }
        },
       {
            $project: {
                name: 1,
                membersInfo: 1,
                groupChat: 1
            }
       }
    ]);
    res.status(200).json({ groups: groups });
});

export const addMessage = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const { id: senderId } = req.params;
    const { message, chatId } = req.body;

    let conversation = await Chat.findOne({_id: chatId});

    if(!conversation) {
        throw new ApiError(404, "Chat not found");
    }

    const newMessage = new Conversation({
        content: message,
        sender: senderId,
        chat: chatId,
    });

    await newMessage.save();

    // await Promise.all([newMessage.save(), conversation.save()]);

    res.status(201).json({ message: "Message sent successfully" });
});

export const addAttachement = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const { id: senderId } = req.params;
    const { chatId } = req.body;
    console.log('hereeee1', chatId, senderId);
    const [chat, user] = await Promise.all([Chat.findById(chatId), User.findById(senderId, "fullName profileImageURL")]);
    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }
    const files: Express.Multer.File[] = req.files as Express.Multer.File[];
    if (files && files.length === 0) {
        throw new ApiError(400, "No files uploaded");
    }
    console.log("here222");
    const uploadedFiles = await uploadMultipleFilesOnCloudinary(files);

    const attachments = uploadedFiles.filter(upload => upload !== null && upload.url)?.map(upload => upload && upload.url);

    const messageToShow = {
        content: "",
        attachments,
        sender: {
            _id: senderId,
            fullName: user?.fullName,
            profileImageURL: user?.profileImageURL,
        },
        chat: chatId,
    };
    const messageForDB = {
        content: "",
        attachments,
        sender: senderId,
        chat: chatId,
    };
    const conversation = (await Conversation.create(messageForDB)).save();
    emitEvent(req, NEW_MESSAGE, chat.members, {
        message: messageToShow,
        chatId,
    });
    emitEvent(req, NEW_MESSAGE_ALERT, chat.members, { chatId });
    res.status(201).send({ "message": "Files Uploaded successfully" });
});

export const getChatDetails = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const { id: chatId } = req.params;
    const chat = await Chat.findById(chatId).populate("members", "id fullName profileImageURL");
    console.log("chatDeeee", chat);
    res.status(200).json({ chat });
});

export const renameGroup = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const { id: chatId } = req.params;
    const { newName } = req.body;
    const chat = await Chat.findById(chatId);

    if (!chat) {
        throw new ApiError(404, "Chat not found");
    } else if (!chat.groupChat) {
        throw new ApiError(400, "Chat is not a group chat");
    }
    else if (req?.user?._id?.toString() !== chat.creator?.toString()) {
        throw new ApiError(403, "You are not the creator of this chat");
    }

    chat.name = newName;
    await chat.save();
    emitEvent(req, REFETCH_CHATS, chat.members, {});

    res.status(200).json({ message: "Group renamed successfully" });
});

export const getChatMessages = asyncHandler(async (req: ICustomRequest, res: Response) => {
    const { id: chatId } = req.params;
    const { page, limit } = req.query;
    const messages = await Conversation.find({ chat: chatId }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit)).populate("sender");
    res.status(200).send({data: messages});
});