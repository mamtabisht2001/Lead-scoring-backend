import dotenv from "dotenv";
dotenv.config();
import express from "express";
import setupRoutes from "./routes/index.js";
import multer from "multer"
const app = express();
const upload = multer({ storage: multer.memoryStorage() });


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) =>
  res
    .status(200)
    .json({ status: true, message: "Lead Scoring Backend running" })
);
setupRoutes(app);
const PORT = process.env.PORT|| 3000;
app.listen(PORT, () => {
  console.log(`App is running on ${PORT}`);
});

export default app