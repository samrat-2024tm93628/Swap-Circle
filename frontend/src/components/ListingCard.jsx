import { Link } from 'react-router-dom';
import { Clock, Tag } from 'lucide-react';

const categoryColors = {
  'Technology': 'bg-blue-50 text-blue-700',
  'Education': 'bg-green-50 text-green-700',
  'Home Services': 'bg-yellow-50 text-yellow-700',
  'Transportation': 'bg-purple-50 text-purple-700',
  'Arts & Creative': 'bg-pink-50 text-pink-700',
  'Food & Cooking': 'bg-red-50 text-red-700',
  'Health & Wellness': 'bg-teal-50 text-teal-700',
  'Other': 'bg-gray-50 text-gray-700',
};

export default function ListingCard({ listing }) {
  const catColor = categoryColors[listing.category] || 'bg-gray-50 text-gray-700';

  return (
    <Link to={`/listings/${listing._id}`} className="card p-5 block group">
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${listing.type === 'offer' ? 'badge-offer' : 'badge-request'}`}>
          {listing.type === 'offer' ? 'Offering' : 'Requesting'}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catColor}`}>
          {listing.category}
        </span>
      </div>

      <h3 className="font-semibold text-dark group-hover:text-primary-600 transition-colors mb-1 line-clamp-2">
        {listing.title}
      </h3>
      <p className="text-gray-500 text-sm mb-3 line-clamp-2">{listing.description}</p>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>{listing.estimatedHours}h</span>
        </div>
        <span className="font-medium text-gray-600">{listing.userName}</span>
      </div>

      {listing.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {listing.tags.slice(0, 3).map(tag => (
            <span key={tag} className="flex items-center gap-0.5 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
              <Tag size={10} />
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
