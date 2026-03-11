import { ThemeProvider, createTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Command,
  FilePlus2,
  LayoutDashboard,
  LucideIcon,
  Search,
  Settings,
  User,
} from "lucide-react";
import {
  FC,
  ReactNode,
  Suspense,
  createContext,
  lazy,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Navigate,
  Outlet,
  Route,
  BrowserRouter as Router,
  Routes,
  useNavigate,
} from "react-router-dom";
import { authApi, type AuthUser } from "./api/client";
import ErrorBoundary from "./components/ErrorBoundary";
import { AppSidebar } from "./components/app-sidebar";
import { SiteHeader } from "./components/site-header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { Input } from "./components/ui/input";
import { Separator } from "./components/ui/separator";
import { SidebarInset, SidebarProvider } from "./components/ui/sidebar";
import { cn } from "./lib/utils";
import type {
  AuthContextType,
  CheckHistoryContextType,
  CheckHistoryEntry,
  ColorModeContextType,
  User as UserType,
} from "./types";

// ============================================================================
// Type Definitions
// ============================================================================

type ColorMode = "light" | "dark";

interface UIActionsContextType {
  openShortcuts: () => void;
  openPalette: () => void;
}

interface ShortcutDef {
  keys: string[];
  description: string;
}

interface PaletteNavItem {
  label: string;
  to: string;
  shortcut: string;
  icon: LucideIcon;
}

interface RecentItem extends PaletteNavItem {
  state?: Record<string, any>;
  date?: string;
  flatIdx?: number;
}

interface PaletteSection {
  label: string;
  items: RecentItem[];
}

interface PageWrapperProps {
  children: ReactNode;
}

interface AppShellLayoutProps {
  children?: ReactNode;
}

interface ProtectedRouteProps {
  children?: ReactNode;
}

interface AdminRouteProps {
  children?: ReactNode;
}

interface KeyboardShortcutsHandlerProps {
  onOpenShortcuts?: () => void;
  onOpenPalette?: () => void;
}

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: (value: boolean) => void;
}

interface KbdKeyProps {
  label: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: (value: boolean) => void;
}

// ============================================================================
// Contexts
// ============================================================================

export const ColorModeContext = createContext<ColorModeContextType>({
  toggleColorMode: () => {},
});

export const CheckHistoryContext = createContext<CheckHistoryContextType>({
  history: [],
  addToHistory: () => {},
  removeFromHistory: () => {},
  clearHistory: () => {},
});

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: () => {},
});

export const UIActionsContext = createContext<UIActionsContextType>({
  openShortcuts: () => {},
  openPalette: () => {},
});

// ============================================================================
// Page Components (Lazy Loaded)
// ============================================================================

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const UploadPage = lazy(() => import("./pages/UploadPage"));
const ReportPage = lazy(() => import("./pages/ReportPage"));
const ProfilesPage = lazy(() => import("./pages/ProfilesPage"));
const PreviewPage = lazy(() => import("./pages/PreviewPage"));
const OAuthCallbackPage = lazy(() => import("./pages/OAuthCallbackPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const BillingPage = lazy(() => import("./pages/BillingPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));

// ============================================================================
// Constants
// ============================================================================

const SHORTCUT_DEFS: ShortcutDef[] = [
  { keys: ["N"], description: "Новый документ" },
  { keys: ["G", "D"], description: "Панель" },
  { keys: ["G", "H"], description: "История" },
  { keys: ["G", "R"], description: "Отчёты" },
  { keys: ["G", "P"], description: "Тарифы" },
  { keys: ["G", "A"], description: "Аккаунт" },
  { keys: ["G", "S"], description: "Настройки" },
  { keys: ["Ctrl", "K"], description: "Командная палитра" },
  { keys: ["?"], description: "Справка по хоткеям" },
];

const PALETTE_NAV_ITEMS: PaletteNavItem[] = [
  { label: "Загрузить документ", to: "/", shortcut: "N", icon: FilePlus2 },
  { label: "Панель", to: "/dashboard", shortcut: "G D", icon: LayoutDashboard },
  { label: "Отчёты", to: "/reports", shortcut: "G R", icon: ArrowUpRight },
  { label: "Тарифы", to: "/pricing", shortcut: "G P", icon: Command },
  { label: "Аккаунт", to: "/account", shortcut: "G A", icon: User },
  { label: "Настройки", to: "/settings", shortcut: "G S", icon: Settings },
];

// ============================================================================
// Loading Component
// ============================================================================

const PageLoader: FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-background px-6">
    <div className="flex flex-col items-center gap-4 text-center">
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.45, 1, 0.45] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
        className="size-14 rounded-2xl border border-border bg-card shadow-surface"
      />
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-foreground/90">
          CURSA
        </p>
        <p className="text-sm text-muted-foreground">Загружаем интерфейс</p>
      </div>
    </div>
  </div>
);

// ============================================================================
// Layout Components
// ============================================================================

const PageWrapper: FC<PageWrapperProps> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    className="h-full w-full"
  >
    {children}
  </motion.div>
);

const AppShellLayout: FC<AppShellLayoutProps> = ({ children }) => (
  <SidebarProvider>
    <AppSidebar variant="inset" />
    <SidebarInset>
      <SiteHeader />
      <motion.main className="relative min-h-0 flex-1 overflow-hidden bg-background">
        {children ?? <Outlet />}
      </motion.main>
    </SidebarInset>
  </SidebarProvider>
);

// ============================================================================
// Route Protection
// ============================================================================

const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useContext(AuthContext);
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children ?? <Outlet />;
};

const AdminRoute: FC<AdminRouteProps> = ({ children }) => {
  const { user, isLoading } = useContext(AuthContext);
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children ?? <Outlet />;
};

// ============================================================================
// UI Components
// ============================================================================

const KbdKey: FC<KbdKeyProps> = ({ label }) => (
  <span className="inline-flex min-w-7 items-center justify-center rounded-md border border-border bg-muted px-2 py-1 font-mono text-[11px] font-semibold text-muted-foreground">
    {label}
  </span>
);

const KeyboardShortcutsModal: FC<KeyboardShortcutsModalProps> = ({ open, onClose }) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="max-w-xl border-border bg-card">
      <DialogHeader>
        <DialogTitle>Горячие клавиши</DialogTitle>
        <DialogDescription>
          Работают вне полей ввода и помогают быстро перемещаться по CURSA.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        {SHORTCUT_DEFS.map(({ keys, description }) => (
          <div
            key={`${description}-${keys.join("-")}`}
            className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-background/70 px-4 py-3"
          >
            <span className="text-sm text-foreground">{description}</span>
            <div className="flex flex-wrap items-center gap-2">
              {keys.map((key) => (
                <KbdKey key={key} label={key} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </DialogContent>
  </Dialog>
);

const CommandPalette: FC<CommandPaletteProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { history } = useContext(CheckHistoryContext);
  const [query, setQuery] = useState<string>("");
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const recentItems = useMemo(
    (): RecentItem[] =>
      history.slice(0, 5).map((entry: CheckHistoryEntry) => ({
        label: entry.fileName || "Документ",
        to: "/report",
        state: { reportData: entry.reportData, fileName: entry.fileName },
        date: new Date(entry.timestamp || entry.id).toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "short",
        }),
        shortcut: "",
        icon: FilePlus2,
      })),
    [history],
  );

  const filteredNavItems = useMemo((): PaletteNavItem[] => {
    if (!query.trim()) return PALETTE_NAV_ITEMS;
    const normalized = query.toLowerCase();
    return PALETTE_NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(normalized));
  }, [query]);

  const filteredRecentItems = useMemo((): RecentItem[] => {
    if (!query.trim()) return recentItems;
    const normalized = query.toLowerCase();
    return recentItems.filter((item) => item.label.toLowerCase().includes(normalized));
  }, [query, recentItems]);

  const sections = useMemo((): PaletteSection[] => {
    const output: PaletteSection[] = [];
    if (filteredNavItems.length)
      output.push({ label: "Навигация", items: filteredNavItems as RecentItem[] });
    if (filteredRecentItems.length) output.push({ label: "Недавние", items: filteredRecentItems });
    let flatIdx = 0;
    return output.map((section) => ({
      ...section,
      items: section.items.map((item) => ({ ...item, flatIdx: flatIdx++ })),
    }));
  }, [filteredNavItems, filteredRecentItems]);

  const flatItems = useMemo(
    (): RecentItem[] => sections.flatMap((section) => section.items),
    [sections],
  );

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  const selectItem = useCallback(
    (item: RecentItem): void => {
      navigate(item.to, { state: item.state });
      onClose(false);
    },
    [navigate, onClose],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>): void => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIdx((current) => Math.min(current + 1, Math.max(flatItems.length - 1, 0)));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIdx((current) => Math.max(current - 1, 0));
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const selected = flatItems[selectedIdx];
        if (selected) selectItem(selected);
      }
    },
    [flatItems, selectedIdx, selectItem],
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl overflow-hidden border-border bg-card p-0">
        <div className="flex items-center gap-3 border-b border-border px-4 py-4">
          <Search className="size-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Перейти к странице или документу..."
            className="border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
          />
          <KbdKey label="Esc" />
        </div>

        <div className="max-h-[420px] overflow-y-auto p-2">
          {!flatItems.length && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Ничего не найдено
            </div>
          )}
          {sections.map((section) => (
            <div key={section.label} className="mb-3">
              <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {section.label}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon || Command;
                  const selected = item.flatIdx === selectedIdx;
                  return (
                    <button
                      key={`${section.label}-${item.label}`}
                      type="button"
                      onClick={() => selectItem(item)}
                      onMouseEnter={() => setSelectedIdx(item.flatIdx ?? 0)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                        selected ? "bg-accent text-accent-foreground" : "hover:bg-accent/60",
                      )}
                    >
                      <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-background/70">
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{item.label}</div>
                        {item.date ? (
                          <div className="text-xs text-muted-foreground">{item.date}</div>
                        ) : null}
                      </div>
                      {item.shortcut ? (
                        <div className="hidden items-center gap-1 md:flex">
                          {item.shortcut.split(" ").map((key) => (
                            <KbdKey key={`${item.label}-${key}`} label={key} />
                          ))}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <Separator />
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <KbdKey label="↑" />
            <KbdKey label="↓" /> выбор
          </span>
          <span className="inline-flex items-center gap-2">
            <KbdKey label="↵" /> открыть
          </span>
          <span className="inline-flex items-center gap-2">
            <KbdKey label="Esc" /> закрыть
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// Keyboard Handler
// ============================================================================

const KeyboardShortcutsHandler: FC<KeyboardShortcutsHandlerProps> = ({
  onOpenShortcuts,
  onOpenPalette,
}) => {
  const navigate = useNavigate();
  const pendingRef = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const ignoredTags = ["INPUT", "TEXTAREA", "SELECT"];
    const sequenceMap: Record<string, string> = {
      d: "/dashboard",
      h: "/history",
      r: "/reports",
      p: "/pricing",
      a: "/account",
      s: "/settings",
    };

    const handler = (event: KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenPalette?.();
        return;
      }

      const target = event.target as HTMLElement;
      if (ignoredTags.includes(target.tagName) || target.isContentEditable) return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const key = event.key.toLowerCase();
      if (pendingRef.current === "g") {
        if (timerRef.current) clearTimeout(timerRef.current);
        pendingRef.current = null;
        if (sequenceMap[key]) {
          event.preventDefault();
          navigate(sequenceMap[key]);
        }
        return;
      }

      if (key === "g") {
        pendingRef.current = "g";
        timerRef.current = setTimeout(() => {
          pendingRef.current = null;
        }, 1500);
        return;
      }

      if (event.key === "?") {
        event.preventDefault();
        onOpenShortcuts?.();
        return;
      }

      if (key === "n") {
        event.preventDefault();
        navigate("/");
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [navigate, onOpenPalette, onOpenShortcuts]);

  return null;
};

// ============================================================================
// Routes
// ============================================================================

const AnimatedRoutes: FC = () => {
  return (
    <Routes>
      <Route element={<AppShellLayout />}>
        <Route
          path="/"
          element={
            <PageWrapper>
              <UploadPage />
            </PageWrapper>
          }
        />
        <Route
          path="/report"
          element={
            <PageWrapper>
              <ReportPage />
            </PageWrapper>
          }
        />
        <Route
          path="/profiles"
          element={
            <PageWrapper>
              <ProfilesPage />
            </PageWrapper>
          }
        />
        <Route
          path="/preview"
          element={
            <PageWrapper>
              <PreviewPage />
            </PageWrapper>
          }
        />
        <Route
          path="/pricing"
          element={
            <PageWrapper>
              <PricingPage />
            </PageWrapper>
          }
        />
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={
              <PageWrapper>
                <DashboardPage />
              </PageWrapper>
            }
          />
          <Route
            path="/history"
            element={
              <PageWrapper>
                <HistoryPage />
              </PageWrapper>
            }
          />
          <Route
            path="/reports"
            element={
              <PageWrapper>
                <ReportsPage />
              </PageWrapper>
            }
          />
          <Route
            path="/account"
            element={
              <PageWrapper>
                <AccountPage />
              </PageWrapper>
            }
          />
          <Route
            path="/settings"
            element={
              <PageWrapper>
                <SettingsPage />
              </PageWrapper>
            }
          />
          <Route
            path="/billing"
            element={
              <PageWrapper>
                <BillingPage />
              </PageWrapper>
            }
          />
        </Route>
        <Route element={<AdminRoute />}>
          <Route
            path="/admin"
            element={
              <PageWrapper>
                <AdminPage />
              </PageWrapper>
            }
          />
        </Route>
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/upload" element={<Navigate to="/" replace />} />
      <Route
        path="/auth/:provider/callback"
        element={
          <PageWrapper>
            <OAuthCallbackPage />
          </PageWrapper>
        }
      />
      <Route path="/check" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// ============================================================================
// Main App Content
// ============================================================================

const AppContent: FC = () => {
  const [shortcutsOpen, setShortcutsOpen] = useState<boolean>(false);
  const [paletteOpen, setPaletteOpen] = useState<boolean>(false);
  const openShortcuts = useCallback(() => setShortcutsOpen(true), []);
  const openPalette = useCallback(() => setPaletteOpen(true), []);

  return (
    <UIActionsContext.Provider value={{ openShortcuts, openPalette }}>
      <div className="relative min-h-screen bg-background">
        <Suspense fallback={<PageLoader />}>
          <KeyboardShortcutsHandler onOpenShortcuts={openShortcuts} onOpenPalette={openPalette} />
          <AnimatedRoutes />
        </Suspense>
        <KeyboardShortcutsModal open={shortcutsOpen} onClose={setShortcutsOpen} />
        <CommandPalette open={paletteOpen} onClose={setPaletteOpen} />
      </div>
    </UIActionsContext.Provider>
  );
};

// ============================================================================
// Main App Component
// ============================================================================

const App: FC = () => {
  const [mode, setMode] = useState<ColorMode>(() => {
    const stored = localStorage.getItem("colorMode");
    return (stored as ColorMode) || "light";
  });
  const [checkHistory, setCheckHistory] = useState<CheckHistoryEntry[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("checkHistory") || "[]");
    } catch {
      return [];
    }
  });
  const [user, setUser] = useState<UserType | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Update dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setAuthLoading(false);
      return;
    }
    authApi
      .me(token)
      .then((data) => {
        let authUser: AuthUser | undefined;
        if ("user" in data) {
          authUser = (data as { user?: AuthUser }).user;
        } else if ("email" in data) {
          authUser = data as AuthUser;
        }

        if (authUser) {
          setUser({
            id: "",
            email: authUser.email || "",
            name: `${authUser.first_name || ""} ${authUser.last_name || ""}`.trim(),
            role: "user",
            created_at: new Date().toISOString(),
          });
        }
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      })
      .finally(() => setAuthLoading(false));
  }, []);

  // Auth functions
  const authLogin = useCallback(async (email: string, password: string): Promise<void> => {
    const data = await authApi.login(email, password);
    localStorage.setItem("access_token", data.access_token);
    if (data.refresh_token) {
      localStorage.setItem("refresh_token", data.refresh_token);
    } else {
      localStorage.removeItem("refresh_token");
    }
    const user = data.user || { email, first_name: "", last_name: "" };
    setUser({
      id: "",
      email: user.email || email,
      name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || email,
      role: (user as any).role || "user",
      created_at: new Date().toISOString(),
    });
  }, []);

  const authRegister = useCallback(
    async (email: string, password: string, name: string): Promise<void> => {
      const [firstName = "", lastName = ""] = name.split(" ");
      const data = await authApi.register({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      });
      // RegisterResponse doesn't have tokens, user needs to login after registration
      if (data.user) {
        setUser({
          id: "",
          email: data.user.email || email,
          name: `${data.user.first_name || ""} ${data.user.last_name || ""}`.trim() || name,
          role: "user",
          created_at: new Date().toISOString(),
        });
      }
    },
    [],
  );

  const authLogout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  }, []);

  const updateUser = useCallback((userPatch: Partial<UserType>) => {
    setUser((prev) => (prev ? { ...prev, ...userPatch } : null));
  }, []);

  // Context values
  const authContextValue: AuthContextType = useMemo(
    () => ({
      user,
      token: localStorage.getItem("access_token"),
      isLoading: authLoading,
      isAuthenticated: !!user,
      login: authLogin,
      register: authRegister,
      logout: authLogout,
      updateUser,
    }),
    [user, authLoading, authLogin, authRegister, authLogout, updateUser],
  );

  const colorMode: ColorModeContextType = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((previous) => {
          const next = previous === "light" ? "dark" : "light";
          localStorage.setItem("colorMode", next);
          return next;
        });
      },
    }),
    [],
  );

  // History functions
  const addToHistory = useCallback((entry: Omit<CheckHistoryEntry, "id" | "timestamp">) => {
    setCheckHistory((previous) => {
      const id = String(Date.now());
      const next = [
        {
          ...entry,
          id,
          timestamp: Date.now(),
        } as CheckHistoryEntry,
        ...previous,
      ].slice(0, 100);
      localStorage.setItem("checkHistory", JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFromHistory = useCallback((id: string | number) => {
    const idStr = String(id);
    setCheckHistory((previous) => {
      const next = previous.filter((item) => String(item.id) !== idStr);
      localStorage.setItem("checkHistory", JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setCheckHistory([]);
    localStorage.removeItem("checkHistory");
  }, []);

  const historyContextValue: CheckHistoryContextType = useMemo(
    () => ({ history: checkHistory, addToHistory, removeFromHistory, clearHistory }),
    [checkHistory, addToHistory, removeFromHistory, clearHistory],
  );

  // MUI theme
  const muiTheme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <CheckHistoryContext.Provider value={historyContextValue}>
        <AuthContext.Provider value={authContextValue}>
          <ThemeProvider theme={muiTheme}>
            <ErrorBoundary>
              <Router>
                <AppContent />
              </Router>
            </ErrorBoundary>
          </ThemeProvider>
        </AuthContext.Provider>
      </CheckHistoryContext.Provider>
    </ColorModeContext.Provider>
  );
};

export default App;
