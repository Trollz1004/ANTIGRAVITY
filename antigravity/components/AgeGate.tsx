import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';

export default function AgeGate({ isDarkMode }: { isDarkMode: boolean }) {
  const [coppa1, setCoppa1] = useState(false);
  const [coppa2, setCoppa2] = useState(false);
  const [coppa3, setCoppa3] = useState(false);
  const [age, setAge] = useState('');
  const [platform, setPlatform] = useState('general'); // general or dating
  const [status, setStatus] = useState<'idle' | 'approved' | 'rejected'>('idle');

  const handleVerify = () => {
    if (!coppa1 || !coppa2 || !coppa3) {
      setStatus('rejected');
      return;
    }
    const ageNum = parseInt(age);
    if (isNaN(ageNum)) {
      setStatus('rejected');
      return;
    }
    
    if (platform === 'dating' && ageNum < 18) {
      setStatus('rejected');
      return;
    }
    
    if (ageNum < 13) {
      setStatus('rejected');
      return;
    }

    setStatus('approved');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 text-rose-600 mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Strict Age Gate & Compliance</h2>
        <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Mandatory COPPA compliance and age verification for ecosystem access.
        </p>
      </div>

      <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} space-y-6`}>
        
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-500" />
            Select Platform Access
          </h3>
          <div className="flex gap-4">
            <label className={`flex-1 p-4 rounded-xl border cursor-pointer transition-all ${platform === 'general' ? 'border-blue-500 bg-blue-500/10' : isDarkMode ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'}`}>
              <input type="radio" name="platform" value="general" checked={platform === 'general'} onChange={() => setPlatform('general')} className="sr-only" />
              <div className="font-bold">General Ecosystem</div>
              <div className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Minimum Age: 13+</div>
            </label>
            <label className={`flex-1 p-4 rounded-xl border cursor-pointer transition-all ${platform === 'dating' ? 'border-rose-500 bg-rose-500/10' : isDarkMode ? 'border-slate-700 hover:border-slate-600' : 'border-slate-200 hover:border-slate-300'}`}>
              <input type="radio" name="platform" value="dating" checked={platform === 'dating'} onChange={() => setPlatform('dating')} className="sr-only" />
              <div className="font-bold">Dating Platform</div>
              <div className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Minimum Age: 18+</div>
            </label>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-lg">COPPA Compliance Checklist</h3>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={coppa1} onChange={(e) => setCoppa1(e.target.checked)} className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>I confirm that I am not providing any personally identifiable information of a child under 13 without verifiable parental consent.</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={coppa2} onChange={(e) => setCoppa2(e.target.checked)} className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>I agree to the data collection and privacy policies regarding minors as outlined in the Terms of Service.</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={coppa3} onChange={(e) => setCoppa3(e.target.checked)} className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>I understand that falsifying age information will result in immediate account termination.</span>
          </label>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-lg">Verify Age</h3>
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Enter your age</label>
            <input 
              type="number" 
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 25"
              className={`w-full max-w-xs px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
            />
          </div>
        </div>

        <button 
          onClick={handleVerify}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
        >
          Verify & Continue
        </button>

        {status === 'approved' && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
            <div>
              <p className="font-bold">Access Approved</p>
              <p className="text-sm">You meet the age requirements for the {platform} platform.</p>
            </div>
          </div>
        )}

        {status === 'rejected' && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <p className="font-bold">Access Denied</p>
              <p className="text-sm">You do not meet the requirements or have not agreed to the COPPA terms.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
