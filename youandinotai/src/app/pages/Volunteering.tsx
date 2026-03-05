import { useEffect, useState } from 'react';
import { HandHeart, MapPin, Calendar, Users, Plus, Check } from 'lucide-react';
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
    return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400 animate-pulse">Loading opportunities...</div></div>;
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-white">Volunteering</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 rounded-full text-white text-sm font-bold"
        >
          <Plus size={16} /> Create Opportunity
        </button>
      </div>

      {showCreate && (
        <div className="bg-gray-800 rounded-2xl p-6 border border-white/10 mb-6 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Opportunity title" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
          <input value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Organization name" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the volunteer opportunity" rows={3} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
            <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <input type="number" value={spots} onChange={(e) => setSpots(e.target.value)} placeholder="Available spots (optional)" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
          <button onClick={create} className="px-6 py-2 bg-emerald-500 rounded-full text-white text-sm font-bold">Create</button>
        </div>
      )}

      {opportunities.length === 0 ? (
        <div className="text-center py-16">
          <HandHeart size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No volunteer opportunities yet. Start one and make a difference!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => (
            <div key={opp.id} className="bg-gray-800/50 rounded-2xl p-6 border border-white/5 hover:border-emerald-500/20 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">{opp.title}</h3>
                  <p className="text-emerald-400 text-sm font-medium">{opp.organization}</p>
                  <p className="text-gray-400 text-sm mt-2">{opp.description}</p>
                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                    {opp.event_date && <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(opp.event_date).toLocaleDateString()}</span>}
                    {opp.location && <span className="flex items-center gap-1"><MapPin size={12} /> {opp.location}</span>}
                    <span className="flex items-center gap-1"><Users size={12} /> {opp.signup_count}{opp.spots ? `/${opp.spots}` : ''} signed up</span>
                  </div>
                </div>
                <button
                  onClick={() => signup(opp.id)}
                  disabled={signedUp.has(opp.id)}
                  className={`px-4 py-2 rounded-full text-sm font-bold flex-shrink-0 ${
                    signedUp.has(opp.id)
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-emerald-500 text-white hover:scale-105 transition-transform'
                  }`}
                >
                  {signedUp.has(opp.id) ? <><Check size={14} /> Signed Up</> : 'Sign Up'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
