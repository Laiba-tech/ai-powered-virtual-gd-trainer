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
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}/>
        <Route path="/gd-setup"element={<ProtectedRoute><GDSetup/></ProtectedRoute>}/>
        <Route path="/speaking" element={<SpeakingHome />} />
<Route path="/speaking/topics" element={<TopicSelection />} />
<Route path="/speaking/practice" element={<SpeechPractice />} />
<Route path="/speaking/report" element={<SpeechReport />} />
<Route path="/speaking/history" element={<SpeechHistory />} />
<Route path="/speaking/audience" element={<VirtualAudience />} />
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