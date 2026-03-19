"use client";

import {
  BarChartIcon,
  DatabaseIcon,
  FolderIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from "lucide-react";
import * as React from "react";

import { useContext } from "react";

import { AuthContext } from "../App";

import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";

const data = {
  user: {
    name: "Пользователь CURSA",
    email: "user@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Обзор",
      url: "/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: "История",
      url: "/history",
      icon: FolderIcon,
    },
    {
      title: "Отчёты",
      url: "/reports",
      icon: BarChartIcon,
    },
    {
      title: "Профили",
      url: "/profiles",
      icon: DatabaseIcon,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useContext(AuthContext) as {
    user?: { email?: string; first_name?: string; name?: string; role?: string } | null;
  };

  const navSecondary = [
    {
      title: "Аккаунт",
      url: "/account",
      icon: UserCircleIcon,
    },
    {
      title: "Настройки",
      url: "/settings",
      icon: SettingsIcon,
    },
    ...(user?.role === "admin"
      ? [
          {
            title: "Администрирование",
            url: "/admin",
            icon: ShieldCheckIcon,
          },
        ]
      : []),
  ];

  const currentUser = {
    name: user?.first_name || user?.name || "Пользователь CURSA",
    email: user?.email || data.user.email,
    avatar: data.user.avatar,
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <div>
                <LayoutDashboardIcon className="h-5 w-5" />
                <span className="text-base font-semibold">CURSA</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
