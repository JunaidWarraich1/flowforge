import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Workflow, Mail, Lock, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      // Handled in store
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background text-zinc-100 selection:bg-primary selection:text-black">
      {/* Left Column: Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md mx-auto"
        >
          {/* Brand header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#d4af37] to-[#f59e0b] flex items-center justify-center shadow-gold-active">
              <Workflow className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                FlowForge
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary">
                  Pro
                </span>
              </h1>
              <p className="text-xs text-zinc-400 font-mono">
                Visual Workflow Engine
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Welcome back
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Sign in to manage and execute your automation pipelines.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 mb-5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              required
              placeholder="engineer@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4 text-zinc-500" />}
            />

            <Input
              label="Password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-zinc-500" />}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2 shadow-gold-active"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>

            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-border" />
              </div>
              <span className="relative bg-background px-3 text-[11px] uppercase font-mono tracking-wider text-zinc-500">
                Or Quick Access
              </span>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full border border-primary/30 hover:border-primary/60 text-primary-light hover:bg-primary/5 transition-all"
              onClick={async () => {
                setEmail('demo@flowforge.dev');
                setPassword('Password123!');
                clearError();
                try {
                  await login({ email: 'demo@flowforge.dev', password: 'Password123!' });
                  navigate('/dashboard');
                } catch (err) {}
              }}
            >
              <Sparkles className="w-4 h-4 mr-2 text-primary" />
              Explore Live Demo (1-Click)
            </Button>
          </form>

          <p className="text-center text-xs text-zinc-400 mt-8">
            Don't have an account yet?{' '}
            <Link
              to="/register"
              className="text-primary hover:text-primary-light font-semibold underline underline-offset-4"
            >
              Create account
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Column: Hero Graphic - Carbon & Champagne Gold */}
      <div className="hidden lg:flex flex-1 relative bg-background-deep items-center justify-center p-12 overflow-hidden border-l border-surface-border">
        <div className="absolute inset-0 dot-grid-bg opacity-40" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-lg space-y-6 text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            ENTERPRISE AUTOMATION
          </div>

          <h3 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Build high-throughput workflows without glue code.
          </h3>

          <p className="text-base text-zinc-400 leading-relaxed">
            Drag-and-drop reactive DAGs with instant Python execution, real-time
            WebSocket observability, and robust error tracing.
          </p>

          <div className="pt-4 space-y-3">
            {[
              'Deterministic DAG Topological Execution',
              'Real-Time Node Status Stream via WebSockets',
              'Sub-millisecond State Transitions & Tracing',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
