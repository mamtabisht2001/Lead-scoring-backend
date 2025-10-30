import express from "express";
import multer from "multer"
const router = express.Router();
const upload =multer()

import { uploadLeads } from "../controllers/leadController.js";

router.post("/leads/upload", upload.single("file"), uploadLeads);

export default router;