import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import { ArrowLeftRight, CheckCircle, XCircle, Star } from 'lucide-react';

const statusColors = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  accepted: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-gray-50 text-gray-600 border-gray-200',
};

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star size={24} className={n <= value ? 'text-primary-500 fill-primary-500' : 'text-gray-300'} />
        </button>
      ))}
    </div>
  );
}

export default function SwapDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [swap, setSwap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    api.get(`/swaps/${id}`)
      .then(r => setSwap(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  const act = async (action) => {
    setActing(true);
    try {
      const { data } = await api.patch(`/swaps/${id}/${action}`);
      setSwap(data);
      toast.success(`Swap ${action}ed`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActing(false);
    }
  };

  const submitRating = async () => {
    if (!rating) return toast.error('Pick a rating');
    setActing(true);
    try {
      const { data } = await api.patch(`/swaps/${id}/rate`, { rating });
      setSwap(data);
      toast.success('Rating submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setActing(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
  if (!swap) return <div className="text-center py-16 text-gray-400">Swap not found</div>;

  const isProposer = swap.proposerId === user.id;
  const isReceiver = swap.receiverId === user.id;
  const myRating = isProposer ? swap.proposerRating : swap.receiverRating;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-700 text-sm mb-6 inline-block">← Back</button>

      <div className="card p-8">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border mb-6 ${statusColors[swap.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
          {swap.status}
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 bg-primary-50 rounded-xl p-4">
            <p className="text-xs text-primary-600 font-semibold mb-1">{isProposer ? 'You offer' : `${swap.proposerName} offers`}</p>
            <p className="font-bold text-dark">{swap.offeredListingTitle}</p>
          </div>
          <ArrowLeftRight size={20} className="text-gray-400 shrink-0" />
          <div className="flex-1 bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-500 font-semibold mb-1">{isReceiver ? 'You offer' : `${swap.receiverName} offers`}</p>
            <p className="font-bold text-dark">{swap.requestedListingTitle}</p>
          </div>
        </div>

        {swap.message && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm text-gray-600 italic">
            "{swap.message}"
          </div>
        )}

        <div className="text-xs text-gray-400 mb-6 space-y-1">
          <p>Proposed by <span className="font-medium text-gray-600">{swap.proposerName}</span></p>
          <p>Proposed on {new Date(swap.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          {swap.completedAt && <p>Completed on {new Date(swap.completedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
        </div>

        <div className="border-t border-gray-100 pt-6 space-y-3">
          {swap.status === 'pending' && isReceiver && (
            <div className="flex gap-3">
              <button onClick={() => act('reject')} disabled={acting} className="flex-1 flex items-center justify-center gap-2 border border-red-300 text-red-600 hover:bg-red-50 font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60">
                <XCircle size={18} />
                Decline
              </button>
              <button onClick={() => act('accept')} disabled={acting} className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-60">
                <CheckCircle size={18} />
                Accept
              </button>
            </div>
          )}

          {swap.status === 'pending' && isProposer && (
            <button onClick={() => act('cancel')} disabled={acting} className="w-full border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60">
              Cancel proposal
            </button>
          )}

          {swap.status === 'accepted' && (
            <button onClick={() => act('complete')} disabled={acting} className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-60">
              <CheckCircle size={18} />
              Mark as completed
            </button>
          )}

          {swap.status === 'completed' && !myRating && (
            <div>
              <p className="font-semibold text-dark mb-3">Rate your experience</p>
              <StarRating value={rating} onChange={setRating} />
              <button onClick={submitRating} disabled={acting || !rating} className="btn-primary mt-3 disabled:opacity-60">
                Submit rating
              </button>
            </div>
          )}

          {swap.status === 'completed' && myRating && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle size={16} />
              You rated this swap {myRating}/5
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
