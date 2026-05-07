import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SwapCard from '../components/SwapCard';
import api from '../services/api';

const TABS = ['all', 'pending', 'accepted', 'completed', 'rejected'];

export default function MySwaps() {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/swaps/mine')
      .then(r => setSwaps(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === 'all' ? swaps : swaps.filter(s => s.status === tab);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-dark mb-6">My Swaps</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${tab === t ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>No swaps here yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(s => <SwapCard key={s._id} swap={s} currentUserId={user.id} />)}
        </div>
      )}
    </div>
  );
}
