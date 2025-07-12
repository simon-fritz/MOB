import React, { useState } from "react";
import axios from "axios";
import { BACKEND_HTTP } from "./backend_urls";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false); // Toggle for showing the modal
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    await axios
      .post(`${BACKEND_HTTP}/accounts/token/`, {
        username,
        password,
      })
      .then(function (response) {
        const { access, refresh } = response.data;

        localStorage.setItem("accessToken", access);
        localStorage.setItem("refreshToken", refresh);

        // Show success modal
        setSuccess(true);
        setUsername("");
        setPassword("");

        // Redirect to RoleSelection page after modal closes
        setTimeout(() => {
          setSuccess(false); // Hide modal
          navigate("/");
        }, 2000);
      })
      .catch(function (err) {
        if (err.response && err.response.data) {
          if (err.response.data.detail) {
            setError(err.response.data.detail);
          } else {
            setError(JSON.stringify(err.response.data));
          }
        } else {
          setError("An error occurred. Please try again.");
        }
      });
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <h2 className="text-center mb-4">Lehrer Login</h2>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleLogin}>
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

            <button type="submit" className="btn btn-primary w-100 mb-2">
              Login
            </button>
          </form>

          <button
            type="button"
            className="btn btn-secondary w-100"
            onClick={() => navigate("/register")}
          >
            Zur Registrierung
          </button>
        </div>
      </div>

      {/* Bootstrap Modal */}
      {success && (
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
                <p>Login erfolgreich! Weiterleitung ...</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate("/")}
                >
                  Jetzt weiter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
