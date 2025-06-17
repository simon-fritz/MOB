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

function TeacherPanel({ room }) {
  const [members, setMembers] = useState([]);
  const [socketStatus, setSocketStatus] = useState("Disconnected");
  const [socket, setSocket] = useState(null);
  const [timerString, setTimerString] = useState("");
  const [showSocketAlert, setShowSocketAlert] = useState(false);

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
          <span role="img" aria-label="room">
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
        </Card.Body>
      </Card>
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
      {room.id && <RoomMembers members={members} />}
    </Container>
  );
}

export default TeacherPanel;
