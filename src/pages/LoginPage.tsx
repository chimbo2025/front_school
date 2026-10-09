import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { schoolConfig } from '../config/schoolConfig';
import { authService } from '../services/auth';

interface LoginPageProps {
  onLogin: (userData: any) => void;
  onNavigate?: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigate }) => {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(username, password);
      onLogin(authService.getUser());
      if (onNavigate) {
        const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/admin';
        sessionStorage.removeItem('redirectAfterLogin');
        onNavigate(redirectPath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-light flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* School Logo & Header */}
        <div className="text-center mb-8">
          <img
            src="/logo.jpeg"
            alt={`${schoolConfig.name} Logo`}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl object-cover shadow-lg"
          />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">
            {schoolConfig.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Online Admission System - Admin Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="px-6 py-5 sm:px-8 sm:py-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 text-center">Sign in to your account</h2>
              <p className="text-xs text-slate-500 text-center mt-1">
                Use your admin credentials to access the dashboard
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">
                  <p className="font-medium">Sign in failed</p>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full px-3.5 py-2.5 pl-10 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  <ShieldCheck className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2.5 pl-10 pr-10 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-lg text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 text-center">
                Demo credentials: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-primary">admin</code> / <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-primary">admin123</code>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>{schoolConfig.name} &copy; {new Date().getFullYear()}</p>
          <p className="mt-0.5">Secure Admission Management System</p>
        </div>
      </div>
    </div>
  );
};