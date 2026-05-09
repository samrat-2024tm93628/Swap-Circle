import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ListingCard from '../components/ListingCard';
import api from '../services/api';
import { Search, SlidersHorizontal } from 'lucide-react';

const CATEGORIES = ['Technology', 'Education', 'Home Services', 'Transportation', 'Arts & Creative', 'Food & Cooking', 'Health & Wellness', 'Other'];

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const fetchListings = async (s = search, t = type, c = category) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (t) params.set('type', t);
      if (c) params.set('category', c);
      if (s) params.set('search', s);
      const { data } = await api.get(`/listings?${params}`);
      setListings(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchListings(search, type, category); }, [type, category]);

  useEffect(() => {
    if (search.length >= 2 || search === '') {
      fetchListings(search, type, category);
    }
  }, [search]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchListings(search, type, category);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dark">Browse listings</h1>
        <Link to="/listings/new" className="btn-primary text-sm">+ Post</Link>
      </div>

      <div className="card p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search listings..."
              className="input pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input w-auto" value={type} onChange={e => setType(e.target.value)}>
            <option value="">All types</option>
            <option value="offer">Offers</option>
            <option value="request">Requests</option>
          </select>
          <select className="input w-auto" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <SlidersHorizontal size={40} className="mx-auto mb-3 opacity-30" />
          <p>No listings found.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {listings.map(l => <ListingCard key={l._id} listing={l} />)}
        </div>
      )}
    </div>
  );
}
