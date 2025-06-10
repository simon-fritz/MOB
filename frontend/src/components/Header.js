import React, { useState, useEffect } from "react";
import { Navbar, Container, Nav, Button } from "react-bootstrap";
import { useNavigate, useLocation} from "react-router-dom";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isTeacherLoggedIn, setIsTeacherLoggedIn] = useState(false);
  const [isJoinedRoom, setIsJoinedRoom] = useState(false);

  useEffect(() => {
      // Check if teacher is logged in (e.g., token in localStorage)
      const teacherToken = localStorage.getItem("accessToken");
      if (teacherToken) {
            setIsTeacherLoggedIn(true);
      }
      else {
        setIsTeacherLoggedIn(false);
      }
    }, [
      localStorage.getItem("accessToken"),
      localStorage.getItem("refreshToken")
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
          MOB
        </Navbar.Brand>
        <Nav className="ms-auto align-items-center">
          {isJoinedRoom ? (
            <Button
              variant="outline-light"
              size="sm"
              onClick={leaveRoom}
              className="ms-2"
            >
              Leave Room
            </Button>
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
