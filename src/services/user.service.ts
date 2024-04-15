import mongoose from "mongoose";
import { User } from "../models/user.model";

export const generateAccessToken = async(userId: mongoose.Types.ObjectId) => {
    try{
        const user = await User.findById(userId);
        if(user){
            const accessToken = await user.generateAccessToken();
            const refreshToken = await user.generateRefreshToken();
            user.refreshToken = refreshToken;
            await user.save({validateBeforeSave: false});
            return {accessToken, refreshToken};
        }
        return null;
    } catch(error){
        return null;
    }
}