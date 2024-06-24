import { Router } from "express";
import { deleteUser, getNotifications, getUserProfile, getUserProfileById, loginUser, logoutUser, refreshAccessToken, registerUser, searchUser, updateUserProfile, verifyEmail } from "../controllers/user.controller";
import { verifyJWT } from "../middleware/auth.middleware";
import { multerUpload, singleAttachement } from "../middleware/multer.middleware";

const router = Router();

router.post("/register", singleAttachement, registerUser);
router.post("/login", loginUser);

// verifying the token
router.get("/:id/verify/:token", verifyEmail);

// secured routes
router.get("/profile", verifyJWT, getUserProfile);
router.get("/profile/:id", verifyJWT, getUserProfileById);
router.patch("/patch", verifyJWT, singleAttachement, updateUserProfile);
router.get("/notifications", verifyJWT, getNotifications);
router.get("/search-user/:searchTerm", verifyJWT, searchUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout/:id", verifyJWT, logoutUser)
router.delete("/delete", verifyJWT, deleteUser);

export default router;