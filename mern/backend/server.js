import express from "express";
import cors from "cors";
import client from "prom-client";
import records from "./routes/record.js";
import employees from "./routes/employees.js";
import departments from "./routes/departments.js";
import attendance from "./routes/attendance.js";
import leave from "./routes/leave.js";
import payroll from "./routes/payroll.js";
import reports from "./routes/reports.js";
import settings from "./routes/settings.js";

const PORT = process.env.PORT || 5050;
const app = express();

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

const httpRequestTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on("finish", () => {
    end({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode });
    httpRequestTotal.inc({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode });
  });
  next();
});

app.use("/record", records);
app.use("/employees", employees);
app.use("/departments", departments);
app.use("/attendance", attendance);
app.use("/leave", leave);
app.use("/payroll", payroll);
app.use("/reports", reports);
app.use("/settings", settings);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
