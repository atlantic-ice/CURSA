import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AuthContext } from "../App";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { provider } = useParams();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { loginWithToken } = useContext(AuthContext);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        if (provider === "telegram") {
          const hash = window.location.hash?.startsWith("#") ? window.location.hash.slice(1) : "";
          const hashParams = new URLSearchParams(hash);

          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          const userId = hashParams.get("user_id");
          const email = hashParams.get("email");
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

        const code = searchParams.get("code");

        if (!code) {
          setError("Authorization code not found in URL");
          setLoading(false);
          return;
        }

        if (!["google", "github", "yandex"].includes(provider)) {
          setError(`Unknown provider: ${provider}`);
          setLoading(false);
          return;
        }

        // Отправить код на бэкенд
        const apiBase =
          process.env.REACT_APP_API_URL ||
          (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
            ? "http://localhost:5000"
            : "");

        const response = await axios.post(
          `${apiBase}/api/auth/oauth/${provider}/callback`,
          { code },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const { access_token, refresh_token, is_new_user } = response.data;

        await loginWithToken(access_token, refresh_token);

        navigate(is_new_user ? "/?welcome=true" : "/dashboard");
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            err.message ||
            "Authentication failed",
        );
        setLoading(false);
      }
    };

    handleOAuthCallback();
  }, [searchParams, provider, navigate]);

  if (loading) {
    return (
      <Box
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
}
