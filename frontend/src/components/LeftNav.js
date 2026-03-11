import {
  FileCheck2,
  HelpCircle,
  History,
  LayoutDashboard,
  LogIn,
  MoreHorizontal,
  PanelsTopLeft,
  Search,
  Settings,
  Shield,
} from "lucide-react";
import { useContext } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";

import { AuthContext, UIActionsContext } from "../App";
import { cn } from "../lib/utils";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";

const navGroups = [
  {
    label: "Рабочее пространство",
    items: [
      { label: "Главная", icon: FileCheck2, to: "/" },
      { label: "Панель", icon: LayoutDashboard, to: "/dashboard" },
      { label: "История", icon: History, to: "/history" },
    ],
  },
  {
    label: "Документы",
    items: [
      { label: "Профили", icon: PanelsTopLeft, to: "/profiles" },
      { label: "Отчёты", icon: FileCheck2, to: "/reports" },
    ],
  },
];

const utilityItems = [
  { label: "Настройки", icon: Settings, to: "/settings", type: "link" },
  { label: "Помощь", icon: HelpCircle, action: "shortcuts", type: "action" },
  { label: "Поиск", icon: Search, action: "palette", type: "action" },
];

const LeftNav = ({ width = 248 }) => {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const { openPalette, openShortcuts } = useContext(UIActionsContext);
  const userLabel = user?.first_name || user?.name || user?.email?.split("@")[0] || "Аккаунт";
  const userInitial = (
    user?.first_name?.[0] ||
    user?.name?.[0] ||
    user?.email?.[0] ||
    "U"
  ).toUpperCase();

  const renderNavItem = (item, compact = false) => {
    const active =
      location.pathname === item.to ||
      (item.to !== "/" && item.to && location.pathname.startsWith(item.to));
    const Icon = item.icon;

    return (
      <RouterLink
        key={item.to}
        to={item.to}
        className={cn(
          "group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[10px] transition-colors",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/76 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
          compact && "py-1.5",
        )}
      >
        <div
          className={cn(
            "flex size-6.5 shrink-0 items-center justify-center rounded-[8px]",
            active
              ? "text-sidebar-foreground/55"
              : "text-sidebar-foreground/55 group-hover:bg-sidebar-accent group-hover:text-sidebar-accent-foreground",
          )}
        >
          <Icon className="size-[14px]" strokeWidth={1.8} />
        </div>
        <div className={cn("min-w-0 flex-1 truncate font-medium", active && "font-semibold")}>
          {item.label}
        </div>
      </RouterLink>
    );
  };

  const renderUtilityItem = (item) => {
    const Icon = item.icon;

    if (item.type === "link") {
      return renderNavItem(item, true);
    }

    return (
      <button
        key={item.label}
        type="button"
        onClick={() => (item.action === "palette" ? openPalette() : openShortcuts())}
        className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[12px] text-sidebar-foreground/76 transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
      >
        <div className="flex size-6.5 shrink-0 items-center justify-center rounded-[8px] text-sidebar-foreground/55 group-hover:bg-sidebar-accent group-hover:text-sidebar-accent-foreground">
          <Icon className="size-[14px]" strokeWidth={1.8} />
        </div>
        <span className="font-medium">{item.label}</span>
      </button>
    );
  };

  return (
    <aside
      className="sticky top-0 flex h-screen flex-col overflow-hidden border-r border-sidebar-border bg-sidebar px-2.5 py-0 text-sidebar-foreground"
      style={{ width, minWidth: width }}
    >
      <RouterLink
        to="/"
        className="flex h-14 items-center gap-2 rounded-none px-2 py-1.5 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <div className="flex size-6 items-center justify-center rounded-full border border-sidebar-border text-sidebar-foreground">
          <div className="size-2 rounded-full border border-sidebar-foreground/70" />
        </div>
        <div className="min-w-0">
          <div className="brand-heading truncate text-[14px] font-semibold tracking-[-0.02em] text-sidebar-foreground">
            CURSA
          </div>
        </div>
      </RouterLink>

      <div className="-mx-2.5 h-px bg-sidebar-border" />

      <div className="flex-1 overflow-y-auto px-0 pt-3 pr-1">
        <div className="flex flex-col gap-4">
          {navGroups.map((group, index) => (
            <div key={group.label} className="relative">
              {index > 0 && <div className="-mx-2.5 mb-4 h-px bg-sidebar-border" />}
              <div className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/50">
                {group.label}
              </div>
              <nav className="space-y-0.5">{group.items.map((item) => renderNavItem(item))}</nav>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <div className="-mx-2.5 mb-3 h-px bg-sidebar-border" />
        <div className="space-y-0.5">{utilityItems.map((item) => renderUtilityItem(item))}</div>

        {user ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-sidebar-accent/70">
            <RouterLink to="/account" className="flex min-w-0 flex-1 items-center gap-2">
              <Avatar className="size-8 border border-sidebar-border">
                <AvatarFallback className="bg-sidebar-accent text-xs text-sidebar-foreground">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-sidebar-foreground">
                  {userLabel}
                </div>
                <div className="truncate text-[10px] text-sidebar-foreground/42">{user.email}</div>
              </div>
            </RouterLink>
            <button
              type="button"
              onClick={openShortcuts}
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/42 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label="Дополнительные действия аккаунта"
            >
              <MoreHorizontal className="size-[14px]" strokeWidth={1.8} />
            </button>
          </div>
        ) : (
          <Button
            asChild
            variant="outline"
            className="mt-3 h-9 w-full justify-start rounded-xl border-sidebar-border bg-transparent px-2 text-[13px] text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <RouterLink to="/login">
              <LogIn className="size-[14px]" strokeWidth={1.8} />
              Войти
            </RouterLink>
          </Button>
        )}

        {user?.role === "admin" ? (
          <Button
            asChild
            variant="ghost"
            className="mt-1 h-9 w-full justify-start rounded-xl px-2 text-[13px] text-sidebar-foreground/76 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <RouterLink to="/admin">
              <Shield className="size-[14px]" strokeWidth={1.8} />
              Админ-панель
            </RouterLink>
          </Button>
        ) : null}
      </div>
    </aside>
  );
};

export default LeftNav;
