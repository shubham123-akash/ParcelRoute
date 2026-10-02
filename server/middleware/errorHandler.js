import { logger } from "../utils/logger.js";

export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
};

export const errorHandler = (
  error,
  req,
  res,
  next
) => {
  logger.error("Unhandled server error", {
    requestId: req.requestId,
    message: error.message,
    stack:
      process.env.NODE_ENV === "production"
        ? undefined
        : error.stack
  });

  const statusCode =
    error.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal server error"
        : error.message,
    requestId: req.requestId
  });
};