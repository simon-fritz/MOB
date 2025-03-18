import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Card, Container } from "react-bootstrap";
import RoomMembers from "./RoomMembers";
import Timer from "./Timer";

function StudentPanel({ room, user }) {
  const [members, setMembers] = useState([]);
  const [socketStatus, setSocketStatus] = useState("Disconnected");
  const token = localStorage.getItem("accessToken");
  const [timerString, setTimerString] = useState("");

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const RoundStatus = {
    PAUSED: "paused",
    STARTED: "started",
    GUESS_PHASE: "guess_phase",
    RESULT: "result",
  };
  const [roundStatus, setRoundStatus] = useState(RoundStatus.PAUSED);

  const [guessResult, setGuessResult] = useState("");

  const ws = useRef(null);

  useEffect(() => {
    // TODO: BACKEND URL ins env auslagern  
    ws.current = new WebSocket(
      `ws://localhost:8000/ws/rooms/${room.id}/?token=${token}`
    );

    ws.current.onopen = () => {
      setSocketStatus("Connected");
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log(data);
      if (data.type === "member_list") {
        setMembers(data.members);
      }
      if (data.type === "timer") {
        setTimerString(data.seconds);
        setRoundStatus(RoundStatus.STARTED);
      }
      if (data.type === "private_message") {
        setMessages((prevMessages) => [
          ...prevMessages,
          { username: "?", message: data.message },
        ]);
      }
      if (data.type === "round_started") {
        room.current_round = data.current_round;
        setMessages([]);
        setNewMessage("");
        setRoundStatus(RoundStatus.STARTED);
      }
      if (data.type === "guess_phase") {
        setGuessResult("");
        setRoundStatus(RoundStatus.GUESS_PHASE);
      }
      if (data.type === "make_guess") {
        setGuessResult(data.is_correct ? "Richtig" : "Falsch");
        setRoundStatus(RoundStatus.RESULT);
      }
    };

    ws.current.onclose = () => {
      setSocketStatus("Disconnected");
      ws.current = null;
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket Fehler:", error);
    };

    return () => {
      ws.current.close();
    };
  }, [room]);

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
        past_messages: messages.map((msg) => msg.username === "Du"? {"role": "user", "content": msg.message} : {"role": "assistant", "content": msg.message}),
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

  const handleGuess = (gueessedAI) => {
    console.log("Guess senden:", gueessedAI ? "AI" : "Human");
    console.log("Round:", room.current_round);
    if (
      ws.current &&
      ws.current.readyState === WebSocket.OPEN
    ) {
      const payload = {
        command: "make_guess",
        guessed_ai: gueessedAI,
        room_round: room.current_round,
      };
      ws.current.send(JSON.stringify(payload));
    }
    setRoundStatus(RoundStatus.PAUSED);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

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
            <strong>Round</strong>{room.current_round}
          </Card.Text>
          <p>Status der WebSocket-Verbindung: {socketStatus}</p>
          <Timer timerString={timerString} />
        </Card.Body>
      </Card>



      {roundStatus === RoundStatus.PAUSED && <RoomMembers members={members} />}
      {roundStatus === RoundStatus.STARTED &&
        (<Card className="shadow p-4 mt-4">
          <Card.Header className="text-center">Privater Chat</Card.Header>
          <Card.Body>
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
          </Card.Body>
        </Card>)
      }
      {roundStatus == RoundStatus.GUESS_PHASE &&
        <Card className="shadow p-4 mt-4">
          <Card.Header className="text-center">Guess</Card.Header>
          <button onClick={() => handleGuess(false)}>Guess human</button>
          <button onClick={() => handleGuess(true)}>Guess AI</button>
        </Card>
      }
      {roundStatus == RoundStatus.RESULT &&
        <Card className="shadow p-4 mt-4">
          <Card.Header className="text-center">Result</Card.Header>
          <p>{guessResult}</p>
        </Card>
      }

    </Container>
  );
}

export default StudentPanel;
