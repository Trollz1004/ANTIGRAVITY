import { useEffect } from 'react';
import { useAuth } from '../../lib/auth';

declare global {
  interface Window {
    google: any;
  }
}

export function GoogleSignInButton() {
  const { googleLogin, user } = useAuth();

  useEffect(() => {
    if (user) return; // a user is already logged in

    const handleCredentialResponse = async (response: any) => {
      try {
        await googleLogin(response.credential);
        // The user will be redirected by the auth hook
      } catch (error) {
        console.error("Google login failed", error);
      }
    };

    const initializeGsi = () => {
      if (!window.google) {
        console.error("Google Identity Services library not loaded.");
        return;
      }
      
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-signin-button"),
        { theme: "outline", size: "large" }
      );
    };

    // Check if the GSI script is already loaded.
    if (window.google) {
      initializeGsi();
    } else {
      // If not, you might need to handle this case, 
      // but the script is loaded in index.html with `async defer`
      // so it should be available when this component mounts.
    }

  }, [googleLogin, user]);

  return <div id="google-signin-button"></div>;
}
