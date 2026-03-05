import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Camera, MapPin, Sparkles, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth';

const INTEREST_OPTIONS = [
  'Travel', 'Music', 'Cooking', 'Fitness', 'Reading', 'Gaming',
  'Art', 'Photography', 'Hiking', 'Movies', 'Dancing', 'Volunteering',
  'Animals', 'Technology', 'Sports', 'Yoga', 'Coffee', 'Wine',
];

export function ProfileSetup() {
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [location, setLocation] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < 10 ? [...prev, interest] : prev
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/profiles/me', {
        bio: bio || null,
        age: age ? parseInt(age) : null,
        gender: gender || null,
        looking_for: lookingFor || null,
        location: location || null,
        interests: selectedInterests,
      });
      await fetchUser();
      navigate('/app');
    } catch (err: any) {
      alert(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-lg mx-auto animate-scale-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-pink-500/20">
            <User size={44} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Set Up Your Profile</h1>
          <p className="text-gray-400 text-sm mt-2 font-medium">
            Hey <span className="text-pink-400">{user?.display_name}</span>! Tell people about yourself.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bio */}
          <div className="glass-strong rounded-3xl p-6 glass-highlight space-y-5">
            <div>
              <label className="text-sm font-bold text-gray-300 mb-2 block">About You</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What makes you, you?"
                maxLength={500}
                rows={3}
                className="w-full px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/40 input-glow transition-all duration-300 resize-none"
              />
              <div className="flex justify-end mt-1">
                <span className="text-gray-600 text-xs">{bio.length}/500</span>
              </div>
            </div>

            {/* Age + Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">Age</label>
                <input
                  type="number"
                  min={18}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="18+"
                  className="w-full px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/40 input-glow transition-all duration-300"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-300 mb-2 block">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white focus:outline-none focus:border-pink-500/40 input-glow transition-all duration-300 appearance-none"
                >
                  <option value="" className="bg-gray-900">Select...</option>
                  <option value="male" className="bg-gray-900">Male</option>
                  <option value="female" className="bg-gray-900">Female</option>
                  <option value="nonbinary" className="bg-gray-900">Non-binary</option>
                  <option value="other" className="bg-gray-900">Other</option>
                </select>
              </div>
            </div>

            {/* Looking for */}
            <div>
              <label className="text-sm font-bold text-gray-300 mb-2 block">Looking For</label>
              <select
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
                className="w-full px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white focus:outline-none focus:border-pink-500/40 input-glow transition-all duration-300 appearance-none"
              >
                <option value="" className="bg-gray-900">Select...</option>
                <option value="relationship" className="bg-gray-900">Relationship</option>
                <option value="friends" className="bg-gray-900">Friends</option>
                <option value="casual" className="bg-gray-900">Something Casual</option>
                <option value="unsure" className="bg-gray-900">Not Sure Yet</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-bold text-gray-300 mb-2 block flex items-center gap-1.5">
                <MapPin size={14} className="text-pink-400" /> Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State"
                maxLength={200}
                className="w-full px-5 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/40 input-glow transition-all duration-300"
              />
            </div>
          </div>

          {/* Interests — separate glass card */}
          <div className="glass-strong rounded-3xl p-6 glass-highlight">
            <label className="text-sm font-bold text-gray-300 mb-3 block flex items-center gap-1.5">
              <Sparkles size={14} className="text-purple-400" /> Interests
              <span className="text-gray-500 font-normal ml-1">({selectedInterests.length}/10)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 ${
                    selectedInterests.includes(interest)
                      ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border border-pink-500/30 shadow-lg shadow-pink-500/5'
                      : 'glass text-gray-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {selectedInterests.includes(interest) && <Check size={12} className="inline mr-1" />}
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl font-bold text-white flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-pink-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 relative overflow-hidden group"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              <>
                <Camera size={18} /> Save Profile
              </>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
          </button>
        </form>
      </div>
    </div>
  );
}
