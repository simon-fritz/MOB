import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Card, Container, Alert, OverlayTrigger, Tooltip } from "react-bootstrap";
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
      `ws://localhost:8000/ws/rooms/${room.id}/?token=${token}`
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
      if (data.type === "round_started") {
        room.current_round = parseInt(data.current_round, 10);
        // Statistiken nach neuer Runde neu laden
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
            <button
              onClick={handleMatchUsers}
              className="btn btn-success w-100 mb-2"
              style={{ fontWeight: 500, fontSize: 18 }}
            >
              Starte nächste Runde
            </button>
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
                Die Verbindung zum Server ist fehlgeschlagen. Bitte erstelle einen
                neuen Raum.
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
            <div className="shadow p-3 mt-4" style={{ maxWidth: 800, width: "100%", borderRadius: 20, background: '#f8fafc' }}>
              <div className="bg-info text-white text-center" style={{ borderRadius: 15, fontSize: 20, fontWeight: 500, padding: 10 }}>
                Auswertung der Schätzungen
              </div>
                        <button
            className="btn btn-outline-info mb-2 mt-3"
            onClick={() => TeacherPanel.fetchStats && TeacherPanel.fetchStats()}
            style={{ maxWidth: 300 }}
          >
            Ergebnisse aktualisieren
          </button>

              <div className="mb-3">
                <strong>Alle Runden:</strong>
                <div className="d-flex gap-4 mt-2">
                  <div>
                    <span className="badge bg-success" style={{ fontSize: 18 }}>Richtig: {guessStats.correct}</span>
                  </div>
                  <div>
                    <span className="badge bg-danger" style={{ fontSize: 18 }}>Falsch: {guessStats.wrong}</span>
                  </div>
                  <div>
                    <span className="badge bg-primary" style={{ fontSize: 18 }}>&quot;KI&quot; getippt: {guessStats.ai}</span>
                  </div>
                  <div>
                    <span className="badge bg-secondary" style={{ fontSize: 18 }}>&quot;Mensch&quot; getippt: {guessStats.human}</span>
                  </div>
                </div>
              </div>
              <div>
                <strong>Pro Runde:</strong>
                <table className="table table-bordered mt-2">
                  <thead>
                    <tr>
                      <th>Runde</th>
                      <th>Richtig</th>
                      <th>Falsch</th>
                      <th>&quot;KI&quot; getippt</th>
                      <th>&quot;Mensch&quot; getippt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guessStats.per_round.map((r) => (
                      <tr key={r.round}>
                        <td>{r.round}</td>
                        <td style={{ color: "#198754", fontWeight: 600 }}>{r.correct}</td>
                        <td style={{ color: "#dc3545", fontWeight: 600 }}>{r.wrong}</td>
                        <td>{r.ai}</td>
                        <td>{r.human}</td>
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
