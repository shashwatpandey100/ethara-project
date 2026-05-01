"use client";

import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FolderKanban,
  PanelLeft,
  PanelRight,
  Settings,
  Zap,
} from "lucide-react";
import React, { createContext, useContext, useState, useEffect } from "react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserAvatar } from "@/components/common/user-avatar";
import { Logo } from "./logo";
import { Separator } from "@/components/ui/separator";
import {
  BreadcrumbProvider,
  DashboardBreadcrumb,
  getBreadcrumbCrumbs,
  useBreadcrumbOverride,
} from "@/components/common/dashboard-breadcrumb";
import type { BreadcrumbCrumb } from "@/components/common/dashboard-breadcrumb";

const SIDEBAR_ITEMS = [
  {
    groupLabel: "Content",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: <LayoutDashboard size={16} />,
      },
      {
        label: "My Projects",
        href: "/dashboard/projects",
        icon: <FolderKanban size={16} />,
      },
    ],
  },
  {
    groupLabel: "Account",
    items: [
      {
        label: "Settings",
        href: "/dashboard/settings",
        icon: <Settings size={16} />,
      },
    ],
  },
];

const SidebarContext = createContext<{
  collapsed: boolean;
  toggle: () => void;
  closeSidebar: () => void;
}>({ collapsed: false, toggle: () => {}, closeSidebar: () => {} });

const useSidebar = () => useContext(SidebarContext);

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", collapsed ? "60px" : "240px");
  }, [collapsed]);

  const toggle = () => setCollapsed((prev) => !prev);
  const closeSidebar = () => setCollapsed(true);

  return (
    <BreadcrumbProvider>
      <SidebarContext.Provider value={{ collapsed, toggle, closeSidebar }}>
        <main className="fixed top-0 left-0 flex h-screen w-screen flex-col overflow-hidden">
          <Header />
          <section className="flex h-[calc(100vh-36px)] overflow-hidden bg-app-bg">
            <Sidebar showAppHeader />
            <div className="flex h-full flex-1 flex-col overflow-hidden bg-[#efeada0f] pl-1 pr-2.5 py-2">
              <div className="flex min-h-0 flex-1 flex-col rounded-2xl bg-white overflow-hidden">
                <AppHeader fallbackCrumbs={getBreadcrumbCrumbs(pathname)} />
                <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
              </div>
            </div>
          </section>
        </main>
      </SidebarContext.Provider>
    </BreadcrumbProvider>
  );
}

const AppHeader = ({ fallbackCrumbs }: { fallbackCrumbs: BreadcrumbCrumb[] }) => {
  const { collapsed, toggle } = useSidebar();
  const override = useBreadcrumbOverride();
  const crumbs = override ?? fallbackCrumbs;

  return (
    <div className="flex h-12.5 w-full items-center justify-between border-b px-4">
      <div className="flex items-center gap-2">
        <div className={`${collapsed && "hidden"} h-full w-max transition-all duration-300`}>
          <Button
            variant="ghost"
            onClick={toggle}
            className="h-full w-max rounded-md hover:bg-app-bg shadow-none"
          >
            {collapsed ? <PanelLeft size={24} /> : <PanelRight size={24} />}
          </Button>
        </div>
        <DashboardBreadcrumb crumbs={crumbs} />
      </div>
      <UserAvatar />
    </div>
  );
};

const Header = () => {
  return (
    <header className="flex h-9 w-full items-center bg-linear-to-b from-yellow-200/70 to-yellow-100/70">
      <span className="flex h-full w-full items-center justify-center text-[13px] text-black underline">
        This product is in development stage. Some features may be unstable-contact support for help.
      </span>
    </header>
  );
};

const SidebarHeader = ({ showAppHeader }: { showAppHeader: boolean }) => {
  const { collapsed } = useSidebar();
  return (
    <div className="flex w-full items-center justify-between px-2.5 py-4">
      <Link href="/dashboard" className={`${collapsed && "mx-auto"} mt-2 flex items-center gap-2`}>
        <Logo compact={collapsed} />
      </Link>
      {!showAppHeader && !collapsed ? (
        <span className="mb-2 h-9 w-9" />
      ) : null}
    </div>
  );
};

const Sidebar = ({ showAppHeader }: { showAppHeader: boolean }) => {
  const { collapsed, toggle } = useSidebar();
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: collapsed ? 60 : 240,
        transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      className="flex shrink-0 flex-col overflow-hidden bg-[#efeada0f]"
    >
      <SidebarHeader showAppHeader={showAppHeader} />
      <div className="flex flex-1 flex-col space-y-1 overflow-x-hidden overflow-y-auto px-2.5 py-4">
        {collapsed && (
          <button onClick={toggle} className="mb-2">
            <SideBarItem
              label="Show Sidebar"
              icon={<PanelLeft size={16} />}
              href="#"
              isSelected={false}
            />
          </button>
        )}
        {SIDEBAR_ITEMS.map((group, groupIndex) => (
          <React.Fragment key={groupIndex}>
            <GroupName
              collapsed={collapsed}
              label={group.groupLabel}
              className={groupIndex > 0 ? "mt-4" : ""}
            />
            {group.items.map((item, itemIndex) => (
              <SideBarItem
                key={itemIndex}
                label={item.label}
                icon={item.icon}
                href={item.href}
                isSelected={
                  item.href === "/dashboard"
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + "/")
                }
              />
            ))}
          </React.Fragment>
        ))}
      </div>
      <Separator />
      <div className="h-max w-full px-2.5 py-2.5">
        <button className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg border bg-[linear-gradient(360deg,#ffffff_0%,#ffffffcc_20%,#ffffff00_65%),repeating-linear-gradient(135deg,#e5e7eb,#e5e7eb_4px,#f3f4f6_4px,#f3f4f6_8px)] whitespace-nowrap">
          <span className="shrink-0 rounded-full bg-gray-900 p-1">
            <Zap className="text-white" size={14} />
          </span>
          <span
            className={`text-sm font-semibold text-gray-900 transition-opacity duration-300 ${collapsed ? "hidden" : "opacity-100"}`}
          >
            Upgrade
          </span>
        </button>
      </div>
    </aside>
  );
};

function GroupName({
  label,
  collapsed,
  className,
}: {
  label: string;
  collapsed: boolean;
  className?: string;
}) {
  return (
    <div
      className={`mb-1.5 overflow-hidden px-2 font-mono text-[11px] whitespace-nowrap text-gray-500 uppercase transition-all duration-300 ${
        collapsed ? "mb-0 h-px border-t border-gray-200 opacity-100" : "h-4 opacity-100"
      } ${className}`}
    >
      {label}
    </div>
  );
}

function SideBarItem({
  label,
  icon,
  href,
  isSelected,
}: {
  label: string;
  icon: React.ReactNode;
  href: string;
  isSelected: boolean;
}) {
  const { collapsed } = useSidebar();
  const content = (
    <Link
      href={href}
      className={`group flex h-9 items-center overflow-hidden rounded-md ${isSelected ? "bg-[#141414]" : "hover:bg-black/5"}`}
    >
      <div
        className={`flex aspect-square h-full shrink-0 items-center justify-center px-2 py-1.5 ${collapsed && "w-full"} ${
          isSelected ? "text-gray-200" : "text-gray-500"
        }`}
      >
        {icon}
      </div>
      <div
        className={`ml-2 truncate text-[14px] transition-opacity duration-300 group-hover:underline ${
          collapsed ? "w-0 opacity-0" : "opacity-100"
        } ${isSelected ? "underline text-gray-200" : "text-gray-800"}`}
      >
        {label}
      </div>
    </Link>
  );

  if (!collapsed) return content;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
