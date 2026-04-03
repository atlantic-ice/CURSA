import { motion } from "framer-motion";
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Copy,
    Eye,
    EyeOff,
    Key,
    Loader2,
    Plus,
    Power,
    RefreshCw,
    Shield,
    Trash2
} from "lucide-react";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

import {
    apiKeysApi,
    type ApiKeyAuditEvent,
    type ApiKeyData,
    type ApiKeyUsageMetrics,
} from "../api/client";
import AppPageLayout from "../components/layout/AppPageLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Separator } from "../components/ui/separator";
import { cn } from "../lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface APIKeysPageProps {
  className?: string;
}

interface CreateKeyDialog {
  isOpen: boolean;
  name: string;
  selectedScopes: string[];
  isLoading: boolean;
}

interface RevokeKeyDialog {
  isOpen: boolean;
  keyId: number | null;
  keyName: string;
  isLoading: boolean;
}

interface BulkDisableDialog {
  isOpen: boolean;
  isLoading: boolean;
}

// ─── Animation helpers ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger = {
  show: { transition: { staggerChildren: 0.06 } },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVAILABLE_SCOPES = [
  { id: "document:check", label: "Проверка документов", icon: "✓" },
  { id: "document:correct", label: "Исправление документов", icon: "✎" },
  { id: "document:view", label: "Просмотр документов", icon: "👁" },
];

const formatDate = (iso: string | null): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (iso: string | null): string => {
  if (!iso) return "Никогда";
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFreshness = (timestamp: number, nowTimestamp: number): string => {
  const diffMs = Math.max(0, nowTimestamp - timestamp);
  const totalMinutes = Math.floor(diffMs / 60000);

  if (totalMinutes < 1) {
    return "только что";
  }

  if (totalMinutes < 60) {
    return `${totalMinutes}м назад`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}ч ${minutes}м назад`;
};

const AUDIT_EVENT_LABELS: Record<string, string> = {
  api_key_created: "Ключ создан",
  api_key_updated: "Параметры ключа обновлены",
  api_key_revoked: "Ключ отозван",
  api_key_regenerated: "Ключ пересоздан",
};

const maskApiKey = (prefix: string): string => {
  return `${prefix}••••••••••••••••`;
};

const formatResetCountdown = (iso: string, nowTimestamp: number): string => {
  const resetTime = new Date(iso).getTime();
  const diffMs = resetTime - nowTimestamp;

  if (Number.isNaN(resetTime) || diffMs <= 0) {
    return "сейчас";
  }

  const totalMinutes = Math.ceil(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes}м`;
  }

  return `${hours}ч ${minutes}м`;
};

const formatAuditExportTimestamp = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
};

type QuotaSeverity = "ok" | "warning" | "critical";
type RiskFilter = "all" | "critical" | "warning" | "ok" | "active";
type SortMode = "risk" | "name" | "created_desc" | "usage_desc";
type AuditEventFilter = "all" | "api_key_created" | "api_key_updated" | "api_key_revoked" | "api_key_regenerated";

const API_KEYS_RISK_FILTER_STORAGE_KEY = "api_keys_risk_filter";
const API_KEYS_SEARCH_STORAGE_KEY = "api_keys_search_query";
const API_KEYS_SORT_MODE_STORAGE_KEY = "api_keys_sort_mode";
const API_KEYS_PAGE_SIZE_STORAGE_KEY = "api_keys_page_size";
const API_KEYS_AUDIT_EVENT_FILTER_STORAGE_KEY = "api_keys_audit_event_filter";
const API_KEYS_AUDIT_LIMIT_STORAGE_KEY = "api_keys_audit_limit";
const API_KEYS_AUDIT_SEARCH_STORAGE_KEY = "api_keys_audit_search_query";

const getQuotaSeverity = (usageMetrics: ApiKeyUsageMetrics): QuotaSeverity => {
  if (usageMetrics.hourly_remaining === null || usageMetrics.rate_limit <= 0) {
    return "ok";
  }

  const percentRemaining = (usageMetrics.hourly_remaining / usageMetrics.rate_limit) * 100;

  if (percentRemaining <= 10) {
    return "critical";
  }

  if (percentRemaining <= 30) {
    return "warning";
  }

  return "ok";
};

const getUsagePercent = (usageMetrics: ApiKeyUsageMetrics): number | null => {
  if (usageMetrics.rate_limit <= 0) {
    return null;
  }

  const rawPercent = (usageMetrics.usage_count_last_hour / usageMetrics.rate_limit) * 100;
  return Math.max(0, Math.min(100, Math.round(rawPercent)));
};

const getSeverityRank = (severity: QuotaSeverity): number => {
  if (severity === "critical") return 0;
  if (severity === "warning") return 1;
  return 2;
};

const getUsageSeverity = (usageMetrics?: ApiKeyUsageMetrics): QuotaSeverity => {
  if (!usageMetrics) {
    return "ok";
  }

  return getQuotaSeverity(usageMetrics);
};

// ─── Sub-components ──────────────────────────────────────────────────────────

interface ApiKeyCardProps {
  apiKey: ApiKeyData;
  usageMetrics?: ApiKeyUsageMetrics;
  nowTimestamp: number;
  onRevoke: (id: number, name: string) => void;
  onRegenerate?: (id: number) => void;
  onToggleActive?: (id: number, isActive: boolean) => void;
  isRegenerating?: boolean;
  isTogglingActive?: boolean;
}

const ApiKeyCard: FC<ApiKeyCardProps> = ({
  apiKey,
  usageMetrics,
  nowTimestamp,
  onRevoke,
  onRegenerate,
  onToggleActive,
  isRegenerating = false,
  isTogglingActive = false,
}) => {
  const [revealed, setRevealed] = useState(false);
  const quotaSeverity = usageMetrics ? getQuotaSeverity(usageMetrics) : null;
  const usagePercent = usageMetrics ? getUsagePercent(usageMetrics) : null;

  return (
    <motion.div variants={fadeUp}>
      <Card className={cn("relative overflow-hidden", !apiKey.is_active && "opacity-60")}>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-emerald-500/[0.03] via-transparent to-blue-500/[0.03]" />

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Key className="size-4 text-emerald-500" />
                <CardTitle className="text-base font-semibold">{apiKey.name}</CardTitle>
                {apiKey.is_active ? (
                  <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700 text-xs">
                    <CheckCircle className="mr-1 size-2.5" />
                    Активен
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    Отключён
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                ID: <span className="font-mono">{apiKey.id}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Key preview */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <code className="text-sm font-mono text-slate-600 dark:text-slate-300 break-all">
                  {revealed ? apiKey.key_prefix + "..." : maskApiKey(apiKey.key_prefix)}
                </code>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRevealed(!revealed)}
                  className="h-6 w-6 p-0"
                >
                  {revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey.key_prefix);
                    toast.success("Скопировано в буфер обмена");
                  }}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">Создан</span>
              <p className="font-mono text-xs">{formatDate(apiKey.created_at)}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Истекает</span>
              <p className="font-mono text-xs">{formatDate(apiKey.expires_at)}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Использовано</span>
              <p className="font-bold text-xs">{apiKey.usage_count}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Последний раз</span>
              <p className="text-xs flex items-center gap-1">
                <Clock className="size-2.5" />
                {formatTime(apiKey.last_used_at)}
              </p>
            </div>
          </div>

          {usageMetrics && (
            <div className="rounded-md border bg-muted/30 p-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Запросов за 1ч</span>
                  <p className="font-semibold">{usageMetrics.usage_count_last_hour}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Осталось за 1ч</span>
                  <p
                    className={cn(
                      "font-semibold",
                      quotaSeverity === "warning" && "text-amber-600",
                      quotaSeverity === "critical" && "text-red-600",
                    )}
                  >
                    {usageMetrics.hourly_remaining === null ? "∞" : usageMetrics.hourly_remaining}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                <span className="text-muted-foreground">Сброс лимита через {formatResetCountdown(usageMetrics.rate_limit_reset_at, nowTimestamp)}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "h-5 px-1.5 text-[10px]",
                    quotaSeverity === "warning" && "border-amber-300 text-amber-700",
                    quotaSeverity === "critical" && "border-red-300 text-red-700",
                  )}
                >
                  {quotaSeverity === "critical"
                    ? "Критично"
                    : quotaSeverity === "warning"
                      ? "Низкий остаток"
                      : "Норма"}
                </Badge>
              </div>
              {usagePercent !== null && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Лимит часа</span>
                    <span className="font-medium">{usagePercent}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        quotaSeverity === "critical" && "bg-red-500",
                        quotaSeverity === "warning" && "bg-amber-500",
                        quotaSeverity === "ok" && "bg-emerald-500",
                      )}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scopes */}
          {apiKey.scopes && apiKey.scopes.length > 0 && (
            <div>
              <span className="text-xs text-muted-foreground mb-2 block">Разрешения</span>
              <div className="flex flex-wrap gap-1.5">
                {apiKey.scopes.map((scope) => (
                  <Badge key={scope} variant="outline" className="text-xs">
                    {scope}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <Separator className="my-2" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {onToggleActive && (
              <Button
                variant={apiKey.is_active ? "outline" : "secondary"}
                size="sm"
                disabled={isTogglingActive}
                onClick={() => onToggleActive(apiKey.id, apiKey.is_active)}
              >
                {isTogglingActive ? (
                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                ) : (
                  <Power className="mr-2 size-3.5" />
                )}
                {apiKey.is_active ? "Отключить" : "Включить"}
              </Button>
            )}
            {onRegenerate && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={isRegenerating}
                onClick={() => onRegenerate(apiKey.id)}
              >
                {isRegenerating ? (
                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 size-3.5" />
                )}
                {isRegenerating ? "Пересоздание..." : "Пересоздать"}
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => onRevoke(apiKey.id, apiKey.name)}
            >
              <Trash2 className="mr-2 size-3.5" />
              Отозвать
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────

const APIKeysPage: FC<APIKeysPageProps> = ({ className }) => {
  const accessToken =
    typeof window !== "undefined" ? (localStorage.getItem("accessToken") ?? "") : "";

  // State
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [usageByKeyId, setUsageByKeyId] = useState<Record<number, ApiKeyUsageMetrics>>({});
  const [auditEvents, setAuditEvents] = useState<ApiKeyAuditEvent[]>([]);

  const [loading, setLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);
  const [isTabVisible, setIsTabVisible] = useState<boolean>(true);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>(() => {
    if (typeof window === "undefined") {
      return "all";
    }

    const stored = window.localStorage.getItem(API_KEYS_RISK_FILTER_STORAGE_KEY);
    if (stored === "critical" || stored === "warning" || stored === "ok" || stored === "active") {
      return stored;
    }

    return "all";
  });
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem(API_KEYS_SEARCH_STORAGE_KEY) ?? "";
  });
  const [sortMode, setSortMode] = useState<SortMode>(() => {
    if (typeof window === "undefined") {
      return "risk";
    }

    const stored = window.localStorage.getItem(API_KEYS_SORT_MODE_STORAGE_KEY);
    if (stored === "name" || stored === "created_desc" || stored === "usage_desc") {
      return stored;
    }

    return "risk";
  });
  const [pageSize, setPageSize] = useState<number>(() => {
    if (typeof window === "undefined") {
      return 10;
    }

    const raw = window.localStorage.getItem(API_KEYS_PAGE_SIZE_STORAGE_KEY);
    const parsed = Number(raw);
    if (parsed === 20 || parsed === 50) {
      return parsed;
    }

    return 10;
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastManualRefreshAt, setLastManualRefreshAt] = useState<number>(0);
  const [auditFilterKeyId, setAuditFilterKeyId] = useState<number | null>(null);
  const [auditEventFilter, setAuditEventFilter] = useState<AuditEventFilter>(() => {
    if (typeof window === "undefined") {
      return "all";
    }

    const stored = window.localStorage.getItem(API_KEYS_AUDIT_EVENT_FILTER_STORAGE_KEY);
    if (stored === "api_key_created" || stored === "api_key_updated" || stored === "api_key_revoked" || stored === "api_key_regenerated") {
      return stored;
    }

    return "all";
  });
  const [auditLimit, setAuditLimit] = useState<number>(() => {
    if (typeof window === "undefined") {
      return 10;
    }

    const parsed = Number(window.localStorage.getItem(API_KEYS_AUDIT_LIMIT_STORAGE_KEY));
    if (parsed === 25 || parsed === 50) {
      return parsed;
    }

    return 10;
  });
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.localStorage.getItem(API_KEYS_AUDIT_SEARCH_STORAGE_KEY) ?? "";
  });
  const [regeneratingKeyId, setRegeneratingKeyId] = useState<number | null>(null);
  const [togglingActiveKeyId, setTogglingActiveKeyId] = useState<number | null>(null);
  const [createDialog, setCreateDialog] = useState<CreateKeyDialog>({
    isOpen: false,
    name: "",
    selectedScopes: ["document:check"],
    isLoading: false,
  });
  const [revokeDialog, setRevokeDialog] = useState<RevokeKeyDialog>({
    isOpen: false,
    keyId: null,
    keyName: "",
    isLoading: false,
  });
  const [bulkDisableDialog, setBulkDisableDialog] = useState<BulkDisableDialog>({
    isOpen: false,
    isLoading: false,
  });

  // Load API keys
  const loadApiKeys = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await apiKeysApi.list(accessToken);
      const keys = response.api_keys || [];
      setApiKeys(keys);

      if (keys.length > 0) {
        const usageResponse = await apiKeysApi.getUsageBulk(
          accessToken,
          keys.map((key) => key.id),
        );
        const usageMap: Record<number, ApiKeyUsageMetrics> = {};
        Object.entries(usageResponse.usage_by_key_id || {}).forEach(([keyId, metrics]) => {
          usageMap[Number(keyId)] = metrics;
        });
        setUsageByKeyId(usageMap);
      } else {
        setUsageByKeyId({});
      }
      setLastLoadedAt(Date.now());
      setLoading(false);
    } catch (error) {
      console.error("Failed to load API keys:", error);
      toast.error("Не удалось загрузить API ключи");
      setLoading(false);
    }
  }, [accessToken]);

  const loadAuditHistory = useCallback(async () => {
    if (!accessToken) return;
    setAuditLoading(true);
    try {
      const response = await apiKeysApi.history(accessToken, {
        limit: auditLimit,
        keyId: auditFilterKeyId ?? undefined,
      });
      setAuditEvents(response.items || []);
    } catch (error) {
      console.error("Failed to load API key audit history:", error);
    } finally {
      setAuditLoading(false);
    }
  }, [accessToken, auditFilterKeyId, auditLimit]);

  useEffect(() => {
    loadApiKeys();
    loadAuditHistory();
  }, [loadApiKeys, loadAuditHistory]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTimestamp(Date.now());
    }, 60000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    const timer = window.setInterval(() => {
      if (!document.hidden) {
        void loadApiKeys();
      }
    }, 120000);

    return () => window.clearInterval(timer);
  }, [accessToken, loadApiKeys]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsTabVisible(visible);

      if (!visible) {
        return;
      }

      const isStale = !lastLoadedAt || Date.now() - lastLoadedAt > 120000;
      if (isStale) {
        void loadApiKeys();
      }
    };

    setIsTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [lastLoadedAt, loadApiKeys]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(API_KEYS_RISK_FILTER_STORAGE_KEY, riskFilter);
  }, [riskFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(API_KEYS_SEARCH_STORAGE_KEY, searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(API_KEYS_SORT_MODE_STORAGE_KEY, sortMode);
  }, [sortMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(API_KEYS_PAGE_SIZE_STORAGE_KEY, String(pageSize));
  }, [pageSize]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(API_KEYS_AUDIT_EVENT_FILTER_STORAGE_KEY, auditEventFilter);
  }, [auditEventFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(API_KEYS_AUDIT_LIMIT_STORAGE_KEY, String(auditLimit));
  }, [auditLimit]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(API_KEYS_AUDIT_SEARCH_STORAGE_KEY, auditSearchQuery);
  }, [auditSearchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [riskFilter, searchQuery, sortMode, pageSize]);

  // Create new API key
  const handleCreateKey = async () => {
    if (!createDialog.name.trim()) {
      toast.error("Введите имя ключа");
      return;
    }

    setCreateDialog({ ...createDialog, isLoading: true });
    try {
      const newKey = await apiKeysApi.create(
        {
          name: createDialog.name,
          scopes: createDialog.selectedScopes,
        },
        accessToken
      );

      // Show the full key once (user responsibility to save it)
      if (newKey.key) {
        toast.success(`Ключ создан! Скопируйте его: ${newKey.key}`);
        // Copy to clipboard automatically
        navigator.clipboard.writeText(newKey.key);
      } else {
        toast.success("API ключ создан успешно");
      }

      setCreateDialog({ isOpen: false, name: "", selectedScopes: ["document:check"], isLoading: false });
      await loadApiKeys();
      await loadAuditHistory();
    } catch (error) {
      console.error("Failed to create API key:", error);
      toast.error("Не удалось создать API ключ");
      setCreateDialog({ ...createDialog, isLoading: false });
    }
  };

  // Revoke API key
  const handleRevokeKey = async () => {
    if (revokeDialog.keyId === null) return;

    setRevokeDialog({ ...revokeDialog, isLoading: true });
    try {
      await apiKeysApi.revoke(revokeDialog.keyId, accessToken);

      setApiKeys(apiKeys.filter(k => k.id !== revokeDialog.keyId));
      toast.success("API ключ отозван");
      setRevokeDialog({ isOpen: false, keyId: null, keyName: "", isLoading: false });
      await loadAuditHistory();
    } catch (error) {
      console.error("Failed to revoke API key:", error);
      toast.error("Не удалось отозвать API ключ");
      setRevokeDialog({ ...revokeDialog, isLoading: false });
    }
  };

  const handleRegenerateKey = async (keyId: number) => {
    setRegeneratingKeyId(keyId);
    try {
      const regenerated = await apiKeysApi.regenerate(keyId, accessToken);
      if (regenerated.key) {
        toast.success("Ключ пересоздан. Новый ключ скопирован в буфер обмена");
        navigator.clipboard.writeText(regenerated.key);
      } else {
        toast.success("Ключ успешно пересоздан");
      }

      await loadApiKeys();
      await loadAuditHistory();
    } catch (error) {
      console.error("Failed to regenerate API key:", error);
      toast.error("Не удалось пересоздать API ключ");
    } finally {
      setRegeneratingKeyId(null);
    }
  };

  const handleToggleKeyActive = async (keyId: number, isActive: boolean) => {
    setTogglingActiveKeyId(keyId);
    try {
      await apiKeysApi.update(
        keyId,
        { is_active: !isActive },
        accessToken,
      );

      setApiKeys((prev) =>
        prev.map((key) => (key.id === keyId ? { ...key, is_active: !isActive } : key)),
      );

      toast.success(!isActive ? "API ключ активирован" : "API ключ отключён");
      await loadAuditHistory();
    } catch (error) {
      console.error("Failed to toggle API key active status:", error);
      toast.error("Не удалось изменить статус API ключа");
    } finally {
      setTogglingActiveKeyId(null);
    }
  };

  const toggleScope = (scope: string) => {
    const newScopes = createDialog.selectedScopes.includes(scope)
      ? createDialog.selectedScopes.filter(s => s !== scope)
      : [...createDialog.selectedScopes, scope];
    setCreateDialog({ ...createDialog, selectedScopes: newScopes });
  };

  const handleManualRefreshKeys = useCallback(async () => {
    const now = Date.now();
    if (now - lastManualRefreshAt < 3000) {
      toast("Подождите пару секунд перед следующим обновлением");
      return;
    }

    setLastManualRefreshAt(now);
    await Promise.all([loadApiKeys(), loadAuditHistory()]);
  }, [lastManualRefreshAt, loadApiKeys, loadAuditHistory]);

  const riskSummary = useMemo(() => {
    return apiKeys.reduce(
      (acc, key) => {
        const severity = getUsageSeverity(usageByKeyId[key.id]);
        acc.total += 1;
        acc[severity] += 1;
        if (key.is_active) {
          acc.active += 1;
        }
        return acc;
      },
      {
        total: 0,
        critical: 0,
        warning: 0,
        ok: 0,
        active: 0,
      },
    );
  }, [apiKeys, usageByKeyId]);

  const sortedApiKeys = useMemo(() => {
    const byRisk = (left: ApiKeyData, right: ApiKeyData): number => {
      const leftUsage = usageByKeyId[left.id];
      const rightUsage = usageByKeyId[right.id];

      const leftRank = leftUsage ? getSeverityRank(getQuotaSeverity(leftUsage)) : 3;
      const rightRank = rightUsage ? getSeverityRank(getQuotaSeverity(rightUsage)) : 3;
      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      const leftRemaining = leftUsage?.hourly_remaining ?? Number.MAX_SAFE_INTEGER;
      const rightRemaining = rightUsage?.hourly_remaining ?? Number.MAX_SAFE_INTEGER;
      if (leftRemaining !== rightRemaining) {
        return leftRemaining - rightRemaining;
      }

      if (left.is_active !== right.is_active) {
        return left.is_active ? -1 : 1;
      }

      return left.name.localeCompare(right.name, "ru");
    };

    return [...apiKeys].sort((left, right) => {
      if (sortMode === "name") {
        const nameDiff = left.name.localeCompare(right.name, "ru");
        if (nameDiff !== 0) {
          return nameDiff;
        }

        return byRisk(left, right);
      }

      if (sortMode === "created_desc") {
        const leftCreatedAt = new Date(left.created_at).getTime();
        const rightCreatedAt = new Date(right.created_at).getTime();
        if (leftCreatedAt !== rightCreatedAt) {
          return rightCreatedAt - leftCreatedAt;
        }

        return byRisk(left, right);
      }

      if (sortMode === "usage_desc") {
        if (left.usage_count !== right.usage_count) {
          return right.usage_count - left.usage_count;
        }

        return byRisk(left, right);
      }

      return byRisk(left, right);
    });
  }, [apiKeys, sortMode, usageByKeyId]);

  const visibleApiKeys = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return sortedApiKeys.filter((key) => {
      const usageSeverity = getUsageSeverity(usageByKeyId[key.id]);
      const riskMatch =
        riskFilter === "all"
          ? true
          : riskFilter === "active"
            ? key.is_active
            : usageSeverity === riskFilter;

      if (!riskMatch) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        key.name,
        String(key.id),
        key.key_prefix,
        ...(key.scopes ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [riskFilter, searchQuery, sortedApiKeys, usageByKeyId]);

  const freshnessLabel = useMemo(() => {
    if (!lastLoadedAt) {
      return "загрузка...";
    }

    return formatFreshness(lastLoadedAt, nowTimestamp);
  }, [lastLoadedAt, nowTimestamp]);

  const criticalKeys = useMemo(() => {
    return sortedApiKeys
      .filter((key) => getUsageSeverity(usageByKeyId[key.id]) === "critical")
      .slice(0, 3);
  }, [sortedApiKeys, usageByKeyId]);

  const criticalActiveKeys = useMemo(() => {
    return sortedApiKeys.filter(
      (key) => key.is_active && getUsageSeverity(usageByKeyId[key.id]) === "critical",
    );
  }, [sortedApiKeys, usageByKeyId]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(visibleApiKeys.length / pageSize));
  }, [visibleApiKeys.length, pageSize]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const pagedApiKeys = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return visibleApiKeys.slice(startIndex, startIndex + pageSize);
  }, [currentPage, pageSize, visibleApiKeys]);

  const visibleRange = useMemo(() => {
    if (visibleApiKeys.length === 0) {
      return { from: 0, to: 0 };
    }

    const from = (currentPage - 1) * pageSize + 1;
    const to = Math.min(currentPage * pageSize, visibleApiKeys.length);
    return { from, to };
  }, [currentPage, pageSize, visibleApiKeys.length]);

  const visibleAuditEvents = useMemo(() => {
    const normalizedQuery = auditSearchQuery.trim().toLowerCase();

    return auditEvents.filter((event) => {
      const byEventType = auditEventFilter === "all" || event.event === auditEventFilter;
      if (!byEventType) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        event.event,
        String(event.api_key_id ?? ""),
        String(event.user_id),
        event.ip_address ?? "",
        event.user_agent ?? "",
        JSON.stringify(event.metadata ?? {}),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [auditEventFilter, auditEvents, auditSearchQuery]);

  const handleBulkDisableCriticalKeys = async () => {
    if (criticalActiveKeys.length === 0) {
      setBulkDisableDialog({ isOpen: false, isLoading: false });
      return;
    }

    setBulkDisableDialog({ isOpen: true, isLoading: true });

    let successCount = 0;
    const successfulIds = new Set<number>();
    for (const key of criticalActiveKeys) {
      try {
        await apiKeysApi.update(
          key.id,
          { is_active: false },
          accessToken,
        );
        successCount += 1;
        successfulIds.add(key.id);
      } catch (error) {
        console.error(`Failed to disable critical API key ${key.id}:`, error);
      }
    }

    if (successCount > 0) {
      setApiKeys((prev) =>
        prev.map((key) => (successfulIds.has(key.id) ? { ...key, is_active: false } : key)),
      );
      await Promise.all([loadApiKeys(), loadAuditHistory()]);
    }

    if (successCount === criticalActiveKeys.length) {
      toast.success(`Отключены все критичные ключи (${successCount})`);
    } else {
      toast.error(`Отключено ${successCount} из ${criticalActiveKeys.length} критичных ключей`);
    }

    setBulkDisableDialog({ isOpen: false, isLoading: false });
  };

  const handleExportAuditEvents = () => {
    if (visibleAuditEvents.length === 0) {
      toast("Нет событий для экспорта");
      return;
    }

    const payload = {
      generated_at: new Date().toISOString(),
      filters: {
        key_id: auditFilterKeyId,
        event: auditEventFilter,
        limit: auditLimit,
      },
      total_loaded: auditEvents.length,
      total_exported: visibleAuditEvents.length,
      items: visibleAuditEvents,
    };

    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `api_key_audit_${formatAuditExportTimestamp(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Экспортировано событий: ${visibleAuditEvents.length}`);
  };

  return (
    <AppPageLayout
      title="API Ключи"
      className={className}
    >
      <Toaster position="top-center" />

      <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-6">
        {/* Header Section */}
        <motion.div variants={fadeUp} className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="text-emerald-500" />
              API Ключи
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Создавайте и управляйте API ключами для интеграции CURSA в ваши приложения
              </p>
              <Badge variant="outline" className="text-[10px]">
                Данные: {freshnessLabel}
              </Badge>
              {!isTabVisible && (
                <Badge variant="secondary" className="text-[10px]">Автообновление на паузе</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleManualRefreshKeys} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              Обновить
            </Button>
            <Button
              onClick={() => setCreateDialog({ ...createDialog, isOpen: true })}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="mr-2 size-4" />
              Новый ключ
            </Button>
          </div>
        </motion.div>

        {/* Info Card */}
        <motion.div variants={fadeUp}>
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
            <CardHeader className="pb-3">
              <div className="flex gap-2">
                <AlertCircle className="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Безопасность API ключей
                  </CardTitle>
                  <CardDescription className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                    Никогда не делитесь API ключами публично. Если ключ скомпрометирован, отозовите его немедленно.
                    Используйте отдельные ключи для разных приложений.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className={cn("border", criticalKeys.length > 0 && "border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/30")}>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className={cn("size-4", criticalKeys.length > 0 ? "text-red-600" : "text-emerald-600")} />
                    Горячие риски
                  </CardTitle>
                  <CardDescription>
                    {criticalKeys.length > 0
                      ? `Критичные ключи: ${riskSummary.critical}`
                      : "Критичных ключей сейчас нет"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setBulkDisableDialog({ isOpen: true, isLoading: false })}
                    disabled={criticalActiveKeys.length === 0}
                  >
                    <Power className="mr-2 size-3.5" />
                    Отключить критичные ({criticalActiveKeys.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRiskFilter("critical");
                      setSearchQuery("");
                    }}
                    disabled={riskSummary.critical === 0}
                  >
                    Показать критичные
                  </Button>
                </div>
              </div>
            </CardHeader>
            {criticalKeys.length > 0 && (
              <CardContent className="space-y-2">
                {criticalKeys.map((key) => {
                  const usageMetrics = usageByKeyId[key.id];
                  return (
                    <div
                      key={key.id}
                      className="flex flex-col gap-2 rounded-md border border-red-200 bg-background p-3 dark:border-red-900 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold">{key.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Осталось за 1ч: {usageMetrics?.hourly_remaining ?? "—"} · Сброс через {usageMetrics ? formatResetCountdown(usageMetrics.rate_limit_reset_at, nowTimestamp) : "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-[10px]">Критично</Badge>
                        {key.is_active ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleToggleKeyActive(key.id, true)}
                            disabled={togglingActiveKeyId === key.id}
                          >
                            {togglingActiveKeyId === key.id ? (
                              <Loader2 className="mr-2 size-3.5 animate-spin" />
                            ) : (
                              <Power className="mr-2 size-3.5" />
                            )}
                            Быстро отключить
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">Уже отключён</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        </motion.div>

        {/* API Keys List */}
        <motion.div variants={fadeUp}>
          <Card className="border-dashed">
            <CardContent className="pt-5">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск: имя, id, префикс, scope"
                    className="sm:max-w-sm"
                  />
                  <select
                    className="h-9 rounded-md border bg-background px-2 text-sm sm:w-[220px]"
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                  >
                    <option value="risk">Сортировка: по риску</option>
                    <option value="usage_desc">Сортировка: по использованию</option>
                    <option value="created_desc">Сортировка: новые сначала</option>
                    <option value="name">Сортировка: по имени</option>
                  </select>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setRiskFilter("all");
                      setSearchQuery("");
                    }}
                    disabled={riskFilter === "all" && !searchQuery}
                  >
                    Сбросить фильтры
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant={riskFilter === "all" ? "default" : "outline"}
                    onClick={() => setRiskFilter("all")}
                  >
                    Все ({riskSummary.total})
                  </Button>
                  <Button
                    size="sm"
                    variant={riskFilter === "critical" ? "destructive" : "outline"}
                    onClick={() => setRiskFilter("critical")}
                  >
                    Критично ({riskSummary.critical})
                  </Button>
                  <Button
                    size="sm"
                    variant={riskFilter === "warning" ? "default" : "outline"}
                    className={cn(riskFilter !== "warning" && "border-amber-300 text-amber-700")}
                    onClick={() => setRiskFilter("warning")}
                  >
                    Warning ({riskSummary.warning})
                  </Button>
                  <Button
                    size="sm"
                    variant={riskFilter === "ok" ? "default" : "outline"}
                    className={cn(riskFilter !== "ok" && "border-emerald-300 text-emerald-700")}
                    onClick={() => setRiskFilter("ok")}
                  >
                    Норма ({riskSummary.ok})
                  </Button>
                  <Button
                    size="sm"
                    variant={riskFilter === "active" ? "default" : "outline"}
                    onClick={() => setRiskFilter("active")}
                  >
                    Активные ({riskSummary.active})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : apiKeys.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Key className="size-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground mb-4">Нет API ключей</p>
                <Button
                  onClick={() => setCreateDialog({ ...createDialog, isOpen: true })}
                  variant="outline"
                >
                  <Plus className="mr-2 size-4" />
                  Создать первый ключ
                </Button>
              </CardContent>
            </Card>
          ) : visibleApiKeys.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="size-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground mb-1">По текущим фильтрам ключей нет</p>
                <p className="text-xs text-muted-foreground mb-4">Попробуйте другой фильтр или обновите список</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRiskFilter("all");
                    setSearchQuery("");
                  }}
                >
                  Показать все
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4">
                {pagedApiKeys.map((key) => (
                  <ApiKeyCard
                    key={key.id}
                    apiKey={key}
                    usageMetrics={usageByKeyId[key.id]}
                    nowTimestamp={nowTimestamp}
                    onRevoke={(id, name) => setRevokeDialog({ isOpen: true, keyId: id, keyName: name, isLoading: false })}
                    onRegenerate={handleRegenerateKey}
                    onToggleActive={handleToggleKeyActive}
                    isRegenerating={regeneratingKeyId === key.id}
                    isTogglingActive={togglingActiveKeyId === key.id}
                  />
                ))}
              </div>
              <div className="flex flex-col gap-2 rounded-md border px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between">
                <div className="text-muted-foreground">
                  Показано {visibleRange.from}-{visibleRange.to} из {visibleApiKeys.length}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-muted-foreground">На странице</label>
                  <select
                    className="h-8 rounded-md border bg-background px-2 text-xs"
                    value={String(pageSize)}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage <= 1}
                  >
                    Назад
                  </Button>
                  <span className="text-muted-foreground">{currentPage}/{totalPages}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    Вперёд
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Последние события API ключей</CardTitle>
                <div className="flex items-center gap-2">
                  <select
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                    value={auditFilterKeyId ?? "all"}
                    onChange={(e) => {
                      const nextValue = e.target.value === "all" ? null : Number(e.target.value);
                      setAuditFilterKeyId(nextValue);
                    }}
                  >
                    <option value="all">Все ключи</option>
                    {apiKeys.map((key) => (
                      <option key={key.id} value={key.id}>
                        {key.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                    value={auditEventFilter}
                    onChange={(e) => setAuditEventFilter(e.target.value as AuditEventFilter)}
                  >
                    <option value="all">Все события</option>
                    <option value="api_key_created">Создание</option>
                    <option value="api_key_updated">Обновление</option>
                    <option value="api_key_revoked">Отзыв</option>
                    <option value="api_key_regenerated">Пересоздание</option>
                  </select>
                  <select
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                    value={String(auditLimit)}
                    onChange={(e) => setAuditLimit(Number(e.target.value))}
                  >
                    <option value="10">10 записей</option>
                    <option value="25">25 записей</option>
                    <option value="50">50 записей</option>
                  </select>
                  <Input
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                    placeholder="Поиск по аудиту"
                    className="h-9 w-[170px]"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadAuditHistory}
                    disabled={auditLoading}
                  >
                    {auditLoading ? (
                      <Loader2 className="mr-2 size-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 size-3.5" />
                    )}
                    Обновить
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportAuditEvents}
                    disabled={auditLoading || visibleAuditEvents.length === 0}
                  >
                    Экспорт JSON
                  </Button>
                </div>
              </div>
              <CardDescription>
                Журнал изменений и операций для контроля безопасности ({visibleAuditEvents.length}/{auditEvents.length})
                {auditSearchQuery.trim() ? ` · Поиск: ${auditSearchQuery.trim()}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : visibleAuditEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">События пока отсутствуют</p>
              ) : (
                <div className="space-y-2">
                  {visibleAuditEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {AUDIT_EVENT_LABELS[event.event] ?? event.event}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          key_id: {event.api_key_id ?? "-"}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(event.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Create Key Dialog */}
      <Dialog open={createDialog.isOpen} onOpenChange={(open) =>
        setCreateDialog({ ...createDialog, isOpen: open })
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новый API ключ</DialogTitle>
            <DialogDescription>
              API ключ будет использоваться для аутентификации запросов к CURSA API
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-semibold">Имя ключа</label>
              <Input
                placeholder="например: Production, Testing, Integration"
                value={createDialog.name}
                onChange={(e) => setCreateDialog({ ...createDialog, name: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Разрешения</label>
              <div className="space-y-2">
                {AVAILABLE_SCOPES.map((scope) => (
                  <label key={scope.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createDialog.selectedScopes.includes(scope.id)}
                      onChange={() => toggleScope(scope.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{scope.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialog({ ...createDialog, isOpen: false })}
              disabled={createDialog.isLoading}
            >
              Отмена
            </Button>
            <Button
              onClick={handleCreateKey}
              disabled={createDialog.isLoading || !createDialog.name.trim()}
            >
              {createDialog.isLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Plus className="mr-2 size-4" />
              )}
              Создать ключ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Key Dialog */}
      <Dialog open={revokeDialog.isOpen} onOpenChange={(open) =>
        setRevokeDialog({ ...revokeDialog, isOpen: open })
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отозвать API ключ</DialogTitle>
            <DialogDescription>
              Это действие необратимо. Все приложения, использующие этот ключ, перестанут работать.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3">
              <p className="text-sm">
                Вы собираетесь отозвать ключ: <span className="font-semibold">{revokeDialog.keyName}</span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRevokeDialog({ ...revokeDialog, isOpen: false })}
              disabled={revokeDialog.isLoading}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevokeKey}
              disabled={revokeDialog.isLoading}
            >
              {revokeDialog.isLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 size-4" />
              )}
              Отозвать ключ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Disable Critical Keys Dialog */}
      <Dialog
        open={bulkDisableDialog.isOpen}
        onOpenChange={(open) => {
          if (bulkDisableDialog.isLoading) {
            return;
          }

          setBulkDisableDialog({ ...bulkDisableDialog, isOpen: open });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отключить критичные ключи</DialogTitle>
            <DialogDescription>
              Будут отключены все активные ключи с критичным остатком лимита. Это безопасно и обратимо.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900 dark:bg-red-950/30">
              Найдено активных критичных ключей: <span className="font-semibold">{criticalActiveKeys.length}</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkDisableDialog({ ...bulkDisableDialog, isOpen: false })}
              disabled={bulkDisableDialog.isLoading}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDisableCriticalKeys}
              disabled={bulkDisableDialog.isLoading || criticalActiveKeys.length === 0}
            >
              {bulkDisableDialog.isLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Power className="mr-2 size-4" />
              )}
              Отключить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppPageLayout>
  );
};

export default APIKeysPage;
