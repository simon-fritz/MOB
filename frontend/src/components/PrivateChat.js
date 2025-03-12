import React, { useState, useEffect, useRef } from "react";

const PrivateChat = ({ room, user ,token}) => {
  const [messages, setMessages] = useState([]); // Enthält die Chatnachrichten
  const [newMessage, setNewMessage] = useState(""); // Eingabetext für neue Nachrichten
  const ws = useRef(null);

  useEffect(() => {
    // Aufbau der WebSocket-Verbindung zum entsprechenden Endpoint
    const wsUrl = `ws://localhost:8000/ws/rooms/${room.id}/?token=${token}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log("Verbunden mit dem privaten Chat-WebSocket");
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Verarbeite empfangene Chatnachrichten
      console.log("Nachricht empfangen:", data);
      if (data.type === "private_message") {
        setMessages((prevMessages) => [
          ...prevMessages,
          { username: "?", message: data.message },
        ]);
      }
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket-Fehler im privaten Chat:", error);
    };

    ws.current.onclose = () => {
      console.log("WebSocket-Verbindung für privaten Chat geschlossen");
    };

    // Aufräumen: Schließe die WebSocket-Verbindung beim Unmount
    return () => {
      if (ws.current) ws.current.close();
    };
  }, [room]);

  // Funktion zum Versenden einer Nachricht
  const handleSend = () => {
    console.log("Nachricht senden:", newMessage);
    if (
      ws.current &&
      ws.current.readyState === WebSocket.OPEN &&
      newMessage.trim() !== ""
    ) {
      const payload = {
        command: "send_private_message",
        user: user,
        room_id: room.id,
        room_round: room.current_round,
        message: newMessage,
      };
      ws.current.send(JSON.stringify(payload));

      // Füge die eigene Nachricht sofort lokal zum Chatverlauf hinzu
      setMessages((prevMessages) => [
        ...prevMessages,
        { username: "Du", message: newMessage },
      ]);
      setNewMessage("");
    }
  };

  // Versende Nachricht per Enter-Taste
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="private-chat">
      <h5>Privater Chat</h5>
      <div
        className="chat-window"
        style={{
          border: "1px solid #ccc",
          height: "300px",
          overflowY: "auto",
          padding: "10px",
          backgroundColor: "#f9f9f9",
        }}
      >
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: "8px" }}>
            <strong>{msg.username}: </strong>
            <span>{msg.message}</span>
          </div>
        ))}
      </div>
      <div className="chat-input mt-2" style={{ display: "flex" }}>
        <input
          type="text"
          className="form-control"
          placeholder="Nachricht eingeben..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button
          className="btn btn-primary ml-2"
          onClick={handleSend}
          style={{ marginLeft: "10px" }}
        >
          Senden
        </button>
      </div>
    </div>
  );
};

export default PrivateChat;
