import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';

function RoleSelection({ setRole }) {
  // Lokaler State für das Lehrer-Passwort und die Schüler-Raumnummer
  const [teacherPassword, setTeacherPassword] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  // Lehrer-Button-Handler
  const handleTeacherClick = () => {
    if (teacherPassword === 'MOB2025') {
      setRole('teacher');
    } else {
      alert('Falsches Passwort');
    }
  };

  // Schüler-Button-Handler
  const handleStudentClick = () => {
    if (roomNumber.trim().length > 0) {
      setRole('student');
    } else {
      alert('Bitte eine gültige Raumnummer eingeben.');
    }
  };

  const handleRoomCreation = () => {
    
  };

  return (
    <Container
      fluid
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: '100vh' }}
    >
      <Row className="gx-5">
        {/* Karte für Lehrer */}
        <Col xs={12} md={6} className="mb-3 mb-md-0">
          <Card className="text-center shadow">
            <Card.Body>
              <Card.Title>Lehrer</Card.Title>
              <Card.Text>
                Erstelle einen neuen Raum für deine Klasse.
              </Card.Text>

              {/* Eingabefeld für das Lehrer-Passwort */}
              <Form.Group className="mb-3">
                <Form.Label>Passwort</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="super secret password"
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                />
              </Form.Group>

              <Button variant="primary" onClick={handleTeacherClick}>
                Raum erstellen
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Karte für Schüler */}
        <Col xs={12} md={6}>
          <Card className="text-center shadow">
            <Card.Body>
              <Card.Title>Schüler</Card.Title>
              <Card.Text>
                Tritt einem bestehenden Raum bei.
              </Card.Text>

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

              <Button variant="success" onClick={handleStudentClick}>
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
