import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Clock, Tag, ArrowLeftRight, Trash2, IndianRupee } from 'lucide-react';

export default function ListingDetail() {
  const { id } = useParams();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState('');
  const [message, setMessage] = useState('');
  const [proposing, setProposing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  const [creditAmount, setCreditAmount] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/listings/${id}`).then(r => {
        setListing(r.data);
        setCreditAmount(String(r.data.estimatedHours));
      }),
      api.get(`/listings/user/${user.id}`)
        .then(r => setMyListings(r.data.filter(l => l.status === 'active' && l.type === 'offer')))
        .catch(() => setMyListings([])),
    ]).finally(() => setLoading(false));
  }, [id, user.id]);

  const handleDelete = async () => {
    if (!confirm('Delete this listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      toast.success('Listing deleted');
      navigate('/listings');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handlePropose = async (e) => {
    e.preventDefault();
    if (!selectedOffer) return toast.error('Select one of your offers');
    setProposing(true);
    try {
      await api.post('/swaps', {
        offeredListingId: selectedOffer,
        requestedListingId: listing._id,
        receiverId: listing.userId,
        receiverName: listing.userName,
        message,
      });
      toast.success('Swap proposed!');
      navigate('/swaps');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to propose');
    } finally {
      setProposing(false);
    }
  };

  const handlePayCredits = async () => {
    const amt = parseInt(creditAmount);
    if (!amt || amt < 1) return toast.error('Enter a valid amount');
    if (user.timeCredits < amt) return toast.error(`Insufficient credits. You have ${user.timeCredits}.`);
    setPaying(true);
    try {
      const { data } = await api.post('/auth/credits/pay', {
        toUserId: listing.userId,
        toUserName: listing.userName,
        amount: amt,
        listingTitle: listing.title,
      });
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const updated = { ...stored, timeCredits: data.user.timeCredits };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      toast.success(data.message);
      navigate('/credits');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" /></div>;
  if (!listing) return <div className="text-center py-16 text-gray-400">Listing not found</div>;

  const isOwner = listing.userId === user.id;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="card p-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-2">
            <span className={listing.type === 'offer' ? 'badge-offer' : 'badge-request'}>
              {listing.type === 'offer' ? 'Offering' : 'Requesting'}
            </span>
            <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
              {listing.category}
            </span>
          </div>
          {isOwner && (
            <button onClick={handleDelete} className="text-red-400 hover:text-red-600 transition-colors p-1">
              <Trash2 size={18} />
            </button>
          )}
        </div>

        <h1 className="text-2xl font-bold text-dark mb-3">{listing.title}</h1>
        <p className="text-gray-600 mb-6 leading-relaxed">{listing.description}</p>

        <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
          <div className="flex items-center gap-1.5">
            <Clock size={15} />
            <span>{listing.estimatedHours} hour{listing.estimatedHours > 1 ? 's' : ''}</span>
          </div>
          <Link to={`/profile/${listing.userId}`} className="font-medium text-dark hover:text-primary-600 transition-colors">
            {listing.userName}
          </Link>
        </div>

        {listing.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {listing.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                <Tag size={11} />
                {tag}
              </span>
            ))}
          </div>
        )}

        {!isOwner && listing.status === 'active' && (
          <div className="border-t border-gray-100 pt-6">
            {!mode && (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setMode('swap')} className="btn-primary py-3 flex items-center justify-center gap-2">
                  <ArrowLeftRight size={18} />
                  Propose a swap
                </button>
                <button onClick={() => setMode('pay')} className="btn-outline py-3 flex items-center justify-center gap-2">
                  <IndianRupee size={18} />
                  Pay with credits
                </button>
              </div>
            )}

            {mode === 'swap' && (
              <form onSubmit={handlePropose} className="space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-dark">What will you offer in return?</h3>
                  <button type="button" onClick={() => setMode(null)} className="text-sm text-gray-400 hover:text-gray-600">← Back</button>
                </div>
                {myListings.length === 0 ? (
                  <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4">
                    You need to post an offer first.{' '}
                    <Link to="/listings/new" className="text-primary-600 font-medium hover:underline">Create one</Link>
                  </div>
                ) : (
                  <>
                    <select className="input" value={selectedOffer} onChange={e => setSelectedOffer(e.target.value)} required>
                      <option value="">Select your offer</option>
                      {myListings.map(l => <option key={l._id} value={l._id}>{l.title}</option>)}
                    </select>
                    <textarea className="input resize-none h-24" placeholder="Add a message (optional)" value={message} onChange={e => setMessage(e.target.value)} />
                    <button type="submit" disabled={proposing} className="btn-primary w-full disabled:opacity-60">
                      {proposing ? 'Sending...' : 'Send proposal'}
                    </button>
                  </>
                )}
              </form>
            )}

            {mode === 'pay' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-dark">Pay with credits</h3>
                  <button type="button" onClick={() => setMode(null)} className="text-sm text-gray-400 hover:text-gray-600">← Back</button>
                </div>
                <div className="bg-primary-50 rounded-lg p-4 text-sm text-primary-800">
                  <p>Suggested: <strong>{listing.estimatedHours} credits</strong> for {listing.estimatedHours}h of work</p>
                  <p className="text-primary-600 mt-0.5">You have <strong>{user.timeCredits} credits</strong> (₹{user.timeCredits})</p>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₹</span>
                  <input
                    type="number"
                    className="input pl-7"
                    placeholder="Enter credits to pay"
                    min="1"
                    max={user.timeCredits}
                    value={creditAmount}
                    onChange={e => setCreditAmount(e.target.value)}
                  />
                </div>
                <button onClick={handlePayCredits} disabled={paying || !creditAmount} className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60">
                  <IndianRupee size={18} />
                  {paying ? 'Processing...' : `Pay ₹${creditAmount || 0} to ${listing.userName}`}
                </button>
                <p className="text-xs text-gray-400 text-center">Credits transfer instantly. No swap needed.</p>
              </div>
            )}
          </div>
        )}

        {listing.status !== 'active' && (
          <div className="border-t border-gray-100 pt-6">
            <p className="text-center text-gray-400 font-medium capitalize">This listing is {listing.status}</p>
          </div>
        )}
      </div>
    </div>
  );
}
