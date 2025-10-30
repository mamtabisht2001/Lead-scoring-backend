import dotenv from "dotenv";
dotenv.config();
import express from "express";
import setupRoutes from "./routes/index.js";
const app = express();
app.use(express.json())
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
