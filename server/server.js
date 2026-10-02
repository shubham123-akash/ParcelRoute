import "dotenv/config";

import mongoose from "mongoose";

import app from "./app.js";

import {
  logger
} from "./utils/logger.js";

const PORT =
  process.env.PORT || 5000;

const startServer = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI
    );

    logger.info(
      "MongoDB connected"
    );

    app.listen(
      PORT,
      () => {
        logger.info(
          `Server running on port ${PORT}`
        );
      }
    );
  } catch (error) {
    logger.error(
      "Failed to start server",
      {
        error: error.message
      }
    );

    process.exit(1);
  }
};

startServer();