/**
 * Router, layout raíz y guardias de ruta de Sous Chef.
 *
 * Los avisos se emiten con `showToast` de `utils/events`; `Layout` los muestra.
 *
 * Guardias:
 * - `ProtectedRoute`: sin sesión, a `/login`.
 * - `PremiumRoute`: sin membresía, a `/membresia` con aviso.
 * - `LevelRoute`: nivel bloqueado, a `/mapa` con aviso.
 *
 * El layout usa `h-dvh` con scroll solo en el área de contenido: así los
 * `h-full` de cada pantalla tienen altura real y la app no se desplaza entera
 * como una página web.
 */

import { BrowserRouter as Router, Routes, Route, Link, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ChefHat, Home, Map as MapIcon, Globe, BookOpen, LogOut, CalendarDays, ShieldAlert, X, Flame, UserRound } from 'lucide-react';
import { useState, useEffect, useRef, lazy, Suspense, memo, type ComponentType } from 'react';
import { EditorProvider, useEditor } from './context/EditorContext';

// Carga inmediata: lo necesario para el primer render.
import { AuthScreen } from './components/AuthScreen';
import { HomeMenu } from './components/HomeMenu';
import { isPremiumUser } from './utils/membership';
import { clearSession, backendLogout, getUserCountry, setUserCountry, getUser } from './utils/auth';
import { LEVELS, isUnlocked } from './data/adventure';
import type { PlacedLevel } from './data/adventure';
import { readLevelStars } from './utils/progress';
import { CountryPicker } from './components/CountryPicker';
import { initAnalytics, identify, resetIdentity, track, Events } from './utils/analytics';
import { useRoutePageviews } from './hooks/useAnalytics';
import { FeedbackButton } from './components/FeedbackButton';
import { showToast, onToast, onUserStateChange } from './utils/events';
import type { ToastDetail } from './utils/events';
import { getRankInfo } from './utils/rank';
import { getStreak } from './utils/streak';

initAnalytics();

// React.lazy espera un export `default` y los componentes exportan con nombre.
function lazyNamed<K extends string, M extends Record<K, ComponentType>>(loader: () => Promise<M>, exportName: K) {
  return lazy(async () => ({ default: (await loader())[exportName] }));
}

const CookingSession = lazyNamed(() => import('./components/CookingSession'), 'CookingSession');
const SkillTreeMap   = lazyNamed(() => import('./components/SkillTreeMap'),   'SkillTreeMap');
const AcademyModule  = lazyNamed(() => import('./components/AcademyModule'),  'AcademyModule');
const FlavorsModule  = lazyNamed(() => import('./components/FlavorsModule'),  'FlavorsModule');
const MilprepModule  = lazyNamed(() => import('./components/MilprepModule'),  'MilprepModule');
const MembresiaPage  = lazyNamed(() => import('./components/MembresiaPage'),  'MembresiaPage');
const ProfilePage    = lazyNamed(() => import('./components/ProfilePage'),    'ProfilePage');
const CMSTestPage    = lazyNamed(() => import('./components/cms/CMSTestPage'),'CMSTestPage');

// Niveles y jefes del Modo Aventura. Cada página carga su contenido y la
// pantalla base en paralelo, así cada nivel es un chunk propio. Se crean una
// sola vez, fuera del render, para que React.lazy no recargue en cada pintado.
function lazyAdventurePage(level: PlacedLevel) {
  return lazy(async () => {
    if (level.kind === 'boss') {
      const [content, { BossPage }] = await Promise.all([level.load(), import('./components/BossPage')]);
      return { default: () => <BossPage level={level} content={content} /> };
    }
    const [content, { LevelPage }] = await Promise.all([level.load(), import('./components/LevelPage')]);
    return { default: () => <LevelPage level={level} content={content} /> };
  });
}

const ADVENTURE_ROUTES = LEVELS.map(level => ({ level, Page: lazyAdventurePage(level) }));

const RouteFallback = () => (
  <div role="status" aria-live="polite" className="flex items-center justify-center h-full min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-orange-200 border-t-orange-600 motion-safe:animate-spin" aria-hidden />
      <span className="text-sm font-semibold text-neutral-500">Cargando…</span>
    </div>
  </div>
);

// Escritorio: las seis secciones en el menú lateral.
const navLinks = [
  { to: '/home',     icon: Home,         label: 'Inicio',            shortLabel: 'Inicio',   exact: true },
  { to: '/cocinar',  icon: ChefHat,      label: 'Cocinemos',         shortLabel: 'Cocinar',  exact: false },
  { to: '/mapa',     icon: MapIcon,      label: 'Modo Aventura',     shortLabel: 'Aventura', exact: false },
  { to: '/sabores',  icon: Globe,        label: 'Sabores del Mundo', shortLabel: 'Sabores',  exact: false },
  { to: '/academia', icon: BookOpen,     label: 'La Academia',       shortLabel: 'Academia', exact: false },
  { to: '/milprep',  icon: CalendarDays, label: 'Mealprep',          shortLabel: 'Mealprep', exact: false },
];

// Móvil: cinco pestañas. Sabores del Mundo y Mealprep se abren desde Inicio.
const mobileTabs = [
  { to: '/home',     icon: Home,       label: 'Inicio',   exact: true,  also: ['/sabores', '/milprep'] },
  { to: '/cocinar',  icon: ChefHat,    label: 'Cocinar',  exact: false, also: [] },
  { to: '/mapa',     icon: MapIcon,    label: 'Aventura', exact: false, also: [] },
  { to: '/academia', icon: BookOpen,   label: 'Academia', exact: false, also: [] },
  { to: '/perfil',   icon: UserRound,  label: 'Perfil',   exact: false, also: ['/membresia'] },
];

type ToastData = ToastDetail;

// Los avisos importantes (tope de voz, contenido bloqueado) duran más: se leen
// con las manos ocupadas y a distancia.
const TOAST_MS: Record<ToastData['type'], number> = {
  info: 5000, success: 5000, warning: 8000, error: 8000,
};

const Toast = memo(({ data, onClose, onPause, onResume }: {
  data: ToastData; onClose: () => void; onPause: () => void; onResume: () => void;
}) => {
  const colors: Record<ToastData['type'], string> = {
    info:    'bg-blue-600 text-white',
    warning: 'bg-amber-500 text-white',
    success: 'bg-emerald-600 text-white',
    error:   'bg-red-600 text-white',
  };
  const urgent = data.type === 'warning' || data.type === 'error';
  return (
    <div
      role={urgent ? 'alert' : 'status'}
      aria-live={urgent ? 'assertive' : 'polite'}
      onMouseEnter={onPause}
      onMouseLeave={onResume}
      onFocus={onPause}
      onBlur={onResume}
      className={`fixed top-[calc(4.5rem+env(safe-area-inset-top))] md:top-20 left-1/2 -translate-x-1/2 z-[250] flex items-center gap-2 pl-4 pr-1 py-1 rounded-2xl shadow-2xl max-w-sm w-[calc(100vw-2rem)] animate-sheet-up motion-reduce:animate-none ${colors[data.type]}`}
    >
      <span className="flex-1 text-sm font-semibold leading-snug py-2">{data.msg}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar aviso"
        className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl opacity-70 hover:opacity-100"
      >
        <X size={18} aria-hidden />
      </button>
    </div>
  );
});
Toast.displayName = 'Toast';

const ToastRedirect = ({ to, msg, type }: { to: string; msg: string; type: ToastData['type'] }) => {
  const navigate = useNavigate();
  useEffect(() => {
    showToast(msg, type);
    navigate(to, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};


interface HeaderUserData {
  username: string; rank: string; xp: number; nextRankXp: number; levelProgress: number; is_admin: boolean; streak: number;
}

// Rango, progreso y racha del encabezado a partir del usuario guardado.
function readUserData(): HeaderUserData {
  const streak = getStreak();
  const fallback: HeaderUserData = { username: 'Cargando…', rank: 'Iniciado', xp: 0, nextRankXp: 500, levelProgress: 0, is_admin: false, streak };
  try {
    const user = JSON.parse(localStorage.getItem('user') ?? 'null');
    if (!user) return fallback;
    const info = getRankInfo(user.xp ?? 0);
    return {
      username: user.username,
      rank: info.rank,
      xp: info.xp,
      nextRankXp: info.nextRankXp,
      levelProgress: info.progress,
      is_admin: user.is_admin || false,
      streak,
    };
  } catch (e) {
    console.error(e);
    return fallback;
  }
}

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, isEditMode, toggleEditMode } = useEditor();
  const location = useLocation();
  const navigate = useNavigate();
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Solo usuarios anteriores al registro con país: el registro nuevo ya lo pide.
  const [showCountryPicker, setShowCountryPicker] = useState(() => !getUserCountry());

  const [userData, setUserData] = useState(readUserData);

  useEffect(() => {
    // El username es el distinct_id de PostHog; no se envía correo ni nombre real.
    const u = getUser();
    if (u?.username) {
      identify(u.username, {
        is_admin: !!u.is_admin,
        is_premium: !!u.isPremium,
        country: u.country ?? null,
        has_preferences: ((u.preferences ?? u.dietaryPreferences ?? []).length > 0),
        has_allergies: ((u.allergies ?? []).length > 0),
      });
    }
    return onUserStateChange(() => setUserData(readUserData()));
  }, []);

  const scheduleToastClose = (type: ToastData['type']) => {
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS[type]);
  };

  useEffect(() => {
    const off = onToast(({ msg, type = 'info' }) => {
      setToast({ msg, type });
      scheduleToastClose(type);
    });
    return () => { off(); clearTimeout(toastTimer.current); };
  }, []);

  const handleLogout = async () => {
    track(Events.LoggedOut);
    await backendLogout();
    clearSession();
    resetIdentity();
    navigate('/login');
  };

  const userInitial = userData.username?.[0]?.toUpperCase() ?? '?';

  const handleCountrySelect = (code: string) => {
    setUserCountry(code);
    setShowCountryPicker(false);
    showToast('Listo. Sous te va a sugerir recetas con ingredientes de tu país 🌎', 'success');
  };

  const handleCountrySkip = () => {
    // OTHER evita que se vuelva a preguntar en cada visita.
    setUserCountry('OTHER');
    setShowCountryPicker(false);
  };

  const isActive = (to: string, exact: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="h-dvh bg-neutral-50 flex flex-col overflow-hidden">
      {showCountryPicker && (
        <CountryPicker
          mode="modal"
          onSelect={handleCountrySelect}
          onSkip={handleCountrySkip}
          onDismiss={() => setShowCountryPicker(false)}
        />
      )}

      {toast && (
        <Toast
          data={toast}
          onClose={() => { clearTimeout(toastTimer.current); setToast(null); }}
          onPause={() => clearTimeout(toastTimer.current)}
          onResume={() => scheduleToastClose(toast.type)}
        />
      )}

      <header className="relative z-50 flex-shrink-0 bg-neutral-50 md:bg-white md:border-b-2 md:border-neutral-200 pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto px-4 h-16 md:h-[72px] flex items-center justify-between gap-2">
          <Link to="/home" aria-label="Sous, ir al inicio" className="flex items-center gap-2 min-w-0">
            <span className="w-9 h-9 md:w-10 md:h-10 rounded-[11px] bg-orange-600 flex items-center justify-center flex-shrink-0 shadow-[0_3px_0_theme(colors.orange.800)]">
              <ChefHat className="text-white w-5 h-5 md:w-6 md:h-6" strokeWidth={2.4} aria-hidden />
            </span>
            <span className="font-display font-extrabold text-2xl md:text-[28px] tracking-tight text-ink">sous</span>
            {userData.is_admin && (
              <span className="ml-1 text-xs font-bold bg-ink text-white px-2 py-0.5 rounded-md tracking-wide uppercase">Admin</span>
            )}
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="pill-stat" title="Días seguidos cocinando">
              <Flame size={18} strokeWidth={2.5} className={userData.streak > 0 ? 'text-flame' : 'text-neutral-400'} aria-hidden />
              <span>{userData.streak}</span>
              <span className="sr-only">{userData.streak === 1 ? 'día de racha' : 'días de racha'}</span>
            </span>
            <span className="pill-stat">
              <span className="xp-coin" aria-hidden>XP</span>
              <span>{userData.xp}</span>
              <span className="sr-only">puntos de experiencia</span>
            </span>
            <Link
              to="/perfil"
              aria-label="Mi perfil"
              className="md:hidden w-11 h-11 flex items-center justify-center"
            >
              <span className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white font-black text-base shadow-[0_3px_0_theme(colors.orange.800)]">
                {userInitial}
              </span>
            </Link>
            <Link
              to="/perfil"
              className="hidden md:flex items-center gap-2.5 h-12 pl-1 pr-3.5 rounded-full border-2 border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              <span className="w-9 h-9 rounded-full bg-orange-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0" aria-hidden>
                {userInitial}
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-extrabold text-ink">{userData.username}</span>
                <span className="text-xs font-extrabold text-amber-700">{userData.rank}</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="hidden md:flex w-11 h-11 items-center justify-center text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-150"
            >
              <LogOut size={20} aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 max-w-6xl mx-auto w-full md:p-4 flex gap-5">
        <nav aria-label="Secciones" className="w-60 flex-shrink-0 hidden md:flex flex-col gap-1.5 pt-1">
          {navLinks.map(({ to, icon: Icon, label, exact }) => {
            const active = isActive(to, exact);
            return (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={`flex items-center gap-3 px-3.5 min-h-[52px] rounded-2xl text-base font-extrabold border-2 transition-colors duration-150 ${
                  active
                    ? 'bg-orange-100 text-orange-600 border-orange-200'
                    : 'text-ink border-transparent hover:bg-white hover:border-neutral-200'
                }`}
              >
                <Icon size={22} strokeWidth={2.3} aria-hidden className={active ? 'text-orange-600' : 'text-neutral-500'} />
                {label}
              </NavLink>
            );
          })}
          <Link
            to="/membresia"
            className="mt-auto mb-2 flex flex-col gap-1.5 p-4 rounded-[20px] bg-ink text-white hover:bg-neutral-800 transition-colors"
          >
            <span className="font-extrabold">Hazte Premium</span>
            <span className="text-sm font-semibold text-neutral-200 leading-snug">Mundos 3, 4 y 5 y clases avanzadas.</span>
          </Link>
        </nav>

        <div className="flex-1 min-h-0 bg-neutral-50 md:bg-white md:rounded-[24px] md:border-2 md:border-neutral-200 overflow-y-auto relative flex flex-col">
          {children}

          {isAdmin && (
            <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-8 left-4 md:left-auto md:right-8 z-[100]">
              <button
                type="button"
                onClick={toggleEditMode}
                aria-pressed={isEditMode}
                className={`flex items-center gap-2 min-h-11 px-5 py-3 rounded-full shadow-2xl font-bold transition-all border-2 ${
                  isEditMode
                    ? 'bg-orange-600 text-white border-orange-400 shadow-orange-500/40 motion-safe:animate-pulse'
                    : 'bg-neutral-900 text-white border-neutral-700 hover:bg-neutral-800'
                }`}
              >
                <ShieldAlert className="w-5 h-5" aria-hidden />
                <span className="hidden md:inline">{isEditMode ? 'Constructor visual activo' : 'Activar constructor visual'}</span>
                <span className="md:hidden sr-only">Constructor visual</span>
              </button>
            </div>
          )}
        </div>
      </main>

      <FeedbackButton />

      <nav
        aria-label="Secciones"
        className="relative z-50 md:hidden flex-shrink-0 bg-white border-t-2 border-neutral-200 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-stretch justify-around h-[68px] px-1">
          {mobileTabs.map(({ to, icon: Icon, label, exact, also }) => {
            const active = isActive(to, exact) || also.some(p => location.pathname.startsWith(p));
            return (
              <NavLink
                key={to}
                to={to}
                end={exact}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 text-center transition-colors duration-150 ${
                  active ? 'text-orange-600' : 'text-neutral-500 hover:text-orange-600'
                }`}
              >
                <span className={`w-14 h-8 flex items-center justify-center rounded-xl transition-colors duration-150 ${active ? 'bg-orange-100' : ''}`}>
                  <Icon size={23} strokeWidth={2.3} aria-hidden />
                </span>
                <span className="text-xs font-extrabold leading-none truncate max-w-full px-0.5">{label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem('user');
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

const PremiumRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isPremiumUser()) {
    return <ToastRedirect to="/membresia" msg="🔒 Este nivel es de Premium." type="info" />;
  }
  return <>{children}</>;
};

const LevelRoute = ({ children, path }: { children: React.ReactNode; path: string }) => {
  if (!isUnlocked(path, readLevelStars())) {
    return <ToastRedirect to="/mapa" msg="🔒 Completa el nivel anterior para abrir este." type="warning" />;
  }
  return <>{children}</>;
};

// Cierra sesión cuando el JWT expira y el refresh también falla.
const AuthExpiryWatcher = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = () => {
      showToast('Tu sesión expiró. Vuelve a iniciar sesión.', 'warning');
      clearSession();
      navigate('/login', { replace: true });
    };
    window.addEventListener('sous:auth-expired', handler);
    return () => window.removeEventListener('sous:auth-expired', handler);
  }, [navigate]);
  return null;
};

// Tiene que vivir dentro del Router para poder usar useLocation.
const PageviewTracker = () => {
  useRoutePageviews();
  return null;
};

function App() {
  return (
    <ErrorBoundary>
    <EditorProvider>
      <Router>
        <AuthExpiryWatcher />
        <PageviewTracker />
        <Routes>
        <Route path="/login" element={<AuthScreen />} />

        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Navigate to="/home" replace />} />
                <Route path="/cms-test" element={<CMSTestPage />} />
                <Route path="/home" element={<HomeMenu />} />
                <Route path="/membresia" element={<MembresiaPage />} />
                <Route path="/perfil" element={<ProfilePage />} />
                <Route path="/cocinar" element={<CookingSession />} />
                <Route path="/mapa" element={<SkillTreeMap />} />

                {ADVENTURE_ROUTES.map(({ level, Page }) => {
                  const page = <LevelRoute path={level.path}><Page /></LevelRoute>;
                  return <Route key={level.path} path={level.path} element={level.world.premium ? <PremiumRoute>{page}</PremiumRoute> : page} />;
                })}

                <Route path="/sabores" element={<FlavorsModule />} />
                <Route path="/academia" element={<AcademyModule />} />
                <Route path="/milprep" element={<MilprepModule />} />
              </Routes>
              </Suspense>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
    </EditorProvider>
    </ErrorBoundary>
  );
}

export default App;
