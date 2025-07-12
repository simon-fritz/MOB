import React, { useState, useEffect } from "react";
import { Navbar, Container, Nav, Button } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";

// LimeSurvey Icon (externes SVG)
const LimeSurveyIcon = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: "#fff",
      border: "1px solid #fff",
      borderRadius: 4,
      padding: "4px 6px",
      marginLeft: 12,
      display: "flex",
      alignItems: "center",
      cursor: "pointer",
      transition: "box-shadow 0.2s",
      height: 31,
    }}
    title="LimeSurvey öffnen"
  >
    <img
      src="https://community.limesurvey.org/wp-content/uploads/2020/03/logo_limesurvey_darkblue_00.svg"
      alt="LimeSurvey öffnen"
      style={{
        width: 80,
        height: "auto",
        display: "block",
        background: "transparent",
        border: "none",
        boxShadow: "none",
        padding: 0,
      }}
    />
  </button>
);

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isTeacherLoggedIn, setIsTeacherLoggedIn] = useState(false);
  const [isJoinedRoom, setIsJoinedRoom] = useState(false);

  // Check if studentId is present
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem("studentId");
    setStudentId(id);
  }, [localStorage.getItem("studentId")]);

  useEffect(() => {
    // Check if teacher is logged in (e.g., token in localStorage)
    const teacherToken = localStorage.getItem("accessToken");
    if (teacherToken) {
      setIsTeacherLoggedIn(true);
    } else {
      setIsTeacherLoggedIn(false);
    }
  }, [
    localStorage.getItem("accessToken"),
    localStorage.getItem("refreshToken"),
  ]);

  useEffect(() => {
    // Check if current path matches /rooms/:roomId
    const isRoom = /^\/rooms\/[^/]+$/.test(location.pathname);
    setIsJoinedRoom(isRoom);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setIsTeacherLoggedIn(false);
  };

  const leaveRoom = () => {
    navigate("/");
    localStorage.removeItem("guestId");
    localStorage.removeItem("studentName");
  };

  // LimeSurvey Umfrage öffnen (Version 1)
  const openLimeSurvey = () => {
    if (!studentId) return;
    const surveyUrl = `https://user-surveys.cs.fau.de/index.php?r=survey/index&sid=448573&lang=de
&student_id=${studentId}`;
    window.open(surveyUrl, "_blank");
  };

  return (
    <Navbar
      bg="primary"
      variant="dark"
      expand="md"
      className="shadow-sm"
      style={{ borderRadius: 0 }}
    >
      <Container>
        <Navbar.Brand
          style={{ fontWeight: 700, fontSize: 24, letterSpacing: 1 }}
          onClick={() => navigate("/")}
          role="button"
        >
          Mensch oder Bot?
        </Navbar.Brand>
        <Nav className="ms-auto align-items-center">
          {isJoinedRoom && studentId ? (
            <>
              <LimeSurveyIcon onClick={openLimeSurvey} />
              <Button
                variant="outline-light"
                size="sm"
                onClick={leaveRoom}
                className="ms-2"
              >
                Leave Room
              </Button>
            </>
          ) : isTeacherLoggedIn ? (
            <Button
              variant="outline-light"
              size="sm"
              onClick={handleLogout}
              className="ms-2"
            >
              Logout
            </Button>
          ) : (
            <>
              <Button
                variant="outline-light"
                size="sm"
                onClick={() => navigate("/login")}
                className="ms-2"
              >
                Login
              </Button>
              <Button
                variant="light"
                size="sm"
                onClick={() => navigate("/register")}
                className="ms-2"
              >
                Register
              </Button>
            </>
          )}
        </Nav>
      </Container>
    </Navbar>
  );
}

export default Header;
