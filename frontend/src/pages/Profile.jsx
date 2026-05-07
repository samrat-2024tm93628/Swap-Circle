import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import ListingCard from '../components/ListingCard';
import { Star, MapPin, ArrowLeftRight, Edit2, Check, X } from 'lucide-react';

export default function Profile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bio: '', location: '', skills: '' });

  const isOwn = user.id === userId;

  useEffect(() => {
    Promise.all([
      api.get(`/users/${userId}`).then(r => {
        setProfile(r.data);
        setForm({ bio: r.data.bio || '', location: r.data.location || '', skills: (r.data.skills || []).join(', ') });
      }),
      api.get(`/listings/user/${userId}`).then(r => setListings(r.data.filter(l => l.status === 'active'))),
    ]).finally(() => setLoading(false));
  }, [userId]);

  const saveProfile = async () => {
    try {
      const { data } = await api.put(`/users/${userId}`, {
        bio: form.bio,
        location: form.location,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      });
      setProfile(data);
      setEditing(false);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update');
    }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="card p-8 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-black text-2xl">
              {user.name[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-dark">{isOwn ? user.name : userId}</h1>
              <div className="flex items-center gap-3 mt-1">
                {profile?.rating > 0 && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Star size={14} className="text-primary-500 fill-primary-500" />
                    <span className="font-semibold">{profile.rating}</span>
                    <span className="text-gray-400">({profile.ratingCount})</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <ArrowLeftRight size={14} />
                  <span>{profile?.completedSwaps || 0} swaps</span>
                </div>
              </div>
            </div>
          </div>
          {isOwn && !editing && (
            <button onClick={() => setEditing(true)} className="btn-outline text-sm flex items-center gap-1.5">
              <Edit2 size={14} />
              Edit
            </button>
          )}
          {isOwn && editing && (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="p-2 text-gray-400 hover:text-gray-700"><X size={18} /></button>
              <button onClick={saveProfile} className="btn-primary flex items-center gap-1.5 text-sm"><Check size={14} />Save</button>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {editing ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea className="input resize-none h-20" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell people what you're about..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="City, Country" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
                  <input className="input" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="e.g. plumbing, cooking, coding" />
                </div>
              </div>
            </>
          ) : (
            <>
              {profile?.bio && <p className="text-gray-600">{profile.bio}</p>}
              {profile?.location && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <MapPin size={14} />
                  {profile.location}
                </div>
              )}
              {profile?.skills?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map(s => (
                    <span key={s} className="bg-primary-50 text-primary-700 text-sm font-medium px-3 py-1 rounded-full">{s}</span>
                  ))}
                </div>
              )}
              {!profile?.bio && !profile?.location && !profile?.skills?.length && isOwn && (
                <p className="text-gray-400 text-sm">Add a bio, location, and skills to help others know you better.</p>
              )}
            </>
          )}
        </div>
      </div>

      {listings.length > 0 && (
        <div>
          <h2 className="font-bold text-lg text-dark mb-4">Active listings</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {listings.map(l => <ListingCard key={l._id} listing={l} />)}
          </div>
        </div>
      )}
    </div>
  );
}
