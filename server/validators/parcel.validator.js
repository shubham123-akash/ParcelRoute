import Joi from "joi";

export const parcelSchema = Joi.object({
  weight: Joi.number()
    .min(0)
    .required(),

  value: Joi.number()
    .min(0)
    .required(),

  destinationCountry: Joi.string()
    .trim()
    .uppercase()
    .min(2)
    .max(3)
    .required(),

  attributes: Joi.object()
    .default({})
});

export const batchSchema = Joi.array()
  .items(parcelSchema)
  .min(1)
  .max(1000)
  .required();