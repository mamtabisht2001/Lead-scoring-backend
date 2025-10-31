import express from "express";
import multer from "multer";
const router = express.Router();
const upload = multer();

import {
  uploadLeads,
  leadsScore,
  results,
  exportResults,
} from "../controllers/leadController.js";

router.post("/leads/upload", upload.single("file"), uploadLeads);
router.post("/score", leadsScore);
router.get("/results", results);
router.get("/results/export", exportResults);

export default router;
