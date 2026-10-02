import express from "express";

import {
  createParcel,
  processBatch,
  getParcels,
  getParcelById,
  getRules
} from "../controllers/parcel.controller.js";

import {
  authenticate
} from "../middleware/auth.js";

import {
  validate
} from "../middleware/validate.js";

import {
  parcelSchema
} from "../validators/parcel.validator.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  validate(parcelSchema),
  createParcel
);

router.post(
  "/batch",
  processBatch
);

router.get(
  "/",
  getParcels
);

router.get(
  "/rules",
  getRules
);

router.get(
  "/:id",
  getParcelById
);

export default router;