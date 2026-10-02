import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";

import api from "../services/api.js";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const registrationMessage =
    location.state?.message || "";

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

    if (!formData.email.trim()) {
      newErrors.email =
        "Email is required.";
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
      await api.post(
        "/auth/login",
        {
          email: formData.email
            .trim()
            .toLowerCase(),
          password: formData.password
        }
      );

      navigate("/dashboard", {
        replace: true
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
            "Login failed. Please check your credentials."
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
            Parcel Routing System
          </p>
        </div>

        {registrationMessage && (
          <div className="success-message">
            {registrationMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
        >
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
              ? "Logging in..."
              : "Login"}
          </button>
        </form>

        <div className="auth-footer">
          <span>
            Don't have an account?
          </span>

          <Link to="/register">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;