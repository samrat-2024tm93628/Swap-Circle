import { Link } from 'react-router-dom';
import { ArrowLeftRight, Clock } from 'lucide-react';

const statusStyles = {
  pending: 'bg-yellow-50 text-yellow-700',
  accepted: 'bg-blue-50 text-blue-700',
  'in-progress': 'bg-primary-50 text-primary-700',
  completed: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  cancelled: 'bg-gray-50 text-gray-500',
};

export default function SwapCard({ swap, currentUserId }) {
  const isProposer = swap.proposerId === currentUserId;
  const otherName = isProposer ? swap.receiverName : swap.proposerName;

  return (
    <Link to={`/swaps/${swap._id}`} className="card p-5 block group">
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyles[swap.status] || 'bg-gray-50 text-gray-600'}`}>
          {swap.status}
        </span>
        <span className="text-xs text-gray-400">{isProposer ? 'You proposed' : 'Incoming'}</span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <div className="flex-1 bg-primary-50 rounded-lg px-3 py-2">
          <p className="text-xs text-primary-600 font-medium mb-0.5">You offer</p>
          <p className="font-semibold text-dark line-clamp-1">{swap.offeredListingTitle}</p>
        </div>
        <ArrowLeftRight size={18} className="text-gray-400 shrink-0" />
        <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2">
          <p className="text-xs text-gray-500 font-medium mb-0.5">You get</p>
          <p className="font-semibold text-dark line-clamp-1">{swap.requestedListingTitle}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
        <span>with <span className="font-medium text-gray-600">{otherName}</span></span>
        <div className="flex items-center gap-1">
          <Clock size={11} />
          <span>{new Date(swap.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}
