import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    parcelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parcel",
      default: null
    },

    action: {
      type: String,
      required: true
    },

    status: {
      type: String,
      required: true
    },

    department: {
      type: String,
      default: null
    },

    ruleName: {
      type: String,
      default: null
    },

    ruleVersion: {
      type: Number,
      default: null
    },

    requestId: {
      type: String,
      default: null
    },

    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

const AuditLog = mongoose.model(
  "AuditLog",
  auditLogSchema
);

export default AuditLog;