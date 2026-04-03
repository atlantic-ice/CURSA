import { FC, useContext, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { AuthContext } from "../App";
import { authApi } from "../api/client";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { cn } from "../lib/utils";

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

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  yandex: "Yandex",
  telegram: "Telegram",
};

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
      <div
        className={cn(
          "flex min-h-screen items-center justify-center overflow-hidden bg-background px-4",
          className,
        )}
      >
        <Card className="w-full max-w-md rounded-[32px] border-border/70 bg-card/95 shadow-surface backdrop-blur-xl">
          <CardContent className="flex flex-col items-center gap-5 px-8 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
              <div className="size-6 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary/70">
                OAuth Callback
              </p>
              <h1 className="text-2xl font-semibold tracking-[-0.04em] text-card-foreground">
                Завершаем вход через {PROVIDER_LABELS[provider || ""] || "провайдера"}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Получаем токены и подготавливаем пользовательскую сессию.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "flex min-h-screen items-center justify-center overflow-hidden bg-background px-4",
          className,
        )}
      >
        <Card className="w-full max-w-lg rounded-[32px] border-border/70 bg-card/95 shadow-surface backdrop-blur-xl">
          <CardContent className="space-y-5 px-8 py-8">
            <div className="rounded-3xl border border-destructive/40 bg-destructive/10 p-5 text-destructive">
              <p className="text-base font-semibold">Ошибка входа</p>
              <p className="mt-2 text-sm leading-relaxed text-destructive/90">{error}</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Возврат в приложение
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Авторизация не завершилась. Можно вернуться на главную и повторить вход.
              </p>
            </div>

            <Button className="w-full rounded-2xl" onClick={() => navigate("/")}>
              Вернуться на главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default OAuthCallbackPage;
