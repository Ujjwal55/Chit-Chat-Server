export const emitEvent = (req: any, event: any, users: any, data: any) => {
    console.log("Emitting event", event);
}

export const getSockets = (users: any, userSocketIds: any) => {
    const sockets = users?.map((user: any) => {
        return userSocketIds.get(user._id.toString())
    })
    return sockets;
}