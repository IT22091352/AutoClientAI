import express from "express";
import {
	getMyBusiness,
	saveBusinessDetails,
	updateBusinessDetails,
	upsertMyBusiness,
} from "../controllers/businessController.js";
import { protect, requireFeatureAccess } from "../middleware/auth.js";

const router = express.Router();

router.get("/me", protect, requireFeatureAccess, getMyBusiness);
router.put("/me", protect, requireFeatureAccess, upsertMyBusiness);
router.post("/save", protect, requireFeatureAccess, saveBusinessDetails);
router.put("/update", protect, requireFeatureAccess, updateBusinessDetails);

export default router;
