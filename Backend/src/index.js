import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoutes.js";
import docRoutes from "./routes/docRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  // Strip trailing slashes just in case it was set incorrectly
  process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : null,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      
      // Check exact matches
      if (allowedOrigins.includes(origin)) return callback(null, true);
      
      // Automatically allow any vercel deployment (useful for preview environments)
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      
      // In development, allow all
      if (process.env.NODE_ENV !== "production") return callback(null, true);
      
      // Fail gracefully (browser will just block it instead of server crashing)
      callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());


app.use("/api/auth", authRoutes);
app.use("/api/docs", docRoutes);

// Health-check endpoint
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Collaborative Document Editor API is running." });
});


// Global Error Handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);

  // Catch Multer size limits and formatting errors
  if (err.name === "MulterError") {
    return res.status(400).json({ error: err.message });
  }
  
  // Catch our custom file filter error
  if (err.isMulterFilterError) {
    return res.status(400).json({ error: err.message });
  }

  // Generic fallback
  if (err.message) {
    return res.status(400).json({ error: err.message });
  }

  return res.status(500).json({ error: "Internal server error." });
});


app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
