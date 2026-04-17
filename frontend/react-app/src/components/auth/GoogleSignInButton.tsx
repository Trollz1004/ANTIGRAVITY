import { useEffect } from 'react';
import { useAuth } from '../../lib/auth';

declare global {
  interface Window {
    google: any;
  }
}

export function GoogleSignInButton() {
  const { googleLogin, user } = useAuth();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (user || !googleClientId) return; // a user is already logged in or Google auth is not configured
    let cancelled = false;

    const handleCredentialResponse = async (response: any) => {
      try {
        await googleLogin(response.credential);
        // The user will be redirected by the auth hook
      } catch (error) {
        console.error('Google login failed', error);
      }
    };

    const initializeGsi = () => {
      if (cancelled || !window.google?.accounts?.id) {
        console.error('Google Identity Services library not loaded.');
        return;
      }

      const buttonRoot = document.getElementById('google-signin-button');
      if (!buttonRoot) return;
      buttonRoot.innerHTML = '';

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(buttonRoot, {
        theme: 'outline',
        size: 'large',
      });
    };

    const loadGsi = async () => {
      if (window.google?.accounts?.id) {
        initializeGsi();
        return;
      }

      const existing = document.getElementById(
        'google-gsi-client'
      ) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', initializeGsi, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.addEventListener('load', initializeGsi, { once: true });
      script.addEventListener(
        'error',
        () => {
          console.error('Google Identity Services library failed to load.');
        },
        { once: true }
      );
      document.head.appendChild(script);
    };

    void loadGsi();

    return () => {
      cancelled = true;
    };
  }, [googleClientId, googleLogin, user]);

  if (!googleClientId) return null;
  return <div id="google-signin-button"></div>;
}
