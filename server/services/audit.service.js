import AuditLog from "../models/AuditLog.js";
import { logger } from "../utils/logger.js";

export const createAuditLog = async ({
  parcelId,
  action,
  status,
  department,
  ruleName,
  ruleVersion,
  requestId,
  details = {}
}) => {
  try {
    const audit = await AuditLog.create({
      parcelId,
      action,
      status,
      department,
      ruleName,
      ruleVersion,
      requestId,
      details
    });

    logger.info("Audit log created", {
      requestId,
      parcelId,
      action,
      status
    });

    return audit;
  } catch (error) {
    /*
     * Audit failure should be visible but should not
     * necessarily turn a successful routing operation
     * into a failed business operation.
     */
    logger.error(
      "Failed to create audit log",
      {
        requestId,
        error: error.message
      }
    );

    return null;
  }
};