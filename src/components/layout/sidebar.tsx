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

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full bg-surface border-r border-border-subtle shrink-0 select-none z-30 overflow-hidden",
        "transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        sidebarCollapsed ? "w-[76px]" : "w-[280px]"
      )}
    >
      <div className="flex items-center justify-between h-16 px-5 border-b border-border-subtle shrink-0">
        <div
          className={cn(
            "flex items-center gap-2.5 transition-opacity duration-200 overflow-hidden",
            sidebarCollapsed ? "opacity-0 pointer-events-none w-0" : "opacity-100"
          )}
        >
          <span className="font-display text-2xl tracking-tight text-foreground font-normal">
            AVERA
          </span>
        </div>

        <button
          onClick={toggleSidebar}
          className={cn(
            "p-2 rounded text-muted hover:text-foreground hover:bg-surface-raised transition-colors shrink-0",
            sidebarCollapsed && "mx-auto"
          )}
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
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group relative flex items-center h-12 px-3 rounded transition-colors duration-150 select-none",
                  isActive
                    ? "text-foreground font-medium"
                    : "text-muted hover:text-foreground hover:bg-surface-raised/40"
                )}
                title={sidebarCollapsed ? label : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute inset-0 bg-surface-raised rounded shadow-[inset_0_0_0_1px_rgba(25,26,24,0.06)]"
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 35,
                      mass: 0.6,
                    }}
                  />
                )}

                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-bar"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-primary rounded-r z-10"
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 35,
                      mass: 0.6,
                    }}
                  />
                )}

                <div className="w-8 h-8 flex items-center justify-center shrink-0 relative z-10">
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-foreground" : "text-muted group-hover:text-foreground"
                    )}
                  />
                </div>

                <span
                  className={cn(
                    "ml-3.5 text-[15px] tracking-wide whitespace-nowrap transition-opacity duration-200 font-medium relative z-10",
                    sidebarCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </LayoutGroup>
    </aside>
  );
}
