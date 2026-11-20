import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Eye, EyeOff, KeyRound, Layers, Sparkles } from 'lucide-react';
import { NexusLogo } from '../components/NexusLogo';
import { AuthGeometricIllustration } from '../components/ProjectArtwork';
import { Modal } from '../components/UiPrimitives';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { api } from '../services/api';
import type { UserRole } from '../types/nexus';

function AuthSplitShell({
  heading,
  subcopy,
  children,
}: {
  heading: string;
  subcopy: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#F8F8FC] dark:bg-[#0D0E14]">
      {/* Left Brand Showcase */}
      <div className="lg:col-span-5 bg-[#171725] text-white p-8 sm:p-12 flex flex-col justify-between">
        <div>
          <Link to="/" className="inline-flex items-center gap-2.5">
            <NexusLogo size="md" className="[&_span]:text-white" />
          </Link>

          <div className="mt-12">
            <h1 className="font-display font-bold text-3xl sm:text-4xl leading-tight tracking-tight">
              {heading}
            </h1>
            <p className="mt-3 text-sm text-[#B8B9CC] leading-relaxed max-w-md">{subcopy}</p>
          </div>

          <div className="mt-8">
            <AuthGeometricIllustration />
          </div>
        </div>

        <div className="mt-8 space-y-3 pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 text-xs text-[#D8D9E6]">
            <Sparkles className="w-4 h-4 text-[#63CBEA] shrink-0" />
            <span>Structured Gemini problem & feasibility analysis</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#D8D9E6]">
            <Layers className="w-4 h-4 text-[#F47BA7] shrink-0" />
            <span>Side-by-side solution tradeoffs & phased roadmaps</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#D8D9E6]">
            <Check className="w-4 h-4 text-[#7955E8] shrink-0" />
            <span>Export-ready technical reports & hackathon pitches</span>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="lg:col-span-7 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login, loginDemo, pushToast } = useWorkspace();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset password modal
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter both your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password, remember);
      pushToast('Welcome back', 'success');
      navigate('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    setError('');
    try {
      await loginDemo();
      pushToast('Demo workspace ready', 'success', 'Signed in as Hackathon Judge');
      navigate('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start demo mode');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);
    try {
      await api.resetPassword({ email: resetEmail, newPassword: resetNewPass });
      pushToast('Password updated', 'success', 'You can now sign in with your new password.');
      setResetOpen(false);
      setEmail(resetEmail);
      setResetNewPass('');
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <AuthSplitShell
      heading="Welcome back to innovation."
      subcopy="Sign in to continue framing problems, comparing technical pathways, and building with your team."
    >
      <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6 sm:p-8 shadow-[0_16px_40px_-20px_rgba(23,23,37,0.12)]">
        <h2 className="font-display font-bold text-2xl text-[#171725] dark:text-[#F4F4FA]">
          Sign in to NEXUS AI
        </h2>
        <p className="text-sm text-[#777789] dark:text-[#9C9DB2] mt-1">
          Enter your workspace credentials below.
        </p>

        {error && (
          <div className="mt-4 rounded-xl bg-[#FEF2F2] dark:bg-[#3A1C1E] border border-[#FECACA] dark:border-[#7F1D1D] px-3.5 py-2.5 text-xs text-[#DC2626] dark:text-[#FCA5A5]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-semibold text-[#171725] dark:text-[#F4F4FA] mb-1.5">
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm text-[#171725] dark:text-[#F4F4FA] focus:outline-none focus:ring-2 focus:ring-[#7955E8]/40 focus:border-[#7955E8]"
              required
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-semibold text-[#171725] dark:text-[#F4F4FA] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] pl-3.5 pr-10 py-2.5 text-sm text-[#171725] dark:text-[#F4F4FA] focus:outline-none focus:ring-2 focus:ring-[#7955E8]/40 focus:border-[#7955E8]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
                title={showPass ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#777789] hover:text-[#171725] dark:hover:text-white"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="inline-flex items-center gap-2 text-[#777789] dark:text-[#9C9DB2] cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-[#ECECF2] text-[#7955E8] focus:ring-[#7955E8]"
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setResetEmail(email);
                setResetError('');
                setResetOpen(true);
              }}
              className="font-semibold text-[#7955E8] hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#7955E8] text-white text-sm font-semibold hover:bg-[#6641D9] transition-colors disabled:opacity-60"
          >
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#ECECF2] dark:bg-[#23263A]" />
          <span className="text-[11px] font-medium text-[#777789]">Or quick access</span>
          <div className="h-px flex-1 bg-[#ECECF2] dark:bg-[#23263A]" />
        </div>

        <button
          type="button"
          onClick={handleDemo}
          disabled={demoLoading}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] text-sm font-semibold text-[#171725] dark:text-[#F4F4FA] hover:border-[#7955E8] transition-colors disabled:opacity-60"
        >
          <KeyRound className="w-4 h-4 text-[#7955E8]" />
          <span>{demoLoading ? 'Preparing Demo...' : 'Enter Demo Mode (Hackathon Judges)'}</span>
        </button>

        <p className="mt-6 text-center text-xs text-[#777789] dark:text-[#9C9DB2]">
          New to NEXUS AI?{' '}
          <Link to="/register" className="font-semibold text-[#7955E8] hover:underline">
            Create an account
          </Link>
        </p>
      </div>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset Account Password"
        description="Enter your registered account email and choose a new password."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          {resetError && (
            <div className="rounded-xl bg-[#FEF2F2] dark:bg-[#3A1C1E] border border-[#FECACA] px-3 py-2 text-xs text-[#DC2626]">
              {resetError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold mb-1.5">Account Email</label>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">New Password (min 6 characters)</label>
            <input
              type="password"
              value={resetNewPass}
              onChange={(e) => setResetNewPass(e.target.value)}
              minLength={6}
              required
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setResetOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resetLoading}
              className="px-4 py-2 rounded-xl bg-[#7955E8] text-white text-xs font-semibold"
            >
              {resetLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Modal>
    </AuthSplitShell>
  );
}

const ROLES: UserRole[] = ['Student', 'Developer', 'Researcher', 'Innovator', 'Hackathon Lead'];

export function RegisterPage() {
  const { register, loginDemo, pushToast } = useWorkspace();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [institution, setInstitution] = useState('');
  const [role, setRole] = useState<UserRole>('Innovator');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!acceptTerms) {
      setError('Please accept the Terms of Service and Privacy Policy.');
      return;
    }
    setLoading(true);
    try {
      await register({ name, email, password, institution, role });
      pushToast('Account created', 'success', 'Welcome to NEXUS AI');
      navigate('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      await loginDemo();
      pushToast('Demo workspace ready', 'success');
      navigate('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start demo mode');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <AuthSplitShell
      heading="Build solutions that matter."
      subcopy="Create your workspace to analyze real-world problems, evaluate solution options, and ship structured projects."
    >
      <div className="rounded-2xl bg-white dark:bg-[#151722] border border-[#ECECF2] dark:border-[#23263A] p-6 sm:p-8 shadow-[0_16px_40px_-20px_rgba(23,23,37,0.12)]">
        <h2 className="font-display font-bold text-2xl text-[#171725] dark:text-[#F4F4FA]">
          Create your account
        </h2>
        <p className="text-sm text-[#777789] dark:text-[#9C9DB2] mt-1">
          Set up your NEXUS AI profile in under a minute.
        </p>

        {error && (
          <div className="mt-4 rounded-xl bg-[#FEF2F2] dark:bg-[#3A1C1E] border border-[#FECACA] dark:border-[#7F1D1D] px-3.5 py-2.5 text-xs text-[#DC2626] dark:text-[#FCA5A5]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <div>
            <label htmlFor="reg-name" className="block text-xs font-semibold mb-1">
              Full Name
            </label>
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Maya Lin"
              required
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-xs font-semibold mb-1">
              Email Address
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@organization.org"
              required
              className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="reg-inst" className="block text-xs font-semibold mb-1">
                Institution (optional)
              </label>
              <input
                id="reg-inst"
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="University or Lab"
                className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="reg-role" className="block text-xs font-semibold mb-1">
                Primary Role
              </label>
              <select
                id="reg-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="reg-pass" className="block text-xs font-semibold mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-pass"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  required
                  className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] pl-3.5 pr-9 py-2.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  title={showPass ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#777789]"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="reg-confirm" className="block text-xs font-semibold mb-1">
                Confirm Password
              </label>
              <input
                id="reg-confirm"
                type={showPass ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                required
                className="w-full rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          <label className="flex items-start gap-2.5 text-xs text-[#777789] dark:text-[#9C9DB2] cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 rounded border-[#ECECF2] text-[#7955E8]"
            />
            <span>
              I agree to the{' '}
              <Link to="/terms" className="text-[#7955E8] font-medium hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-[#7955E8] font-medium hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#7955E8] text-white text-sm font-semibold hover:bg-[#6641D9] transition-colors disabled:opacity-60"
          >
            <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleDemo}
            disabled={demoLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#ECECF2] dark:border-[#2A2E45] bg-[#F8F8FC] dark:bg-[#1C1F2E] text-xs font-semibold text-[#171725] dark:text-[#F4F4FA] hover:border-[#7955E8] transition-colors"
          >
            <KeyRound className="w-4 h-4 text-[#7955E8]" />
            <span>{demoLoading ? 'Entering Demo...' : 'Or Explore Judge Demo Mode'}</span>
          </button>
        </div>

        <p className="mt-5 text-center text-xs text-[#777789] dark:text-[#9C9DB2]">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#7955E8] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthSplitShell>
  );
}
