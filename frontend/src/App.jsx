import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Listings from './pages/Listings';
import ListingDetail from './pages/ListingDetail';
import CreateListing from './pages/CreateListing';
import MySwaps from './pages/MySwaps';
import SwapDetail from './pages/SwapDetail';
import Profile from './pages/Profile';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/listings" element={<Protected><Listings /></Protected>} />
        <Route path="/listings/new" element={<Protected><CreateListing /></Protected>} />
        <Route path="/listings/:id" element={<Protected><ListingDetail /></Protected>} />
        <Route path="/swaps" element={<Protected><MySwaps /></Protected>} />
        <Route path="/swaps/:id" element={<Protected><SwapDetail /></Protected>} />
        <Route path="/profile/:userId" element={<Protected><Profile /></Protected>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}
