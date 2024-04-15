import { Router } from "express";
import UserRoutes from "./user.route"
import FriendRoutes from "./friend.route"
import ActivityRoutes from "./activity.route"
import ChatRoutes from "./chat.route"

const router = Router();

router.use("/user", UserRoutes);
router.use("/friend", FriendRoutes);
router.use("/activity", ActivityRoutes);
router.use("/chat", ChatRoutes);

export default router;