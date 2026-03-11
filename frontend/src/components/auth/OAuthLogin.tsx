/**
 * OAuth Login Component - Multi-Provider
 *
 * Supports Google, GitHub, and Yandex OAuth2 authentication.
 * Handles authorization code flow and token management.
 */

import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../../App";
import { authApi, getApiErrorMessage } from "../../api/client";
import styles from "./OAuthLogin.module.css";

export const OAUTH_PROVIDERS = {
  GOOGLE: "google",
  GITHUB: "github",
  YANDEX: "yandex",
} as const;

type OAuthProvider = (typeof OAUTH_PROVIDERS)[keyof typeof OAUTH_PROVIDERS];

interface OAuthConfig {
  clientId: string;
  provider: OAuthProvider;
  label: string;
  icon: string;
}

interface OAuthCallbackData {
  access_token: string;
  refresh_token: string;
  is_new_user?: boolean;
}

interface OAuthAuthContextType {
  loginWithToken: (accessToken: string, refreshToken: string) => Promise<void>;
}

const getOAuthConfig = (provider: OAuthProvider): OAuthConfig | null => {
  const configs: Record<OAuthProvider, OAuthConfig> = {
    google: {
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || "",
      provider: OAUTH_PROVIDERS.GOOGLE,
      label: "Sign in with Google",
      icon: "google",
    },
    github: {
      clientId: process.env.REACT_APP_GITHUB_CLIENT_ID || "",
      provider: OAUTH_PROVIDERS.GITHUB,
      label: "Sign in with GitHub",
      icon: "github",
    },
    yandex: {
      clientId: process.env.REACT_APP_YANDEX_CLIENT_ID || "",
      provider: OAUTH_PROVIDERS.YANDEX,
      label: "Sign in with Yandex",
      icon: "yandex",
    },
  };

  return configs[provider];
};

const getAuthorizationUrl = (provider: OAuthProvider): string => {
  const redirectUri = `${window.location.origin}/auth/${provider}/callback`;

  switch (provider) {
    case OAUTH_PROVIDERS.GOOGLE:
      return (
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${getOAuthConfig(provider)?.clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=openid%20email%20profile`
      );

    case OAUTH_PROVIDERS.GITHUB:
      return (
        `https://github.com/login/oauth/authorize?` +
        `client_id=${getOAuthConfig(provider)?.clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=user:email`
      );

    case OAUTH_PROVIDERS.YANDEX:
      return (
        `https://oauth.yandex.ru/authorize?` +
        `client_id=${getOAuthConfig(provider)?.clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code`
      );

    default:
      return "";
  }
};

interface OAuthLoginProps {
  provider?: OAuthProvider;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  showAllProviders?: boolean;
}

/**
 * OAuthLogin Component
 *
 * Displays OAuth login button(s) for specified provider(s).
 *
 * Usage:
 * - Single provider: <OAuthLogin provider="google" />
 * - All providers: <OAuthLogin showAllProviders />
 */
export const OAuthLogin: React.FC<OAuthLoginProps> = ({
  provider = OAUTH_PROVIDERS.GOOGLE,
  onSuccess,
  onError,
  className = "",
  showAllProviders = false,
}) => {
  const navigate = useNavigate();
  const { loginWithToken } = useContext(AuthContext) as OAuthAuthContextType;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOAuthClick = (selectedProvider: OAuthProvider) => {
    try {
      const config = getOAuthConfig(selectedProvider);
      if (!config?.clientId) {
        const errorMsg = `${selectedProvider} OAuth not configured`;
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      const authUrl = getAuthorizationUrl(selectedProvider);
      if (!authUrl) {
        const errorMsg = `Unable to build authorization URL for ${selectedProvider}`;
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      // Open authorization window
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const authWindow = window.open(
        authUrl,
        `${selectedProvider}_login`,
        `width=${width},height=${height},left=${left},top=${top}`,
      );

      if (!authWindow) {
        const errorMsg = "Popup blocked. Please allow popups and try again.";
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      // Listen for message from callback page
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === "oauth_callback") {
          authWindow.close();
          handleOAuthCallback(event.data.payload);
          window.removeEventListener("message", handleMessage);
        }
      };

      window.addEventListener("message", handleMessage);

      // Cleanup if window is closed
      const checkWindow = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkWindow);
          window.removeEventListener("message", handleMessage);
        }
      }, 1000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "OAuth error";
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  const handleOAuthCallback = async (callbackData: OAuthCallbackData) => {
    try {
      setLoading(true);
      setError(null);

      await loginWithToken(callbackData.access_token, callbackData.refresh_token);

      onSuccess?.();
      navigate(callbackData.is_new_user ? "/?welcome=true" : "/dashboard");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Authentication failed";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const providers = showAllProviders ? Object.values(OAUTH_PROVIDERS) : [provider];

  return (
    <div className={`${styles.oauthContainer} ${className}`}>
      {error && <div className={styles.error}>{error}</div>}

      {providers.map((p) => {
        const config = getOAuthConfig(p);
        if (!config) return null;

        return (
          <button
            key={p}
            className={`${styles.oauthButton} ${styles[p]}`}
            onClick={() => handleOAuthClick(p)}
            disabled={loading}
            aria-label={config.label}
          >
            <span className={styles.icon} aria-hidden="true">
              {getIconSvg(p)}
            </span>
            <span>{config.label}</span>
          </button>
        );
      })}

      {loading && <p className={styles.loading}>Redirecting to provider...</p>}
    </div>
  );
};

/**
 * OAuth Callback Page Handler
 *
 * Should be mounted at /auth/{provider}/callback
 * Extracts authorization code from URL and posts to backend
 */
export const OAuthCallback: React.FC<{ provider: OAuthProvider }> = ({ provider }) => {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const errorParam = params.get("error");

        if (errorParam) {
          throw new Error(`OAuth error: ${errorParam}`);
        }

        if (!code) {
          throw new Error("No authorization code received");
        }

        const data: OAuthCallbackData = await authApi.oauthCallback(provider, code);

        // Send success message to parent window
        if (window.opener) {
          window.opener.postMessage(
            {
              type: "oauth_callback",
              payload: data,
            },
            window.location.origin,
          );
        } else {
          // Fallback: store in sessionStorage and redirect
          sessionStorage.setItem("oauth_callback", JSON.stringify(data));
          window.location.href = "/dashboard";
        }
      } catch (err) {
        const errorMsg = getApiErrorMessage(err, "Authentication failed");
        setError(errorMsg);
        setLoading(false);
      }
    };

    handleCallback();
  }, [provider]);

  if (loading) {
    return <div className={styles.loading}>Authenticating...</div>;
  }

  if (error) {
    return <div className={styles.error}>Authentication failed: {error}</div>;
  }

  return null;
};

/**
 * Get SVG icon for OAuth provider
 */
function getIconSvg(provider: OAuthProvider): React.ReactNode {
  switch (provider) {
    case OAUTH_PROVIDERS.GOOGLE:
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      );

    case OAUTH_PROVIDERS.GITHUB:
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      );

    case OAUTH_PROVIDERS.YANDEX:
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M11.5 0C5.1 0 0 5.1 0 11.5S5.1 23 11.5 23 23 17.9 23 11.5 17.9 0 11.5 0zm1 19.5h-2v-9.4H9v-1.8h1.5V6.7c0-1.8.8-2.8 2.8-2.8.8 0 1.5.1 1.5.1v1.7s-.7 0-1.3 0c-.9 0-1 .4-1 1.1v3h2.4l-.3 1.8h-2.1v9.4z" />
        </svg>
      );

    default:
      return null;
  }
}

export default OAuthLogin;
