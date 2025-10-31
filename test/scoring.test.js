import request from "supertest";
import { jest } from "@jest/globals";

import express from "express";

// --- Step 1: Mock Prisma before importing app ---
const mockPrismaClient = {
  lead: {
    findMany: jest.fn(),
    createMany: jest.fn(),
  },
  scoringBatch: {
    create: jest.fn(),
  },
};

// Return this mock whenever PrismaClient is instantiated
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
}));

// --- Step 2: Mock OpenAI before importing app ---
jest.mock("openai", () => ({
  OpenAI: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: "Lead scored successfully" } }],
        }),
      },
    },
  })),
}));

// --- Step 3: Import app after mocks ---
import app from "../src/server.js";

// --- Step 4: Safety helper ---
const ensureMock = (obj, key) => {
  if (!obj[key] || typeof obj[key] !== "function" || !obj[key].mock) {
    obj[key] = jest.fn();
  }
};

// Defensive fix in case any mock fields go missing
if (!mockPrismaClient.lead) mockPrismaClient.lead = {};
if (!mockPrismaClient.scoringBatch) mockPrismaClient.scoringBatch = {};

ensureMock(mockPrismaClient.lead, "findMany");
ensureMock(mockPrismaClient.lead, "createMany");
ensureMock(mockPrismaClient.scoringBatch, "create");

// --- Step 5: TEST SUITE ---
describe("Lead Scoring API", () => {
  // ===== 1️⃣ Upload Endpoint =====
  describe("POST /leads/upload", () => {
    it("should return 400 when no file uploaded", async () => {
      const res = await request(app).post("/leads/upload");
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("No file uploaded");
    });

    it("should upload CSV and create leads", async () => {
      mockPrismaClient.lead.createMany.mockResolvedValue({ count: 2 });

      const res = await request(app)
        .post("/leads/upload")
        .attach(
          "file",
          Buffer.from("name,email\nJohn,john@gmail.com"),
          "leads.csv"
        );

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Leads uploaded successfully");
      expect(mockPrismaClient.lead.createMany).toHaveBeenCalled();
    });
  });

  // ===== 2️⃣ Scoring Endpoint =====
  describe("POST /score", () => {
    it("should handle missing offerId", async () => {
      const res = await request(app).post("/score").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("No offer ID available");
    });

    it("should score leads successfully", async () => {
      mockPrismaClient.lead.findMany.mockResolvedValue([
        { id: 1, name: "John Doe", email: "john@gmail.com" },
      ]);
      mockPrismaClient.scoringBatch.create.mockResolvedValue({ id: 1 });

      const res = await request(app).post("/score").send({ offerId: 1 });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Scoring completed successfully");
      expect(mockPrismaClient.scoringBatch.create).toHaveBeenCalled();
    });
  });

  // ===== 3️⃣ Results Endpoint =====
  describe("GET /results", () => {
    it("should handle missing offerId", async () => {
      const res = await request(app).get("/results");
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("No offer ID provided");
    });

    it("should return scored leads", async () => {
      mockPrismaClient.lead.findMany.mockResolvedValue([
        { id: 1, name: "John Doe", score: 87 },
      ]);

      const res = await request(app).get("/results").query({ offerId: 1 });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].name).toBe("John Doe");
    });
  });

  // ===== 4️⃣ CSV Export =====
  describe("GET /results/export", () => {
    it("should export results as CSV", async () => {
      mockPrismaClient.lead.findMany.mockResolvedValue([
        { id: 1, name: "John Doe", score: 90 },
      ]);

      const res = await request(app)
        .get("/results/export")
        .query({ offerId: 1 });

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.text).toContain("John Doe");
    });
  });

  // ===== 5️⃣ 404 Handler =====
  describe("404 Handler", () => {
    it("should return 404 for unknown routes", async () => {
      const res = await request(app).get("/unknown");
      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Endpoint not found");
    });
  });
});
