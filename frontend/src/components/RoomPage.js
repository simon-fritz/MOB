import React from "react";
import { useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Card, Container } from "react-bootstrap";

function RoomPage() {
  const location = useLocation();

  // Access the room data from location.state
  const room = location.state;

  if (!room) {
    return <p>No room data available. Please try again.</p>;
  }

  return (
    <Container className="mt-5">
      <Card className="shadow p-4">
        <Card.Body>
          <Card.Title className="text-center">Room Details</Card.Title>
          <Card.Text>
            <strong>Room ID:</strong> {room.id}
          </Card.Text>
          <Card.Text>
            <strong>Room Name:</strong> {room.name}
          </Card.Text>
          <Card.Text>
            <strong>Room Code:</strong> {room.code}
          </Card.Text>
          <Card.Text>
            <strong>Created At:</strong>{" "}
            {new Date(room.created_at).toLocaleString()}
          </Card.Text>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default RoomPage;
