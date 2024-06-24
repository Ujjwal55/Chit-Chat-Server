import { Router } from "express";
import { deleteUser, getUserProfile, getUserProfileById, loginUser, logoutUser, refreshAccessToken, registerUser, updateUserProfile } from "../controllers/user.controller";
import { verifyJWT } from "../middleware/auth.middleware";
import { getFriendRequests, getFriends, removeFriend, respondToFriendRequest, searchFriend, sendFriendRequest } from "../controllers/friend.controller";

const router = Router();


// secured routes
router.post("/send-request", verifyJWT, sendFriendRequest);
router.get("/requests", verifyJWT, getFriendRequests);
router.post("/respond-request", verifyJWT, respondToFriendRequest);
router.post("remove-friend", verifyJWT, removeFriend)
router.get("/get-friends", verifyJWT, getFriends);
router.get("/search-friend/:searchTerm", verifyJWT, searchFriend);

export default router;