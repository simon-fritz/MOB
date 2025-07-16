import { BACKEND_WS } from "./api";
import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import {
  Card,
  Container,
  Alert,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import RoomMembers from "./RoomMembers";
import Timer from "./Timer";
import API from "./api";

function TeacherPanel({ room }) {
  const [members, setMembers] = useState([]);
  const [socketStatus, setSocketStatus] = useState("Disconnected");
  const [socket, setSocket] = useState(null);
  const [timerString, setTimerString] = useState("");
  const [showSocketAlert, setShowSocketAlert] = useState(false);
  const [guessStats, setGuessStats] = useState(null);

  let roundPaused = timerString === "" || parseInt(timerString, 10) === 0;

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const socket = new WebSocket(
      `${BACKEND_WS}/ws/rooms/${room.id}/?token=${token}`
    );
    socket.onopen = () => {
      setSocketStatus("Connected");
      setSocket(socket);
      setShowSocketAlert(false);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "member_list") {
        setMembers(data.members);
      }
      if (data.type === "timer") {
        setTimerString(data.seconds);
      }
      // Automatisches Aktualisieren der Statistiken, wenn ein Schüler abgestimmt hat
      if (data.type === "student_guessed") {
        if (TeacherPanel.fetchStats) TeacherPanel.fetchStats();
      }
    };

    socket.onclose = () => {
      setSocketStatus("Disconnected");
      setSocket(null);
      setShowSocketAlert(true);
    };

    socket.onerror = (error) => {
      setShowSocketAlert(true);
      console.error("WebSocket Fehler:", error);
    };

    return () => {
      socket.close();
    };
  }, [room]);

  useEffect(() => {
    // Guess-Statistiken laden
    const fetchStats = () => {
      API.get(`/api/rooms/${room.id}/guesses/summary/`)
        .then((res) => setGuessStats(res.data))
        .catch(() => setGuessStats(null));
    };
    fetchStats();
    // Speichere Funktion für späteren Button
    TeacherPanel.fetchStats = fetchStats;
  }, [room]);

  const handleMatchUsers = () => {
    if (socket) {
      socket.send(JSON.stringify({ command: "match_users" }));
    }
  };

  return (
    <Container className="mt-5 d-flex flex-column align-items-center">
      <Card
        className="shadow-lg p-4"
        style={{
          maxWidth: 800,
          width: "100%",
          borderRadius: 20,
          background: "linear-gradient(135deg, #f8fafc 60%, #e0e7ff 100%)",
        }}
      >
        <Card.Header
          className="text-center bg-primary text-white"
          style={{
            borderRadius: 15,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 1,
          }}
        >
          <span role="img" aria-label="student">
            🏫
          </span>{" "}
          {room.name}
        </Card.Header>
        <Card.Body style={{ position: "relative" }}>
          <div className="mb-4 d-flex justify-content-center align-items-center gap-4">
            <div className="d-flex align-items-center">
              <strong className="me-2" style={{ fontSize: 22 }}>
                Raumcode:
              </strong>
              <span
                className="badge bg-secondary"
                style={{ fontSize: 22, letterSpacing: 1, padding: "10px 18px" }}
              >
                {room.code}
              </span>
            </div>
            <div className="d-flex align-items-center">
              <strong className="me-2" style={{ fontSize: 22 }}>
                Runde:
              </strong>
              <span className="badge bg-secondary" style={{ fontSize: 22 }}>
                {room.current_round}
              </span>
            </div>
          </div>
          <div className="mb-3 text-center">
            <div style={{ fontSize: 48, fontWeight: 700, marginBottom: 8 }}>
              {!roundPaused && (
                <span style={{ fontSize: 22 }}>Runde endet in:</span>
              )}
              <Timer timerString={timerString} />
            </div>
          </div>
          {roundPaused && (
            <div className="d-flex justify-content-center">
              <button
                onClick={handleMatchUsers}
                className="btn btn-success mb-2"
                style={{ fontWeight: 500, fontSize: 18 }}
              >
                Starte nächste Runde
              </button>
            </div>
          )}
          <OverlayTrigger
            placement="bottom"
            overlay={
              <Tooltip id="websocket-status-tooltip">
                WebSocket-Verbindung:{" "}
                {socketStatus === "Connected" ? "Verbunden" : "Nicht verbunden"}
              </Tooltip>
            }
          >
            <span
              style={{
                position: "absolute",
                top: 20,
                right: 30,
                cursor: "pointer",
              }}
            >
              <i
                className={`bi ${
                  socketStatus === "Connected" ? "bi-wifi" : "bi-wifi-off"
                }`}
                style={{
                  color: socketStatus === "Connected" ? "#198754" : "#dc3545",
                  fontSize: 22,
                }}
              ></i>
            </span>
          </OverlayTrigger>
          {showSocketAlert && (
            <Alert
              variant="danger"
              className="mt-3 shadow"
              dismissible
              onClose={() => setShowSocketAlert(false)}
              style={{ maxWidth: 500 }}
            >
              <Alert.Heading>Verbindungsfehler</Alert.Heading>
              <p>
                Die Verbindung zum Server ist fehlgeschlagen. Bitte erstelle
                einen neuen Raum.
              </p>
              <button
                className="btn btn-outline-danger"
                onClick={() => (window.location.href = "/")}
              >
                Raum verlassen
              </button>
            </Alert>
          )}
          {/* Guess-Statistik anzeigen */}
          {guessStats && (
            <div
              className="shadow p-3 mt-4"
              style={{
                maxWidth: 800,
                width: "100%",
                borderRadius: 20,
                background: "#f8fafc",
              }}
            >
              <div
                className="bg-primary text-white text-center"
                style={{
                  borderRadius: 15,
                  fontSize: 20,
                  fontWeight: 500,
                  padding: 10,
                  width: "100%",
                }}
              >
                So haben die Schüler abgestimmt:
              </div>
              <div className="mb-3 mt-3">
                <strong>Alle Runden:</strong>
                <div className="d-flex gap-4 mt-2">
                  {guessStats.per_round.length > 0 && (
                    <div style={{ display: "flex", gap: 32 }}>
                      {/* Gesamt */}
                      <div
                        style={{ width: 180, height: 180, textAlign: "center" }}
                      >
                        <svg width="180" height="180" viewBox="0 0 180 180">
                          {(() => {
                            const totalCorrect = guessStats.per_round.reduce(
                              (sum, r) => sum + r.correct_human + r.correct_ai,
                              0
                            );
                            const total = guessStats.per_round.reduce(
                              (sum, r) => sum + r.total,
                              0
                            );
                            const percent =
                              total > 0 ? totalCorrect / total : 0;
                            const radius = 80;
                            const circumference = 2 * Math.PI * radius;
                            const arc = circumference * percent;
                            return (
                              <>
                                <circle
                                  cx="90"
                                  cy="90"
                                  r={radius}
                                  fill="#f1f5f9"
                                  stroke="#e5e7eb"
                                  strokeWidth="16"
                                />
                                <circle
                                  cx="90"
                                  cy="90"
                                  r={radius}
                                  fill="none"
                                  stroke="#198754"
                                  strokeWidth="16"
                                  strokeDasharray={`${arc} ${
                                    circumference - arc
                                  }`}
                                  strokeDashoffset={0}
                                  transform="rotate(-90 90 90)"
                                  style={{
                                    transition: "stroke-dasharray 0.5s",
                                  }}
                                />
                                <text
                                  x="90"
                                  y="90"
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  fontSize="32"
                                  fontWeight="bold"
                                  fill="#198754"
                                >
                                  {Math.round(percent * 100)}%
                                </text>
                                <text
                                  x="90"
                                  y="120"
                                  textAnchor="middle"
                                  fontSize="16"
                                  fill="#333"
                                >
                                  {totalCorrect}/{total}
                                </text>
                              </>
                            );
                          })()}
                        </svg>
                        <div
                          style={{
                            fontWeight: 500,
                            color: "#198754",
                            marginTop: 4,
                          }}
                        >
                          Gesamt erkannt
                        </div>
                      </div>
                      {/* Mensch */}
                      <div
                        style={{ width: 180, height: 180, textAlign: "center" }}
                      >
                        <svg width="180" height="180" viewBox="0 0 180 180">
                          {(() => {
                            const totalCorrect = guessStats.per_round.reduce(
                              (sum, r) => sum + (r.correct_human || 0),
                              0
                            );
                            const total = guessStats.per_round.reduce(
                              (sum, r) => sum + (r.total_human || 0),
                              0
                            );
                            const percent =
                              total > 0 ? totalCorrect / total : 0;
                            const radius = 80;
                            const circumference = 2 * Math.PI * radius;
                            const arc = circumference * percent;
                            return (
                              <>
                                <circle
                                  cx="90"
                                  cy="90"
                                  r={radius}
                                  fill="#f1f5f9"
                                  stroke="#e5e7eb"
                                  strokeWidth="16"
                                />
                                <circle
                                  cx="90"
                                  cy="90"
                                  r={radius}
                                  fill="none"
                                  stroke="#6f42c1"
                                  strokeWidth="16"
                                  strokeDasharray={`${arc} ${
                                    circumference - arc
                                  }`}
                                  strokeDashoffset={0}
                                  transform="rotate(-90 90 90)"
                                  style={{
                                    transition: "stroke-dasharray 0.5s",
                                  }}
                                />
                                <text
                                  x="90"
                                  y="90"
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  fontSize="32"
                                  fontWeight="bold"
                                  fill="#6f42c1"
                                >
                                  {Math.round(percent * 100)}%
                                </text>
                                <text
                                  x="90"
                                  y="120"
                                  textAnchor="middle"
                                  fontSize="16"
                                  fill="#333"
                                >
                                  {totalCorrect}/{total}
                                </text>
                              </>
                            );
                          })()}
                        </svg>
                        <div
                          style={{
                            fontWeight: 500,
                            color: "#6f42c1",
                            marginTop: 4,
                          }}
                        >
                          Menschen erkannt
                        </div>
                      </div>
                      {/* KI */}
                      <div
                        style={{ width: 180, height: 180, textAlign: "center" }}
                      >
                        <svg width="180" height="180" viewBox="0 0 180 180">
                          {(() => {
                            const totalCorrect = guessStats.per_round.reduce(
                              (sum, r) => sum + (r.correct_ai || 0),
                              0
                            );
                            const total = guessStats.per_round.reduce(
                              (sum, r) => sum + (r.total_ai || 0),
                              0
                            );
                            const percent =
                              total > 0 ? totalCorrect / total : 0;
                            const radius = 80;
                            const circumference = 2 * Math.PI * radius;
                            const arc = circumference * percent;
                            return (
                              <>
                                <circle
                                  cx="90"
                                  cy="90"
                                  r={radius}
                                  fill="#f1f5f9"
                                  stroke="#e5e7eb"
                                  strokeWidth="16"
                                />
                                <circle
                                  cx="90"
                                  cy="90"
                                  r={radius}
                                  fill="none"
                                  stroke="#17a2b8"
                                  strokeWidth="16"
                                  strokeDasharray={`${arc} ${
                                    circumference - arc
                                  }`}
                                  strokeDashoffset={0}
                                  transform="rotate(-90 90 90)"
                                  style={{
                                    transition: "stroke-dasharray 0.5s",
                                  }}
                                />
                                <text
                                  x="90"
                                  y="90"
                                  textAnchor="middle"
                                  dominantBaseline="central"
                                  fontSize="32"
                                  fontWeight="bold"
                                  fill="#17a2b8"
                                >
                                  {Math.round(percent * 100)}%
                                </text>
                                <text
                                  x="90"
                                  y="120"
                                  textAnchor="middle"
                                  fontSize="16"
                                  fill="#333"
                                >
                                  {totalCorrect}/{total}
                                </text>
                              </>
                            );
                          })()}
                        </svg>
                        <div
                          style={{
                            fontWeight: 500,
                            color: "#17a2b8",
                            marginTop: 4,
                          }}
                        >
                          KIs erkannt
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ paddingTop: "20px" }}>
                <strong>Pro Runde:</strong>
                <table className="table table-bordered mt-2">
                  <thead>
                    <tr>
                      <th>Runde</th>
                      <th>Menschen erkannt</th>
                      <th>KIs erkannt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...guessStats.per_round]
                      .sort((a, b) => b.round - a.round)
                      .map((r) => (
                        <tr key={r.round}>
                          <td>{r.round}</td>
                          <td style={{ color: "#6f42c1", fontWeight: 600 }}>
                            {r.correct_human + "/" + r.total_human ?? 0}
                          </td>
                          <td style={{ color: "#17a2b8", fontWeight: 600 }}>
                            {r.correct_ai + "/" + r.total_ai ?? 0}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {room.id && (
            <div style={{ width: "100%", maxWidth: 800 }}>
              <RoomMembers members={members} />
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default TeacherPanel;
