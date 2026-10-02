import { useState } from "react";

import api from "../services/api.js";

const MAX_FILE_SIZE = 1 * 1024 * 1024;
const MAX_PARCELS = 1000;

const BatchUpload = ({
  onBatchComplete
}) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile =
      event.target.files?.[0];

    setError("");
    setResult(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (
      selectedFile.size >
      MAX_FILE_SIZE
    ) {
      setError(
        "File size must be less than 1 MB."
      );
      setFile(null);
      return;
    }

    if (
      !selectedFile.name
        .toLowerCase()
        .endsWith(".json")
    ) {
      setError(
        "Please select a JSON file."
      );
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError(
        "Please select a JSON file first."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const text =
        await file.text();

      const parsed =
        JSON.parse(text);

      const parcels = Array.isArray(
        parsed
      )
        ? parsed
        : parsed.parcels;

      if (!Array.isArray(parcels)) {
        throw new Error(
          'JSON must be an array or contain a "parcels" array.'
        );
      }

      if (
        parcels.length === 0
      ) {
        throw new Error(
          "The file contains no parcels."
        );
      }

      if (
        parcels.length >
        MAX_PARCELS
      ) {
        throw new Error(
          `Maximum ${MAX_PARCELS} parcels are allowed.`
        );
      }

      const response =
        await api.post(
          "/parcels/batch",
          {
            parcels
          }
        );

      setResult(
        response.data
      );

      onBatchComplete?.(
        response.data
      );
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Batch upload failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>Batch Upload</h2>
          <p>
            Upload a JSON file containing up to
            1,000 parcels.
          </p>
        </div>
      </div>

      <div className="upload-box">
        <input
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
        />

        {file && (
          <div className="file-name">
            Selected:{" "}
            <strong>{file.name}</strong>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <button
        type="button"
        className="secondary-button"
        onClick={handleUpload}
        disabled={
          !file || loading
        }
      >
        {loading
          ? "Processing..."
          : "Process Batch"}
      </button>

      {result && (
        <div className="batch-summary">
          <h3>Batch Result</h3>

          <div className="summary-grid">
            <div>
              <span>Total</span>
              <strong>
                {result.total}
              </strong>
            </div>

            <div>
              <span>Processed</span>
              <strong className="success-text">
                {result.processed}
              </strong>
            </div>

            <div>
              <span>Failed</span>
              <strong className="danger-text">
                {result.failed}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchUpload;