/**
 * Router, layout raíz y guardias de ruta de Sous Chef.
 *
 * `showToast(msg, type)` se puede llamar desde cualquier archivo: despacha el
 * evento `sous:toast` que escucha `Layout`, sin context ni props.
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
import { LessonViewer } from './components/LessonViewer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ChefHat, Home, Compass, Map as MapIcon, Globe, BookOpen, LogOut, CalendarDays, ShieldAlert, X } from 'lucide-react';
import { useState, useEffect, useRef, lazy, Suspense, memo, type ComponentType } from 'react';
import { EditorProvider, useEditor } from './context/EditorContext';

// Carga inmediata: lo necesario para el primer render.
import { AuthScreen } from './components/AuthScreen';
import { HomeMenu } from './components/HomeMenu';
import { isPremiumUser } from './utils/membership';
import { clearSession, backendLogout, getUserCountry, setUserCountry, getUser } from './utils/auth';
import { isLevelUnlocked } from './data/levelsData';
import { CountryPicker } from './components/CountryPicker';
import { initAnalytics, identify, resetIdentity, track, Events } from './utils/analytics';
import { useRoutePageviews } from './hooks/useAnalytics';
import { FeedbackButton } from './components/FeedbackButton';

initAnalytics();

// React.lazy espera un export `default` y los componentes exportan con nombre.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyNamed(loader: () => Promise<any>, exportName: string) {
  return lazy(async () => {
    const mod = await loader();
    return { default: mod[exportName] as ComponentType<Record<string, never>> };
  });
}

const CookingSession = lazyNamed(() => import('./components/CookingSession'), 'CookingSession');
const SkillTreeMap   = lazyNamed(() => import('./components/SkillTreeMap'),   'SkillTreeMap');
const AcademyModule  = lazyNamed(() => import('./components/AcademyModule'),  'AcademyModule');
const FlavorsModule  = lazyNamed(() => import('./components/FlavorsModule'),  'FlavorsModule');
const MilprepModule  = lazyNamed(() => import('./components/MilprepModule'),  'MilprepModule');
const MembresiaPage  = lazyNamed(() => import('./components/MembresiaPage'),  'MembresiaPage');
const ProfilePage    = lazyNamed(() => import('./components/ProfilePage'),    'ProfilePage');
const CMSTestPage    = lazyNamed(() => import('./components/cms/CMSTestPage'),'CMSTestPage');

// Niveles y jefes de los mundos 1 a 5.
const JulianaLevel    = lazyNamed(() => import('./components/JulianaLevel'),    'JulianaLevel');
const BrunoiseLevel   = lazyNamed(() => import('./components/BrunoiseLevel'),   'BrunoiseLevel');
const ChiffonadeLevel = lazyNamed(() => import('./components/ChiffonadeLevel'), 'ChiffonadeLevel');
const ChefVegetalBoss = lazyNamed(() => import('./components/ChefVegetalBoss'), 'ChefVegetalBoss');
const SofritoLevel   = lazyNamed(() => import('./components/SofritoLevel'),   'SofritoLevel');
const MaillardLevel  = lazyNamed(() => import('./components/MaillardLevel'),  'MaillardLevel');
const EmulsionLevel  = lazyNamed(() => import('./components/EmulsionLevel'),  'EmulsionLevel');
const FlambeadorBoss = lazyNamed(() => import('./components/FlambeadorBoss'), 'FlambeadorBoss');
const FondoBlancoLevel    = lazyNamed(() => import('./components/FondoBlancoLevel'),    'FondoBlancoLevel');
const FondoOscuroLevel    = lazyNamed(() => import('./components/FondoOscuroLevel'),    'FondoOscuroLevel');
const FumetLevel          = lazyNamed(() => import('./components/FumetLevel'),          'FumetLevel');
const MaestroDeSalsasBoss = lazyNamed(() => import('./components/MaestroDeSalsasBoss'), 'MaestroDeSalsasBoss');
const SousVideLevel       = lazyNamed(() => import('./components/SousVideLevel'),       'SousVideLevel');
const EsferificacionLevel = lazyNamed(() => import('./components/EsferificacionLevel'), 'EsferificacionLevel');
const FermentacionLevel   = lazyNamed(() => import('./components/FermentacionLevel'),   'FermentacionLevel');
const AlquimistaBoss      = lazyNamed(() => import('./components/AlquimistaBoss'),      'AlquimistaBoss');
const MenuDegustacionLevel = lazyNamed(() => import('./components/MenuDegustacionLevel'), 'MenuDegustacionLevel');
const MarinajeLevel        = lazyNamed(() => import('./components/MarinajeLevel'),        'MarinajeLevel');
const AltaCocinaLevel      = lazyNamed(() => import('./components/AltaCocinaLevel'),      'AltaCocinaLevel');
const GranChefBoss         = lazyNamed(() => import('./components/GranChefBoss'),         'GranChefBoss');

const RouteFallback = () => (
  <div role="status" aria-live="polite" className="flex items-center justify-center h-full min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-brand-100 border-t-brand-700 motion-safe:animate-spin" aria-hidden />
      <span className="text-sm font-semibold text-neutral-600">Cargando…</span>
    </div>
  </div>
);

const navLinks = [
  { to: '/home',     icon: Home,         label: 'Inicio',            shortLabel: 'Inicio',   exact: true },
  { to: '/cocinar',  icon: Compass,      label: 'Cocinemos',         shortLabel: 'Cocinar',  exact: false },
  { to: '/mapa',     icon: MapIcon,      label: 'Modo Aventura',     shortLabel: 'Aventura', exact: false },
  { to: '/sabores',  icon: Globe,        label: 'Sabores del Mundo', shortLabel: 'Sabores',  exact: false },
  { to: '/academia', icon: BookOpen,     label: 'La Academia',       shortLabel: 'Academia', exact: false },
  { to: '/milprep',  icon: CalendarDays, label: 'Mealprep',          shortLabel: 'Mealprep', exact: false },
];

interface LessonEventData {
  title: string; emoji: string; duration: string;
  levelName: string; levelColor: string; levelBg: string; levelBorder: string;
  isCompleted: boolean;
}

interface ToastData { msg: string; type: 'info' | 'warning' | 'success' | 'error' }

export function showToast(msg: string, type: ToastData['type'] = 'info') {
  window.dispatchEvent(new CustomEvent('sous:toast', { detail: { msg, type } }));
}

// Los avisos importantes (tope de voz, contenido bloqueado) duran más: se leen
// con las manos ocupadas y a distancia.
const TOAST_MS: Record<ToastData['type'], number> = {
  info: 5000, success: 5000, warning: 8000, error: 8000,
};

const Toast = memo(({ data, onClose, onPause, onResume }: {
  data: ToastData; onClose: () => void; onPause: () => void; onResume: () => void;
}) => {
  const colors: Record<ToastData['type'], string> = {
    info:    'bg-neutral-900 text-white',
    warning: 'bg-amber-800 text-white',
    success: 'bg-emerald-700 text-white',
    error:   'bg-red-700 text-white',
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
      className={`fixed top-[calc(4.5rem+env(safe-area-inset-top))] md:top-20 left-1/2 -translate-x-1/2 z-[250] flex items-center gap-2 pl-4 pr-1 py-1 rounded-card shadow-overlay max-w-sm w-[calc(100vw-2rem)] animate-sheet-up motion-reduce:animate-none ${colors[data.type]}`}
    >
      <span className="flex-1 text-sm font-semibold leading-snug py-2">{data.msg}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar aviso"
        className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-control hover:bg-white/15"
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

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, isEditMode, toggleEditMode } = useEditor();
  const location = useLocation();
  const navigate = useNavigate();
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [activeLesson, setActiveLesson] = useState<LessonEventData | null>(null);

  // Solo usuarios anteriores al registro con país: el registro nuevo ya lo pide.
  const [showCountryPicker, setShowCountryPicker] = useState(() => !getUserCountry());

  const [userData, setUserData] = useState({
    username: 'Cargando…',
    rank: 'Iniciado',
    xp: 0,
    nextRankXp: 500,
    levelProgress: 0,
    is_admin: false,
  });

  const loadUserData = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    try {
      const user = JSON.parse(userStr);
      let rank = 'Iniciado';
      let nextXp = 500;
      let base = 0;
      if (user.xp >= 500) { rank = 'Cocinero de Partida'; nextXp = 1500; base = 500; }
      if (user.xp >= 1500) { rank = 'Sous Chef'; nextXp = 5000; base = 1500; }
      if (user.xp >= 5000) { rank = 'Chef de Cuisine'; nextXp = 15000; base = 5000; }
      if (user.xp >= 15000) { rank = 'Maestría Culinaria'; nextXp = 50000; base = 15000; }
      const progress = ((user.xp - base) / (nextXp - base)) * 100;
      setUserData({
        username: user.username,
        rank,
        xp: user.xp,
        nextRankXp: nextXp,
        levelProgress: progress > 100 ? 100 : progress,
        is_admin: user.is_admin || false,
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadUserData();
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
    window.addEventListener('userStateChange', loadUserData);
    return () => window.removeEventListener('userStateChange', loadUserData);
  }, []);

  const scheduleToastClose = (type: ToastData['type']) => {
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS[type]);
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const { msg, type = 'info' } = (e as CustomEvent<ToastData>).detail;
      setToast({ msg, type });
      scheduleToastClose(type);
    };
    window.addEventListener('sous:toast', handler);
    return () => { window.removeEventListener('sous:toast', handler); clearTimeout(toastTimer.current); };
  }, []);

  useEffect(() => {
    const handler = (e: Event) => setActiveLesson((e as CustomEvent<LessonEventData>).detail);
    window.addEventListener('sous:openLesson', handler);
    return () => window.removeEventListener('sous:openLesson', handler);
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
    showToast('Listo. Sous te va a sugerir recetas con ingredientes de tu país.', 'success');
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

      {activeLesson && (
        <LessonViewer
          lessonTitle={activeLesson.title}
          lessonEmoji={activeLesson.emoji}
          lessonDuration={activeLesson.duration}
          levelName={activeLesson.levelName}
          levelColor={activeLesson.levelColor}
          levelBg={activeLesson.levelBg}
          levelBorder={activeLesson.levelBorder}
          isCompleted={activeLesson.isCompleted}
          onClose={() => setActiveLesson(null)}
          onComplete={(title) => {
            window.dispatchEvent(new CustomEvent('sous:lessonComplete', { detail: { title } }));
            setActiveLesson(null);
          }}
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

      <header className="flex-shrink-0 bg-white border-b border-neutral-200 pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-brand-700 p-1.5 rounded-control">
              <ChefHat className="text-white w-5 h-5" aria-hidden />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-neutral-900">Sous</span>
            {userData.is_admin && (
              <span className="ml-1 text-xs font-bold bg-neutral-900 text-white px-2 py-0.5 rounded-md">Admin</span>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              to="/perfil"
              aria-label="Mi perfil"
              className="sm:hidden w-11 h-11 flex items-center justify-center"
            >
              <span className="w-9 h-9 rounded-full bg-brand-700 flex items-center justify-center text-white font-extrabold text-sm">
                {userInitial}
              </span>
            </Link>
            <Link
              to="/perfil"
              className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-card border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0" aria-hidden>
                {userInitial}
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-bold text-neutral-900">{userData.username}</span>
                <span className="text-xs font-semibold text-brand-700">{userData.rank}</span>
              </span>
              <span className="flex flex-col items-end gap-1 pl-3 border-l border-neutral-200">
                <span className="text-xs text-neutral-600 font-medium">{userData.xp} / {userData.nextRankXp} XP</span>
                <span
                  className="w-20 h-1.5 bg-brand-100 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-label="Progreso al siguiente rango"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(userData.levelProgress)}
                >
                  <span className="block h-full bg-brand-700 rounded-full transition-all duration-700" style={{ width: `${userData.levelProgress}%` }} />
                </span>
              </span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="w-11 h-11 flex items-center justify-center text-neutral-600 hover:text-red-700 hover:bg-red-50 rounded-control transition-colors"
            >
              <LogOut size={18} aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 max-w-6xl mx-auto w-full md:p-4 flex gap-5">
        <nav aria-label="Secciones" className="w-56 flex-shrink-0 hidden md:flex flex-col gap-1 pt-1">
          {navLinks.map(({ to, icon: Icon, label, exact }, i) => (
            <div key={to}>
              {i === 1 && <div className="border-t border-neutral-200 my-1" />}
              <NavLink
                to={to}
                end={exact}
                className={`flex items-center gap-3 px-3 min-h-11 rounded-control text-sm font-semibold transition-colors ${
                  isActive(to, exact)
                    ? 'bg-brand-50 text-brand-800'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <Icon size={18} aria-hidden />
                {label}
              </NavLink>
            </div>
          ))}
        </nav>

        <div className="flex-1 min-h-0 bg-white md:rounded-card md:border md:border-neutral-200 overflow-y-auto relative flex flex-col">
          {children}

          {isAdmin && (
            <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-8 left-4 md:left-auto md:right-8 z-[100]">
              <button
                type="button"
                onClick={toggleEditMode}
                aria-pressed={isEditMode}
                className={`flex items-center gap-2 min-h-11 px-4 rounded-full shadow-overlay font-semibold text-sm transition-colors ${
                  isEditMode ? 'bg-brand-700 text-white' : 'bg-neutral-900 text-white hover:bg-neutral-800'
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
        className="md:hidden flex-shrink-0 bg-white border-t border-neutral-200 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-stretch justify-around h-16">
          {navLinks.map(({ to, icon: Icon, shortLabel, exact }) => {
            const active = isActive(to, exact);
            return (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 text-center transition-colors ${
                  active ? 'text-brand-700' : 'text-neutral-600'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.9} aria-hidden />
                <span className="text-[11px] font-semibold leading-none truncate max-w-full px-0.5">{shortLabel}</span>
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
    return <ToastRedirect to="/membresia" msg="Este nivel es de Premium." type="info" />;
  }
  return <>{children}</>;
};

const LevelRoute = ({ children, path }: { children: React.ReactNode; path: string }) => {
  if (!isLevelUnlocked(path)) {
    return <ToastRedirect to="/mapa" msg="Completa el nivel anterior para abrir este." type="warning" />;
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

                {/* Mundo 1: Isla del Cuchillo */}
                <Route path="/mapa/juliana"    element={<LevelRoute path="/mapa/juliana"><JulianaLevel /></LevelRoute>} />
                <Route path="/mapa/brunoise"   element={<LevelRoute path="/mapa/brunoise"><BrunoiseLevel /></LevelRoute>} />
                <Route path="/mapa/chiffonade" element={<LevelRoute path="/mapa/chiffonade"><ChiffonadeLevel /></LevelRoute>} />
                <Route path="/mapa/chef-vegetal" element={<LevelRoute path="/mapa/chef-vegetal"><ChefVegetalBoss /></LevelRoute>} />

                {/* Mundo 2: Valle del Fuego */}
                <Route path="/mapa/sofrito"    element={<LevelRoute path="/mapa/sofrito"><SofritoLevel /></LevelRoute>} />
                <Route path="/mapa/maillard"   element={<LevelRoute path="/mapa/maillard"><MaillardLevel /></LevelRoute>} />
                <Route path="/mapa/emulsion"   element={<LevelRoute path="/mapa/emulsion"><EmulsionLevel /></LevelRoute>} />
                <Route path="/mapa/flambeador" element={<LevelRoute path="/mapa/flambeador"><FlambeadorBoss /></LevelRoute>} />

                {/* Mundo 3: Mar de Sabores (Premium) */}
                <Route path="/mapa/fondo-blanco"   element={<PremiumRoute><LevelRoute path="/mapa/fondo-blanco"><FondoBlancoLevel /></LevelRoute></PremiumRoute>} />
                <Route path="/mapa/fondo-oscuro"   element={<PremiumRoute><LevelRoute path="/mapa/fondo-oscuro"><FondoOscuroLevel /></LevelRoute></PremiumRoute>} />
                <Route path="/mapa/fumet"          element={<PremiumRoute><LevelRoute path="/mapa/fumet"><FumetLevel /></LevelRoute></PremiumRoute>} />
                <Route path="/mapa/maestro-salsas" element={<PremiumRoute><LevelRoute path="/mapa/maestro-salsas"><MaestroDeSalsasBoss /></LevelRoute></PremiumRoute>} />

                {/* Mundo 4: Pico del Maestro (Premium) */}
                <Route path="/mapa/sous-vide"      element={<PremiumRoute><LevelRoute path="/mapa/sous-vide"><SousVideLevel /></LevelRoute></PremiumRoute>} />
                <Route path="/mapa/esferificacion" element={<PremiumRoute><LevelRoute path="/mapa/esferificacion"><EsferificacionLevel /></LevelRoute></PremiumRoute>} />
                <Route path="/mapa/fermentacion"   element={<PremiumRoute><LevelRoute path="/mapa/fermentacion"><FermentacionLevel /></LevelRoute></PremiumRoute>} />
                <Route path="/mapa/alquimista"     element={<PremiumRoute><LevelRoute path="/mapa/alquimista"><AlquimistaBoss /></LevelRoute></PremiumRoute>} />

                {/* Mundo 5: Castillo del Chef (Premium) */}
                <Route path="/mapa/menu-degustacion" element={<PremiumRoute><LevelRoute path="/mapa/menu-degustacion"><MenuDegustacionLevel /></LevelRoute></PremiumRoute>} />
                <Route path="/mapa/maridaje"         element={<PremiumRoute><LevelRoute path="/mapa/maridaje"><MarinajeLevel /></LevelRoute></PremiumRoute>} />
                <Route path="/mapa/alta-cocina"      element={<PremiumRoute><LevelRoute path="/mapa/alta-cocina"><AltaCocinaLevel /></LevelRoute></PremiumRoute>} />
                <Route path="/mapa/gran-chef"        element={<PremiumRoute><LevelRoute path="/mapa/gran-chef"><GranChefBoss /></LevelRoute></PremiumRoute>} />

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
