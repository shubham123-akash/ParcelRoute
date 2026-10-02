import mongoose from "mongoose";

const routingRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      enum: ["ROUTING", "GATE"],
      required: true
    },

    field: {
      type: String,
      required: true
    },

    operator: {
      type: String,
      enum: [
        "<",
        "<=",
        ">",
        ">=",
        "==",
        "!=",
        "IN",
        "NOT_IN"
      ],
      required: true
    },

    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },

    action: {
      type: String,
      required: true
    },

    priority: {
      type: Number,
      default: 100
    },

    enabled: {
      type: Boolean,
      default: true
    },

    version: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

const RoutingRule = mongoose.model(
  "RoutingRule",
  routingRuleSchema
);

export default RoutingRule;