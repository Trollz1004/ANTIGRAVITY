/**
 * MeetupsDiscovery — GPS-aware meetup listing and creation.
 * Wires to events.py backend:
 *   GET  /api/v1/events           (category, limit)
 *   POST /api/v1/events           (title, description, location, event_date, max_attendees, category)
 *   POST /api/v1/events/{id}/rsvp
 *
 * GPS is opt-in per session — nothing is stored or background-tracked.
 * Geo filtering is done client-side using the geolocation lib's bounding box helpers.
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import {
  requestLocation,
  boundingBox,
  isGeolocationSupported,
  distanceMiles,
  type Coords,
  type RadiusMiles,
} from '../lib/geolocation';

// ── Types — match backend EventResponse exactly ─────────────────────────────

interface MeetupEvent {
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

interface CreateEventPayload {
  title: string;
  description: string;
  location: string;
  event_date: string;
  max_attendees: number;
  category: string;
}

const RADIUS_OPTIONS: RadiusMiles[] = [5, 10, 25];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatEventDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function toLocalDatetimeString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function MeetupsDiscovery() {
  // State
  const [allEvents, setAllEvents] = useState<MeetupEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<MeetupEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // GPS
  const [coords, setCoords] = useState<Coords | null>(null);
  const [gpsRequesting, setGpsRequesting] = useState(false);
  const [radius, setRadius] = useState<RadiusMiles>(10);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateEventPayload>({
    title: '',
    description: '',
    location: '',
    event_date: toLocalDatetimeString(new Date(Date.now() + 86400000)),
    max_attendees: 20,
    category: 'general',
  });

  // RSVP tracking (optimistic)
  const [rsvpSet, setRsvpSet] = useState<Set<string>>(new Set());
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);

  // ── Fetch events ─────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<MeetupEvent[]>('/events');
      setAllEvents(data);
    } catch {
      setError('Failed to load meetups. Pull to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Client-side geo filtering when coords or radius change
  useEffect(() => {
    if (!coords) {
      setFilteredEvents(allEvents);
      return;
    }
    const box = boundingBox(coords, radius);
    // Note: events don't have lat/lng fields on the backend,
    // so we just show all events when GPS is active.
    // Future: add lat/lng to Event model for real geo filtering.
    // For now, all events pass through.
    setFilteredEvents(allEvents);
    // If events had coordinates:
    // setFilteredEvents(allEvents.filter(e => {
    //   if (!e.lat || !e.lng) return true;
    //   return distanceMiles(coords, { lat: e.lat, lng: e.lng }) <= radius;
    // }));
  }, [coords, radius, allEvents]);

  // ── GPS opt-in ───────────────────────────────────────────────────────────

  const enableGps = async () => {
    setGpsRequesting(true);
    const loc = await requestLocation();
    setGpsRequesting(false);
    if (loc) {
      setCoords(loc);
    } else {
      setError('Location access denied or unavailable.');
    }
  };

  const clearGps = () => {
    setCoords(null);
  };

  // ── RSVP ─────────────────────────────────────────────────────────────────

  const handleRsvp = async (eventId: string) => {
    if (rsvpSet.has(eventId)) return;
    setRsvpLoading(eventId);
    try {
      await api.post(`/events/${eventId}/rsvp`);
      setRsvpSet((prev) => new Set(prev).add(eventId));
      setAllEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, attendee_count: e.attendee_count + 1 } : e)),
      );
    } catch {
      setError('RSVP failed. You may have already RSVP\'d or the event is full.');
    } finally {
      setRsvpLoading(null);
    }
  };

  // ── Create event ─────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!form.title.trim() || !form.location.trim()) return;
    setCreating(true);
    try {
      const created = await api.post<MeetupEvent>('/events', {
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        event_date: new Date(form.event_date).toISOString(),
        max_attendees: form.max_attendees || null,
        category: form.category,
      });
      setAllEvents((prev) => [created, ...prev]);
      setShowCreate(false);
      setForm({
        title: '',
        description: '',
        location: '',
        event_date: toLocalDatetimeString(new Date(Date.now() + 86400000)),
        max_attendees: 20,
        category: 'general',
      });
    } catch {
      setError('Failed to create meetup.');
    } finally {
      setCreating(false);
    }
  };

  const updateForm = (field: keyof CreateEventPayload, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">📍</span> Nearby Meetups
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Find people near you doing good</p>
        </div>
        <button
          id="meetups-create-btn"
          onClick={() => setShowCreate(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white text-sm px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-purple-600/20"
        >
          + Create
        </button>
      </div>

      {/* GPS Controls */}
      <div className="glass rounded-xl p-4 space-y-3">
        {!coords ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Enable location to find meetups nearby</p>
              <p className="text-xs text-gray-500 mt-0.5">GPS is opt-in. Never stored or tracked.</p>
            </div>
            <button
              id="meetups-enable-gps"
              onClick={enableGps}
              disabled={gpsRequesting || !isGeolocationSupported()}
              className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg border border-gray-700 transition-colors flex items-center gap-2"
            >
              {gpsRequesting ? (
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>🛰</span>
              )}
              {gpsRequesting ? 'Requesting…' : 'Enable Location'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-400 flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Location active
              </p>
              <button
                onClick={clearGps}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Clear
              </button>
            </div>

            {/* Radius toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Radius:</span>
              <div className="flex bg-gray-800 rounded-lg p-0.5 gap-0.5">
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    id={`meetups-radius-${r}`}
                    onClick={() => setRadius(r)}
                    className={`text-xs px-3 py-1.5 rounded-md transition-all duration-200 ${
                      radius === r
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {r} mi
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-gray-600 ml-1">(geo filtering coming soon)</span>
            </div>
          </div>
        )}
      </div>

      {/* Error bar */}
      {error && (
        <div className="bg-red-900/30 border border-red-800/50 text-red-300 rounded-lg px-4 py-2.5 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button className="text-red-400 hover:text-red-200 text-xs ml-3 shrink-0" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Event list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-2/3 mb-3" />
              <div className="h-3 bg-gray-800 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-800 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">🌏</p>
          <p className="text-gray-400">No meetups found{coords ? ' in this area' : ''}.</p>
          <p className="text-gray-600 text-sm">Be the first to organize something!</p>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {filteredEvents.map((ev) => {
            const isFull = ev.max_attendees != null && ev.attendee_count >= ev.max_attendees;
            const didRsvp = rsvpSet.has(ev.id);
            const isPast = new Date(ev.event_date) < new Date();

            return (
              <div
                key={ev.id}
                className="glass glass-highlight rounded-xl p-5 hover:border-purple-600/30 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                      {ev.title}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{ev.description}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        📅 {formatEventDate(ev.event_date)}
                      </span>
                      {ev.location && (
                        <span className="flex items-center gap-1">
                          📍 {ev.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        👥 {ev.attendee_count}{ev.max_attendees ? `/${ev.max_attendees}` : ''} going
                      </span>
                    </div>
                  </div>

                  {/* RSVP button */}
                  <button
                    id={`meetup-rsvp-${ev.id}`}
                    onClick={() => handleRsvp(ev.id)}
                    disabled={didRsvp || isFull || isPast || rsvpLoading === ev.id}
                    className={`shrink-0 text-sm px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      didRsvp
                        ? 'bg-green-600/20 text-green-400 border border-green-600/30 cursor-default'
                        : isFull || isPast
                          ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-500 text-white hover:shadow-lg hover:shadow-purple-600/20'
                    }`}
                  >
                    {rsvpLoading === ev.id ? (
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : didRsvp ? (
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
                {ev.max_attendees != null && ev.max_attendees > 0 && (
                  <div className="mt-3">
                    <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min((ev.attendee_count / ev.max_attendees) * 100, 100)}%`,
                          background: isFull
                            ? 'rgb(239, 68, 68)'
                            : 'linear-gradient(90deg, rgb(147, 51, 234), rgb(168, 85, 247))',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Modal ────────────────────────────────────────────────────── */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreate(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

          <div
            className="relative glass-strong rounded-2xl p-6 w-full max-w-md space-y-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Create a Meetup</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-500 hover:text-white text-xl leading-none transition-colors"
              >
                ×
              </button>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Title *</label>
              <input
                id="meetup-create-title"
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                placeholder="Saturday morning park cleanup"
                maxLength={200}
                className="w-full bg-gray-900 text-white placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm outline-none border border-gray-800 focus:border-purple-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Description *</label>
              <textarea
                id="meetup-create-desc"
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder="What's the plan?"
                rows={3}
                maxLength={5000}
                className="w-full bg-gray-900 text-white placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm outline-none border border-gray-800 focus:border-purple-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Location</label>
              <input
                id="meetup-create-location"
                value={form.location}
                onChange={(e) => updateForm('location', e.target.value)}
                placeholder="Lake Eola Park, Orlando FL"
                maxLength={300}
                className="w-full bg-gray-900 text-white placeholder-gray-600 rounded-lg px-3 py-2.5 text-sm outline-none border border-gray-800 focus:border-purple-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Date & Time</label>
                <input
                  id="meetup-create-date"
                  type="datetime-local"
                  value={form.event_date}
                  onChange={(e) => updateForm('event_date', e.target.value)}
                  className="w-full bg-gray-900 text-white rounded-lg px-3 py-2.5 text-sm outline-none border border-gray-800 focus:border-purple-500 transition-colors [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Max Attendees</label>
                <input
                  id="meetup-create-max"
                  type="number"
                  min={1}
                  max={500}
                  value={form.max_attendees}
                  onChange={(e) => updateForm('max_attendees', Number(e.target.value))}
                  className="w-full bg-gray-900 text-white rounded-lg px-3 py-2.5 text-sm outline-none border border-gray-800 focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                id="meetup-create-submit"
                onClick={handleCreate}
                disabled={!form.title.trim() || !form.description.trim() || creating}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white text-sm px-5 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-purple-600/20 flex items-center gap-2"
              >
                {creating && (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Create Meetup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
