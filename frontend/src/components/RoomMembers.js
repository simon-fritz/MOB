// src/components/RoomMembers.jsx
import React, { useState, useEffect } from "react";

function RoomMembers({ id }) {
  const [members, setMembers] = useState([]);
  const [socketStatus, setSocketStatus] = useState("Disconnected");
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    console.log("RoomMembers received id:", id);

    if (!id) {
      console.error("roomId ist undefined in RoomMembers");
      return;
    }

    const token = localStorage.getItem("accessToken");
    const socket = new WebSocket(
      `ws://localhost:8000/ws/rooms/${id}/?token=${token}`
    );
    //const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    //const socket = new WebSocket(`ws://localhost:8000/ws/rooms/${id}/`);
    socket.onopen = () => {
      console.log("WebSocket verbunden zu Raum:", id);
      setSocketStatus("Connected");
      // Optional: Anfrage senden, um aktuelle Mitglieder zu erhalten
      // socket.send(JSON.stringify({ command: 'get_members' }));
      setSocket(socket);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Nachricht erhalten:", data);
      if (data.type === "member_list") {
        setMembers(data.members);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket getrennt von Raum:", id);
      setSocketStatus("Disconnected");
      setSocket(null);
    };

    socket.onerror = (error) => {
      console.error("WebSocket Fehler:", error);
    };

    return () => {
      socket.close();
    };
  }, [id]);

  const handleMatchUsers = () => {
    if (socket) {
      socket.send(JSON.stringify({ command: "match_users" }));
    }
  };

  return (
    <div className="mt-4">
      <h3>Mitglieder im Raum:</h3>
      <p>Status der WebSocket-Verbindung: {socketStatus}</p>
      <button onClick={handleMatchUsers}>Match Users</button>
      <ul>
        {members.map((member, index) => (
          <li key={index}>{member}</li>
        ))}
      </ul>
    </div>
  );
}

export default RoomMembers;
