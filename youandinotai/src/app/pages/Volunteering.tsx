import { useEffect, useState } from 'react';
import { HandHeart, MapPin, Calendar, Users, Plus, Check, Heart } from 'lucide-react';
import { api } from '../../lib/api';

interface VolunteerData {
  id: string;
  created_by: string;
  title: string;
  organization: string;
  description: string;
  location: string | null;
  event_date: string | null;
  spots: number | null;
  signup_count: number;
  created_at: string;
}

export function Volunteering() {
  const [opportunities, setOpportunities] = useState<VolunteerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [spots, setSpots] = useState('');
  const [signedUp, setSignedUp] = useState<Set<string>>(new Set());

  const load = () => {
    api.get<VolunteerData[]>('/volunteer').then(setOpportunities).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!title.trim() || !organization.trim() || !description.trim()) return;
    await api.post('/volunteer', {
      title, organization, description,
      location: location || null,
      event_date: eventDate ? new Date(eventDate).toISOString() : null,
      spots: spots ? parseInt(spots) : null,
    });
    setTitle(''); setOrganization(''); setDescription(''); setLocation(''); setEventDate(''); setSpots('');
    setShowCreate(false);
    load();
  };

  const signup = async (id: string) => {
    try {
      await api.post(`/volunteer/${id}/signup`);
      setSignedUp((prev) => new Set(prev).add(id));
      load();
    } catch { /* already signed up or full */ }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-4">
            <HandHeart size={24} className="text-emerald-400 animate-pulse" />
          </div>
          <p className="text-gray-400 font-medium">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Volunteering</h1>
          <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1">
            Make a difference <Heart size={12} className="text-pink-400" fill="currentColor" />
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl text-white text-sm font-bold hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <Plus size={16} /> Create Opportunity
        </button>
      </div>

      {showCreate && (
        <div className="glass-strong rounded-3xl p-6 glass-highlight mb-6 space-y-4 animate-scale-in">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Opportunity title" className="w-full px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/40 input-glow transition-all duration-300" />
          <input value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Organization name" className="w-full px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/40 input-glow transition-all duration-300" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the volunteer opportunity" rows={3} className="w-full px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/40 input-glow transition-all duration-300 resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/40 input-glow transition-all duration-300" />
            <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white focus:outline-none focus:border-emerald-500/40 input-glow transition-all duration-300" />
          </div>
          <input type="number" value={spots} onChange={(e) => setSpots(e.target.value)} placeholder="Available spots (optional)" className="w-full px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/40 input-glow transition-all duration-300" />
          <button onClick={create} className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl text-white text-sm font-bold hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-200">Create</button>
        </div>
      )}

      {opportunities.length === 0 ? (
        <div className="text-center py-20 animate-scale-in">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/20 animate-float">
            <HandHeart size={44} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">No Opportunities Yet</h2>
          <p className="text-gray-400 max-w-sm mx-auto">Start one and make a difference!</p>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {opportunities.map((opp) => (
            <div key={opp.id} className="glass rounded-3xl p-6 glass-highlight hover:bg-white/[0.04] transition-all duration-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-lg">{opp.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-emerald-400 text-sm font-semibold">{opp.organization}</span>
                  </div>
                  <p className="text-gray-400 text-sm mt-2 leading-relaxed">{opp.description}</p>
                  <div className="flex flex-wrap gap-3 mt-4">
                    {opp.event_date && (
                      <span className="flex items-center gap-1.5 text-xs text-gray-400 glass rounded-full px-3 py-1.5">
                        <Calendar size={12} className="text-emerald-400" />
                        {new Date(opp.event_date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    {opp.location && (
                      <span className="flex items-center gap-1.5 text-xs text-gray-400 glass rounded-full px-3 py-1.5">
                        <MapPin size={12} className="text-emerald-400" /> {opp.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-xs text-gray-400 glass rounded-full px-3 py-1.5">
                      <Users size={12} className="text-emerald-400" />
                      {opp.signup_count}{opp.spots ? `/${opp.spots}` : ''} signed up
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => signup(opp.id)}
                  disabled={signedUp.has(opp.id)}
                  className={`px-5 py-2.5 rounded-2xl text-sm font-bold flex-shrink-0 transition-all duration-200 ${
                    signedUp.has(opp.id)
                      ? 'glass text-emerald-400 border-emerald-500/20'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {signedUp.has(opp.id) ? <span className="flex items-center gap-1.5"><Check size={14} /> Signed Up</span> : 'Sign Up'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
