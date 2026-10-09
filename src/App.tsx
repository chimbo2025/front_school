import React, { useState, useEffect, useCallback } from 'react';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { FeeModal } from './components/FeeModal';
import { LandingPage } from './pages/LandingPage';
import { ApplyPage } from './pages/ApplyPage';
import { AdminPage } from './pages/AdminPage';
import { StudentDetailPage } from './pages/StudentDetailPage';
import { LoginPage } from './pages/LoginPage';
import { authService, User, onAuthLogout, triggerAuthLogout } from './services/auth';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(() => authService.getUser());
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getAccessToken();
      if (token) {
        try {
          const userData = await authService.fetchUserProfile(token);
          authService.setUser(userData);
          setUser(userData);
        } catch {
          authService.clear();
          setUser(null);
        }
      }
      setAuthLoading(false);
    };
    initAuth();
  }, []);

  // Listen for auth logout events (triggered by token refresh failure or idle timeout)
  useEffect(() => {
    const handleAuthLogout = () => {
      authService.clear();
      setUser(null);
      navigate('/login');
    };
    return onAuthLogout(handleAuthLogout);
  }, []);
const handleLogin = useCallback((userData: User) => {
    setUser(userData);
  }, []);

  const handleLogout = useCallback(() => {
    authService.clear();
    triggerAuthLogout();
    navigate('/login');
  }, []);


  // Sync state with browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined' && window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Route matching
  const renderCurrentPage = () => {
    // Login route
    if (currentPath === '/login') {
      return <LoginPage onLogin={handleLogin} onNavigate={navigate} />;
    }

    // Protected routes - redirect to login if not authenticated
    const isAdminRoute = currentPath.startsWith('/admin');

    if (isAdminRoute && !user) {
      // Store intended destination and redirect to login
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      return <LoginPage onLogin={handleLogin} onNavigate={navigate} />;
    }

    // Student detail route: /admin/students/:id
    const studentMatch = currentPath.match(/^\/admin\/students\/(.+)$/);
    if (studentMatch && studentMatch[1]) {
      const studentId = studentMatch[1];
      return (
        <StudentDetailPage
          studentId={studentId}
          onNavigate={navigate}
          onOpenFeesModal={() => setIsFeeModalOpen(true)}
          user={user}
          onLogout={handleLogout}
        />
      );
    }

    // Admin root route: /admin
    if (currentPath.startsWith('/admin')) {
      return (
        <AdminPage
          onNavigate={navigate}
          onOpenFeesModal={() => setIsFeeModalOpen(true)}
          onLogout={handleLogout}
          user={user}
        />
      );
    }

    // Apply route: /apply
    if (currentPath === '/apply') {
      return (
        <ApplyPage onNavigate={navigate} />
      );
    }

    // Default: Landing Page
    return (
      <LandingPage
        onNavigate={navigate}
        onOpenFeesModal={() => setIsFeeModalOpen(true)}
      />
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  const isFormOrAdmin = currentPath === '/apply' || currentPath.startsWith('/admin');

  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col font-sans antialiased text-slate-800 bg-slate-50 selection:bg-purple-200 selection:text-purple-900">
        {/* Render Navbar on Landing Page or Apply Page */}
        {!currentPath.startsWith('/admin') && currentPath !== '/login' && (
          <Navbar
            currentPath={currentPath}
            onNavigate={navigate}
            onOpenFeesModal={() => setIsFeeModalOpen(true)}
            user={user}
          />
        )}

        {/* Page Content */}
        <div className="flex-1">
          {renderCurrentPage()}
        </div>

        {/* Global Fee Structure Modal */}
        <FeeModal
          isOpen={isFeeModalOpen}
          onClose={() => setIsFeeModalOpen(false)}
          size="lg"
        />
      </div>
    </AppProvider>
  );
}
