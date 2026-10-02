import mongoose from "mongoose";

const parcelSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    weight: {
      type: Number,
      required: true,
      min: 0
    },

    value: {
      type: Number,
      required: true,
      min: 0
    },

    destinationCountry: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },

    attributes: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    department: {
      type: String,
      default: null
    },

    insuranceRequired: {
      type: Boolean,
      default: false
    },

    routingStatus: {
      type: String,
      enum: [
        "ROUTED",
        "INSURANCE_REQUIRED",
        "FAILED"
      ],
      default: "FAILED"
    },

    matchedRule: {
      type: String,
      default: null
    },

    ruleVersion: {
      type: Number,
      default: null
    },

    routingError: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Parcel = mongoose.model(
  "Parcel",
  parcelSchema
);

export default Parcel;