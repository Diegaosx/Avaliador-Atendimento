/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Locale, User, UserRole } from './shared/types';
import { translations } from './shared/i18n';
import { AuthSplitScreen } from './components/AuthSplitScreen';
import { AvaliacaoView } from './components/AvaliacaoView';
import { RankingMuralView } from './components/RankingMuralView';
import { AdminAvaliadorDashboard } from './components/AdminAvaliadorDashboard';
import { DashboardView } from './components/DashboardView';
import { UsersManagementView } from './components/UsersManagementView';
import { ProfileView } from './components/ProfileView';
import {
  Star,
  Trophy,
  ShieldCheck,
  LayoutDashboard,
  Users,
  UserCircle,
  LogOut,
  Sparkles,
  Menu,
  X,
  Lock,
  ArrowLeft,
  ChevronRight,
  Store,
} from 'lucide-react';

type PrimaryTab = 'avaliar' | 'ranking' | 'admin';
type AdminInternalTab = 'avaliador' | 'system-dashboard' | 'users' | 'profile';

export default function App() {
  const [locale, setLocale] = useState<Locale>('pt-BR');
  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>('avaliar');
  const [adminInternalTab, setAdminInternalTab] = useState<AdminInternalTab>('avaliador');
  const [initialVendedoraId, setInitialVendedoraId] = useState<string | null>(null);

  // Auth state
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('auth_user');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Check URL params on initial load (e.g. ?v=vnd_01 from QR Code scan)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const vParam = params.get('v');
    const tabParam = params.get('tab');

    if (vParam) {
      setInitialVendedoraId(vParam);
      setPrimaryTab('avaliar');
    } else if (tabParam === 'ranking') {
      setPrimaryTab('ranking');
    } else if (tabParam === 'admin') {
      setPrimaryTab('admin');
    }
  }, []);

  const handleAuthSuccess = (newToken: string, loggedUser: User) => {
    setToken(newToken);
    setUser(loggedUser);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(loggedUser));
    if (loggedUser.locale) {
      setLocale(loggedUser.locale);
    }
    setPrimaryTab('admin');
    setAdminInternalTab('avaliador');
  };

  const handleSignOut = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setPrimaryTab('ranking');
  };

  const handleSelectVendedoraToRate = (vendedoraId: string) => {
    setInitialVendedoraId(vendedoraId);
    setPrimaryTab('avaliar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* ==================================================================== */}
      {/* GLOBAL TOP NAVIGATION BAR */}
      {/* ==================================================================== */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div
            onClick={() => {
              setPrimaryTab('avaliar');
              setInitialVendedoraId(null);
            }}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 flex items-center justify-center text-slate-950 shadow-md group-hover:scale-105 transition-transform">
              <Star className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight tracking-tight">
                  Avaliador de Atendimento
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                  R$ 300 / Quinzena
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block leading-none mt-0.5">
                Ranking de Encantamento
              </span>
            </div>
          </div>

          {/* Desktop Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/60 text-xs">
            <button
              type="button"
              id="nav-avaliar"
              onClick={() => {
                setPrimaryTab('avaliar');
                setMobileNavOpen(false);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                primaryTab === 'avaliar'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Avaliar Atendimento</span>
            </button>

            <button
              type="button"
              id="nav-ranking"
              onClick={() => {
                setPrimaryTab('ranking');
                setMobileNavOpen(false);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                primaryTab === 'ranking'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Ranking & Prêmio R$ 300</span>
            </button>

            <button
              type="button"
              id="nav-admin"
              onClick={() => {
                setPrimaryTab('admin');
                setMobileNavOpen(false);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                primaryTab === 'admin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Painel Restrito (Admin)</span>
            </button>
          </nav>

          {/* Right User or Quick Admin Access */}
          <div className="flex items-center gap-2">
            {token && user ? (
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:block text-right">
                  <span className="text-xs font-bold text-slate-900 block leading-tight">{user.name}</span>
                  <span className="text-[10px] text-amber-600 font-semibold uppercase">{user.role}</span>
                </div>
                <button
                  type="button"
                  id="btn-signout"
                  onClick={handleSignOut}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Sair da conta"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="btn-acesso-admin-header"
                onClick={() => setPrimaryTab('admin')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Entrar (Admin)</span>
              </button>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 animate-in slide-in-from-top-2">
            <button
              type="button"
              onClick={() => {
                setPrimaryTab('avaliar');
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold ${
                primaryTab === 'avaliar' ? 'bg-amber-50 text-amber-900' : 'text-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Avaliar Atendimento</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPrimaryTab('ranking');
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold ${
                primaryTab === 'ranking' ? 'bg-amber-50 text-amber-900' : 'text-slate-700'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Ranking & Prêmio R$ 300</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPrimaryTab('admin');
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold ${
                primaryTab === 'admin' ? 'bg-slate-900 text-white' : 'text-slate-700'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Painel Restrito (Admin)</span>
            </button>
          </div>
        )}
      </header>

      {/* ==================================================================== */}
      {/* MAIN VIEWPORT SWITCHER */}
      {/* ==================================================================== */}
      <main className="flex-1">
        {/* PUBLIC EVALUATION FLOW */}
        {primaryTab === 'avaliar' && (
          <AvaliacaoView
            initialVendedoraId={initialVendedoraId}
            onNavigateToRanking={() => setPrimaryTab('ranking')}
          />
        )}

        {/* PUBLIC / MURAL RANKING VIEW */}
        {primaryTab === 'ranking' && (
          <RankingMuralView onSelectVendedoraToRate={handleSelectVendedoraToRate} />
        )}

        {/* RESTRICTED ADMIN PANEL */}
        {primaryTab === 'admin' && (
          <>
            {!token || !user ? (
              <div className="relative">
                <div className="max-w-xl mx-auto pt-4 px-4">
                  <button
                    type="button"
                    onClick={() => setPrimaryTab('avaliar')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar ao Avaliador</span>
                  </button>
                </div>
                <AuthSplitScreen
                  locale={locale}
                  onLocaleChange={setLocale}
                  onAuthSuccess={handleAuthSuccess}
                />
              </div>
            ) : (
              <div>
                {/* Secondary navigation for Admin */}
                <div className="bg-white border-b border-slate-200">
                  <div className="max-w-7xl mx-auto px-4 flex items-center gap-4 h-12 overflow-x-auto text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setAdminInternalTab('avaliador')}
                      className={`flex items-center gap-1.5 py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                        adminInternalTab === 'avaliador'
                          ? 'border-amber-500 text-amber-700 font-bold'
                          : 'border-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span>Gestão do Avaliador & QR Codes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdminInternalTab('system-dashboard')}
                      className={`flex items-center gap-1.5 py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                        adminInternalTab === 'system-dashboard'
                          ? 'border-slate-900 text-slate-900 font-bold'
                          : 'border-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Métricas de Sistema & Logs</span>
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setAdminInternalTab('users')}
                        className={`flex items-center gap-1.5 py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                          adminInternalTab === 'users'
                            ? 'border-slate-900 text-slate-900 font-bold'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Users className="w-4 h-4" />
                        <span>Usuários Administrativos</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setAdminInternalTab('profile')}
                      className={`flex items-center gap-1.5 py-3 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                        adminInternalTab === 'profile'
                          ? 'border-slate-900 text-slate-900 font-bold'
                          : 'border-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <UserCircle className="w-4 h-4" />
                      <span>Meu Perfil</span>
                    </button>
                  </div>
                </div>

                {/* SubTab Views */}
                {adminInternalTab === 'avaliador' && (
                  <AdminAvaliadorDashboard token={token} user={user} />
                )}

                {adminInternalTab === 'system-dashboard' && (
                  <div className="max-w-7xl mx-auto px-4 py-8">
                    <DashboardView token={token} user={user} locale={locale} />
                  </div>
                )}

                {adminInternalTab === 'users' && isAdmin && (
                  <div className="max-w-7xl mx-auto px-4 py-8">
                    <UsersManagementView token={token} currentUser={user} locale={locale} />
                  </div>
                )}

                {adminInternalTab === 'profile' && (
                  <div className="max-w-4xl mx-auto px-4 py-8">
                    <ProfileView
                      token={token}
                      user={user}
                      locale={locale}
                      onUserUpdated={setUser}
                      onLocaleChange={setLocale}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Avaliador de Atendimento • Ranking Quinzenal com Premiação de R$ 300,00</span>
          <span>Critérios: Sorriso, Cordialidade, Conhecimento de produto e Experiência</span>
        </div>
      </footer>
    </div>
  );
}
