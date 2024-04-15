import { CookieOptions } from "express";

export const TokenOptions: CookieOptions = {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    sameSite: "none",
    secure: true,
    path: "/"
}

export const SOCKET_TOKEN = "somerandomtoken"