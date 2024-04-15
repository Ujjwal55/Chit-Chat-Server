import * as dotenv from "dotenv"
import cors from "cors";
import cookieParser from "cookie-parser"
import connectToDatabase from "./db/index";
import express from "express";
import { Server as SocketIOServer, Socket } from "socket.io";
import { createServer } from "http";
import {app, server} from "./socket/socket"
import routes from "./routes/index.route"


dotenv.config()

app.use(cors({
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    origin: "http://localhost:3000",
    },
))
app.use(express.json({limit: "160kb"}))
app.use(cookieParser())
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use("/api/v1" ,routes)

connectToDatabase().then(() => {
    server.listen(process.env.PORT, () => {
        console.log(`Server is running at http://localhost:${process.env.PORT}`)
    })
}).catch((error) => {
    console.log("Error in connecting to MONGODB!");
});