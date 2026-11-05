import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  Camera,
  Check,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { useAuth } from '../../lib/auth';
import { api } from '../../lib/api';
import { calculateAgeUtc, formatDateInput, toIsoDate } from '../../lib/ageGate';

interface SavedProfileResponse {
  user_id: string;
  display_name: string;
  bio: string | null;
  age: number | null;
  gender: string | null;
  looking_for: string | null;
  location: string | null;
  photos: string[];
  interests: string[];
  verified: boolean;
}

function parseStructuredBio(rawBio: string | null): {
  bio: string;
  promptAnswer: string;
  dateComfort: string;
  safetyPreference: string;
} {
  if (!rawBio) {
    return { bio: '', promptAnswer: '', dateComfort: '', safetyPreference: '' };
  }
  let promptAnswer = '';
  let dateComfort = '';
  let safetyPreference = '';
  const bioParts: string[] = [];

  for (const block of rawBio.split(/\n\n+/)) {
    const trimmed = block.trim();
    if (trimmed.startsWith('Prompt: ')) {
      promptAnswer = trimmed.slice('Prompt: '.length).trim();
    } else if (trimmed.startsWith('Date comfort: ')) {
      dateComfort = trimmed.slice('Date comfort: '.length).trim();
    } else if (trimmed.startsWith('Safety preference: ')) {
      safetyPreference = trimmed.slice('Safety preference: '.length).trim();
    } else if (trimmed) {
      bioParts.push(trimmed);
    }
  }

  return {
    bio: bioParts.join('\n\n'),
    promptAnswer,
    dateComfort,
    safetyPreference,
  };
}

const INTEREST_OPTIONS = [
  'Travel',
  'Music',
  'Cooking',
  'Fitness',
  'Reading',
  'Gaming',
  'Art',
  'Photography',
  'Hiking',
  'Movies',
  'Dancing',
  'Volunteering',
  'Animals',
  'Technology',
  'Sports',
  'Yoga',
  'Coffee',
  'Wine',
  'Intentional Dating',
  'Verified Profiles',
  'Coffee Dates',
  'Live Events',
  'Clear Communication',
  'Safety First',
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

  useEffect(() => {
    let active = true;
    api
      .get<SavedProfileResponse>('/profiles/me')
      .then(profile => {
        if (!active || !profile) return;
        const parsed = parseStructuredBio(profile.bio);
        setBio(parsed.bio);
        if (parsed.promptAnswer) setPromptAnswer(parsed.promptAnswer);
        if (parsed.dateComfort) setDateComfort(parsed.dateComfort);
        if (parsed.safetyPreference) {
          setSafetyPreference(parsed.safetyPreference);
        }
        if (profile.age !== null && profile.age !== undefined) {
          setAge(String(profile.age));
        }
        if (profile.gender) {
          setGender(profile.gender.toLowerCase());
        }
        if (profile.looking_for) {
          setLookingFor(profile.looking_for.toLowerCase());
        }
        if (profile.location) {
          setLocation(profile.location);
        }
        if (Array.isArray(profile.interests)) {
          setSelectedInterests(profile.interests);
        }
      })
      .catch(() => {
        // 404 is expected before the user saves their profile for the first time.
      });
    return () => {
      active = false;
    };
  }, []);

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
    <div className="min-h-screen bg-[#0A0B0D] text-[#F4F1EA] p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 grid gap-6 md:grid-cols-[1.15fr_0.85fr] md:items-end">
          <div>
            <div className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-[#FFD21E] mb-3">
              Profile Setup · CLAUDE&apos;s N Joshua&apos;s
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-[#F4F1EA] mb-4">
              Tell people who you are.
            </h1>
            <p className="text-[#C9CBCE] text-lg max-w-2xl leading-relaxed">
              Build your real profile before you start matching. Keep it
              specific, human, and useful to someone deciding whether to say hi.
            </p>
          </div>
          <div className="bg-[#12151A] border border-[#3A3F45] rounded-xl p-6">
            <div className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-[#FFD21E] mb-2">
              Current account
            </div>
            <p className="font-display text-xl font-bold tracking-tight text-[#F4F1EA]">
              {user?.display_name}
            </p>
            <p className="mt-3 text-sm text-[#C9CBCE] leading-relaxed">
              This profile becomes the public side of your account inside
              discover, matches, and boards.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="rounded-xl border border-[#FF6B6B] bg-[#1A1E25] px-6 py-4 text-sm font-semibold text-[#FF6B6B]">
              {error}
            </div>
          )}

          <div className="bg-[#12151A] border border-[#3A3F45] rounded-xl p-6 md:p-8">
            <div className="grid gap-8">
              <div className="grid gap-4 rounded-xl border border-[#3A3F45] bg-[#1A1E25] p-6 md:grid-cols-3">
                {[
                  {
                    icon: ShieldCheck,
                    title: 'Verify first',
                    desc: 'The best feed starts with a visible verification state.',
                  },
                  {
                    icon: Sparkles,
                    title: 'Prompt first',
                    desc: 'Make it easy for someone to comment on something specific.',
                  },
                  {
                    icon: CalendarCheck,
                    title: 'Plan safely',
                    desc: 'Share a first-date comfort level before chat turns into a plan.',
                  },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#12151A] border border-[#3A3F45]">
                      <item.icon size={22} className="text-[#FFD21E]" />
                    </div>
                    <h2 className="font-display text-sm font-bold uppercase tracking-[0.08em] text-[#F4F1EA] mb-2">
                      {item.title}
                    </h2>
                    <p className="text-sm text-[#C9CBCE] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div>
                <label className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-[#C9CBCE] mb-3 block">
                  About You
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="What makes you you?"
                  maxLength={500}
                  rows={4}
                  className="w-full bg-[#0A0B0D] border border-[#3A3F45] rounded-lg p-4 text-[#F4F1EA] placeholder-[#9DA3AA] focus:outline-none focus:border-[#FFD21E]"
                />
                <div className="mt-2 text-right font-mono text-xs text-[#9DA3AA]">
                  {bio.length}/500
                </div>
              </div>

              <div>
                <label className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-[#C9CBCE] mb-3 block">
                  Profile Prompt
                </label>
                <textarea
                  value={promptAnswer}
                  onChange={e => setPromptAnswer(e.target.value)}
                  placeholder="Example: My ideal first date is coffee, a bookstore, and a relaxed conversation."
                  maxLength={220}
                  rows={3}
                  className="w-full bg-[#0A0B0D] border border-[#3A3F45] rounded-lg p-4 text-[#F4F1EA] placeholder-[#9DA3AA] focus:outline-none focus:border-[#FFD21E]"
                />
                <div className="mt-2 text-right font-mono text-xs text-[#9DA3AA]">
                  {promptAnswer.length}/220
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <label className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-[#C9CBCE] mb-3 block">
                    Date of Birth
                  </label>
                  <input
                    type="text"
                    value={dateOfBirth}
                    onChange={e =>
                      setDateOfBirth(formatDateInput(e.target.value))
                    }
                    inputMode="numeric"
                    maxLength={14}
                    placeholder="MM / DD / YYYY"
                    className="w-full bg-[#0A0B0D] border border-[#3A3F45] rounded-lg p-4 text-[#F4F1EA] placeholder-[#9DA3AA] focus:outline-none focus:border-[#FFD21E]"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-[#C9CBCE] mb-3 block">
                    Age
                  </label>
                  <input
                    type="number"
                    min={18}
                    max={120}
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    placeholder="18+"
                    className="w-full bg-[#0A0B0D] border border-[#3A3F45] rounded-lg p-4 text-[#F4F1EA] placeholder-[#9DA3AA] focus:outline-none focus:border-[#FFD21E]"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-[#C9CBCE] mb-3 block">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-full bg-[#0A0B0D] border border-[#3A3F45] rounded-lg p-4 text-[#F4F1EA] focus:outline-none focus:border-[#FFD21E]"
                  >
                    <option value="" className="bg-[#12151A]">
                      Select...
                    </option>
                    <option value="male" className="bg-[#12151A]">
                      Male
                    </option>
                    <option value="female" className="bg-[#12151A]">
                      Female
                    </option>
                    <option value="nonbinary" className="bg-[#12151A]">
                      Non-binary
                    </option>
                    <option value="other" className="bg-[#12151A]">
                      Other
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-[#C9CBCE] mb-3 block">
                    Looking For
                  </label>
                  <select
                    value={lookingFor}
                    onChange={e => setLookingFor(e.target.value)}
                    className="w-full bg-[#0A0B0D] border border-[#3A3F45] rounded-lg p-4 text-[#F4F1EA] focus:outline-none focus:border-[#FFD21E]"
                  >
                    <option value="" className="bg-[#12151A]">
                      Select...
                    </option>
                    <option value="relationship" className="bg-[#12151A]">
                      Relationship
                    </option>
                    <option value="friends" className="bg-[#12151A]">
                      Friends
                    </option>
                    <option value="casual" className="bg-[#12151A]">
                      Something casual
                    </option>
                    <option value="unsure" className="bg-[#12151A]">
                      Not sure yet
                    </option>
                  </select>
                </div>
                <div>
                  <label className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-[#C9CBCE] mb-3 block">
                    Date Comfort
                  </label>
                  <select
                    value={dateComfort}
                    onChange={e => setDateComfort(e.target.value)}
                    className="w-full bg-[#0A0B0D] border border-[#3A3F45] rounded-lg p-4 text-[#F4F1EA] focus:outline-none focus:border-[#FFD21E]"
                  >
                    <option value="" className="bg-[#12151A]">
                      Select...
                    </option>
                    <option
                      value="Public coffee or daytime walk first"
                      className="bg-[#12151A]"
                    >
                      Public coffee or daytime walk first
                    </option>
                    <option
                      value="Dinner after a short chat"
                      className="bg-[#12151A]"
                    >
                      Dinner after a short chat
                    </option>
                    <option
                      value="Group or event meetup first"
                      className="bg-[#12151A]"
                    >
                      Group or event meetup first
                    </option>
                    <option
                      value="Video chat before meeting"
                      className="bg-[#12151A]"
                    >
                      Video chat before meeting
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.14em] text-[#C9CBCE] mb-3">
                    <MapPin size={16} className="text-[#FFD21E]" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="City, State"
                    maxLength={200}
                    className="w-full bg-[#0A0B0D] border border-[#3A3F45] rounded-lg p-4 text-[#F4F1EA] placeholder-[#9DA3AA] focus:outline-none focus:border-[#FFD21E]"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.14em] text-[#C9CBCE] mb-3">
                    <ShieldCheck size={16} className="text-[#FFD21E]" />
                    Safety Preference
                  </label>
                  <select
                    value={safetyPreference}
                    onChange={e => setSafetyPreference(e.target.value)}
                    className="w-full bg-[#0A0B0D] border border-[#3A3F45] rounded-lg p-4 text-[#F4F1EA] focus:outline-none focus:border-[#FFD21E]"
                  >
                    <option value="" className="bg-[#12151A]">
                      Select...
                    </option>
                    <option
                      value="Share date details before meeting"
                      className="bg-[#12151A]"
                    >
                      Share date details before meeting
                    </option>
                    <option
                      value="Keep first meetings public"
                      className="bg-[#12151A]"
                    >
                      Keep first meetings public
                    </option>
                    <option
                      value="Use chat check-in before plans"
                      className="bg-[#12151A]"
                    >
                      Use chat check-in before plans
                    </option>
                    <option
                      value="Only match with verified profiles"
                      className="bg-[#12151A]"
                    >
                      Only match with verified profiles
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#12151A] border border-[#3A3F45] rounded-xl p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.14em] text-[#C9CBCE]">
                <Sparkles size={16} className="text-[#FFD21E]" />
                Interests
              </label>
              <span className="font-mono text-xs text-[#9DA3AA]">
                {selectedInterests.length}/10 selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {INTEREST_OPTIONS.map(interest => {
                const active = selectedInterests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? 'border-[#FFD21E] bg-[#FFD21E] text-[#0A0B0D]'
                        : 'border-[#3A3F45] bg-[#1A1E25] text-[#C9CBCE] hover:border-[#F4F1EA] hover:text-[#F4F1EA]'
                    }`}
                  >
                    {active && <Check size={14} />}
                    {interest}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-[#C9CBCE] max-w-md leading-relaxed">
              Save the real profile first. Photos, matching, and verification
              become more useful once the basics are filled in.
            </div>
            <button
              type="submit"
              disabled={loading}
              className="ds-btn-signal flex items-center gap-2 px-8 py-4 text-sm disabled:opacity-50"
            >
              {loading ? (
                'Saving...'
              ) : (
                <>
                  <Camera size={20} /> Save Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
