import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Row, Col, Card, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import API from "./api";

function RoleSelection({}) {
  const [roomNumber, setRoomNumber] = useState("");
  const [roomName, setRoomName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [isTeacherLoggedIn, setIsTeacherLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if teacher is logged in (e.g., token or role in localStorage)
    const teacherToken = localStorage.getItem("teacherToken");
    const role = localStorage.getItem("role");
    setIsTeacherLoggedIn(!!teacherToken || role === "teacher");
  }, []);

  const handleTeacherLogin = () => {
    navigate("/login"); // Adjust route if needed
  };

  const handleCreateRoom = async () => {
    console.log("Creating room with name:", roomName);
    if (roomName.trim().length === 0) {
      alert("Bitte geben Sie einen Namen für den Raum ein.");
      return;
    }
    try {
      const response = await API.post("/api/rooms/", { name: roomName });
      localStorage.setItem("role", "teacher");
      navigate(`/rooms/${response.data.id}`);
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Failed to create room. Please try again.");
    }
  };

  const handleJoinRoom = async () => {
    if (roomNumber.trim().length === 0) {
      alert("Bitte geben Sie ein Kürzel für den Raum ein.");
      return;
    }
    if (studentName.trim().length === 0) {
      alert("Bitte gib deinen Namen ein.");
      return;
    }
    // Gast-Login
    try {
      const guestRes = await API.post("/accounts/guest/", {
        name: studentName,
      });
      localStorage.setItem("guestId", guestRes.data.guest_id);
      localStorage.setItem("studentName", guestRes.data.name);
      // Dann Raumbeitritt
      const response = await API.post("/api/rooms/join/", {
        code: roomNumber,
        guest_id: guestRes.data.guest_id,
        name: guestRes.data.name,
      });
      // Optional: setRole("student");
      navigate(`/rooms/${response.data.id}`);
    } catch (error) {
      alert("Beitritt fehlgeschlagen. Bitte versuche es erneut.");
    }
  };

  return (
    <Container
      fluid
      className="d-flex justify-content-center align-items-center bg-light"
      style={{ minHeight: "100vh" }}
    >
      <Row className="gx-5 w-100" style={{ maxWidth: 900 }}>
        <Col xs={12} md={6} className="mb-3 mb-md-0">
          <Card
            className="text-center shadow-lg border-0"
            style={{ borderRadius: 20 }}
          >
            <Card.Body className="p-5">
              <Card.Title as="h2" className="mb-4 fw-bold text-primary">
                Lehrer
              </Card.Title>
              <Card.Text
                className="mb-4 text-secondary"
                style={{ minHeight: 48 }}
              >
                {isTeacherLoggedIn
                  ? "Erstelle einen neuen Raum für deine Klasse."
                  : "Bitte logge dich als Lehrer ein, um einen Raum zu erstellen."}
              </Card.Text>

              {isTeacherLoggedIn ? (
                <>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">Raumname</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Mein Klassenraum"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      style={{
                        borderRadius: 10,
                        fontSize: 18,
                        padding: "12px 16px",
                      }}
                    />
                  </Form.Group>
                  <Button
                    variant="primary"
                    onClick={handleCreateRoom}
                    className="w-100 py-2 fw-bold"
                    style={{ borderRadius: 10, fontSize: 18 }}
                  >
                    Raum erstellen
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline-primary"
                  onClick={handleTeacherLogin}
                  className="w-100 py-2 fw-bold"
                  style={{ borderRadius: 10, fontSize: 18 }}
                >
                  Lehrer Login
                </Button>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card
            className="text-center shadow-lg border-0"
            style={{ borderRadius: 20 }}
          >
            <Card.Body className="p-5">
              <Card.Title as="h2" className="mb-4 fw-bold text-success">
                Schüler
              </Card.Title>
              <Card.Text
                className="mb-4 text-secondary"
                style={{ minHeight: 48 }}
              >
                Tritt einem bestehenden Raum bei.
              </Card.Text>
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">Raumnummer</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="1234"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  style={{
                    borderRadius: 10,
                    fontSize: 18,
                    padding: "12px 16px",
                  }}
                />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">Dein Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Max Mustermann"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  style={{
                    borderRadius: 10,
                    fontSize: 18,
                    padding: "12px 16px",
                  }}
                />
              </Form.Group>
              <Button
                variant="success"
                onClick={handleJoinRoom}
                className="w-100 py-2 fw-bold"
                style={{ borderRadius: 10, fontSize: 18 }}
              >
                Raum beitreten
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default RoleSelection;
