import { useState } from "react";

import api from "../services/api.js";

const ParcelForm = ({ onRoutingComplete }) => {
  const [formData, setFormData] = useState({
    weight: "",
    value: "",
    destinationCountry: ""
  });

  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

    // Clear field-specific error when user starts correcting it
    setErrors((previous) => ({
      ...previous,
      [name]: ""
    }));

    // Clear general error
    setError("");
  };

  const validateForm = () => {
    const newErrors = {};

    // Weight validation
    if (formData.weight === "") {
      newErrors.weight = "Weight is required.";
    } else if (Number(formData.weight) < 0) {
      newErrors.weight =
        "Weight must be greater than or equal to 0.";
    }

    // Value validation
    if (formData.value === "") {
      newErrors.value = "Value is required.";
    } else if (Number(formData.value) < 0) {
      newErrors.value =
        "Value must be greater than or equal to 0.";
    }

    // Country validation
    const country =
      formData.destinationCountry.trim();

    if (!country) {
      newErrors.destinationCountry =
        "Destination country is required.";
    } else if (country.length < 2) {
      newErrors.destinationCountry =
        "Country code must contain at least 2 characters.";
    } else if (country.length > 3) {
      newErrors.destinationCountry =
        "Country code must contain at most 3 characters.";
    }

    return newErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const validationErrors = validateForm();

    setErrors(validationErrors);

    // Stop if frontend validation failed
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        "/parcels",
        {
          weight: Number(formData.weight),
          value: Number(formData.value),
          destinationCountry:
            formData.destinationCountry
              .trim()
              .toUpperCase()
        }
      );

      onRoutingComplete(
        response.data.data
      );

      // Clear form after successful routing
      setFormData({
        weight: "",
        value: "",
        destinationCountry: ""
      });

      setErrors({});
    } catch (error) {
      // Backend validation errors from Joi
      const backendErrors =
        error.response?.data?.errors;

      if (Array.isArray(backendErrors)) {
        setError(
          backendErrors.join(" ")
        );
      } else {
        setError(
          error.response?.data?.message ||
            "Failed to route parcel."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>Route a Parcel</h2>

          <p>
            Enter parcel information to determine
            the correct department.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="form-grid">

          {/* Weight */}
          <div className="form-group">
            <label htmlFor="weight">
              Weight (kg)
            </label>

            <input
              id="weight"
              name="weight"
              type="number"
              step="0.01"
              value={formData.weight}
              onChange={handleChange}
              placeholder="e.g. 5"
              aria-invalid={Boolean(errors.weight)}
            />

            {errors.weight && (
              <span className="field-error">
                {errors.weight}
              </span>
            )}
          </div>

          {/* Value */}
          <div className="form-group">
            <label htmlFor="value">
              Value (€)
            </label>

            <input
              id="value"
              name="value"
              type="number"
              step="0.01"
              value={formData.value}
              onChange={handleChange}
              placeholder="e.g. 500"
              aria-invalid={Boolean(errors.value)}
            />

            {errors.value && (
              <span className="field-error">
                {errors.value}
              </span>
            )}
          </div>

          {/* Destination Country */}
          <div className="form-group full-span">
            <label htmlFor="destinationCountry">
              Destination Country
            </label>

            <input
              id="destinationCountry"
              name="destinationCountry"
              type="text"
              maxLength="3"
              value={formData.destinationCountry}
              onChange={handleChange}
              placeholder="e.g. IN"
              aria-invalid={Boolean(
                errors.destinationCountry
              )}
            />

            {errors.destinationCountry && (
              <span className="field-error">
                {errors.destinationCountry}
              </span>
            )}
          </div>
        </div>

        {/* General API error */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="primary-button"
          disabled={loading}
        >
          {loading
            ? "Routing..."
            : "Route Parcel"}
        </button>
      </form>
    </div>
  );
};

export default ParcelForm;