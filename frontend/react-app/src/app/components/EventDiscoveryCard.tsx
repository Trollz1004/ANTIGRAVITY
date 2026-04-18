import { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Cloud,
  Thermometer,
  DollarSign,
} from 'lucide-react';

// Event data interface matching backend EventResponse
interface EventData {
  id: string;
  organizer_id: string;
  organizer_name: string;
  title: string;
  description: string;
  location: string | null;
  event_date: string;
  max_attendees: number | null;
  attendee_count: number;
  category: string;
  created_at: string;
  // Extended fields for enhanced features
  image_url?: string;
  is_virtual?: boolean;
  cost?: number;
  accessibility_features?: string[];
  weather_conditions?: {
    temperature: number;
    condition: string;
    precipitation_chance: number;
  };
}

interface FriendsAttending {
  id: string;
  name: string;
  avatar_url?: string;
}

interface EventDiscoveryCardProps {
  event: EventData;
  onRSVP: (eventId: string) => void;
  onDetail: (eventId: string) => void;
  isNearby?: boolean;
  friendsAttending?: FriendsAttending[];
  isRSVPLoading?: boolean;
  didRSVP?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-gray-500',
  tech: 'bg-blue-500',
  volunteer: 'bg-green-500',
  social: 'bg-purple-500',
  education: 'bg-indigo-500',
  outdoors: 'bg-emerald-500',
  arts: 'bg-pink-500',
  food: 'bg-amber-500',
  fitness: 'bg-red-500',
  default: 'bg-gray-500',
};

const ACCESSIBILITY_ICONS: Record<string, string> = {
  wheelchair: '♿',
  'sign-language': '🤟',
  'quiet-space': '🤫',
  'service-animal': '🐕',
  parking: '🅿️',
};

export function EventDiscoveryCard({
  event,
  onRSVP,
  onDetail,
  isNearby = false,
  friendsAttending = [],
  isRSVPLoading = false,
  didRSVP = false,
}: EventDiscoveryCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Format event date
  const formatDate = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Determine if event is in the past
  const isPast = new Date(event.event_date) < new Date();

  // Check if event is full
  const isFull =
    event.max_attendees != null && event.attendee_count >= event.max_attendees;

  // Get category color
  const getCategoryColor = (category: string) => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
  };

  // Check if event has an image URL
  useEffect(() => {
    if (event.image_url) {
      setImageUrl(event.image_url);
    }
  }, [event.image_url]);

  return (
    <div className="glass glass-highlight rounded-xl overflow-hidden hover:border-purple-600/30 transition-all duration-300 group">
      {/* Event Image */}
      {imageUrl && !imageError ? (
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={imageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          {isNearby && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              <MapPin size={12} />
              Nearby
            </div>
          )}
          <div className="absolute bottom-3 left-3">
            <span
              className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-white ${getCategoryColor(event.category)}`}
            >
              {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
            </span>
          </div>
        </div>
      ) : (
        <div className="relative h-32 w-full bg-gradient-to-r from-purple-900/30 to-indigo-900/30 flex items-center justify-center">
          {isNearby && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              <MapPin size={12} />
              Nearby
            </div>
          )}
          <div className="text-4xl">
            {event.category.includes('outdoors')
              ? '🌳'
              : event.category.includes('tech')
                ? '💻'
                : event.category.includes('volunteer')
                  ? '🤝'
                  : event.category.includes('food')
                    ? '🍽️'
                    : event.category.includes('arts')
                      ? '🎨'
                      : '📅'}
          </div>
          <div className="absolute bottom-3 left-3">
            <span
              className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-white ${getCategoryColor(event.category)}`}
            >
              {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
            </span>
          </div>
        </div>
      )}

      {/* Event Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
              {event.title}
            </h3>
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">
              {event.description}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                {formatDate(event.event_date)}
              </span>
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {event.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users size={12} />
                {event.attendee_count}
                {event.max_attendees ? `/${event.max_attendees}` : ''} going
              </span>
              {event.cost !== undefined && event.cost > 0 && (
                <span className="flex items-center gap-1">
                  <DollarSign size={12} />${event.cost.toFixed(2)}
                </span>
              )}
            </div>

            {/* Weather Considerations */}
            {event.weather_conditions && (
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <Cloud size={12} />
                <span>{event.weather_conditions.condition}</span>
                <Thermometer size={12} />
                <span>{event.weather_conditions.temperature}°F</span>
                {event.weather_conditions.precipitation_chance > 0 && (
                  <span>
                    Rain: {event.weather_conditions.precipitation_chance}%
                  </span>
                )}
              </div>
            )}

            {/* Accessibility Information */}
            {event.accessibility_features &&
              event.accessibility_features.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {event.accessibility_features.map((feature, index) => (
                    <span key={index} className="text-xs" title={feature}>
                      {ACCESSIBILITY_ICONS[feature] || '♿'}
                    </span>
                  ))}
                </div>
              )}

            {/* Friend Attendance Indicators */}
            {friendsAttending.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    Friends attending:
                  </span>
                  <div className="flex -space-x-2">
                    {friendsAttending.slice(0, 3).map((friend, index) => (
                      <img
                        key={friend.id}
                        src={friend.avatar_url || '/default-avatar.png'}
                        alt={friend.name}
                        className="w-6 h-6 rounded-full border-2 border-gray-800"
                        onError={e =>
                          (e.currentTarget.src = '/default-avatar.png')
                        }
                      />
                    ))}
                    {friendsAttending.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center text-xs text-gray-300">
                        +{friendsAttending.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RSVP button */}
          <button
            onClick={() => onRSVP(event.id)}
            disabled={didRSVP || isFull || isPast || isRSVPLoading}
            className={`shrink-0 text-sm px-4 py-2 rounded-lg font-medium transition-all duration-200 min-w-[80px] flex items-center justify-center ${
              didRSVP
                ? 'bg-green-600/20 text-green-400 border border-green-600/30 cursor-default'
                : isFull || isPast
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-500 text-white hover:shadow-lg hover:shadow-purple-600/20'
            }`}
          >
            {isRSVPLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : didRSVP ? (
              '✓ Going'
            ) : isPast ? (
              'Past'
            ) : isFull ? (
              'Full'
            ) : (
              'RSVP'
            )}
          </button>
        </div>

        {/* Capacity bar */}
        {event.max_attendees != null && event.max_attendees > 0 && (
          <div className="mt-3">
            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    (event.attendee_count / event.max_attendees) * 100,
                    100
                  )}%`,
                  background: isFull
                    ? 'rgb(239, 68, 68)'
                    : 'linear-gradient(90deg, rgb(147, 51, 234), rgb(168, 85, 247))',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
