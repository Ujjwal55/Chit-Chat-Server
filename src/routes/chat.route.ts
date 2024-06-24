import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware";
import { addAttachement, addMembers, addMessage, getChatDetails, getChatMessages, getChats, getUserGroups, leaveGroup, newGroupChat, removeMember, renameGroup } from "../controllers/chat.controller";
import { multipleAttachements } from "../middleware/multer.middleware";

const router = Router();

// secured routes
router.post("/new", verifyJWT, newGroupChat);
router.get("/chats", verifyJWT, getChats);
router.get("/groups", verifyJWT, getUserGroups);
router.put("/add-members", verifyJWT, addMembers);
router.delete("/remove-member", verifyJWT, removeMember);
router.delete("/leave-group/:id", verifyJWT, leaveGroup);
router.post("/add/:id", verifyJWT, addMessage);
router.post("/add/attachment/:id", verifyJWT, multipleAttachements, addAttachement);
router.get("/:id", verifyJWT, getChatDetails);
router.post("/:id/rename", verifyJWT, renameGroup);
router.get("/message/:id", verifyJWT, getChatMessages);

export default router;