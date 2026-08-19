import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShieldCheck, Lock, AlertTriangle, KeyRound } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/** Authentication boundary for the operator workspace. No configuration paths or bypass controls are exposed. */
export function SignInGate({ children }) {
  const [state, setState] = useState({ loading: true });
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const refresh = async () => {
    try { const response = await axios.get(`${API}/auth/status`, { withCredentials: true }); setState({ loading: false, ...response.data }); }
    catch (requestError) { setState({ loading: false, configured: false, signed_in: false, error: requestError.message }); }
  };
  useEffect(() => { refresh(); }, []);
  const signIn = async (event) => {
    event?.preventDefault(); setBusy(true); setError(null);
    try { await axios.post(`${API}/auth/login`, { password }, { withCredentials: true }); setPassword(''); await refresh(); }
    catch (requestError) { setError(requestError.response?.data?.detail || requestError.message); }
    finally { setBusy(false); }
  };
  const signOut = async () => { try { await axios.post(`${API}/auth/logout`, {}, { withCredentials: true }); } catch {} refresh(); };
  if (state.loading) return <div className="h-screen flex items-center justify-center bg-[#0a0f1a] text-[#6b82a6] text-xs tracking-widest uppercase">checking authentication…</div>;
  if (state.configured && state.signed_in) return <><>{children}</><button data-testid="auth-signout" onClick={signOut} className="fixed bottom-2 left-2 z-40 flex items-center gap-1 text-[8px] tracking-widest uppercase px-2 py-1 rounded bg-[#1a2332]/80 border border-[#2a3a52] text-[#6b82a6] hover:text-[#ff1744] hover:border-[#ff1744]/40 transition-all" title="Sign out"><Lock size={9} /> sign out</button></>;
  if (state.configured) return <div className="h-screen w-screen bg-[#0a0f1a] text-[#e8f0ff] flex items-center justify-center p-8 relative overflow-hidden"><div className="relative max-w-md w-full border border-[#2a3a52] bg-[#111827] rounded-md p-8"><div className="flex items-center gap-3 mb-5"><div className="w-10 h-10 rounded-md bg-[#fb923c]/10 border border-[#fb923c]/30 flex items-center justify-center"><ShieldCheck className="text-[#fb923c]" size={18} /></div><div><div className="text-[10px] font-bold text-[#fb923c] uppercase tracking-[0.3em]">operator</div><div className="text-lg font-bold tracking-tight">Sign in to Mission Control</div></div></div><form onSubmit={signIn} className="space-y-3" data-testid="signin-form"><label className="block"><span className="text-[8px] tracking-[0.25em] uppercase text-[#6b82a6] mb-1 block">Password</span><input data-testid="signin-password" type="password" autoFocus required value={password} onChange={(event) => setPassword(event.target.value)} className="mono w-full bg-[#0a0f1a] border border-[#2a3a52] rounded px-3 py-2 text-sm text-[#e8f0ff] focus:border-[#fb923c] focus:ring-1 focus:ring-[#fb923c]/20 outline-none" /></label>{error && <div data-testid="signin-error" className="mono text-[11px] text-[#ff1744]">{error}</div>}<button data-testid="signin-submit" type="submit" disabled={busy || !password} className="w-full py-2.5 rounded-md bg-[#fb923c] text-[#0a0f1a] text-xs font-bold uppercase tracking-[0.3em] disabled:opacity-30 hover:bg-[#fbb05a] transition-all flex items-center justify-center gap-2"><KeyRound size={12} /> {busy ? 'signing in…' : 'Sign in'}</button></form><div className="mt-4 pt-4 border-t border-[#2a3a52] text-[9px] mono text-[#6b82a6] leading-relaxed">Authenticated access only. Session configuration is not displayed in this workspace.</div></div></div>;
  return <div className="h-screen w-screen bg-[#0a0f1a] text-[#e8f0ff] flex items-center justify-center p-8"><div className="relative max-w-lg w-full border border-[#ffb300]/40 bg-[#111827] rounded-md p-8"><div className="flex items-center gap-3 mb-4"><AlertTriangle className="text-[#ffb300]" size={22} /><div><div className="text-[10px] font-bold text-[#ffb300] uppercase tracking-[0.3em]">unavailable</div><div className="text-lg font-bold tracking-tight">Operator sign-in is not configured</div></div></div><p className="text-sm text-[#e8f0ff] leading-relaxed">This workspace cannot be entered until an authorized operator configures authentication. No preview bypass is available.</p></div></div>;
}
