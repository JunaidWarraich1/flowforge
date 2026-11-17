import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  User as UserIcon,
  LogOut,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const TopBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pathnames = location.pathname.split('/').filter((x) => x);

  const getBreadcrumbName = (part: string, index: number) => {
    if (part === 'dashboard') return 'Dashboard';
    if (part === 'workflows') return 'Workflows';
    if (part === 'executions') return 'Executions';
    if (part === 'settings') return 'Settings';
    if (pathnames[index - 1] === 'workflows') return 'Workflow Editor';
    if (pathnames[index - 1] === 'executions') return 'Execution Telemetry';
    return part;
  };

  return (
    <header className="h-16 border-b border-[#2a2822] bg-[#0b0b0c]/90 backdrop-blur-md px-6 flex items-center justify-between z-20">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center space-y-0 text-sm">
        <Link
          to="/dashboard"
          className="text-zinc-400 hover:text-primary transition-colors font-medium flex items-center gap-1.5"
        >
          <span>Flow</span><span className="text-primary font-mono">Forge</span>
        </Link>
        {pathnames.map((part, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const label = getBreadcrumbName(part, index);

          return (
            <div key={to} className="flex items-center">
              <ChevronRight className="w-3.5 h-3.5 mx-2 text-[#3d392e] shrink-0" />
              {isLast ? (
                <span className="text-zinc-100 font-semibold truncate max-w-[200px]">
                  {label}
                </span>
              ) : (
                <Link
                  to={to}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors truncate max-w-[150px]"
                >
                  {label}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Right Action Icons & Profile */}
      <div className="flex items-center gap-3">
        {/* Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-md bg-[#141416] border border-[#2a2822] text-zinc-300 text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-medium tracking-wide">ENGINE: 0.24ms</span>
        </div>

        {/* User Menu Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1 pl-3 rounded-md bg-[#141416] border border-[#2a2822] hover:border-primary/50 transition-colors"
          >
            <span className="text-xs font-medium text-zinc-200 hidden md:inline">
              {user?.full_name?.split(' ')[0] || 'Junaid'}
            </span>
            <div className="w-7 h-7 rounded bg-[#1f1d17] border border-primary/40 flex items-center justify-center text-primary text-xs font-bold">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-[#141416] border border-[#2a2822] rounded-md shadow-2xl py-1.5 z-50">
              <div className="px-4 py-2 border-b border-[#2a2822]">
                <p className="text-xs font-semibold text-zinc-100 truncate">
                  {user?.full_name || 'Muhammad Junaid Warraich'}
                </p>
                <p className="text-[11px] text-zinc-400 truncate font-mono">
                  {user?.email || 'j.warraich2004@gmail.com'}
                </p>
              </div>

              <Link
                to="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-300 hover:text-primary hover:bg-[#1f1d17] transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-zinc-400" />
                Settings
              </Link>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
