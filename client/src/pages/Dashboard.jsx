import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api.js";

import ParcelForm from "../components/ParcelForm.jsx";
import BatchUpload from "../components/BatchUpload.jsx";
import RoutingResult from "../components/RoutingResult.jsx";

const Dashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [result, setResult] =
    useState(null);

  const [parcels, setParcels] =
    useState([]);

  const [rules, setRules] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [
        meResponse,
        parcelsResponse,
        rulesResponse
      ] = await Promise.all([
        api.get("/auth/me"),
        api.get("/parcels"),
        api.get("/parcels/rules")
      ]);

      setUser(meResponse.data.user);

      setParcels(
        parcelsResponse.data.data || []
      );

      setRules(
        rulesResponse.data.data || []
      );
    } catch (error) {
      if (
        error.response?.status === 401
      ) {
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.message ||
          "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");

      navigate("/login");
    } catch (error) {
      setError(
        "Logout failed. Please try again."
      );
    }
  };

  const handleRoutingComplete = (
    routingResult
  ) => {
    setResult(routingResult);

    setParcels((previous) => [
      routingResult,
      ...previous
    ]);
  };

  if (loading) {
    return (
      <div className="loading-page">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="topbar">
        <div>
          <h1>ParcelRoute</h1>
          <p>Parcel Routing System</p>
        </div>

        <div className="topbar-right">
          <span>
            {user?.name}
          </span>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="dashboard-grid">
          <div>
            <ParcelForm
              onRoutingComplete={
                handleRoutingComplete
              }
            />

            <BatchUpload
              onBatchComplete={
                loadDashboard
              }
            />
          </div>

          <div>
            <RoutingResult
              result={result}
            />
          </div>
        </div>

        <section className="card">
          <div className="card-header">
            <div>
              <h2>Recent Parcels</h2>
              <p>
                Latest routing decisions.
              </p>
            </div>

            <button
              className="small-button"
              onClick={loadDashboard}
            >
              Refresh
            </button>
          </div>

          {parcels.length === 0 ? (
            <p className="muted">
              No parcels processed yet.
            </p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Weight</th>
                    <th>Value</th>
                    <th>Country</th>
                    <th>Department</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {parcels
                    .slice(0, 10)
                    .map((parcel) => (
                      <tr
                        key={parcel._id}
                      >
                        <td>
                          {parcel.weight} kg
                        </td>

                        <td>
                          €{parcel.value}
                        </td>

                        <td>
                          {
                            parcel.destinationCountry
                          }
                        </td>

                        <td>
                          {parcel.department ||
                            "—"}
                        </td>

                        <td>
                          <span
                            className={`status-badge ${
                              parcel.routingStatus ===
                              "INSURANCE_REQUIRED"
                                ? "status-warning"
                                : parcel.routingStatus ===
                                  "FAILED"
                                ? "status-danger"
                                : "status-success"
                            }`}
                          >
                            {
                              parcel.routingStatus
                            }
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <h2>Active Routing Rules</h2>
              <p>
                Current business rules used by
                the routing engine.
              </p>
            </div>
          </div>

          <div className="rules-list">
            {rules.map((rule) => (
              <div
                className="rule-card"
                key={rule._id}
              >
                <div>
                  <h3>
                    {rule.name}
                  </h3>

                  <p>
                    {rule.field}{" "}
                    <strong>
                      {rule.operator}
                    </strong>{" "}
                    {Array.isArray(
                      rule.value
                    )
                      ? rule.value.join(
                          ", "
                        )
                      : rule.value}
                  </p>
                </div>

                <div className="rule-action">
                  {rule.action}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;