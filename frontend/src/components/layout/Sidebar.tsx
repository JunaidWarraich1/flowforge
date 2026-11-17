import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GitBranch,
  PlaySquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Workflow,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Workflows', icon: GitBranch, path: '/workflows' },
    { label: 'Executions', icon: PlaySquare, path: '/executions' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const getInitials = (name?: string) => {
    if (!name) return 'JW';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <aside
      className={`relative flex flex-col h-screen bg-[#0b0b0c] border-r border-[#2a2822] transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#2a2822]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-md bg-[#141416] border border-primary/50 flex items-center justify-center shrink-0 shadow-sm">
            <Workflow className="w-5 h-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-wide text-zinc-100 flex items-center gap-1.5">
                Flow<span className="text-primary font-mono">Forge</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono tracking-wider flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-primary" /> v1.0.0 ENGINE
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-md hover:bg-zinc-800/60 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/30 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#141416]'
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-[#2a2822] bg-[#070708]">
        <div
          className={`flex items-center gap-3 p-2 rounded-md bg-[#141416] border border-[#2a2822] ${
            collapsed ? 'justify-center p-2' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-md bg-[#1f1d17] border border-primary/40 flex items-center justify-center text-xs font-bold text-primary shrink-0 shadow-sm">
            {getInitials(user?.full_name)}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-zinc-200 truncate">
                {user?.full_name || 'Muhammad Junaid Warraich'}
              </p>
              <p className="text-[11px] text-zinc-400 truncate font-mono">
                {user?.email || 'j.warraich2004@gmail.com'}
              </p>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={handleLogout}
              className="text-zinc-400 hover:text-rose-400 p-1.5 rounded-md hover:bg-zinc-800/60 transition-colors shrink-0"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
