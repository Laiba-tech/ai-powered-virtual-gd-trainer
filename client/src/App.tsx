
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import GDSetup from "./pages/GDSetup";
import GDRoom from "./pages/GDRoom";
import GDReport from "./pages/GDReportPage";

import SpeakingHome from "./pages/SpeakingHome.jsx";
import TopicSelection from "./pages/TopicSelection.jsx";
import SpeechPractice from "./pages/SpeechPractice.jsx";
import SpeechReport from "./pages/SpeechReport.jsx";
import SpeechHistory from "./pages/SpeechHistory.jsx";
import VirtualAudience from "./pages/VirtualAudience.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/gd-setup"
          element={
            <ProtectedRoute>
              <GDSetup />
            </ProtectedRoute>
          }
        />

        <Route
          path="/speaking"
          element={
            <ProtectedRoute>
              <SpeakingHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/speaking/topics"
          element={
            <ProtectedRoute>
              <TopicSelection />
            </ProtectedRoute>
          }
        />
        <Route
          path="/speaking/practice"
          element={
            <ProtectedRoute>
              <SpeechPractice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/speaking/report"
          element={
            <ProtectedRoute>
              <SpeechReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/speaking/history"
          element={
            <ProtectedRoute>
              <SpeechHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/speaking/audience"
          element={
            <ProtectedRoute>
              <VirtualAudience />
            </ProtectedRoute>
          }
        />

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
