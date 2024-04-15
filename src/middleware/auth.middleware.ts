import { NextFunction, Request, Response } from "express"
import jwt, { Secret } from "jsonwebtoken"
import { User } from "../models/user.model";
import { ICustomRequest, IJWTPayload } from "../types/UserModel";

export const verifyJWT = async (req: ICustomRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        if(!token){
            return res.status(401).json({message: "Unauthorized"})
        }
        const decoded = await jwt.verify(token, process.env.JWT_ACCESS_TOKEN as Secret) as IJWTPayload;
        const user = await User.findById(decoded?._id).select("-password");
        if(!user){
            return res.status(401).json({message: "Unauthorized"})
        }
        req.user = user;
        next();
    } catch(error){
        return res.status(401).json({message: "Unauthorized"})
    }
}

export const socketAuthenticator = async (err: any, socket: any, next: any) => {
    try {
        if(err) {
            return next(err);
        }
        const authToken = socket.request.cookies?.accessToken || socket.request.headers?.authorization?.replace("Bearer ", "");
        if(!authToken) {
            return next();
        }
        const decoded = await jwt.verify(authToken, process.env.JWT_ACCESS_TOKEN as Secret) as IJWTPayload;
        socket.user = await User.findById(decoded?._id).select("-password");
        next();
    } catch(error: any) {
        return next();
    }
}