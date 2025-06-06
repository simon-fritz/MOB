import React from "react";
import { Container } from "react-bootstrap";

function Footer() {
  return (
    <footer
      className="bg-light text-center text-muted py-3 mt-auto shadow-sm"
      style={{
        fontSize: 15,
        position: "fixed",
        left: 0,
        bottom: 0,
        width: "100%",
        zIndex: 100,
      }}
    >
      <Container>
        &copy; {new Date().getFullYear()} MOB Lernraum &mdash; Made with ❤️ for
        Education
      </Container>
    </footer>
  );
}

export default Footer;
