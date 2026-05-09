import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import SwapCard from '../components/SwapCard';
import api from '../services/api';
import { PlusCircle, ArrowLeftRight, Star, Zap } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [recentListings, setRecentListings] = useState([]);
  const [mySwaps, setMySwaps] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/listings?status=active').then(r => setRecentListings(r.data.slice(0, 6))).catch(() => {}),
      api.get('/swaps/mine').then(r => setMySwaps(r.data.slice(0, 3))).catch(() => {}),
      api.get(`/users/${user.id}`).then(r => setProfile(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  const pendingSwaps = mySwaps.filter(s => s.status === 'pending' && s.receiverId === user.id);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark">Hey, {user.name.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 mt-1">Ready to make a fair deal?</p>
        </div>
        <Link to="/listings/new" className="btn-primary flex items-center gap-2">
          <PlusCircle size={16} />
          Post something
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-primary-500 mb-1">
            <Zap size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">Credits</span>
          </div>
          <p className="text-3xl font-black text-dark">{user.timeCredits}</p>
          <p className="text-xs text-gray-400">time credits</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-primary-500 mb-1">
            <ArrowLeftRight size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">Swaps</span>
          </div>
          <p className="text-3xl font-black text-dark">{profile?.completedSwaps || 0}</p>
          <p className="text-xs text-gray-400">completed</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-primary-500 mb-1">
            <Star size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">Rating</span>
          </div>
          <p className="text-3xl font-black text-dark">{profile?.rating || '—'}</p>
          <p className="text-xs text-gray-400">{profile?.ratingCount || 0} reviews</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-orange-500 mb-1">
            <ArrowLeftRight size={16} />
            <span className="text-xs font-semibold uppercase tracking-wide">Pending</span>
          </div>
          <p className="text-3xl font-black text-dark">{pendingSwaps.length}</p>
          <p className="text-xs text-gray-400">needs response</p>
        </div>
      </div>

      {pendingSwaps.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mb-8">
          <p className="font-semibold text-primary-800 mb-3">You have {pendingSwaps.length} pending swap proposal{pendingSwaps.length > 1 ? 's' : ''}</p>
          <div className="grid md:grid-cols-2 gap-3">
            {pendingSwaps.map(s => <SwapCard key={s._id} swap={s} currentUserId={user.id} />)}
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-dark">Recent listings</h2>
          <Link to="/listings" className="text-primary-600 text-sm font-medium hover:underline">View all</Link>
        </div>
        {recentListings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>No listings yet.</p>
            <Link to="/listings/new" className="text-primary-500 font-medium hover:underline mt-2 inline-block">Be the first to post</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {recentListings.map(l => <ListingCard key={l._id} listing={l} />)}
          </div>
        )}
      </div>

      {mySwaps.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg text-dark">My swaps</h2>
            <Link to="/swaps" className="text-primary-600 text-sm font-medium hover:underline">View all</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {mySwaps.map(s => <SwapCard key={s._id} swap={s} currentUserId={user.id} />)}
          </div>
        </div>
      )}
    </div>
  );
}
