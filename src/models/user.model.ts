import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt, { Secret } from "jsonwebtoken";
import { IJWTPayload, IUserModel } from "../types/UserModel";

const userSchema = new mongoose.Schema<IUserModel>({
    userName: {
        type: String,
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    // for checking if email is verified
    isVerified: {
        type: Boolean,
        default: false
    },
    profileImageURL: {
        type: String
    },
    lastLogin: {
        type: Date,
        default: null
    },
    refreshToken: {
        type: String
    }
}, {
    timestamps: true
})

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
})

userSchema.methods.isPasswordCorrect = async function(password: string): Promise<boolean> {
    const isPassword = await bcrypt.compare(password, this.password);
    return isPassword;
}

userSchema.methods.generateAccessToken = async function() {
    console.log("hiiii");
    const payload: IJWTPayload = {
        _id: this._id,
        email: this.email
    }
    const accessToken = jwt.sign(payload,
        process.env.JWT_ACCESS_TOKEN as Secret, {
            expiresIn: process.env.JWT_TOKEN_DURATION
        })
    return accessToken;
}

userSchema.methods.generateRefreshToken = async function() {
    const payload: IJWTPayload = {
        _id: this._id,
        email: this.email
    }
    const refreshToken = jwt.sign(payload,
        process.env.REFRESH_TOKEN_SECRET as Secret,
    {
            expiresIn: process.env.REFRESH_TOKEN_DURATION
    })
    return refreshToken;
}

export const User = mongoose.model("User", userSchema)