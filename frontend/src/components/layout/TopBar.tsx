import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  User as UserIcon,
  LogOut,
  Settings,
  Bell,
  Activity,
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

  // Compute breadcrumbs
  const pathnames = location.pathname.split('/').filter((x) => x);

  const getBreadcrumbName = (part: string, index: number) => {
    if (part === 'dashboard') return 'Dashboard';
    if (part === 'workflows') return 'Workflows';
    if (part === 'executions') return 'Executions';
    if (part === 'settings') return 'Settings';
    if (pathnames[index - 1] === 'workflows') return 'Workflow Editor';
    if (pathnames[index - 1] === 'executions') return 'Execution Details';
    return part;
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0d0d14]/80 backdrop-blur-md px-6 flex items-center justify-between z-20">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center space-y-0 text-sm">
        <Link
          to="/dashboard"
          className="text-slate-400 hover:text-slate-200 transition-colors font-medium"
        >
          FlowForge
        </Link>
        {pathnames.map((part, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const label = getBreadcrumbName(part, index);

          return (
            <div key={to} className="flex items-center">
              <ChevronRight className="w-4 h-4 mx-2 text-slate-600 shrink-0" />
              {isLast ? (
                <span className="text-slate-100 font-semibold truncate max-w-[200px]">
                  {label}
                </span>
              ) : (
                <Link
                  to={to}
                  className="text-slate-400 hover:text-slate-200 transition-colors truncate max-w-[150px]"
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
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>ENGINE ONLINE</span>
        </div>

        {/* User Menu Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 pl-3 rounded-full bg-[#151522] border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <span className="text-xs font-medium text-slate-300 hidden md:inline">
              {user?.full_name?.split(' ')[0] || 'Account'}
            </span>
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-xs font-bold">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-[#12121c] border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50">
              <div className="px-4 py-2 border-b border-slate-800/80">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {user?.full_name}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>

              <Link
                to="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Settings
              </Link>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
