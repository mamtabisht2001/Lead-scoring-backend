import express from "express";
const router = express.Router();

import { createOffer } from "../controllers/offerController.js";

router.post("/offer", createOffer);

export default router;