import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import crypto from "crypto";

import authRoutes from "./routes/auth.routes.js";
import parcelRoutes from "./routes/parcel.routes.js";

import {
  notFound,
  errorHandler
} from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true
  })
);

app.use(
  express.json({
    limit: "1mb"
  })
);

app.use(cookieParser());

app.use(
  (req, res, next) => {
    req.requestId =
      crypto.randomUUID();

    res.setHeader(
      "X-Request-ID",
      req.requestId
    );

    next();
  }
);

app.use(morgan("combined"));

const globalLimiter =
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message:
        "Too many requests. Please try again later."
    }
  });

const authLimiter =
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message:
        "Too many authentication attempts."
    }
  });

app.use(globalLimiter);

app.get(
  "/health",
  (req, res) => {
    res.json({
      success: true,
      status: "healthy",
      timestamp: new Date().toISOString()
    });
  }
);

app.use(
  "/api/auth",
  authLimiter,
  authRoutes
);

app.use(
  "/api/parcels",
  parcelRoutes
);

app.use(notFound);

app.use(errorHandler);

export default app;