import {
  routeParcel
} from "../services/routing.service.js";

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

describe("Parcel Routing", () => {
  test("routes parcel up to 1kg to Mail", () => {
    const result = routeParcel(
      {
        weight: 1,
        value: 100,
        destinationCountry: "IN"
      },
      rules
    );

    expect(result.department)
      .toBe("MAIL");
  });

  test("routes parcel above 1kg and up to 10kg to Regular", () => {
    const result = routeParcel(
      {
        weight: 5,
        value: 100,
        destinationCountry: "IN"
      },
      rules
    );

    expect(result.department)
      .toBe("REGULAR");
  });

  test("routes parcel above 10kg to Heavy", () => {
    const result = routeParcel(
      {
        weight: 11,
        value: 100,
        destinationCountry: "IN"
      },
      rules
    );

    expect(result.department)
      .toBe("HEAVY");
  });

  test("requires insurance when value is above 1000", () => {
    const result = routeParcel(
      {
        weight: 2,
        value: 1001,
        destinationCountry: "IN"
      },
      rules
    );

    expect(result.status)
      .toBe("INSURANCE_REQUIRED");

    expect(result.insuranceRequired)
      .toBe(true);
  });

  test("exactly 1000 does not require insurance", () => {
    const result = routeParcel(
      {
        weight: 2,
        value: 1000,
        destinationCountry: "IN"
      },
      rules
    );

    expect(result.status)
      .toBe("ROUTED");

    expect(result.department)
      .toBe("REGULAR");
  });

  test("exactly 10kg goes to Regular", () => {
    const result = routeParcel(
      {
        weight: 10,
        value: 100,
        destinationCountry: "IN"
      },
      rules
    );

    expect(result.department)
      .toBe("REGULAR");
  });
});