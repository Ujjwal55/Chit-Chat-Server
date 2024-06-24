import {Server} from "socket.io"
import http from "http"
import express from "express"
import { NEW_MESSAGE, NEW_MESSAGE_ALERT, START_TYPING, STOP_TYPING } from "../constants/event.constants"
import { v4 as uuid} from "uuid";
import { getSockets } from "../services/socket.service";
import { Conversation } from "../models/conversation.model";
import cookieParser from "cookie-parser";
import { socketAuthenticator } from "../middleware/auth.middleware";
import { ICustomSocket } from "../types/socket.interface";

const app = express()

const server = http.createServer(app);

const userSocketIds = new Map();

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000"],
        credentials: true,
        methods: ["GET", "POST"]
    }
})

app.set("io", io);


io.use((socket: any, next) => {
    cookieParser()(
        socket.request,
        socket.request.res,
        async (err) => await socketAuthenticator(err, socket, next)
    )
})

io.on("connection", (socket: ICustomSocket) => {
    const user = socket?.user
    console.log("herereeee", user);
    userSocketIds.set(user?._id.toString(), socket?.id);
    console.log('userSocketIds', userSocketIds);
    socket.on(NEW_MESSAGE, async ({chatId, members, message}: any) => {
        const messageForRealTime = {
            content: message,
            _id: uuid(),
            sender: {
                _id: user?._id,
                fullName: user?.fullName
            },
            chat: chatId,
            createdAt: new Date().toISOString()
        }
        const messageForDb = {
            content: message,
            sender: user?._id,
            chat: chatId,
        }
        const usersSocket = getSockets(members);
        io.to(usersSocket).emit(NEW_MESSAGE, {
            chatId,
            message: messageForRealTime
        })
        io.to(usersSocket).emit(NEW_MESSAGE_ALERT, {chatId});
        try {
            await Conversation.create(messageForDb);
        } catch (error: any) {
            console.log("error", error);
        }
    });

    socket.on(START_TYPING, ({members, chatId}) => {
        const memberSockets = getSockets(members);
        socket.to(memberSockets).emit(START_TYPING, { chatId });
    })

    socket.on(STOP_TYPING, ({members, chatId}) => {
        const memberSockets = getSockets(members);
        socket.to(memberSockets).emit(STOP_TYPING, { chatId });
    })

    socket.on("disconnect", () => {
        console.log("Disconnected from socket.io", socket.id);
        userSocketIds.delete(user?._id.toString())
    })
})

export {app, io, server, userSocketIds}