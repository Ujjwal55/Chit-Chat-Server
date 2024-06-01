import { Socket } from "socket.io";
import { IUserModel } from "./UserModel";

export interface ICustomSocket extends Socket {
    user?: IUserModel; // Optional user property attached to socket
}