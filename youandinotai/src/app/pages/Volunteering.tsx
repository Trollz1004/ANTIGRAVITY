import { useEffect, useState } from 'react';
import { HandHeart, MapPin, Calendar, Users, Plus, Check, Heart, Clock, Award, Building2, TrendingUp } from 'lucide-react';
import { api } from '../../lib/api';

interface VolunteerData {
  id: string;
  created_by: string;
  creator_name: string;
  title: string;
  organization: string;
  description: string;
  location: string | null;
  category: string;
  hours_estimate: number | null;
  event_date: string | null;
  spots: number | null;
  signup_count: number;
  created_at: string;
}

interface ImpactData {
  total_opportunities: number;
  total_signups: number;
  total_hours_committed: number;
  unique_organizations: number;
  unique_volunteers: number;
  category_breakdown: Record<string, number>;
  top_organizations: { name: string; signups: number; hours: number }[];
  local_opportunities: number;
}

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'children', label: 'Children' },
  { value: 'elderly', label: 'Elderly Care' },
  { value: 'environment', label: 'Environment' },
  { value: 'animals', label: 'Animals' },
  { value: 'food_bank', label: 'Food Bank' },
  { value: 'education', label: 'Education' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'disaster_relief', label: 'Disaster Relief' },
  { value: 'community', label: 'Community' },
];

const CATEGORY_COLORS: Record<string, string> = {
  children: 'from-pink-500 to-rose-500',
  elderly: 'from-amber-500 to-orange-500',
  environment: 'from-emerald-500 to-green-500',
  animals: 'from-cyan-500 to-teal-500',
  food_bank: 'from-yellow-500 to-amber-500',
  education: 'from-blue-500 to-indigo-500',
  healthcare: 'from-red-500 to-pink-500',
  disaster_relief: 'from-orange-500 to-red-500',
  community: 'from-purple-500 to-violet-500',
  general: 'from-gray-500 to-gray-600',
};

export function Volunteering() {
  const [opportunities, setOpportunities] = useState<VolunteerData[]>([]);
  const [impact, setImpact] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('general');
  const [hoursEstimate, setHoursEstimate] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [spots, setSpots] = useState('');
  const [signedUp, setSignedUp] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const load = async () => {
    const params = new URLSearchParams();
    if (filterCategory) params.set('category', filterCategory);
    const url = `/volunteer${params.toString() ? `?${params}` : ''}`;
    const [opps, impactData] = await Promise.all([
      api.get<VolunteerData[]>(url),
      api.get<ImpactData>('/volunteer/impact'),
    ]);
    setOpportunities(opps);
    setImpact(impactData);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filterCategory]);

  const create = async () => {
    if (!title.trim() || !organization.trim() || !description.trim()) return;
    await api.post('/volunteer', {
      title, organization, description,
      location: location || null,
      category,
      hours_estimate: hoursEstimate ? parseFloat(hoursEstimate) : null,
      event_date: eventDate ? new Date(eventDate).toISOString() : null,
      spots: spots ? parseInt(spots) : null,
    });
    setTitle(''); setOrganization(''); setDescription(''); setLocation('');
    setCategory('general'); setHoursEstimate(''); setEventDate(''); setSpots('');
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Volunteering Hub</h1>
          <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1">
            Local charity impact <Heart size={12} className="text-pink-400" fill="currentColor" />
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl text-white text-sm font-bold hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <Plus size={16} /> Create Opportunity
        </button>
      </div>

      {/* Impact Dashboard */}
      {impact && (
        <div className="glass-strong rounded-3xl p-6 glass-highlight mb-6 animate-scale-in">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-400" />
            Community Impact
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <div className="glass rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-white">{impact.total_signups}</div>
              <div className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                <Users size={10} /> Volunteers
              </div>
            </div>
            <div className="glass rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-emerald-400">{Math.round(impact.total_hours_committed)}</div>
              <div className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                <Clock size={10} /> Hours Given
              </div>
            </div>
            <div className="glass rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-purple-400">{impact.unique_organizations}</div>
              <div className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                <Building2 size={10} /> Organizations
              </div>
            </div>
            <div className="glass rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-amber-400">{impact.total_opportunities}</div>
              <div className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                <Award size={10} /> Opportunities
              </div>
            </div>
          </div>

          {/* Top organizations */}
          {impact.top_organizations.length > 0 && (
            <div>
              <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Top Organizations</h3>
              <div className="space-y-2">
                {impact.top_organizations.map((org, i) => (
                  <div key={org.name} className="flex items-center justify-between glass rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <span className="text-white text-sm font-medium">{org.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{org.signups} signups</span>
                      {org.hours > 0 && <span>{Math.round(org.hours)}h</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-6 animate-fade-in">
        <button
          onClick={() => setFilterCategory(null)}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 ${
            !filterCategory
              ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/20'
              : 'glass text-gray-400 hover:text-white'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilterCategory(cat.value === filterCategory ? null : cat.value)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 ${
              filterCategory === cat.value
                ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/20'
                : 'glass text-gray-400 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="glass-strong rounded-3xl p-6 glass-highlight mb-6 space-y-4 animate-scale-in">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Opportunity title" className="w-full px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/40 input-glow transition-all duration-300" />
          <input value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Organization name" className="w-full px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/40 input-glow transition-all duration-300" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the volunteer opportunity" rows={3} className="w-full px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/40 input-glow transition-all duration-300 resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (city, state)" className="px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/40 input-glow transition-all duration-300" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white focus:outline-none focus:border-emerald-500/40 transition-all duration-300 appearance-none">
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} className="bg-gray-900">{cat.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input type="number" step="0.5" min="0.5" value={hoursEstimate} onChange={(e) => setHoursEstimate(e.target.value)} placeholder="Est. hours" className="px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/40 input-glow transition-all duration-300" />
            <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white focus:outline-none focus:border-emerald-500/40 transition-all duration-300" />
            <input type="number" value={spots} onChange={(e) => setSpots(e.target.value)} placeholder="Spots" className="px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/40 input-glow transition-all duration-300" />
          </div>
          <button onClick={create} className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl text-white text-sm font-bold hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-200">Create</button>
        </div>
      )}

      {/* Opportunity list */}
      {opportunities.length === 0 ? (
        <div className="text-center py-20 animate-scale-in">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/20 animate-float">
            <HandHeart size={44} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">No Opportunities Yet</h2>
          <p className="text-gray-400 max-w-sm mx-auto">Start one and make a difference in your community!</p>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {opportunities.map((opp) => {
            const gradient = CATEGORY_COLORS[opp.category] || CATEGORY_COLORS.general;
            return (
              <div key={opp.id} className="glass rounded-3xl p-6 glass-highlight hover:bg-white/[0.04] transition-all duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-bold text-lg">{opp.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${gradient}`}>
                        {CATEGORIES.find(c => c.value === opp.category)?.label || opp.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-emerald-400 text-sm font-semibold">{opp.organization}</span>
                      {opp.creator_name && <span className="text-gray-600 text-xs">by {opp.creator_name}</span>}
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
                      {opp.hours_estimate && (
                        <span className="flex items-center gap-1.5 text-xs text-gray-400 glass rounded-full px-3 py-1.5">
                          <Clock size={12} className="text-emerald-400" /> {opp.hours_estimate}h
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
            );
          })}
        </div>
      )}
    </div>
  );
}
