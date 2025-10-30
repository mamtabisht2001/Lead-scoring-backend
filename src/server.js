import dotenv from "dotenv";
dotenv.config();
import express from "express";

const app = express();

// Health check
app.get("/", (req, res) =>
  res
    .status(200)
    .json({ status: true, message: "Lead Scoring Backend running" })
);

const PORT = process.env.PORT|| 3000;
app.listen(PORT, () => {
  console.log(`App is running on ${PORT}`);
});
