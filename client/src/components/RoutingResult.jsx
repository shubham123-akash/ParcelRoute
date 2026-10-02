const RoutingResult = ({ result }) => {
  if (!result) {
    return (
      <div className="card empty-result">
        <h2>Routing Result</h2>
        <p>
          Enter a parcel above to see its
          routing decision.
        </p>
      </div>
    );
  }

  const isInsuranceRequired =
    result.routingStatus ===
    "INSURANCE_REQUIRED";

  const isFailed =
    result.routingStatus === "FAILED";

  return (
    <div className="card">
      <div className="card-header">
        <h2>Routing Result</h2>
      </div>

      <div className="result-grid">
        <div className="result-item">
          <span>Weight</span>
          <strong>
            {result.weight} kg
          </strong>
        </div>

        <div className="result-item">
          <span>Value</span>
          <strong>
            €{result.value}
          </strong>
        </div>

        <div className="result-item">
          <span>Destination</span>
          <strong>
            {result.destinationCountry}
          </strong>
        </div>

        <div className="result-item">
          <span>Department</span>
          <strong>
            {result.department || "—"}
          </strong>
        </div>
      </div>

      <div className="status-section">
        <span>Status</span>

        <span
          className={`status-badge ${
            isInsuranceRequired
              ? "status-warning"
              : isFailed
              ? "status-danger"
              : "status-success"
          }`}
        >
          {result.routingStatus}
        </span>
      </div>

      <div className="rule-section">
        <span>Matched Rule</span>
        <strong>
          {result.matchedRule || "No rule matched"}
        </strong>
      </div>

      {isInsuranceRequired && (
        <div className="alert warning-alert">
          This parcel requires insurance approval
          before normal routing.
        </div>
      )}

      {isFailed && (
        <div className="alert error-alert">
          No routing rule matched this parcel.
        </div>
      )}
    </div>
  );
};

export default RoutingResult;