import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Workflow, Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await register({ full_name: fullName, email, password });
      navigate('/dashboard');
    } catch (err) {
      // Handled in store
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0a0a0f] text-slate-100 selection:bg-primary selection:text-white">
      {/* Left Column: Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md mx-auto"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-glow-primary">
              <Workflow className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                FlowForge
              </h1>
              <p className="text-xs text-slate-500 font-mono">
                Visual Workflow Engine
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Create an account
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Start building visual pipelines in seconds.
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
              label="Full Name"
              type="text"
              required
              placeholder="Muhammad Junaid"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<User className="w-4 h-4 text-slate-500" />}
            />

            <Input
              label="Email address"
              type="email"
              required
              placeholder="engineer@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4 text-slate-500" />}
            />

            <Input
              label="Password"
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-slate-500" />}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Get Started
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-violet-400 hover:text-violet-300 font-semibold underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Column: Hero Graphic */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-[#120d24] via-[#0d1024] to-[#080811] items-center justify-center p-12 overflow-hidden border-l border-slate-800/80">
        <div className="absolute inset-0 dot-grid-bg opacity-30" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-lg space-y-6 text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            ENTERPRISE GRADE SECURITY
          </div>

          <h3 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Developer first automation infrastructure.
          </h3>

          <p className="text-base text-slate-400 leading-relaxed">
            Construct reactive computational DAGs, configure HTTP requests, logic
            branches, and custom Python transformations with zero setup.
          </p>
        </div>
      </div>
    </div>
  );
};
