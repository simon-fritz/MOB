import React from "react";
import { Navbar, Container, Nav, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

function Header() {
  const navigate = useNavigate();
  const isTeacherLoggedIn =
    localStorage.getItem("teacherToken") ||
    localStorage.getItem("role") === "teacher";

  const handleLogout = () => {
    localStorage.removeItem("teacherToken");
    localStorage.removeItem("role");
    navigate("/login");
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
          MOB Lernraum
        </Navbar.Brand>
        <Nav className="ms-auto align-items-center">
          <Nav.Link onClick={() => navigate("/")} className="text-white">
            Home
          </Nav.Link>
          {isTeacherLoggedIn ? (
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
