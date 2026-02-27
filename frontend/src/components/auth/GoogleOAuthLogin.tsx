/**
 * Google OAuth Login Component
 *
 * Handles Google Sign-In integration with CURSA backend.
 * Uses Google API client library and custom callback handler.
 */

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import styles from "./OAuthLogin.module.css";

interface GoogleOAuthLoginProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export const GoogleOAuthLogin: React.FC<GoogleOAuthLoginProps> = ({
  onSuccess,
  onError,
  className = "",
}) => {
  const navigate = useNavigate();
  const { login } = useAuth();
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

      // Send to backend
      const backendResponse = await fetch(
        `${process.env.REACT_APP_API_URL}/api/auth/oauth/google/callback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: response.credential, // In production, this would be auth code
          }),
        },
      );

      if (!backendResponse.ok) {
        throw new Error("OAuth authentication failed");
      }

      const data = await backendResponse.json();

      // Store tokens and redirect
      login(data.access_token, data.refresh_token, data.user_id);
      onSuccess?.();
      navigate("/dashboard");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Authentication failed";
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
