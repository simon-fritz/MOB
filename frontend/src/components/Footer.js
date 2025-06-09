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
        &copy; {new Date().getFullYear()} MOB &mdash; Made as Part of a Bachelor Thesis for Friedrich-Alexander University Erlangen-Nürnberg
      </Container>
    </footer>
  );
}

export default Footer;
