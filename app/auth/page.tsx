'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Mountain, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        setError(error.message);
      } else {
        if (isSignUp) {
          setError('Check your email to confirm your account!');
        } else {
          router.push('/');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-20 rounded-full bg-gradient-to-br from-primary to-glacier mb-4">
            <Mountain size={36} className="text-background-dark" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-wide mb-2">
            SIDECOUNTRY SCOUT
          </h1>
          <p className="text-slate-400 text-sm">
            Your backcountry safety companion
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-surface-dark border border-primary/20 rounded-2xl p-8 shadow-2xl">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setIsSignUp(false); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg font-display font-bold text-sm uppercase tracking-wider transition-all ${
                !isSignUp
                  ? 'bg-primary text-background-dark'
                  : 'bg-surface-lighter text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg font-display font-bold text-sm uppercase tracking-wider transition-all ${
                isSignUp
                  ? 'bg-primary text-background-dark'
                  : 'bg-surface-lighter text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-display font-medium text-slate-300 mb-2 uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-background-dark/50 border border-primary/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-display font-medium text-slate-300 mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 bg-background-dark/50 border border-primary/20 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="••••••••"
                />
              </div>
              {isSignUp && (
                <p className="text-xs text-slate-500 mt-1">
                  Must be at least 6 characters
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                error.includes('Check your email')
                  ? 'bg-primary/10 border border-primary/30'
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <AlertCircle size={18} className={error.includes('Check your email') ? 'text-primary' : 'text-red-400'} />
                <p className={`text-sm ${error.includes('Check your email') ? 'text-primary' : 'text-red-400'}`}>
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-br from-primary to-glacier text-background-dark font-display font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                <>{isSignUp ? 'Create Account' : 'Sign In'}</>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
