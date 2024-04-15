import { Request, Response } from "express";
import { Activity } from "../models/activity.model";

export const addActivityLog = async (req: Request, res: Response): Promise<any> => {
    try {
        const { description, userId } = req.body;

        const activityLog = new Activity({
            description,
            user: userId,
        });

        await activityLog.save();

        return res.status(201).json({ message: "Activity log added successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getUserActivityLogs = async (req: Request, res: Response): Promise<any> => {
    try {
        const userId = req.params.userId;

        const activityLogs = await Activity.find({ user: userId }).sort({ createdAt: -1 });

        return res.status(200).json({ activityLogs });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

