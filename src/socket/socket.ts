import {Server} from "socket.io"
import http from "http"
import express from "express"
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from "../constants/event.constants"
import { v4 as uuid} from "uuid";
import { getSockets } from "../services/socket.service";
import { Conversation } from "../models/conversation.model";
import cookieParser from "cookie-parser";
import { socketAuthenticator } from "../middleware/auth.middleware";

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

io.use((socket: any, next) => {
    cookieParser()(
        socket.request,
        socket.request.res,
        async (err) => await socketAuthenticator(err, socket, next)
    )
})

io.on("connection", (socket) => {
    console.log("Connected to socket.io", socket.id);
    const user = {
        _id: "dsdfds",
        name: "asdfg"
    }
    userSocketIds.set(user._id.toString(), socket.id);
    socket.on(NEW_MESSAGE, async ({chatId, members, message}) => {
        const messageForRealTime = {
            content: message,
            _id: uuid(),
            sender: {
                _id: user._id,
                fullName: user.name
            },
            chat: chatId,
            createdAt: new Date().toISOString()
        }
        const messageForDb = {
            content: message,
            sender: user._id,
            chat: chatId,
        }
        const usersSocket = getSockets(members, userSocketIds);
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
    })

    socket.on("disconnect", () => {
        console.log("Disconnected from socket.io", socket.id);
        userSocketIds.delete(user._id.toString())
    })
})

export {app, io, server}