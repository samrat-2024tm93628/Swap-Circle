import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SwapCard from '../components/SwapCard';
import api from '../services/api';
import toast from 'react-hot-toast';
import { IndianRupee, CheckCircle, XCircle, Clock, Handshake } from 'lucide-react';

const TABS = ['all', 'pending', 'accepted', 'completed', 'rejected'];

const offerStatusStyle = {
  pending: 'bg-yellow-50 text-yellow-700',
  countered: 'bg-orange-50 text-orange-700',
  accepted: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
};

export default function MySwaps() {
  const { user, setUser } = useAuth();
  const [swaps, setSwaps] = useState([]);
  const [offers, setOffers] = useState([]);
  const [tab, setTab] = useState('all');
  const [offerTab, setOfferTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [counterInputs, setCounterInputs] = useState({});

  const fetchOffers = () => api.get('/credit-offers/mine').then(r => setOffers(r.data)).catch(() => {});

  useEffect(() => {
    Promise.all([
      api.get('/swaps/mine').then(r => setSwaps(r.data)).catch(() => {}),
      fetchOffers(),
    ]).finally(() => setLoading(false));
  }, []);

  const refreshUser = async () => {
    const { data } = await api.get('/auth/me');
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    const updated = { ...stored, timeCredits: data.timeCredits };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };

  const handleOfferAction = async (offerId, action, extraData = {}) => {
    try {
      await api.patch(`/credit-offers/${offerId}/${action}`, extraData);
      const msg = { accept: 'Offer accepted! Credits transferred.', lock: 'Deal locked! Credits transferred.', reject: 'Offer rejected.', counter: 'Counter offer sent.' };
      toast.success(msg[action]);
      await fetchOffers();
      if (action === 'accept' || action === 'lock') await refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const filtered = tab === 'all' ? swaps : swaps.filter(s => s.status === tab);
  const activeOffers = offers.filter(o => ['pending', 'countered'].includes(o.status));
  const pastOffers = offers.filter(o => ['accepted', 'rejected'].includes(o.status));
  const displayedOffers = offerTab === 'active' ? activeOffers : pastOffers;

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
        <div className="text-center py-10 text-gray-400">
          <p>No swaps here yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {filtered.map(s => <SwapCard key={s._id} swap={s} currentUserId={user.id} />)}
        </div>
      )}

      <div className="mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Handshake size={18} className="text-primary-500" />
          <h2 className="font-bold text-lg text-dark">Credit Offers</h2>
          {activeOffers.length > 0 && (
            <span className="bg-primary-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{activeOffers.length}</span>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          {[['active', 'Active'], ['past', 'Past']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setOfferTab(val)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${offerTab === val ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {displayedOffers.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            <IndianRupee size={28} className="mx-auto mb-2 opacity-20" />
            <p>No {offerTab} creditsedit offers.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedOffers.map(offer => {
              const isBuyer = offer.buyerId === user.id;
              return (
                <div key={offer._id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-dark text-sm">{offer.listingTitle}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isBuyer ? `To: ${offer.sellerName}` : `From: ${offer.buyerName}`}
                        {' · '}{new Date(offer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${offerStatusStyle[offer.status]}`}>
                      {offer.status === 'countered' ? 'Counter received' : offer.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm mb-3">
                    <div>
                      <p className="text-xs text-gray-400">{isBuyer ? 'Your offer' : 'Buyer offered'}</p>
                      <p className="font-bold text-dark">{offer.proposedAmount} credits</p>
                    </div>
                    {offer.counterAmount && (
                      <>
                        <span className="text-gray-300 text-lg">→</span>
                        <div>
                          <p className="text-xs text-gray-400">{isBuyer ? 'Counter offer' : 'Your counter'}</p>
                          <p className="font-bold text-orange-600">{offer.counterAmount} credits</p>
                        </div>
                      </>
                    )}
                    {offer.finalAmount && (
                      <>
                        <span className="text-gray-300 text-lg">→</span>
                        <div>
                          <p className="text-xs text-gray-400">Final paid</p>
                          <p className="font-bold text-green-600">{offer.finalAmount} credits</p>
                        </div>
                      </>
                    )}
                  </div>

                  {offer.message && (
                    <p className="text-xs text-gray-500 bg-gray-50 rounded p-2 mb-3">"{offer.message}"</p>
                  )}

                  {['pending', 'countered'].includes(offer.status) && (
                    <div className="flex gap-2 flex-wrap items-center">
                      {!isBuyer && offer.status === 'pending' && (
                        <>
                          <button onClick={() => handleOfferAction(offer._id, 'accept')} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                            <CheckCircle size={13} /> Accept {offer.proposedAmount} credits
                          </button>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              className="input text-xs py-1.5 w-24"
                              placeholder="Counter..."
                              value={counterInputs[offer._id] || ''}
                              onChange={e => setCounterInputs(p => ({ ...p, [offer._id]: e.target.value }))}
                            />
                            <button
                              onClick={() => {
                                if (!counterInputs[offer._id]) return toast.error('Enter counter amount');
                                handleOfferAction(offer._id, 'counter', { counterAmount: parseInt(counterInputs[offer._id]) });
                                setCounterInputs(p => ({ ...p, [offer._id]: '' }));
                              }}
                              className="btn-outline text-xs py-1.5 px-3"
                            >
                              Counter
                            </button>
                          </div>
                          <button onClick={() => handleOfferAction(offer._id, 'reject')} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                            <XCircle size={13} /> Reject
                          </button>
                        </>
                      )}
                      {isBuyer && offer.status === 'countered' && (
                        <>
                          <button onClick={() => handleOfferAction(offer._id, 'lock')} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                            <CheckCircle size={13} /> Lock deal at {offer.counterAmount} credits
                          </button>
                          <button onClick={() => handleOfferAction(offer._id, 'reject')} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                            <XCircle size={13} /> Reject
                          </button>
                        </>
                      )}
                      {isBuyer && offer.status === 'pending' && (
                        <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> Waiting for seller to respond</p>
                      )}
                      {!isBuyer && offer.status === 'countered' && (
                        <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> Waiting for buyer to respond</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
