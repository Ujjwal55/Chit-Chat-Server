import { userSocketIds } from "../socket/socket";

export const getSockets = (users: any) => {
    const sockets = users?.map((user: any) => {
        return userSocketIds.get(user.toString())
    })
    return sockets;
}

export const emitEvent = (req: any, event: any, users: any, data: any) => {
    console.log("iiiiiiiii", req, users);
    const io = req.app.get("io");
    const userSockets = getSockets(users);
    io.to(userSockets).emit(event, data);
}
