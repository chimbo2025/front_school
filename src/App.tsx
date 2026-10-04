import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { FeeModal } from './components/FeeModal';
import { LandingPage } from './pages/LandingPage';
import { ApplyPage } from './pages/ApplyPage';
import { AdminPage } from './pages/AdminPage';
import { StudentDetailPage } from './pages/StudentDetailPage';

export default function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);

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
    // Student detail route: /admin/students/:id
    const studentMatch = currentPath.match(/^\/admin\/students\/(.+)$/);
    if (studentMatch && studentMatch[1]) {
      const studentId = studentMatch[1];
      return (
        <StudentDetailPage
          studentId={studentId}
          onNavigate={navigate}
          onOpenFeesModal={() => setIsFeeModalOpen(true)}
        />
      );
    }

    // Admin root route: /admin
    if (currentPath.startsWith('/admin')) {
      return (
        <AdminPage
          onNavigate={navigate}
          onOpenFeesModal={() => setIsFeeModalOpen(true)}
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

  const isFormOrAdmin = currentPath === '/apply' || currentPath.startsWith('/admin');

  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col font-sans antialiased text-slate-800 bg-slate-50 selection:bg-purple-200 selection:text-purple-900">
        {/* Render Navbar on Landing Page or Apply Page */}
        {!currentPath.startsWith('/admin') && (
          <Navbar
            currentPath={currentPath}
            onNavigate={navigate}
            onOpenFeesModal={() => setIsFeeModalOpen(true)}
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
