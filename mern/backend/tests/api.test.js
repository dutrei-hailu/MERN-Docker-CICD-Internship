import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import express from "express";
import cors from "cors";

process.env.MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/employees_test?directConnection=true";
process.env.MONGODB_DB_NAME = "employees_test";

const { default: records } = await import("../routes/record.js");
const { connectToDatabase, getDb } = await import("../db/connection.js");

function createTestApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", async (_req, res) => {
    try {
      const db = getDb();
      await db.command({ ping: 1 });
      res.status(200).json({ status: "ok", database: "connected" });
    } catch {
      res.status(503).json({ status: "error", database: "disconnected" });
    }
  });

  app.use("/record", records);
  return app;
}

describe("Backend API", () => {
  let app;

  before(async () => {
    await connectToDatabase();
    app = createTestApp();
  });

  after(async () => {
    const db = getDb();
    await db.collection("records").deleteMany({});
  });

  it("GET /health returns ok when database is connected", async () => {
    const response = await request(app).get("/health");
    assert.equal(response.status, 200);
    assert.equal(response.body.status, "ok");
    assert.equal(response.body.database, "connected");
  });

  it("POST /record creates a new employee record", async () => {
    const payload = {
      name: "Test User",
      position: "Engineer",
      level: "Junior",
    };

    const response = await request(app)
      .post("/record")
      .send(payload)
      .set("Content-Type", "application/json");

    assert.equal(response.status, 201);
    assert.ok(response.body.insertedId);
  });

  it("GET /record returns a list of records", async () => {
    const response = await request(app).get("/record");
    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body));
    assert.ok(response.body.length >= 1);
  });
});
