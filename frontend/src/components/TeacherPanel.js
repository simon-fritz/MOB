import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Card, Container } from "react-bootstrap";
import RoomMembers from "./RoomMembers";
import Timer from "./Timer";

function TeacherPanel({ room }) {
  const [members, setMembers] = useState([]);
  const [socketStatus, setSocketStatus] = useState("Disconnected");
  const [socket, setSocket] = useState(null);
  const [timerString, setTimerString] = useState("");

  let roundPaused = (timerString === "" || parseInt(timerString, 10) === 0);

  console.log("Timerstring: ", timerString);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    // TODO: BACKEND URL ins env
    const socket = new WebSocket(
      `ws://localhost:8000/ws/rooms/${room.id}/?token=${token}`
    );
    socket.onopen = () => {
      setSocketStatus("Connected");
      setSocket(socket);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "member_list") {
        setMembers(data.members);
      }
      if (data.type === "timer") {
        setTimerString(data.seconds);
      }
      if (data.type === "round_started"){
        room.current_round = parseInt(data.current_round, 10);
      }
      console.log(data);
    };

    socket.onclose = () => {
      setSocketStatus("Disconnected");
      setSocket(null);
    };

    socket.onerror = (error) => {
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
            <strong>Round:</strong> {room.current_round}
          </Card.Text>
          <p>Status der WebSocket-Verbindung: {socketStatus}</p>
          {roundPaused && (
            <button onClick={handleMatchUsers}>Match Users</button>
          )}
          <Timer timerString={timerString} />
        </Card.Body>
      </Card>
      {room.id && <RoomMembers members={members} />}
    </Container>
  );
}

export default TeacherPanel;
