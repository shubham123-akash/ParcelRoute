const getFieldValue = (parcel, field) => {
  return parcel[field];
};

const evaluateCondition = (
  actualValue,
  operator,
  expectedValue
) => {
  switch (operator) {
    case "<":
      return actualValue < expectedValue;

    case "<=":
      return actualValue <= expectedValue;

    case ">":
      return actualValue > expectedValue;

    case ">=":
      return actualValue >= expectedValue;

    case "==":
      return actualValue === expectedValue;

    case "!=":
      return actualValue !== expectedValue;

    case "IN":
      return Array.isArray(expectedValue)
        ? expectedValue.includes(actualValue)
        : false;

    case "NOT_IN":
      return Array.isArray(expectedValue)
        ? !expectedValue.includes(actualValue)
        : false;

    default:
      return false;
  }
};

export const evaluateRule = (
  parcel,
  rule
) => {
  const actualValue = getFieldValue(
    parcel,
    rule.field
  );

  return evaluateCondition(
    actualValue,
    rule.operator,
    rule.value
  );
};

export const routeParcel = (parcel, rules) => {
  const enabledRules = rules
    .filter((rule) => rule.enabled)
    .sort((a, b) => a.priority - b.priority);

  // 1. Check gate rules first
  const gateRules = enabledRules.filter(
    (rule) => rule.type === "GATE"
  );

  for (const rule of gateRules) {
    if (evaluateRule(parcel, rule)) {
      return {
        routingStatus: "INSURANCE_REQUIRED",
        department: null,
        insuranceRequired: true,
        matchedRule: rule.name,
        ruleVersion: rule.version
      };
    }
  }

  // 2. Check normal routing rules
  const routingRules = enabledRules.filter(
    (rule) => rule.type === "ROUTING"
  );

  for (const rule of routingRules) {
    if (evaluateRule(parcel, rule)) {
      return {
        routingStatus: "ROUTED",
        department: rule.action,
        insuranceRequired: false,
        matchedRule: rule.name,
        ruleVersion: rule.version
      };
    }
  }

  // 3. No rule matched
  return {
    routingStatus: "FAILED",
    department: null,
    insuranceRequired: false,
    matchedRule: null,
    ruleVersion: null
  };
};