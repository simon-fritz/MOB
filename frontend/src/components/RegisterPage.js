import React, { useState } from "react";
import axios from "axios";
import { BACKEND_HTTP } from "./backend_urls";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const RegisterForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    axios
      .post(`${BACKEND_HTTP}/accounts/register/`, {
        username,
        password,
        role: "teacher",
        secret,
      })
      .then(function (response) {
        setSuccess(response.data.detail || "Registrierung erfolgreich!");
        setUsername("");
        setPassword("");
        setSecret("");
        setShowModal(true);
      })
      .catch(function (err) {
        if (err.response && err.response.data) {
          let errorMsg = JSON.stringify(err.response.data);
          if (typeof err.response.data === "object") {
            if (err.response.data.detail) {
              errorMsg = err.response.data.detail;
            } else if (err.response.data.non_field_errors) {
              errorMsg = err.response.data.non_field_errors.join(" ");
            } else if (err.response.data.username) {
              errorMsg =
                "Benutzername: " + err.response.data.username.join(" ");
            }
          }
          setError(errorMsg);
        } else {
          setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
        }
      });
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <h2 className="text-center mb-4">Lehrer Registrierung</h2>
          <p className="text-center text-muted mb-4">
            Lehrer müssen sich registrieren, um Räume zu erstellen.
          </p>
          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleRegister} className="p-4 rounded">
            <div className="form-group mb-3">
              <label htmlFor="username">Benutzername</label>
              <input
                type="text"
                id="username"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="password">Passwort</label>
              <input
                type="password"
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group mb-3">
              <label htmlFor="secret">Lehrer-Code</label>
              <input
                type="text"
                id="secret"
                className="form-control"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100">
              Registrieren
            </button>
          </form>
          <button
            type="button"
            className="btn btn-secondary w-100"
            onClick={() => navigate("/login")}
          >
            Zum Login
          </button>
        </div>
      </div>

      {/* Bootstrap Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Erfolg</h5>
              </div>
              <div className="modal-body">
                <p>{success}</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate("/login")}
                >
                  Zum Login
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterForm;
