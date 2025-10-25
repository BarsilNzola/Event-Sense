import express from "express";
import { processPredictions } from "../controllers/predictionController.js";

const router = express.Router();

router.get("/analyze", processPredictions);

export default router;
