import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { CalendarCheck, Home, Users } from 'lucide-react';
import { EVENT_CONFIG } from '../data/missions';
import { useAppContext } from '../context/AppContext';

export function Layout({ children }: { children: React.ReactNode }) {
  const { firebaseReady } = useAppContext();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/organisateurs');

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FC] text-[#14203B]">
      {/* Barre de navigation supérieure (3 zones strictes, 1 ligne) */}
      <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
          <Link
            to="/"
            className="flex items-center gap-3 text-base sm:text-lg font-bold tracking-tight text-[#2F4A9A] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F4A9A] rounded"
          >
            <img
              src="/logo-ecole.svg"
              alt="Logo École Saint-Pierre"
              className="w-9 h-9 rounded-lg border border-slate-200 bg-white object-contain shrink-0"
            />
            <span>APEL Saint-Pierre</span>
          </Link>

          <nav
            aria-label="Navigation principale"
            className="hidden md:flex items-center gap-6 text-[15px] font-medium text-slate-600"
          >
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                  isActive
                    ? 'text-[#2F4A9A] border-[#2F4A9A] font-semibold'
                    : 'border-transparent hover:text-[#2F4A9A]'
                }`
              }
            >
              Accueil
            </NavLink>
            <NavLink
              to="/benevoles"
              className={({ isActive }) =>
                `whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                  isActive
                    ? 'text-[#2F4A9A] border-[#2F4A9A] font-semibold'
                    : 'border-transparent hover:text-[#2F4A9A]'
                }`
              }
            >
              Missions bénévoles
            </NavLink>
            <NavLink
              to="/mes-inscriptions"
              className={({ isActive }) =>
                `whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                  isActive
                    ? 'text-[#2F4A9A] border-[#2F4A9A] font-semibold'
                    : 'border-transparent hover:text-[#2F4A9A]'
                }`
              }
            >
              Mes inscriptions
            </NavLink>
          </nav>

          <div className="flex items-center shrink-0">
            <Link
              to="/benevoles"
              className="inline-flex items-center justify-center min-h-[42px] px-4 py-2 text-sm font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-xl transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B91C1C]"
            >
              Je m&apos;inscris
            </Link>
          </div>
        </div>
      </header>

      {/* Avertissement doux si les variables Firebase ne sont pas encore configurées */}
      {!firebaseReady && (
        <div
          role="status"
          className="no-print bg-amber-50 border-b border-amber-200 text-amber-950 px-4 py-3 text-sm"
        >
          <div className="max-w-6xl mx-auto">
            <strong>Configuration Firebase en attente :</strong> renseignez les variables{' '}
            <code className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded">
              VITE_FIREBASE_*
            </code>{' '}
            pour activer l&apos;enregistrement en temps réel (voir le fichier{' '}
            <code className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded">README.md</code>
            ).
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <main className="flex-1 pb-20 md:pb-12">{children}</main>

      {/* Pied de page */}
      <footer className="no-print bg-white border-t border-slate-200 mt-auto mb-16 md:mb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-slate-600">
          <div className="space-y-1.5 max-w-2xl">
            <p className="font-semibold text-[#2F4A9A]">{EVENT_CONFIG.piedDePage}</p>
            <p className="text-slate-600 leading-relaxed">{EVENT_CONFIG.mentionRgpd}</p>
          </div>
          <Link
            to="/organisateurs"
            className="text-slate-500 hover:text-[#2F4A9A] underline underline-offset-4 whitespace-nowrap shrink-0 min-h-[44px] inline-flex items-center"
          >
            Espace organisateurs
          </Link>
        </div>
      </footer>

      {/* Barre de navigation mobile en bas (uniquement sur mobile, < 15 % de hauteur) */}
      {!isAdminRoute && (
        <nav
          aria-label="Navigation mobile"
          className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200"
        >
          <div className="grid grid-cols-3 h-16">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 min-h-[44px] text-xs font-medium transition-colors ${
                  isActive ? 'text-[#2F4A9A] font-semibold' : 'text-slate-600'
                }`
              }
            >
              <Home className="w-5 h-5" aria-hidden="true" />
              <span>Accueil</span>
            </NavLink>
            <NavLink
              to="/benevoles"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 min-h-[44px] text-xs font-medium transition-colors ${
                  isActive ? 'text-[#B91C1C] font-semibold' : 'text-slate-600'
                }`
              }
            >
              <Users className="w-5 h-5" aria-hidden="true" />
              <span>Bénévoles</span>
            </NavLink>
            <NavLink
              to="/mes-inscriptions"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 min-h-[44px] text-xs font-medium transition-colors ${
                  isActive ? 'text-[#2F4A9A] font-semibold' : 'text-slate-600'
                }`
              }
            >
              <CalendarCheck className="w-5 h-5" aria-hidden="true" />
              <span>Mes créneaux</span>
            </NavLink>
          </div>
        </nav>
      )}
    </div>
  );
}
