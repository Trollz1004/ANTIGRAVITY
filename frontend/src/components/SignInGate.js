import React, { useEffect, useState } from "react";
import axios from "axios";
import { ShieldCheck, Lock, AlertTriangle, KeyRound } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

/**
 * SignInGate — admin dashboard sign-in per directive
 * ("local-deploy admin dashboards must require sign-in").
 *
 * Honest empty states:
 *   - If ADMIN_PASSWORD / ADMIN_SESSION_SECRET are unset on the backend,
 *     show a clear "auth not configured" message and a BYPASS button
 *     marked DEV-ONLY so Joshua can still see the surface in preview.
 *   - If configured, show the password form.
 */
export function SignInGate({ children }) {
  const [state, setState] = useState({ loading: true });
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      const r = await axios.get(`${API}/auth/status`, { withCredentials: true });
      setState({ loading: false, ...r.data });
    } catch (e) {
      setState({ loading: false, configured: false, signed_in: false, error: e.message });
    }
  };

  useEffect(() => { refresh(); }, []);

  const signIn = async (e) => {
    e?.preventDefault();
    setBusy(true); setError(null);
    try {
      await axios.post(`${API}/auth/login`, { password }, { withCredentials: true });
      setPassword("");
      await refresh();
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally { setBusy(false); }
  };

  const signOut = async () => {
    try { await axios.post(`${API}/auth/logout`, {}, { withCredentials: true }); }
    catch (err) {
      // logout endpoint failed — still clear local state via refresh()
      // eslint-disable-next-line no-console
      console.warn("signout request failed:", err?.message || err);
    }
    refresh();
  };

  if (state.loading) {
    return <div className="h-screen flex items-center justify-center bg-[#0a0f1a] text-[#6b82a6] text-xs tracking-widest uppercase">checking auth…</div>;
  }

  // Configured + signed in → render the app, with a small sign-out chip pinned.
  if (state.configured && state.signed_in) {
    return (
      <>
        {children}
        <button
          data-testid="auth-signout"
          onClick={signOut}
          className="fixed bottom-2 left-2 z-40 flex items-center gap-1 text-[8px] tracking-widest uppercase px-2 py-1 rounded bg-[#1a2332]/80 border border-[#2a3a52] text-[#6b82a6] hover:text-[#ff1744] hover:border-[#ff1744]/40 transition-all"
          title="Sign out of admin"
        >
          <Lock size={9} /> sign out
        </button>
      </>
    );
  }

  // Configured but NOT signed in → password form.
  if (state.configured) {
    return (
      <div className="h-screen w-screen bg-[#0a0f1a] text-[#e8f0ff] flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(0,212,255,0.08),transparent_40%),radial-gradient(circle_at_100%_100%,rgba(224,64,251,0.08),transparent_45%)]" />
        <div className="relative max-w-md w-full border border-[#2a3a52] bg-[#111827] rounded-md p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-md bg-[#fb923c]/10 border border-[#fb923c]/30 flex items-center justify-center">
              <ShieldCheck className="text-[#fb923c]" size={18} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#fb923c] uppercase tracking-[0.3em]">admin</div>
              <div className="text-lg font-bold tracking-tight">Sign in to Mission Control</div>
            </div>
          </div>
          <form onSubmit={signIn} className="space-y-3" data-testid="signin-form">
            <label className="block">
              <span className="text-[8px] tracking-[0.25em] uppercase text-[#6b82a6] mb-1 block">Admin password</span>
              <input
                data-testid="signin-password"
                type="password" autoFocus required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="mono w-full bg-[#0a0f1a] border border-[#2a3a52] rounded px-3 py-2 text-sm text-[#e8f0ff] focus:border-[#fb923c] focus:ring-1 focus:ring-[#fb923c]/20 outline-none"
              />
            </label>
            {error && <div data-testid="signin-error" className="mono text-[11px] text-[#ff1744]">{error}</div>}
            <button
              data-testid="signin-submit"
              type="submit" disabled={busy || !password}
              className="w-full py-2.5 rounded-md bg-[#fb923c] text-[#0a0f1a] text-xs font-bold uppercase tracking-[0.3em] disabled:opacity-30 hover:bg-[#fbb05a] transition-all flex items-center justify-center gap-2"
            >
              <KeyRound size={12} /> {busy ? "signing in…" : "Sign in"}
            </button>
          </form>
          <div className="mt-4 pt-4 border-t border-[#2a3a52] text-[9px] mono text-[#6b82a6] leading-relaxed">
            8-hour HTTP-only session cookie. Sole authority: Joshua Coleman.
            <br />#UntilNoKidInNeed · no trust-me-bro doctrine.
          </div>
        </div>
      </div>
    );
  }

  // NOT configured → honest banner + bypass-for-preview.
  return (
    <div className="h-screen w-screen bg-[#0a0f1a] text-[#e8f0ff] flex items-center justify-center p-8 relative overflow-hidden">
      <div className="relative max-w-lg w-full border border-[#ffb300]/40 bg-[#111827] rounded-md p-8">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-[#ffb300]" size={22} />
          <div>
            <div className="text-[10px] font-bold text-[#ffb300] uppercase tracking-[0.3em]">unconfigured</div>
            <div className="text-lg font-bold tracking-tight">Admin sign-in is not set up</div>
          </div>
        </div>
        <p className="text-sm text-[#e8f0ff] leading-relaxed mb-4">
          Per directive ("local-deploy admin dashboards must require sign-in"),
          Mission Control should be password-gated. Currently <span className="mono text-[#ffb300]">
          {(state.missing_env || []).join(", ")}</span> are blank in
          <span className="mono text-[#00d4ff]"> /app/backend/.env</span>.
        </p>
        <div className="bg-[#0a0f1a] border border-[#2a3a52] rounded p-3 mono text-[10px] text-[#6b82a6] mb-4 whitespace-pre">
{`ADMIN_PASSWORD=<set a strong one>
ADMIN_SESSION_SECRET=<openssl rand -hex 32>`}
        </div>
        <button
          data-testid="signin-bypass"
          onClick={() => setState({ ...state, configured: true, signed_in: true })}
          className="w-full py-2 rounded-md bg-[#1a2332] border border-[#fb923c]/30 text-[#fb923c] text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-[#fb923c]/10 transition-all"
        >
          Continue in preview mode (DEV-ONLY)
        </button>
        <div className="mt-3 text-[9px] mono text-[#6b82a6] text-center italic">
          Bypass is local-only and cannot reach Sabretooth — admin endpoints still 503 until configured.
        </div>
      </div>
    </div>
  );
}
