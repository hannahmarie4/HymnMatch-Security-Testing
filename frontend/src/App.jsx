import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Splash from './pages/Splash';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Readings from './pages/Readings/Readings';
import LoadingAnalysis from './pages/LoadingAnalysis';
import Suggestions from './pages/Suggestions';
import SongDetail from './pages/SongDetail';
import SavedSongs from './pages/SavedSongs';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import LiturgicalCalendar from './pages/LiturgicalCalendar';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes Wrapped in DashboardLayout */}
        {/* 
        // ============================================
        // CONTROL #3: PROTECTED ROUTES
        // ============================================
        // Enforces authentication for all private paths
        */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/home" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/readings" element={<Readings />} />
          <Route path="/loading-analysis" element={<LoadingAnalysis />} />
          <Route path="/suggestions" element={<Suggestions />} />
          <Route path="/song-detail" element={<SongDetail />} />
          <Route path="/saved" element={<SavedSongs />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/liturgical-calendar" element={<LiturgicalCalendar />} />
        </Route>

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
