import express from "express";
import cors from "cors";
import client from "prom-client";
import records from "./routes/record.js";
import { connectToDatabase, getDb } from "./db/connection.js";

const PORT = process.env.PORT || 5050;
const INSTANCE_ID = process.env.INSTANCE_ID || "backend-1";

const app = express();

client.collectDefaultMetrics({
  labels: { instance_id: INSTANCE_ID },
});

const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "status", "instance_id"],
});

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.on("finish", () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode,
      instance_id: INSTANCE_ID,
    });
  });
  next();
});

app.get("/health", async (_req, res) => {
  try {
    const db = getDb();
    await db.command({ ping: 1 });
    res.status(200).json({
      status: "ok",
      database: "connected",
      instance: INSTANCE_ID,
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      database: "disconnected",
      instance: INSTANCE_ID,
    });
  }
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

app.use("/record", records);

async function startServer() {
  try {
    await connectToDatabase();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server [${INSTANCE_ID}] listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
