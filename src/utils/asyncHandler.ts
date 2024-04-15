import { Request, Response, NextFunction } from 'express';

class CustomError extends Error {
    statusCode?: number;

    constructor(message: string, code?: number) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = this.statusCode;
    }
}


type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export const asyncHandler = (fn: AsyncFunction) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        const err = error as CustomError;
        res.status(err.statusCode || 500).json({
            success: false,
            message: err.message
        });
    }
};