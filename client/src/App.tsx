import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import GDSetup from "./pages/GDSetup";
import GDRoom from "./pages/GDRoom";
import GDReport from "./pages/GDReportPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}/>
        <Route path="/gd-setup"element={<ProtectedRoute><GDSetup/></ProtectedRoute>}/>
        <Route
  path="/gd-room"
  element={
    <ProtectedRoute>
      <GDRoom />
    </ProtectedRoute>
  }
/>
        <Route
  path="/gd-report"
  element={
    <ProtectedRoute>
      <GDReport />
    </ProtectedRoute>
  }
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;