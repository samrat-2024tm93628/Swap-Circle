import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const CATEGORIES = ['Technology', 'Education', 'Home Services', 'Transportation', 'Arts & Creative', 'Food & Cooking', 'Health & Wellness', 'Other'];

export default function CreateListing() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    type: 'offer',
    title: '',
    description: '',
    category: '',
    estimatedHours: '',
    tags: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        estimatedHours: parseFloat(form.estimatedHours),
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      await api.post('/listings', payload);
      toast.success('Listing posted!');
      navigate('/listings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-dark mb-6">Post a listing</h1>

      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">I want to...</label>
            <div className="flex gap-3">
              {['offer', 'request'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`flex-1 py-2.5 rounded-lg font-semibold text-sm border-2 transition-colors ${form.type === t ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  {t === 'offer' ? 'Offer something' : 'Request something'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" className="input" placeholder={form.type === 'offer' ? "e.g. I'll fix your bike" : "e.g. Need help moving furniture"} value={form.title} onChange={set('title')} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="input resize-none h-28" placeholder="Describe what you're offering or requesting..." value={form.description} onChange={set('description')} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="input" value={form.category} onChange={set('category')} required>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated hours</label>
              <input type="number" className="input" min="0.5" step="0.5" placeholder="e.g. 2" value={form.estimatedHours} onChange={set('estimatedHours')} required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags <span className="text-gray-400 font-normal">(comma separated)</span></label>
            <input type="text" className="input" placeholder="e.g. plumbing, repairs, weekend" value={form.tags} onChange={set('tags')} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-60">
            {loading ? 'Posting...' : 'Post listing'}
          </button>
        </form>
      </div>
    </div>
  );
}
