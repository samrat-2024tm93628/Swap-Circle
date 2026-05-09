import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, IndianRupee, Handshake, Clock, CheckCircle, XCircle } from 'lucide-react';

const QUICK_AMOUNTS = [50, 100, 500, 1000];

const txIcon = { buy: ArrowDownLeft, redeem: ArrowUpRight, sent: ArrowUpRight, received: ArrowDownLeft };
const txColor = { buy: 'text-green-600', redeem: 'text-red-500', sent: 'text-red-500', received: 'text-green-600' };
const txSign = { buy: '+', redeem: '-', sent: '-', received: '+' };

export default function Credits() {
  const { user, setUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('buy');
  const [amount, setAmount] = useState('');
  const [acting, setActing] = useState(false);
  const [counterInputs, setCounterInputs] = useState({});

  const fetchOffers = () => api.get('/credit-offers/mine').then(r => setOffers(r.data)).catch(() => {});

  useEffect(() => {
    Promise.all([
      api.get('/auth/credits/transactions').then(r => setTransactions(r.data)).catch(() => {}),
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

  const handleBuy = async () => {
    const amt = parseInt(amount);
    if (!amt || amt < 1) return toast.error('Enter a valid amount');
    setActing(true);
    try {
      const { data } = await api.post('/auth/credits/buy', { amount: amt });
      toast.success(data.message);
      setAmount('');
      await refreshUser();
      const { data: txs } = await api.get('/auth/credits/transactions');
      setTransactions(txs);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setActing(false);
    }
  };

  const handleRedeem = async () => {
    const amt = parseInt(amount);
    if (!amt || amt < 10) return toast.error('Minimum redemption is 10 creditsedits');
    setActing(true);
    try {
      const { data } = await api.post('/auth/credits/redeem', { amount: amt });
      toast.success(data.message);
      setAmount('');
      await refreshUser();
      const { data: txs } = await api.get('/auth/credits/transactions');
      setTransactions(txs);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setActing(false);
    }
  };

  const handleOfferAction = async (offerId, action, extraData = {}) => {
    try {
      await api.patch(`/credit-offers/${offerId}/${action}`, extraData);
      toast.success(action === 'accept' ? 'Offer accepted! Credits transferred.' : action === 'lock' ? 'Deal locked! Credits transferred.' : action === 'reject' ? 'Offer rejected.' : 'Counter offer sent.');
      await fetchOffers();
      if (action === 'accept' || action === 'lock') {
        await refreshUser();
        const { data: txs } = await api.get('/auth/credits/transactions');
        setTransactions(txs);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-dark mb-6">Credits Wallet</h1>

      <div className="card p-6 mb-6 bg-dark text-white border-0">
        <p className="text-gray-400 text-sm mb-1">Available Balance</p>
        <div className="flex items-end gap-2">
          <span className="text-5xl font-black text-primary-400">{user.timeCredits}</span>
          <span className="text-gray-400 mb-1">credits</span>
        </div>
        <p className="text-gray-500 text-sm mt-2 flex items-center gap-1">
          <IndianRupee size={13} />
          {user.timeCredits} equivalent value · 1 creditsedit = ₹1
        </p>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex gap-2 mb-5">
          {['buy', 'redeem'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setAmount(''); }}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${tab === t ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {t === 'buy' ? 'Buy Credits' : 'Redeem Credits'}
            </button>
          ))}
        </div>

        {tab === 'buy' ? (
          <>
            <p className="text-sm text-gray-500 mb-4">Pay ₹1 = get 1 creditsedit. Use creditsedits to pay for services directly without swapping.</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {QUICK_AMOUNTS.map(a => (
                <button
                  key={a}
                  onClick={() => setAmount(String(a))}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${amount === String(a) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  ₹{a}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                <input
                  type="number"
                  className="input pl-7"
                  placeholder="Enter amount"
                  min="1"
                  max="10000"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
              <button onClick={handleBuy} disabled={acting || !amount} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                <Plus size={16} />
                {acting ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Simulated payment — no real money charged.</p>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">Redeem your creditsedits to ₹INR. Minimum 10 creditsedits. Processing takes 2–3 business days.</p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                <input
                  type="number"
                  className="input pl-7"
                  placeholder="Enter creditsedits to redeem"
                  min="10"
                  max={user.timeCredits}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
              <button onClick={handleRedeem} disabled={acting || !amount} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                {acting ? 'Processing...' : `Get ₹${amount || 0}`}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">You have {user.timeCredits} creditsedits (₹{user.timeCredits}) available.</p>
          </>
        )}
      </div>

      {offers.filter(o => ['pending', 'countered'].includes(o.status)).length > 0 && (
        <div className="mb-6">
          <h2 className="font-bold text-lg text-dark mb-4 flex items-center gap-2">
            <Handshake size={18} className="text-primary-500" />
            Active Credit Offers
          </h2>
          <div className="space-y-3">
            {offers.filter(o => ['pending', 'countered'].includes(o.status)).map(offer => {
              const isBuyer = offer.buyerId === user.id;
              return (
                <div key={offer._id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-dark text-sm">{offer.listingTitle}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isBuyer ? `To: ${offer.sellerName}` : `From: ${offer.buyerName}`}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${offer.status === 'countered' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                      {offer.status === 'countered' ? 'Counter received' : 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-400 text-xs">Your offer</span>
                      <p className="font-bold text-dark">{offer.proposedAmount} credits</p>
                    </div>
                    {offer.counterAmount && (
                      <>
                        <span className="text-gray-300">→</span>
                        <div>
                          <span className="text-gray-400 text-xs">Counter offer</span>
                          <p className="font-bold text-orange-600">{offer.counterAmount} credits</p>
                        </div>
                      </>
                    )}
                  </div>

                  {offer.message && (
                    <p className="text-xs text-gray-500 bg-gray-50 rounded p-2 mb-3">"{offer.message}"</p>
                  )}

                  <div className="flex gap-2 flex-wrap">
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
                        <button onClick={() => handleOfferAction(offer._id, 'reject')} className="text-xs text-red-500 hover:text-red-700 px-2 flex items-center gap-1">
                          <XCircle size={13} /> Reject
                        </button>
                      </>
                    )}
                    {isBuyer && offer.status === 'countered' && (
                      <>
                        <button onClick={() => handleOfferAction(offer._id, 'lock')} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                          <CheckCircle size={13} /> Lock deal at {offer.counterAmount} credits
                        </button>
                        <button onClick={() => handleOfferAction(offer._id, 'reject')} className="text-xs text-red-500 hover:text-red-700 px-2 flex items-center gap-1">
                          <XCircle size={13} /> Reject
                        </button>
                      </>
                    )}
                    {!isBuyer && offer.status === 'countered' && (
                      <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> Waiting for buyer to respond to your counter</p>
                    )}
                    {isBuyer && offer.status === 'pending' && (
                      <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> Waiting for seller to respond</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-bold text-lg text-dark mb-4">Transaction History</h2>
        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin w-7 h-7 border-4 border-primary-500 border-t-transparent rounded-full" /></div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Wallet size={36} className="mx-auto mb-2 opacity-30" />
            <p>No transactions yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => {
              const Icon = txIcon[tx.type];
              return (
                <div key={tx._id} className="card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.type === 'buy' || tx.type === 'received' ? 'bg-green-50' : 'bg-red-50'}`}>
                      <Icon size={16} className={txColor[tx.type]} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark">{tx.description}</p>
                      <p className="text-xs text-gray-400">
                        {tx.counterpartName && `${tx.type === 'sent' ? 'To' : 'From'} ${tx.counterpartName} · `}
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold text-base ${txColor[tx.type]}`}>
                    {txSign[tx.type]}{tx.amount} credits
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
