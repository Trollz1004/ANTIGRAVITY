import { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, Plus, Check, Clock, Navigation } from 'lucide-react';
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
    api.get<EventData[]>('/events').then(setEvents).finally(() => setLoading(false));
  };

  useEffect(() => { loadEvents(); }, []);

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
    setTitle(''); setDescription(''); setLocation(''); setEventDate(''); setMaxAttendees('');
    setShowCreate(false);
    loadEvents();
  };

  const handleRsvp = async (eventId: string) => {
    try {
      await api.post(`/events/${eventId}/rsvp`);
      setRsvpd((prev) => new Set(prev).add(eventId));
      loadEvents();
    } catch { /* already rsvpd or full */ }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Calendar size={24} className="text-orange-400 animate-pulse" />
          </div>
          <p className="text-gray-400 font-medium">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Events & Meetups</h1>
          <p className="text-gray-500 text-sm mt-0.5">Find your people IRL</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl text-white text-sm font-bold hover:shadow-lg hover:shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <Plus size={16} /> Create Event
        </button>
      </div>

      {/* Find Nearby — collapsible GPS-aware meetup discovery */}
      <div className="mb-6 animate-fade-in">
        <button
          id="events-toggle-nearby"
          onClick={() => setShowNearby(!showNearby)}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 ${
            showNearby
              ? 'glass text-purple-400 border border-purple-500/20'
              : 'glass text-gray-400 hover:text-white'
          }`}
        >
          <Navigation size={14} className={showNearby ? 'text-purple-400' : ''} />
          {showNearby ? 'Hide Nearby' : '📍 Find Nearby Meetups'}
        </button>
        {showNearby && (
          <div className="mt-4 glass-strong rounded-3xl p-4 glass-highlight animate-scale-in">
            <MeetupsDiscovery />
          </div>
        )}
      </div>

      {showCreate && (
        <div className="glass-strong rounded-3xl p-6 glass-highlight mb-6 space-y-4 animate-scale-in">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className="w-full px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 input-glow transition-all duration-300" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this event about?" rows={3} className="w-full px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 input-glow transition-all duration-300 resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 input-glow transition-all duration-300" />
            <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white focus:outline-none focus:border-orange-500/40 input-glow transition-all duration-300" />
          </div>
          <input type="number" value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value)} placeholder="Max attendees (optional)" className="w-full px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 input-glow transition-all duration-300" />
          <button onClick={createEvent} className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl text-white text-sm font-bold hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-200">Create Event</button>
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-20 animate-scale-in">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-orange-500/20 animate-float">
            <Calendar size={44} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">No Events Yet</h2>
          <p className="text-gray-400 max-w-sm mx-auto">Create one and bring people together!</p>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {events.map((event) => {
            const isPast = new Date(event.event_date) < new Date();
            return (
              <div key={event.id} className={`glass rounded-3xl p-6 glass-highlight hover:bg-white/[0.04] transition-all duration-200 ${isPast ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-bold text-lg">{event.title}</h3>
                      {isPast && <span className="text-[10px] font-bold text-gray-500 glass rounded-full px-2 py-0.5 uppercase">Past</span>}
                    </div>
                    <p className="text-gray-400 text-sm mt-1 leading-relaxed">{event.description}</p>
                    <div className="flex flex-wrap gap-3 mt-4">
                      <span className="flex items-center gap-1.5 text-xs text-gray-400 glass rounded-full px-3 py-1.5">
                        <Clock size={12} className="text-orange-400" />
                        {new Date(event.event_date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1.5 text-xs text-gray-400 glass rounded-full px-3 py-1.5">
                          <MapPin size={12} className="text-orange-400" /> {event.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-xs text-gray-400 glass rounded-full px-3 py-1.5">
                        <Users size={12} className="text-orange-400" />
                        {event.attendee_count}{event.max_attendees ? `/${event.max_attendees}` : ''} going
                      </span>
                    </div>
                  </div>
                  {!isPast && (
                    <button
                      onClick={() => handleRsvp(event.id)}
                      disabled={rsvpd.has(event.id)}
                      className={`px-5 py-2.5 rounded-2xl text-sm font-bold flex-shrink-0 transition-all duration-200 ${
                        rsvpd.has(event.id)
                          ? 'glass text-emerald-400 border-emerald-500/20'
                          : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-lg hover:shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                    >
                      {rsvpd.has(event.id) ? <span className="flex items-center gap-1.5"><Check size={14} /> Going</span> : 'RSVP'}
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
