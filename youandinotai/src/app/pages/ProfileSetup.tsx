import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Check, MapPin, Sparkles, User } from 'lucide-react';

import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import { calculateAgeUtc, formatDateInput, toIsoDate } from '../../lib/ageGate';

const INTEREST_OPTIONS = [
  'Travel', 'Music', 'Cooking', 'Fitness', 'Reading', 'Gaming',
  'Art', 'Photography', 'Hiking', 'Movies', 'Dancing', 'Volunteering',
  'Animals', 'Technology', 'Sports', 'Yoga', 'Coffee', 'Wine',
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

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < 10 ? [...prev, interest] : prev,
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
      await api.put('/profiles/me', {
        display_name: user?.display_name || null,
        bio: bio || null,
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
    <div className="app-page">
      <div className="app-page-inner max-w-5xl animate-scale-in">
        <div className="mb-8 grid gap-4 md:grid-cols-[1.15fr_0.85fr] md:items-end">
          <div>
            <div className="app-kicker mb-3">Profile Setup</div>
            <h1 className="app-title">tell people who you are.</h1>
            <p className="app-subtitle mt-4 max-w-2xl">
              Build the real profile before you start matching. Keep it specific, human, and useful to someone deciding whether to say hi.
            </p>
          </div>
          <div className="glass rounded-[1.6rem] p-5">
            <div className="app-panel-title mb-3">Current account</div>
            <p className="text-lg font-black uppercase tracking-[-0.06em] text-[#111111]">{user?.display_name}</p>
            <p className="mt-2 text-sm font-medium text-[#5c594f]">
              This profile becomes the public side of your account inside discover, matches, and boards.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-[1.4rem] border-4 border-[#111111] bg-[#ffd9c7] px-4 py-3 text-sm font-semibold text-[#111111]">
              {error}
            </div>
          )}

          <div className="glass-strong glass-highlight rounded-[2rem] p-6 md:p-8">
            <div className="grid gap-5">
              <div>
                <label className="app-panel-title mb-3 block">About You</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="What makes you you?"
                  maxLength={500}
                  rows={4}
                  className="app-textarea input-glow"
                />
                <div className="mt-2 text-right text-xs font-bold uppercase tracking-[0.16em] text-[#5c594f]">
                  {bio.length}/500
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="app-panel-title mb-3 block">Date of Birth</label>
                  <input
                    type="text"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(formatDateInput(e.target.value))}
                    inputMode="numeric"
                    maxLength={14}
                    placeholder="MM / DD / YYYY"
                    className="app-input input-glow"
                  />
                </div>
                <div>
                  <label className="app-panel-title mb-3 block">Age</label>
                  <input
                    type="number"
                    min={18}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="18+"
                    className="app-input input-glow"
                  />
                </div>
                <div>
                  <label className="app-panel-title mb-3 block">Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)} className="app-select input-glow">
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="nonbinary">Non-binary</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="app-panel-title mb-3 block">Looking For</label>
                  <select value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} className="app-select input-glow">
                    <option value="">Select...</option>
                    <option value="relationship">Relationship</option>
                    <option value="friends">Friends</option>
                    <option value="casual">Something casual</option>
                    <option value="unsure">Not sure yet</option>
                  </select>
                </div>
                <div>
                  <label className="app-panel-title mb-3 flex items-center gap-2">
                    <MapPin size={15} className="text-[#ff4f00]" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, State"
                    maxLength={200}
                    className="app-input input-glow"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-strong glass-highlight rounded-[2rem] p-6 md:p-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <label className="app-panel-title flex items-center gap-2">
                <Sparkles size={15} className="text-[#ff4f00]" />
                Interests
              </label>
              <span className="text-xs font-black uppercase tracking-[0.16em] text-[#5c594f]">
                {selectedInterests.length}/10 selected
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {INTEREST_OPTIONS.map((interest) => {
                const active = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`inline-flex items-center gap-2 rounded-full border-[3px] px-4 py-2 text-sm font-bold transition-all ${
                      active
                        ? 'border-[#111111] bg-[#111111] text-white shadow-[4px_4px_0_0_rgba(17,17,17,1)]'
                        : 'border-[#111111] bg-white text-[#111111] shadow-[4px_4px_0_0_rgba(17,17,17,1)]'
                    }`}
                    style={{
                      color: active ? '#ffffff' : '#111111',
                      backgroundColor: active ? '#111111' : '#ffffff',
                    }}
                  >
                    {active && <Check size={14} />}
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="app-surface-note">
              Save the real profile first. Photos, matching, and verification become more useful once the basics are filled in.
            </div>
            <button type="submit" disabled={loading} className="app-button-dark px-6 py-4 disabled:opacity-60">
              {loading ? 'Saving...' : (
                <>
                  <Camera size={18} /> Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
