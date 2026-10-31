"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Heart,
  Moon,
  Zap,
  Activity,
  FlaskConical,
  Bluetooth,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { motion, LayoutGroup } from "motion/react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store";
import { useUserProfile } from "@/lib/auth/use-profile";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/recovery", label: "Recovery", icon: Heart },
  { href: "/sleep", label: "Sleep", icon: Moon },
  { href: "/activity", label: "Activity", icon: Zap },
  { href: "/vitals", label: "Vitals", icon: Activity },
  { href: "/lab", label: "AVERA Lab", icon: FlaskConical },
  { href: "/devices", label: "Devices", icon: Bluetooth },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, profile } = useUserProfile();

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full bg-surface border-r border-border-subtle shrink-0 select-none z-30",
        "transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        sidebarCollapsed ? "w-[68px]" : "w-[280px]"
      )}
    >
      <div
        className={cn(
          "flex items-center h-16 border-b border-border-subtle shrink-0",
          sidebarCollapsed ? "justify-center px-0" : "justify-between px-5"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2.5 transition-opacity duration-200 overflow-hidden",
            sidebarCollapsed ? "hidden opacity-0 pointer-events-none" : "flex opacity-100"
          )}
        >
          <span className="font-display text-2xl tracking-tight text-foreground font-normal">
            AVERA
          </span>
        </div>

        <button
          onClick={toggleSidebar}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-surface-raised transition-colors shrink-0"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-4.5 w-4.5" />
          ) : (
            <PanelLeftClose className="h-4.5 w-4.5" />
          )}
        </button>
      </div>

      <LayoutGroup id="sidebar-nav">
        <nav
          className={cn(
            "flex-1 py-4 space-y-2 overflow-y-auto overflow-x-hidden",
            sidebarCollapsed ? "px-2.5" : "px-3"
          )}
        >
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                prefetch={true}
                className={cn(
                  "group relative flex items-center rounded-lg transition-colors select-none",
                  sidebarCollapsed
                    ? "w-11 h-11 mx-auto justify-center"
                    : "h-12 px-3 justify-start",
                  isActive
                    ? "text-foreground font-medium"
                    : "text-muted hover:text-foreground hover:bg-surface-raised/40"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute inset-0 bg-surface-raised rounded-lg border border-border-subtle/80 shadow-sm"
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 35,
                      mass: 0.6,
                    }}
                  />
                )}

                <div className="w-5 h-5 flex items-center justify-center shrink-0 relative z-10">
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-foreground" : "text-muted group-hover:text-foreground"
                    )}
                  />
                </div>

                {!sidebarCollapsed && (
                  <span className="ml-3.5 text-[15px] tracking-wide whitespace-nowrap font-medium relative z-10 transition-opacity">
                    {label}
                  </span>
                )}

                {sidebarCollapsed && (
                  <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded bg-foreground text-background text-xs font-mono tracking-wide shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap">
                    {label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </LayoutGroup>

      {/* User Identity / Settings Shortcut */}
      <div className={cn("p-2.5 border-t border-border-subtle shrink-0", sidebarCollapsed ? "px-2" : "px-3")}>
        <Link
          href="/settings"
          prefetch={true}
          className={cn(
            "group relative flex items-center rounded-lg transition-colors hover:bg-surface-raised select-none",
            sidebarCollapsed ? "w-11 h-11 mx-auto justify-center" : "h-12 px-2.5 gap-3"
          )}
        >
          {profile?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt={profile.fullName || user?.name || "User"}
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-full border border-border object-cover shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-surface-raised border border-border text-foreground flex items-center justify-center text-[11px] font-mono font-medium shrink-0">
              {(profile?.fullName || user?.name || "U").slice(0, 1).toUpperCase()}
            </div>
          )}

          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-medium text-foreground truncate leading-tight">
                {profile?.fullName || user?.name || "AVERA User"}
              </p>
              <p className="text-[10px] font-mono text-muted truncate">
                {profile?.username ? `@${profile.username}` : user?.email || "Settings"}
              </p>
            </div>
          )}

          {sidebarCollapsed && (
            <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-2.5 py-1 rounded bg-foreground text-background text-xs font-mono tracking-wide shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap">
              {profile?.fullName || user?.name || "Settings"}
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}
