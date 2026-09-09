import { useEffect, useState } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Check,
  Clock,
  Navigation,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../lib/api';
import MeetupsDiscovery from '../../components/MeetupsDiscovery';

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
}

export function Events() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [rsvpd, setRsvpd] = useState<Set<string>>(new Set());
  const [showNearby, setShowNearby] = useState(false);

  const loadEvents = () => {
    api
      .get<EventData[]>('/events')
      .then(setEvents)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const createEvent = async () => {
    if (!title.trim() || !description.trim() || !eventDate) return;
    await api.post('/events', {
      title,
      description,
      location: location || null,
      event_date: new Date(eventDate).toISOString(),
      max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
      category: 'general',
    });
    setTitle('');
    setDescription('');
    setLocation('');
    setEventDate('');
    setMaxAttendees('');
    setShowCreate(false);
    loadEvents();
  };

  const handleRsvp = async (eventId: string) => {
    try {
      await api.post(`/events/${eventId}/rsvp`);
      setRsvpd(prev => new Set(prev).add(eventId));
      loadEvents();
    } catch {
      /* already rsvpd or full */
    }
  };

  if (loading) {
    return (
      <div className="app-page flex items-center justify-center">
        <div className="glass-strong rounded-[2rem] p-8 text-center animate-fade-in">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[1rem] border-4 border-[#111111] bg-[#111111] text-white">
            <Calendar size={24} className="animate-pulse" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#5c594f]">
            Loading events
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <div className="app-kicker mb-3">Plans</div>
          <h1 className="app-title">plans and safety.</h1>
          <p className="app-subtitle mt-4">
            Turn a good chat into a clear plan: public place, time, meetup
            details, and a check-in path.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="app-button-accent px-5 py-3 text-sm"
        >
          <Plus size={16} /> Create Plan
        </button>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="glass-strong glass-highlight rounded-[1.8rem] p-5">
          <ShieldCheck size={22} className="mb-3 text-[#ff4f00]" />
          <h2 className="text-lg font-black uppercase tracking-tight text-[#111111]">
            Share date
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-[#5c594f]">
            Keep first meetup details in one card so a trusted contact can see
            when, where, and who.
          </p>
        </div>
        <div className="glass-strong glass-highlight rounded-[1.8rem] p-5">
          <Clock size={22} className="mb-3 text-[#ff4f00]" />
          <h2 className="text-lg font-black uppercase tracking-tight text-[#111111]">
            Check-in
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-[#5c594f]">
            Add a private reminder after the meetup window starts.
          </p>
        </div>
        <div className="glass-strong glass-highlight rounded-[1.8rem] p-5">
          <Users size={22} className="mb-3 text-[#ff4f00]" />
          <h2 className="text-lg font-black uppercase tracking-tight text-[#111111]">
            Low pressure
          </h2>
          <p className="mt-2 text-sm font-medium leading-6 text-[#5c594f]">
            Group plans and public events can reduce first-date pressure after
            the core chat flow is stable.
          </p>
        </div>
      </section>

      {/* Find Nearby — collapsible GPS-aware meetup discovery */}
      <div className="mb-6 animate-fade-in">
        <button
          id="events-toggle-nearby"
          onClick={() => setShowNearby(!showNearby)}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 ${
            showNearby
              ? 'glass text-[#111111] border-[#111111]'
              : 'glass text-[#5c594f] hover:text-[#111111]'
          }`}
        >
          <Navigation
            size={14}
            className={showNearby ? 'text-[#ff4f00]' : ''}
          />
          {showNearby ? 'Hide Nearby' : 'Find Nearby Meetups'}
        </button>
        {showNearby && (
          <div className="mt-4 glass-strong rounded-3xl p-4 glass-highlight animate-scale-in">
            <MeetupsDiscovery />
          </div>
        )}
      </div>

      {showCreate && (
        <div className="glass-strong rounded-3xl p-6 glass-highlight mb-6 space-y-4 animate-scale-in">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Plan title"
            className="app-input input-glow"
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What is the plan and safety context?"
            rows={3}
            className="app-textarea input-glow"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Location"
              className="app-input input-glow"
            />
            <input
              type="datetime-local"
              value={eventDate}
              onChange={e => setEventDate(e.target.value)}
              className="app-input input-glow"
            />
          </div>
          <input
            type="number"
            value={maxAttendees}
            onChange={e => setMaxAttendees(e.target.value)}
            placeholder="Max attendees (optional)"
            className="app-input input-glow"
          />
          <button
            onClick={createEvent}
            className="app-button-dark px-6 py-3 text-sm"
          >
            Create Plan
          </button>
        </div>
      )}

      {events.length === 0 ? (
        <div className="glass-strong glass-highlight mx-auto max-w-xl rounded-[2rem] p-8 text-center animate-scale-in">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[1.8rem] border-4 border-[#111111] bg-[#111111] text-white shadow-[8px_8px_0_0_rgba(17,17,17,1)] animate-float">
            <Calendar size={44} />
          </div>
          <h2 className="app-title">no events yet.</h2>
          <p className="app-subtitle mt-4 max-w-sm mx-auto">
            Create a plan when a chat is ready to move into a public meetup.
          </p>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {events.map(event => {
            const isPast = new Date(event.event_date) < new Date();
            return (
              <div
                key={event.id}
                className={`glass rounded-3xl p-6 glass-highlight transition-all duration-200 ${
                  isPast ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[#111111] font-bold text-lg">
                        {event.title}
                      </h3>
                      {isPast && (
                        <span className="text-[10px] font-bold text-[#5c594f] glass rounded-full px-2 py-0.5 uppercase">
                          Past
                        </span>
                      )}
                    </div>
                    <p className="text-[#5c594f] text-sm mt-1 leading-relaxed">
                      {event.description}
                    </p>
                    <div className="flex flex-wrap gap-3 mt-4">
                      <span className="flex items-center gap-1.5 text-xs text-[#5c594f] glass rounded-full px-3 py-1.5">
                        <Clock size={12} className="text-[#ff4f00]" />
                        {new Date(event.event_date).toLocaleDateString([], {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1.5 text-xs text-[#5c594f] glass rounded-full px-3 py-1.5">
                          <MapPin size={12} className="text-[#ff4f00]" />{' '}
                          {event.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-xs text-[#5c594f] glass rounded-full px-3 py-1.5">
                        <Users size={12} className="text-[#ff4f00]" />
                        {event.attendee_count}
                        {event.max_attendees
                          ? `/${event.max_attendees}`
                          : ''}{' '}
                        going
                      </span>
                    </div>
                  </div>
                  {!isPast && (
                    <button
                      onClick={() => handleRsvp(event.id)}
                      disabled={rsvpd.has(event.id)}
                      className={`px-5 py-2.5 rounded-2xl text-sm font-bold flex-shrink-0 transition-all duration-200 ${
                        rsvpd.has(event.id)
                          ? 'glass text-[#244f1f] border-[#244f1f]'
                          : 'border-4 border-[#111111] bg-[#ff4f00] text-white shadow-[4px_4px_0_0_rgba(17,17,17,1)] hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                    >
                      {rsvpd.has(event.id) ? (
                        <span className="flex items-center gap-1.5">
                          <Check size={14} /> Going
                        </span>
                      ) : (
                        'RSVP'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
