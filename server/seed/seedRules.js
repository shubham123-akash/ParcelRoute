import "dotenv/config";

import mongoose from "mongoose";

import RoutingRule from "../models/RoutingRule.js";

const rules = [
  {
    name: "Insurance approval above 1000",
    type: "GATE",
    field: "value",
    operator: ">",
    value: 1000,
    action: "INSURANCE_APPROVAL",
    priority: 1,
    enabled: true,
    version: 1
  },

  {
    name: "Mail up to 1kg",
    type: "ROUTING",
    field: "weight",
    operator: "<=",
    value: 1,
    action: "MAIL",
    priority: 10,
    enabled: true,
    version: 1
  },

  {
    name: "Regular up to 10kg",
    type: "ROUTING",
    field: "weight",
    operator: "<=",
    value: 10,
    action: "REGULAR",
    priority: 20,
    enabled: true,
    version: 1
  },

  {
    name: "Heavy above 10kg",
    type: "ROUTING",
    field: "weight",
    operator: ">",
    value: 10,
    action: "HEAVY",
    priority: 30,
    enabled: true,
    version: 1
  }
];

const seedRules = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI
    );

    await RoutingRule.deleteMany({});

    await RoutingRule.insertMany(
      rules
    );

    console.log(
      "Routing rules seeded successfully"
    );

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedRules();