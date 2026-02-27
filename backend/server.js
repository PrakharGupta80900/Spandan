require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection", err?.message || err);
  process.exit(1);
});

const app = express();

// Connect Database
connectDB();

// Behind proxy (Render/Vercel)
app.set("trust proxy", 1);

// Security Headers
app.use(helmet());

// Logging
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api", limiter);

// CORS - allow configured origins for SPA + Render/Vercel preview
const defaultOrigins = [
  "https://srmscetrevents.in",
  "http://localhost:5173",
];
const envOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: false, // JWT sent via Authorization header
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

// Body Parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/events", require("./routes/events"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/registrations", require("./routes/registrations"));

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
