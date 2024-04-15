import { Router } from "express";
import { deleteUser, getUserProfile, getUserProfileById, loginUser, logoutUser, refreshAccessToken, registerUser, updateUserProfile } from "../controllers/user.controller";
import { verifyJWT } from "../middleware/auth.middleware";
import { getFriends, removeFriend, respondToFriendRequest, sendFriendRequest } from "../controllers/friend.controller";
import { addActivityLog, getUserActivityLogs } from "../controllers/activity.controller";

const router = Router();


// secured routes
router.post("/add", verifyJWT, addActivityLog);
router.get("/:userId", verifyJWT, getUserActivityLogs);

export default router;