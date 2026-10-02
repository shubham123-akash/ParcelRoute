import Parcel from "../models/Parcel.js";
import RoutingRule from "../models/RoutingRule.js";

import {
  routeParcel
} from "../services/routing.service.js";

import {
  createAuditLog
} from "../services/audit.service.js";

export const createParcel = async (
  req,
  res,
  next
) => {
  try {
    const rules = await RoutingRule.find({
      enabled: true
    }).lean();

    const routingResult = routeParcel(
      req.body,
      rules
    );

    const parcel = await Parcel.create({
      ...req.body,

      // Associate parcel with logged-in user
      userId: req.user.userId,

      ...routingResult
    });

    await createAuditLog({
      parcelId: parcel._id,
      action: "PARCEL_ROUTED",
      status: routingResult.routingStatus,
      department: routingResult.department,
      ruleName: routingResult.matchedRule,
      ruleVersion: routingResult.ruleVersion,
      requestId: req.requestId
    });

    res.status(201).json({
      success: true,
      data: parcel
    });
  } catch (error) {
    next(error);
  }
};

export const processBatch = async (
  req,
  res,
  next
) => {
  try {
    const parcels = req.body.parcels;

    const rules =
      await RoutingRule.find({
        enabled: true
      }).lean();

    const results = [];

    for (
      let i = 0;
      i < parcels.length;
      i++
    ) {
      try {
        const parcelData =
          parcels[i];

        const routingResult =
          routeParcel(
            parcelData,
            rules
          );

        const parcel =
          await Parcel.create({
            ...parcelData,
            userId: req.user.userId,
            ...routingResult
          });

        await createAuditLog({
          parcelId: parcel._id,
          action: "BATCH_PARCRL_ROUTED",
          status:
            routingResult.status,
          department:
            routingResult.department,
          ruleName:
            routingResult.matchedRule,
          ruleVersion:
            routingResult.ruleVersion,
          requestId: req.requestId
        });

        results.push({
          index: i,
          success: true,
          parcel
        });
      } catch (error) {
        results.push({
          index: i,
          success: false,
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: true,
      total: parcels.length,
      processed: results.filter(
        (item) => item.success
      ).length,
      failed: results.filter(
        (item) => !item.success
      ).length,
      results
    });
  } catch (error) {
    next(error);
  }
};

export const getParcels = async (
  req,
  res,
  next
) => {
  try {
    const parcels = await Parcel.find({
      userId: req.user.userId
    })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      count: parcels.length,
      data: parcels
    });
  } catch (error) {
    next(error);
  }
};

export const getParcelById = async (
  req,
  res,
  next
) => {
  try {
    const parcel =
      await Parcel.findOne({
        _id: req.params.id,
        userId: req.user.userId
      });

    if (!parcel) {
      return res.status(404).json({
        success: false,
        message: "Parcel not found"
      });
    }

    res.json({
      success: true,
      data: parcel
    });
  } catch (error) {
    next(error);
  }
};

export const getRules = async (
  req,
  res,
  next
) => {
  try {
    const rules =
      await RoutingRule.find({
        enabled: true
      }).sort({ priority: 1 });

    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    next(error);
  }
};