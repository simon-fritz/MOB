import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card } from 'react-bootstrap';

function TeacherPanel() {
  // Beispielhaft: Raumnummer und Liste verbundener Schüler im lokalen State
  const [roomNumber] = useState('1234');
  const [students] = useState([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ]);

  return (
    <Container>
      <Row className="mt-4">
        <Col>
          {/* Karte mit der Raumnummer */}
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Raum Nr. {roomNumber}</Card.Title>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          {/* Karte mit der Liste der verbundenen Schüler */}
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>Verbundene Schüler</Card.Title>
              <ul>
                {students.map((student) => (
                  <li key={student.id}>{student.name}</li>
                ))}
              </ul>
              {/* Beispiel: wenn keine Schüler da sind, könntest du hier eine Meldung anzeigen */}
              {students.length === 0 && (
                <p className="text-muted">Bisher keine Schüler verbunden.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default TeacherPanel;
