/**
 * Google OAuth Login Component
 *
 * Handles Google Sign-In integration with CURSA backend.
 * Uses Google API client library and custom callback handler.
 */

import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../../App";
import { authApi, getApiErrorMessage } from "../../api/client";
import styles from "./OAuthLogin.module.css";

interface GoogleOAuthLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

interface GoogleOAuthAuthContextType {
  loginWithToken: (accessToken: string, refreshToken: string) => Promise<void>;
}

export const GoogleOAuthLogin: React.FC<GoogleOAuthLoginProps> = ({
  onSuccess,
  onError,
  className = "",
}) => {
  const navigate = useNavigate();
  const { loginWithToken } = useContext(AuthContext) as GoogleOAuthAuthContextType;
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    // Initialize Google Sign-In
    loadGoogleLoginScript();
  }, []);

  const loadGoogleLoginScript = () => {
    if (document.getElementById("google-login-script")) {
      return; // Already loaded
    }

    const script = document.createElement("script");
    script.id = "google-login-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleSignIn;
    document.head.appendChild(script);
  };

  const initializeGoogleSignIn = () => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error("Google Client ID not configured");
      return;
    }

    // @ts-ignore
    if (window.google?.accounts?.id) {
      // @ts-ignore
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
        auto_select: false,
      });
    }
  };

  const handleGoogleCallback = async (response: any) => {
    try {
      setLoading(true);

      // The response.credential is a JWT token
      // In a real flow, you'd extract the code from the authorization flow
      // For now, we're demonstrating the implicit flow with the token

      const data = await authApi.oauthCallback("google", response.credential);

      await loginWithToken(data.access_token, data.refresh_token);
      onSuccess?.();
      navigate(data.is_new_user ? "/?welcome=true" : "/dashboard");
    } catch (error) {
      const errorMsg = getApiErrorMessage(error, "Authentication failed");
      onError?.(errorMsg);
      console.error("Google OAuth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClickSignIn = () => {
    try {
      setLoading(true);
      // @ts-ignore
      if (window.google?.accounts?.id) {
        // @ts-ignore
        window.google.accounts.id.renderButton(document.getElementById("google-signin-button"), {
          theme: "outline",
          size: "large",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.oauthContainer} ${className}`}>
      <div id="google-signin-button" onClick={handleClickSignIn} />
      {loading && <p className={styles.loading}>Authenticating...</p>}
    </div>
  );
};

export default GoogleOAuthLogin;
