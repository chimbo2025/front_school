import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight, ShieldCheck, X, LogOut, User as UserIcon } from 'lucide-react';
import { schoolConfig } from '../config/schoolConfig';
import { User as UserType } from '../services/auth';

export type AdminTab = 'students' | 'finance' | 'grades' | 'register';

export interface AdminNavChild {
  id: AdminTab;
  label: string;
  /** Opens a modal instead of switching tabs, e.g. the printable fee statement. */
  action?: 'preview-fees';
}

export interface AdminNavItem {
  id: AdminTab;
  label: string;
  hint: string;
  badge: string;
  badgeClassName: string;
  icon: React.ComponentType<{ className?: string }>;
  /** When present the item becomes an expandable group with sub-navigation. */
  children?: AdminNavChild[];
}

interface AdminSidebarProps {
  items: AdminNavItem[];
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onPreviewFees: () => void;
  onBackToSite: () => void;
  onClose?: () => void;
  user: UserType | null;
  onLogout: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  items,
  activeTab,
  onSelectTab,
  onPreviewFees,
  onBackToSite,
  onClose,
  user,
  onLogout,
}) => {
  const groupOf = (tab: AdminTab) =>
    items.find((item) => item.children?.some((c) => c.id === tab))?.id;

  const [expanded, setExpanded] = useState<AdminTab[]>(() => {
    const owner = groupOf(activeTab);
    return owner ? [owner] : [];
  });

  // Keep the group that owns the active tab open on navigation
  useEffect(() => {
    const owner = groupOf(activeTab);
    if (owner) setExpanded((prev) => (prev.includes(owner) ? prev : [...prev, owner]));
  }, [activeTab, items]);

  const handleSelect = (tab: AdminTab) => {
    onSelectTab(tab);
    onClose?.();
  };

  const toggleGroup = (item: AdminNavItem) => {
    setExpanded((prev) =>
      prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
    );
    if (activeTab !== item.id) handleSelect(item.id);
  };

  const isGroupActive = (item: AdminNavItem) =>
    item.children?.some((c) => c.id === activeTab) ?? false;

  return (
    <div className="flex h-full flex-col bg-[#0f172a] text-slate-300">
      {/* Brand / Identity */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/10 px-4">
        <img
          src="/logo.jpeg"
          alt={`${schoolConfig.shortName} Logo`}
          className="w-9 h-9 shrink-0 rounded-lg object-cover shadow-md"
        />
        <div className="min-w-0">
          <div className="truncate text-[13px] font-bold leading-tight text-white">
            {schoolConfig.shortName}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-emerald-400">
            <ShieldCheck className="h-3 w-3" />
            Staff Admin
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Main Menu
        </p>
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.id === activeTab;
            const groupActive = isGroupActive(item);
            const isOpen = expanded.includes(item.id);
            const hasChildren = Boolean(item.children?.length);

            return (
              <li key={item.id}>
                <button
                  onClick={() => (hasChildren ? toggleGroup(item) : handleSelect(item.id))}
                  aria-current={active || groupActive ? 'page' : undefined}
                  aria-expanded={hasChildren ? isOpen : undefined}
                  className={`group relative flex w-full items-center gap-3 rounded-xl py-2.5 pl-4 pr-3 text-left transition-colors ${
                    active || groupActive
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                  }`}
                >
                  {/* Active left accent bar */}
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#7c3aed] transition-opacity duration-200 ${
                      active || groupActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      active || groupActive
                        ? 'text-[#a78bfa]'
                        : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-tight">{item.label}</span>
                    <span className="block truncate text-[10px] text-slate-500">{item.hint}</span>
                  </span>

                  {hasChildren ? (
                    <ChevronRight
                      className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform duration-200 ${
                        isOpen ? 'rotate-90' : ''
                      }`}
                    />
                  ) : (
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${item.badgeClassName}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>

                {/* Sub-navigation */}
                {hasChildren && (
                  <div
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <ul className="mt-1 space-y-0.5 border-l border-white/10 pl-3 ml-4">
                        {item.children!.map((child) => {
                          const childActive = !child.action && child.id === activeTab;
                          return (
                            <li key={`${child.id}-${child.action ?? 'tab'}`}>
                              <button
                                onClick={() => {
                                  if (child.action === 'preview-fees') {
                                    onSelectTab(item.id);
                                    onPreviewFees();
                                    onClose?.();
                                    return;
                                  }
                                  handleSelect(child.id);
                                }}
                                aria-current={childActive ? 'page' : undefined}
                                className={`flex w-full items-center gap-2 rounded-lg py-2 pl-3 pr-2 text-left text-xs font-medium transition-colors ${
                                  childActive
                                    ? 'bg-[#7c3aed]/20 text-white'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                                }`}
                              >
                                <span
                                  aria-hidden="true"
                                  className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                                    childActive ? 'bg-[#a78bfa]' : 'bg-slate-600'
                                  }`}
                                />
                                <span className="truncate">{child.label}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <p className="px-3 pb-2 pt-7 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Session
        </p>
        <div className="mx-1 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7c3aed]/25 text-[11px] font-bold text-[#c4b5fd]">
              {user?.first_name?.[0] || user?.username?.[0] || 'A'}{user?.last_name?.[0] || ''}
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-white">
                {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username || 'Admissions Officer'}
              </div>
              <div className="truncate text-[10px] text-slate-500">{schoolConfig.location}</div>
            </div>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/10 p-3 space-y-2">
        <button
          onClick={onBackToSite}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Public Portal</span>
        </button>
        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};