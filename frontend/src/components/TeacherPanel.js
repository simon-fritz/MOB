import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { Card, Container } from "react-bootstrap";
import RoomMembers from "./RoomMembers";
import axios from "axios";

function TeacherPanel() {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/rooms/${roomId}/`
        );
        setRoom(response.data);
      } catch (err) {
        setError("Raum nicht gefunden.");
      }
    };

    if (roomId) {
      fetchRoom();
    }
  }, [roomId]);

  if (error) {
    return <p>{error}</p>;
  }

  if (!room) {
    return <p>Loading...</p>;
  }

  return (
    <Container className="mt-5">
      <Card className="shadow p-4">
        <Card.Header className="text-center">Teacher Panel</Card.Header>
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
      {room.id && <RoomMembers id={room.id} />}
    </Container>
  );
}

export default TeacherPanel;
