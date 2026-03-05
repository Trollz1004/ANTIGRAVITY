import { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, Plus, Check } from 'lucide-react';
import { api } from '../../lib/api';

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
    return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400 animate-pulse">Loading events...</div></div>;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Events & Meetups</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 rounded-full text-white text-sm font-bold"
        >
          <Plus size={16} /> Create Event
        </button>
      </div>

      {showCreate && (
        <div className="bg-gray-800 rounded-2xl p-6 border border-white/10 mb-6 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this event about?" rows={3} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
            <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500" />
          </div>
          <input type="number" value={maxAttendees} onChange={(e) => setMaxAttendees(e.target.value)} placeholder="Max attendees (optional)" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
          <button onClick={createEvent} className="px-6 py-2 bg-orange-500 rounded-full text-white text-sm font-bold">Create Event</button>
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-16">
          <Calendar size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No events yet. Create one and bring people together!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="bg-gray-800/50 rounded-2xl p-6 border border-white/5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">{event.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{event.description}</p>
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(event.event_date).toLocaleDateString()}</span>
                    {event.location && <span className="flex items-center gap-1"><MapPin size={12} /> {event.location}</span>}
                    <span className="flex items-center gap-1"><Users size={12} /> {event.attendee_count}{event.max_attendees ? `/${event.max_attendees}` : ''} going</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRsvp(event.id)}
                  disabled={rsvpd.has(event.id)}
                  className={`px-4 py-2 rounded-full text-sm font-bold flex-shrink-0 ${
                    rsvpd.has(event.id)
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-orange-500 text-white hover:scale-105 transition-transform'
                  }`}
                >
                  {rsvpd.has(event.id) ? <><Check size={14} /> Going</> : 'RSVP'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
