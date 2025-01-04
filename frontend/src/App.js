import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegisterPage from "./components/RegisterPage";
import LoginPage from "./components/LoginPage";
import RoleSelection from "./components/RoleSelection";
import Room from "./components/Room";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/rooms/:roomId" element={<Room />} />
      </Routes>
    </Router>
  );
}

export default App;
