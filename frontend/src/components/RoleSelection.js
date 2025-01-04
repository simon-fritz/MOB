import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Row, Col, Card, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import API from "./api";

function RoleSelection({ setRole }) {
  const [roomNumber, setRoomNumber] = useState("");
  const [roomName, setRoomName] = useState("");
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    if (roomName.trim().length === 0) {
      alert("Bitte geben Sie einen Namen für den Raum ein.");
      return;
    }
    try {
      const response = await API.post("/api/rooms/", { name: roomName });
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
    API.post("/api/rooms/join/", { code: roomNumber }).then((response) =>
      navigate(`/rooms/${response.data.id}`)
    );
  };

  return (
    <Container
      fluid
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <Row className="gx-5">
        <Col xs={12} md={6} className="mb-3 mb-md-0">
          <Card className="text-center shadow">
            <Card.Body>
              <Card.Title>Lehrer</Card.Title>
              <Card.Text>Erstelle einen neuen Raum für deine Klasse.</Card.Text>

              {/* Eingabefeld für den Raum-Namen */}
              <Form.Group className="mb-3">
                <Form.Label>Raumname</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Mein Klassenraum"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                />
              </Form.Group>

              <Button variant="primary" onClick={handleCreateRoom}>
                Raum erstellen
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="text-center shadow">
            <Card.Body>
              <Card.Title>Schüler</Card.Title>
              <Card.Text>Tritt einem bestehenden Raum bei.</Card.Text>

              {/* Eingabefeld für die Raumnummer */}
              <Form.Group className="mb-3">
                <Form.Label>Raumnummer</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="1234"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                />
              </Form.Group>

              <Button variant="success" onClick={handleJoinRoom}>
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
