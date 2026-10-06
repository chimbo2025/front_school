import React, { useState } from 'react';
import { Menu, X, Shield, Phone, ArrowRight, ExternalLink, LogOut, User as UserIcon } from 'lucide-react';
import { schoolConfig } from '../config/schoolConfig';
import { authService, User } from '../services/auth';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenFeesModal: () => void;
  user: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate, onOpenFeesModal, user, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (path: string) => {
    setMobileMenuOpen(false);
    onNavigate(path);
  };

  const handleScrollTo = (id: string) => {
    setMobileMenuOpen(false);
    if (currentPath !== '/') {
      onNavigate('/');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Zone 1: Single text element wordmark + crest */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleNavClick('/')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <img
                src="/logo.jpeg"
                alt={`${schoolConfig.name} Logo`}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover shadow-md group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight leading-tight">
                  {schoolConfig.name}
                </span>
                <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                  {schoolConfig.island} · Online Admission System
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: 4-6 clean text navigation links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
            <button
              onClick={() => handleNavClick('/')}
              className={`hover:text-emerald-700 transition-colors cursor-pointer ${
                currentPath === '/' ? 'text-[#16a34a] font-semibold' : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleScrollTo('about')}
              className="hover:text-emerald-700 transition-colors cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() => handleScrollTo('programs')}
              className="hover:text-emerald-700 transition-colors cursor-pointer"
            >
              Grades
            </button>
            <button
              onClick={onOpenFeesModal}
              className="hover:text-purple-700 transition-colors cursor-pointer"
            >
              Fee Structure
            </button>
            <button
              onClick={() => handleScrollTo('how-it-works')}
              className="hover:text-emerald-700 transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => handleScrollTo('campus')}
              className="hover:text-emerald-700 transition-colors cursor-pointer"
            >
              Campus
            </button>
            <button
              onClick={() => handleScrollTo('contact')}
              className="hover:text-emerald-700 transition-colors cursor-pointer"
            >
              Contact
            </button>
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <div className="relative group">
                <button
                  className="px-3 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer text-slate-700 border-slate-300 hover:bg-slate-100"
                  aria-expanded="false"
                  aria-haspopup="true"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{user.first_name || user.username}</span>
                </button>
                <div className="absolute right-0 top-full mt-1 w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900">{user.first_name} {user.last_name}</p>
                      <p className="text-[10px] text-slate-500">{user.username}</p>
                    </div>
                    <button
                      onClick={onLogout}
                      className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => handleNavClick('/login')}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  currentPath.startsWith('/admin') || currentPath === '/login'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
                title="Enter administrative portal"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </button>
            )}

            <button
              onClick={() => handleNavClick('/apply')}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#7c3aed] hover:bg-[#6d28d9] rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>Apply Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => handleNavClick('/apply')}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#7c3aed] rounded-lg shadow-xs cursor-pointer"
            >
              Apply
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-100">
            <button
              onClick={() => handleNavClick('/')}
              className="px-3 py-2.5 text-left text-sm font-medium rounded-lg hover:bg-slate-50 text-slate-800"
            >
              Home
            </button>
            <button
              onClick={() => handleScrollTo('about')}
              className="px-3 py-2.5 text-left text-sm font-medium rounded-lg hover:bg-slate-50 text-slate-800"
            >
              About School
            </button>
            <button
              onClick={() => handleScrollTo('programs')}
              className="px-3 py-2.5 text-left text-sm font-medium rounded-lg hover:bg-slate-50 text-slate-800"
            >
              Grades Offered
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenFeesModal();
              }}
              className="px-3 py-2.5 text-left text-sm font-medium rounded-lg hover:bg-slate-50 text-purple-700 font-semibold"
            >
              Fee Structure
            </button>
            <button
              onClick={() => handleScrollTo('how-it-works')}
              className="px-3 py-2.5 text-left text-sm font-medium rounded-lg hover:bg-slate-50 text-slate-800"
            >
              How It Works
            </button>
            <button
              onClick={() => handleScrollTo('campus')}
              className="px-3 py-2.5 text-left text-sm font-medium rounded-lg hover:bg-slate-50 text-slate-800"
            >
              Campus Facilities
            </button>
          </div>

          <div className="space-y-2 pt-1">
            <button
              onClick={() => handleNavClick('/apply')}
              className="w-full py-3 px-4 bg-[#7c3aed] text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Apply Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {user ? (
              <div className="space-y-2">
                <div className="w-full px-3 py-2 bg-slate-50 rounded-lg flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{user.first_name} {user.last_name}</p>
                    <p className="text-[10px] text-slate-500">{user.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                  className="w-full py-2.5 px-4 bg-red-50 text-red-600 font-medium rounded-lg text-xs flex items-center justify-center gap-2 border border-red-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => { handleNavClick('/login'); setMobileMenuOpen(false); }}
                className="w-full py-2.5 px-4 bg-slate-900 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-2"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Staff Portal</span>
              </button>
            )}

            <a
              href={`tel:${schoolConfig.phone.replace(/\s+/g, '')}`}
              className="flex items-center justify-center gap-1.5 text-xs text-slate-600 pt-1"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Helpline: {schoolConfig.phone}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
