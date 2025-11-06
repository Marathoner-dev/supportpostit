import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import BoardView from "./pages/BoardView";
import LoginPage from "./pages/LoginPage";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/board/:id" element={<BoardView />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
