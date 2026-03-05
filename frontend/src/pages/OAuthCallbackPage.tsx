import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import { FC, useContext, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AuthContext } from "../App";
import { authApi } from "../api/client";

// ============================================================================
// Type Definitions
// ============================================================================

interface OAuthCallbackPageProps {
  className?: string;
}

interface AuthContextType {
  loginWithToken: (accessToken: string, refreshToken: string) => Promise<void>;
}

// ============================================================================
// Constants
// ============================================================================

const VALID_PROVIDERS = ["google", "github", "yandex", "telegram"];

// ============================================================================
// Main Component
// ============================================================================

/**
 * OAuthCallbackPage Component
 *
 * Handles OAuth callbacks from:
 * - Google
 * - GitHub
 * - Yandex
 * - Telegram
 *
 * Manages token exchange and user session initialization
 */
const OAuthCallbackPage: FC<OAuthCallbackPageProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useContext(AuthContext) as AuthContextType;

  // ========== State ==========
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // ========== Effects ==========

  useEffect(() => {
    const handleOAuthCallback = async (): Promise<void> => {
      try {
        // Handle Telegram OAuth
        if (provider === "telegram") {
          const hash = window.location.hash?.startsWith("#") ? window.location.hash.slice(1) : "";
          const hashParams = new URLSearchParams(hash);

          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          const userId = hashParams.get("user_id");
          const isNewUser = hashParams.get("is_new_user") === "true";
          const telegramError = searchParams.get("error");

          if (telegramError) {
            setError(`Telegram auth error: ${telegramError}`);
            setLoading(false);
            return;
          }

          if (!accessToken || !refreshToken || !userId) {
            setError("Telegram tokens not found in callback URL");
            setLoading(false);
            return;
          }

          await loginWithToken(accessToken, refreshToken);
          navigate(isNewUser ? "/?welcome=true" : "/dashboard");
          return;
        }

        // Handle OAuth2 providers (Google, GitHub, Yandex)
        const code = searchParams.get("code");

        if (!code) {
          setError("Authorization code not found in URL");
          setLoading(false);
          return;
        }

        if (!provider || !VALID_PROVIDERS.includes(provider)) {
          setError(`Unknown provider: ${provider}`);
          setLoading(false);
          return;
        }

        const { access_token, refresh_token, is_new_user } = await authApi.oauthCallback(
          provider,
          code,
        );

        await loginWithToken(access_token, refresh_token);

        navigate(is_new_user ? "/?welcome=true" : "/dashboard");
      } catch (err: unknown) {
        console.error("OAuth callback error:", err);

        let errorMessage = "Authentication failed";
        if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        setLoading(false);
      }
    };

    handleOAuthCallback();
  }, [searchParams, provider, navigate, loginWithToken]);

  // ========== Render ==========

  if (loading) {
    return (
      <Box
        className={className}
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #07070a 0%, #0f0f14 100%)",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress sx={{ color: "#22d3ee" }} />
        <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>Вы входите в приложение...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        className={className}
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #07070a 0%, #0f0f14 100%)",
          p: 2,
        }}
      >
        <Alert
          severity="error"
          sx={{
            maxWidth: 500,
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#fca5a5",
          }}
          onClose={() => navigate("/")}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Ошибка входа
          </Typography>
          <Typography variant="body2">{error}</Typography>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 2,
              cursor: "pointer",
              color: "#22d3ee",
              "&:hover": { textDecoration: "underline" },
            }}
            onClick={() => navigate("/")}
          >
            ← Вернуться на главную
          </Typography>
        </Alert>
      </Box>
    );
  }

  return null;
};

export default OAuthCallbackPage;
