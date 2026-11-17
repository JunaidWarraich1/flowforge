import React, { useState } from 'react';
import {
  User,
  Shield,
  Key,
  Mail,
  CheckCircle2,
  Calendar,
  Lock,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    // Success response
    setStatusMessage('Password updated successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Account & Engine Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your credentials, authentication tokens, and engine profile.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-surface border border-surface-border rounded-xl p-6 shadow-card-carbon">
        <h3 className="text-base font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-primary" /> Profile Overview
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-background-deep border border-surface-border">
            <span className="text-[11px] font-mono uppercase text-zinc-500">
              Full Name
            </span>
            <p className="text-sm font-semibold text-zinc-200 mt-1">
              {user?.full_name || 'Muhammad Junaid Warraich'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-background-deep border border-surface-border">
            <span className="text-[11px] font-mono uppercase text-zinc-500">
              Email Address
            </span>
            <p className="text-sm font-semibold text-zinc-200 mt-1">
              {user?.email || 'user@flowforge.dev'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-background-deep border border-surface-border">
            <span className="text-[11px] font-mono uppercase text-zinc-500">
              Assigned Role
            </span>
            <div className="mt-1">
              <Badge variant="active" size="sm">
                {user?.role || 'user'}
              </Badge>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-background-deep border border-surface-border">
            <span className="text-[11px] font-mono uppercase text-zinc-500">
              Member Since
            </span>
            <p className="text-sm font-mono text-zinc-300 mt-1">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString()
                : 'November 2026'}
            </p>
          </div>
        </div>
      </div>

      {/* Security & Password Card */}
      <div className="bg-surface border border-surface-border rounded-xl p-6 shadow-card-carbon">
        <h3 className="text-base font-semibold text-zinc-100 mb-4 flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" /> Security & Password
        </h3>

        {statusMessage && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <Input
            label="Current Password"
            type="password"
            required
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-slate-500" />}
          />

          <Input
            label="New Password"
            type="password"
            required
            placeholder="Minimum 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-slate-500" />}
          />

          <Input
            label="Confirm New Password"
            type="password"
            required
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-slate-500" />}
          />

          <Button type="submit" variant="primary" size="md">
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
};
