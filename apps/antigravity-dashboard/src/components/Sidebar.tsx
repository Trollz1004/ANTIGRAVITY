import { useStore } from "@/store";
import { Icon } from "@/lib/icons";
import { NAV } from "@/data";
import { motion } from "framer-motion";
import clsx from "@/lib/clsx";
import type { PageId } from "@/types";

const ICON_FOR: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard: Icon.LayoutDashboard,
  Users: Icon.Users,
  Workflow: Icon.Workflow,
  Radio: Icon.Radio,
  StickyNote: Icon.StickyNote,
  Banknote: Icon.Banknote,
  Coins: Icon.Coins,
  Settings: Icon.Settings,
};

export function Sidebar() {
  const page = useStore((s) => s.page);
  const setPage = useStore((s) => s.setPage);
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useStore((s) => s.toggleSidebar);

  // group nav by `group` field
  const groups: { name: string; items: typeof NAV }[] = [];
  for (const item of NAV) {
    const last = groups[groups.length - 1];
    if (!last || last.name !== item.group) {
      groups.push({ name: item.group, items: [item] });
    } else {
      last.items.push(item);
    }
  }

  return (
    <motion.aside
      data-testid="sidebar"
      data-collapsed={collapsed}
      initial={false}
      animate={{ width: collapsed ? 64 : 244 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      className="relative z-20 h-screen bg-ag-surface border-r border-ag-elevated flex flex-col"
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-ag-elevated">
        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-brand to-[#2a1235] grid place-items-center shadow-[0_0_0_1px_rgba(255,107,53,0.35),0_6px_18px_rgba(255,107,53,0.25)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2 4 8v10l8 4 8-4V8l-8-6Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M12 6 8 9v6l4 2 4-2V9l-4-3Z" stroke="white" strokeWidth="1.4" strokeLinejoin="round" opacity="0.7" />
            <circle cx="12" cy="12" r="1.4" fill="white" />
          </svg>
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <div className="font-data font-extrabold text-sm tracking-wider">ANTIGRAVITY</div>
            <div className="font-label text-[9px] tracking-[0.22em] text-ink-dim uppercase mt-1">
              v3 · Sabertooth
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {groups.map((g) => (
          <div key={g.name} className="space-y-1">
            {!collapsed && (
              <div className="font-label text-[9px] tracking-[0.22em] uppercase text-ink-dim/80 px-3 py-2">
                {g.name}
              </div>
            )}
            {g.items.map((it) => {
              const Ic = ICON_FOR[it.icon];
              const isActive = page === (it.id as PageId);
              return (
                <button
                  key={it.id}
                  data-testid={`nav-${it.id}`}
                  onClick={() => setPage(it.id as PageId)}
                  title={collapsed ? it.label : undefined}
                  className={clsx(
                    "nav-item relative w-full",
                    isActive && "is-active",
                    collapsed && "justify-center px-0",
                  )}
                >
                  {Ic && <Ic size={16} className="shrink-0" />}
                  {!collapsed && <span className="truncate">{it.label}</span>}
                  {!collapsed && it.badge && (
                    <span className="ml-auto text-[9px] font-label tracking-wider text-brand border border-brand/30 px-1.5 py-0.5 rounded-sharp bg-brand/5">
                      {it.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer / collapse */}
      <div className="border-t border-ag-elevated px-2 py-3 flex items-center">
        <button
          onClick={toggleSidebar}
          data-testid="sidebar-toggle"
          className="nav-item w-full"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? (
            <Icon.ChevronsRight size={16} className="mx-auto" />
          ) : (
            <>
              <Icon.ChevronsLeft size={16} />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
