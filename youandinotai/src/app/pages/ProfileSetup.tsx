import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Camera, MapPin, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <User size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Set Up Your Profile</h1>
          <p className="text-gray-400 text-sm mt-1">
            Hey {user?.display_name}! Tell people about yourself.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bio */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">About You</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What makes you, you?"
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 resize-none"
            />
            <span className="text-gray-600 text-xs">{bio.length}/500</span>
          </div>

          {/* Age + Gender row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Age</label>
              <input
                type="number"
                min={18}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="18+"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500 appearance-none"
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
            <label className="text-sm font-medium text-gray-300 mb-2 block">Looking For</label>
            <select
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500 appearance-none"
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
            <label className="text-sm font-medium text-gray-300 mb-2 block flex items-center gap-1">
              <MapPin size={14} /> Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, State"
              maxLength={200}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Interests */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block flex items-center gap-1">
              <Sparkles size={14} /> Interests ({selectedInterests.length}/10)
            </label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedInterests.includes(interest)
                      ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {loading ? 'Saving...' : (
              <><Camera size={18} /> Save Profile</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
