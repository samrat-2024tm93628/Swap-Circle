import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftRight, PlusCircle, Repeat2, LogOut, LayoutDashboard, Wallet } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (!window.confirm('Log out of SwapCircle?')) return;
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  if (!user) {
    return (
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-dark">
          <ArrowLeftRight className="text-primary-500" size={22} />
          SwapCircle
        </Link>
        <div className="flex gap-3">
          <Link to="/login" className="btn-outline text-sm">Log in</Link>
          <Link to="/register" className="btn-primary text-sm">Sign up</Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 bg-white z-50">
      <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl text-dark">
        <ArrowLeftRight className="text-primary-500" size={22} />
        SwapCircle
      </Link>

      <div className="flex items-center gap-1">
        <Link to="/dashboard" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/dashboard') ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`}>
          <LayoutDashboard size={16} />
          Dashboard
        </Link>
        <Link to="/listings" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/listings') ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`}>
          Browse
        </Link>
        <Link to="/swaps" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/swaps') ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`}>
          <Repeat2 size={16} />
          My Swaps
        </Link>
        <Link to="/credits" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/credits') ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:bg-gray-50'}`}>
          <Wallet size={16} />
          ₹{user.timeCredits}
        </Link>
        <Link to="/listings/new" className="btn-primary text-sm flex items-center gap-1.5 ml-2">
          <PlusCircle size={16} />
          Post
        </Link>
        <Link to={`/profile/${user.id}`} className="ml-2 w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm hover:bg-primary-200 transition-colors">
          {user.name[0].toUpperCase()}
        </Link>
        <div className="w-px h-6 bg-gray-200 mx-2" />
        <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Log out">
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}
