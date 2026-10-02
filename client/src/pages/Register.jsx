import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../services/api.js";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
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

    setErrors((previous) => ({
      ...previous,
      [name]: ""
    }));

    setError("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required.";
    } else if (formData.name.trim().length < 2) {
      newErrors.name =
        "Name must contain at least 2 characters.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email
      )
    ) {
      newErrors.email =
        "Please enter a valid email address.";
    }

    if (!formData.password) {
      newErrors.password =
        "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password =
        "Password must contain at least 6 characters.";
    }

    return newErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const validationErrors =
      validateForm();

    setErrors(validationErrors);

    if (
      Object.keys(validationErrors).length > 0
    ) {
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", {
        name: formData.name.trim(),
        email: formData.email
          .trim()
          .toLowerCase(),
        password: formData.password
      });

      // After successful registration,
      // send user to login page.
      navigate("/login", {
        state: {
          message:
            "Registration successful. Please login."
        }
      });
    } catch (error) {
      const backendErrors =
        error.response?.data?.errors;

      if (Array.isArray(backendErrors)) {
        setError(
          backendErrors.join(" ")
        );
      } else {
        setError(
          error.response?.data?.message ||
            "Registration failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>ParcelRoute</h1>

          <p>
            Create your ParcelRoute account
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
        >
          {/* Name */}
          <div className="form-group">
            <label htmlFor="name">
              Name
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              aria-invalid={Boolean(
                errors.name
              )}
            />

            {errors.name && (
              <span className="field-error">
                {errors.name}
              </span>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              aria-invalid={Boolean(
                errors.email
              )}
            />

            {errors.email && (
              <span className="field-error">
                {errors.email}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              aria-invalid={Boolean(
                errors.password
              )}
            />

            {errors.password && (
              <span className="field-error">
                {errors.password}
              </span>
            )}
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="primary-button full-width"
            disabled={loading}
          >
            {loading
              ? "Creating account..."
              : "Register"}
          </button>
        </form>

        <div
          style={{
            marginTop: "20px",
            textAlign: "center"
          }}
        >
          <span>
            Already have an account?{" "}
          </span>

          <Link to="/login">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;