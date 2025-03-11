import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Card, Container } from "react-bootstrap";
import RoomMembers from "./RoomMembers";
import PrivateChat from "./PrivateChat"; // Importiere den privaten Chat Component

function StudentPanel({ room, user }) {
  const [members, setMembers] = useState([]);
  const [socketStatus, setSocketStatus] = useState("Disconnected");
  const [socket, setSocket] = useState(null);
  const token = localStorage.getItem("accessToken");
  useEffect(() => {
    // TODO: BACKEND URL ins env auslagern  
    const ws = new WebSocket(
      `ws://localhost:8000/ws/rooms/${room.id}/?token=${token}`
    );
    ws.onopen = () => {
      setSocketStatus("Connected");
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "member_list") {
        setMembers(data.members);
      }
    };

    ws.onclose = () => {
      setSocketStatus("Disconnected");
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error("WebSocket Fehler:", error);
    };

    return () => {
      ws.close();
    };
  }, [room.id]);

  return (
    <Container className="mt-5">
      <Card className="shadow p-4">
        <Card.Header className="text-center">Student Panel</Card.Header>
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
          <p>Status der WebSocket-Verbindung: {socketStatus}</p>
        </Card.Body>
      </Card>

      {room.id && <RoomMembers members={members} />}

      <Card className="shadow p-4 mt-4">
        <Card.Header className="text-center">Privater Chat</Card.Header>
        <Card.Body>
            <PrivateChat
              room={room}
              user={user}
              token={token}
            />
        </Card.Body>
      </Card>
    </Container>
  );
}

export default StudentPanel;
