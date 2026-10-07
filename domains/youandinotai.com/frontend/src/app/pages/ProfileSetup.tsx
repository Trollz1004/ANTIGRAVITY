import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  Camera,
  Check,
  MapPin,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import { calculateAgeUtc, formatDateInput, toIsoDate } from '../../lib/ageGate';

const INTEREST_OPTIONS = [
  'Travel', 'Music', 'Cooking', 'Fitness', 'Reading', 'Gaming', 'Art', 'Photography', 'Hiking', 'Movies',
  'Dancing', 'Volunteering', 'Animals', 'Technology', 'Sports', 'Yoga', 'Coffee', 'Wine', 'Intentional Dating',
  'Verified Profiles', 'Coffee Dates', 'Live Events', 'Clear Communication', 'Safety First',
];

export function ProfileSetup() {
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [location, setLocation] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [promptAnswer, setPromptAnswer] = useState('');
  const [dateComfort, setDateComfort] = useState('');
  const [safetyPreference, setSafetyPreference] = useState('');

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : prev.length < 10
          ? [...prev, interest]
          : prev
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const birthDateIso = dateOfBirth ? toIsoDate(dateOfBirth) : null;
    if (dateOfBirth && !birthDateIso) {
      setError('Enter date of birth as MM / DD / YYYY');
      return;
    }
    if (birthDateIso && calculateAgeUtc(birthDateIso) < 18) {
      setError('YouAndINotAI is strictly 18+ only');
      return;
    }

    const derivedAge = birthDateIso ? calculateAgeUtc(birthDateIso) : null;
    setLoading(true);
    try {
      const profileBio = [
        bio,
        promptAnswer ? `Prompt: ${promptAnswer}` : '',
        dateComfort ? `Date comfort: ${dateComfort}` : '',
        safetyPreference ? `Safety preference: ${safetyPreference}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      await api.put('/profiles/me', {
        display_name: user?.display_name || null,
        bio: profileBio || null,
        age: age ? parseInt(age, 10) : derivedAge,
        date_of_birth: birthDateIso,
        gender: gender || null,
        looking_for: lookingFor || null,
        location: location || null,
        interests: selectedInterests,
      });
      await fetchUser();
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-600/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-stone-600/20 blur-[150px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-5xl mx-auto"
      >
        <div className="mb-10 grid gap-6 md:grid-cols-[1.15fr_0.85fr] md:items-end">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-3 drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">Profile Setup</div>
            <h1 className="text-5xl font-black tracking-tight mb-4">tell people who you are.</h1>
            <p className="text-white/60 text-lg max-w-2xl">
              Build the real profile before you start matching. Keep it specific, human, and useful to someone deciding whether to say hi.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl p-6 shadow-2xl">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Current account</div>
            <p className="text-xl font-black uppercase tracking-tight text-white">
              {user?.display_name}
            </p>
            <p className="mt-3 text-sm text-white/50 leading-relaxed">
              This profile becomes the public side of your account inside discover, matches, and boards.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-red-500/50 bg-red-500/10 backdrop-blur-md px-6 py-4 text-sm font-bold text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              {error}
            </motion.div>
          )}

          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl">
            <div className="grid gap-8">
              <div className="grid gap-4 rounded-3xl border border-white/5 bg-white/5 p-6 md:grid-cols-3">
                {[
                  { icon: ShieldCheck, title: 'Verify first', desc: 'The best feed starts with a visible verification state.', color: 'text-stone-400' },
                  { icon: Sparkles, title: 'Prompt first', desc: 'Make it easy for someone to comment on something specific.', color: 'text-amber-400' },
                  { icon: CalendarCheck, title: 'Plan safely', desc: 'Share a first-date comfort level before chat turns into a plan.', color: 'text-violet-400' }
                ].map((item, i) => (
                  <div key={i} className="group">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm transition-all group-hover:scale-110 group-hover:bg-white/10">
                      <item.icon size={24} className={item.color} />
                    </div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-white mb-2">{item.title}</h2>
                    <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 block">About You</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="What makes you you?"
                  maxLength={500}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all backdrop-blur-sm"
                />
                <div className="mt-2 text-right text-xs font-bold uppercase tracking-widest text-white/30">
                  {bio.length}/500
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 block">Profile Prompt</label>
                <textarea
                  value={promptAnswer}
                  onChange={e => setPromptAnswer(e.target.value)}
                  placeholder="Example: My ideal first date is coffee, a bookstore, and no pressure to perform."
                  maxLength={220}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all backdrop-blur-sm"
                />
                <div className="mt-2 text-right text-xs font-bold uppercase tracking-widest text-white/30">
                  {promptAnswer.length}/220
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 block">Date of Birth</label>
                  <input
                    type="text"
                    value={dateOfBirth}
                    onChange={e => setDateOfBirth(formatDateInput(e.target.value))}
                    inputMode="numeric"
                    maxLength={14}
                    placeholder="MM / DD / YYYY"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all backdrop-blur-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 block">Age</label>
                  <input
                    type="number"
                    min={18}
                    max={120}
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    placeholder="18+"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all backdrop-blur-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 block">Gender</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all backdrop-blur-sm appearance-none"
                  >
                    <option value="" className="bg-gray-900">Select...</option>
                    <option value="male" className="bg-gray-900">Male</option>
                    <option value="female" className="bg-gray-900">Female</option>
                    <option value="nonbinary" className="bg-gray-900">Non-binary</option>
                    <option value="other" className="bg-gray-900">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 block">Looking For</label>
                  <select
                    value={lookingFor}
                    onChange={e => setLookingFor(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all backdrop-blur-sm appearance-none"
                  >
                    <option value="" className="bg-gray-900">Select...</option>
                    <option value="relationship" className="bg-gray-900">Relationship</option>
                    <option value="friends" className="bg-gray-900">Friends</option>
                    <option value="casual" className="bg-gray-900">Something casual</option>
                    <option value="unsure" className="bg-gray-900">Not sure yet</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 block">Date Comfort</label>
                  <select
                    value={dateComfort}
                    onChange={e => setDateComfort(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all backdrop-blur-sm appearance-none"
                  >
                    <option value="" className="bg-gray-900">Select...</option>
                    <option value="Public coffee or daytime walk first" className="bg-gray-900">Public coffee or daytime walk first</option>
                    <option value="Dinner after a short chat" className="bg-gray-900">Dinner after a short chat</option>
                    <option value="Group or event meetup first" className="bg-gray-900">Group or event meetup first</option>
                    <option value="Video chat before meeting" className="bg-gray-900">Video chat before meeting</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
                    <MapPin size={16} />
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="City, State"
                    maxLength={200}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all backdrop-blur-sm"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
                    <ShieldCheck size={16} />
                    Safety Preference
                  </label>
                  <select
                    value={safetyPreference}
                    onChange={e => setSafetyPreference(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all backdrop-blur-sm appearance-none"
                  >
                    <option value="" className="bg-gray-900">Select...</option>
                    <option value="Share date details before meeting" className="bg-gray-900">Share date details before meeting</option>
                    <option value="Keep first meetings public" className="bg-gray-900">Keep first meetings public</option>
                    <option value="Use chat check-in before plans" className="bg-gray-900">Use chat check-in before plans</option>
                    <option value="Only match with verified profiles" className="bg-gray-900">Only match with verified profiles</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-400">
                <Sparkles size={16} />
                Interests
              </label>
              <span className="text-xs font-bold uppercase tracking-widest text-white/30">
                {selectedInterests.length}/10 selected
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {INTEREST_OPTIONS.map(interest => {
                const active = selectedInterests.includes(interest);
                return (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-bold transition-colors ${
                      active
                        ? 'border-amber-500 bg-amber-500/20 text-amber-100 shadow-[0_0_15px_rgba(217,70,239,0.3)]'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {active && <Check size={14} />}
                    {interest}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-white/40 max-w-md leading-relaxed">
              Save the real profile first. Photos, matching, and verification become more useful once the basics are filled in.
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-stone-600 px-8 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-[0_0_30px_rgba(217,70,239,0.4)] disabled:opacity-50 transition-opacity"
            >
              {loading ? (
                'Saving...'
              ) : (
                <>
                  <Camera size={20} /> Save Profile
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

