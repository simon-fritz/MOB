import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegisterPage from "./components/RegisterPage";
import LoginPage from "./components/LoginPage";
import RoleSelection from "./components/RoleSelection";
import Room from "./components/Room";
import Header from "./components/Header";
import Footer from "./components/Footer";

function App() {
  return (
    <Router>
      <Header />
      <div style={{ minHeight: "92vh", background: "#f8f9fa" }}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RoleSelection />} />
          <Route path="/rooms/:roomId" element={<Room />} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;
