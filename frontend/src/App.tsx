/**
 * App.tsx
 *
 * Punto de entrada principal de la aplicación Sous Chef.
 * Define el router, el sistema de autenticación local, el toast global,
 * los guardias de ruta (premium, niveles) y el layout raíz.
 *
 * ── Sistema de Toast ─────────────────────────────────────────────────────────
 * `showToast(msg, type)` puede llamarse desde cualquier archivo.
 * Despacha el evento `sous:toast` que escucha el componente `Layout`.
 * No requiere context ni prop-drilling.
 *
 * ── Guardias de ruta ─────────────────────────────────────────────────────────
 * - `RequireAuth`   — Redirige a `/login` si no hay sesión.
 * - `PremiumRoute`  — Redirige a `/membresia` con toast si el usuario no es premium.
 * - `LevelRoute`    — Redirige a `/mapa` con toast si el nivel está bloqueado.
 * - `ToastRedirect` — Lanza un toast antes de hacer `navigate(replace: true)`.
 *
 * ── Layout ───────────────────────────────────────────────────────────────────
 * El componente `Layout` envuelve todas las rutas autenticadas con:
 * - Header con nombre de usuario y XP.
 * - Barra de navegación inferior de 6 pestañas.
 * - Toast overlay global (escucha `sous:toast`).
 * - Botón de modo editor (solo admins).
 */

import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LessonViewer } from './components/LessonViewer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ChefHat, Home, Compass, Map as MapIcon, Globe, BookOpen, LogOut, CalendarDays, ShieldAlert, X } from 'lucide-react';
import { useState, useEffect, lazy, Suspense, memo, type ComponentType } from 'react';
import { EditorProvider, useEditor } from './context/EditorContext';

// ── Eager (necesario en el primer paint) ──────────────────────────────────────
import { AuthScreen } from './components/AuthScreen';
import { HomeMenu } from './components/HomeMenu';
import { isPremiumUser } from './utils/membership';
import { clearSession, backendLogout, getUserCountry, setUserCountry } from './utils/auth';
import { isLevelUnlocked } from './data/levelsData';
import { CountryPicker } from './components/CountryPicker';

// ── Lazy helper: convierte un import nombrado en lazy() ───────────────────────
// React.lazy espera `default`. Como nuestros componentes exportan named, lo
// envolvemos. Cada llamada a `lazyNamed(...)` produce un chunk separado.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyNamed(loader: () => Promise<any>, exportName: string) {
  return lazy(async () => {
    const mod = await loader();
    return { default: mod[exportName] as ComponentType<Record<string, never>> };
  });
}

// ── Lazy: módulos principales ─────────────────────────────────────────────────
const CookingSession = lazyNamed(() => import('./components/CookingSession'), 'CookingSession');
const SkillTreeMap   = lazyNamed(() => import('./components/SkillTreeMap'),   'SkillTreeMap');
const AcademyModule  = lazyNamed(() => import('./components/AcademyModule'),  'AcademyModule');
const FlavorsModule  = lazyNamed(() => import('./components/FlavorsModule'),  'FlavorsModule');
const MilprepModule  = lazyNamed(() => import('./components/MilprepModule'),  'MilprepModule');
const MembresiaPage  = lazyNamed(() => import('./components/MembresiaPage'),  'MembresiaPage');
const CMSTestPage    = lazyNamed(() => import('./components/cms/CMSTestPage'),'CMSTestPage');

// ── Lazy: Mundo 1 ─────────────────────────────────────────────────────────────
const JulianaLevel    = lazyNamed(() => import('./components/JulianaLevel'),    'JulianaLevel');
const BrunoiseLevel   = lazyNamed(() => import('./components/BrunoiseLevel'),   'BrunoiseLevel');
const ChiffonadeLevel = lazyNamed(() => import('./components/ChiffonadeLevel'), 'ChiffonadeLevel');
const ChefVegetalBoss = lazyNamed(() => import('./components/ChefVegetalBoss'), 'ChefVegetalBoss');

// ── Lazy: Mundo 2 ─────────────────────────────────────────────────────────────
const SofritoLevel   = lazyNamed(() => import('./components/SofritoLevel'),   'SofritoLevel');
const MaillardLevel  = lazyNamed(() => import('./components/MaillardLevel'),  'MaillardLevel');
const EmulsionLevel  = lazyNamed(() => import('./components/EmulsionLevel'),  'EmulsionLevel');
const FlambeadorBoss = lazyNamed(() => import('./components/FlambeadorBoss'), 'FlambeadorBoss');

// ── Lazy: Mundo 3 ─────────────────────────────────────────────────────────────
const FondoBlancoLevel    = lazyNamed(() => import('./components/FondoBlancoLevel'),    'FondoBlancoLevel');
const FondoOscuroLevel    = lazyNamed(() => import('./components/FondoOscuroLevel'),    'FondoOscuroLevel');
const FumetLevel          = lazyNamed(() => import('./components/FumetLevel'),          'FumetLevel');
const MaestroDeSalsasBoss = lazyNamed(() => import('./components/MaestroDeSalsasBoss'), 'MaestroDeSalsasBoss');

// ── Lazy: Mundo 4 ─────────────────────────────────────────────────────────────
const SousVideLevel       = lazyNamed(() => import('./components/SousVideLevel'),       'SousVideLevel');
const EsferificacionLevel = lazyNamed(() => import('./components/EsferificacionLevel'), 'EsferificacionLevel');
const FermentacionLevel   = lazyNamed(() => import('./components/FermentacionLevel'),   'FermentacionLevel');
const AlquimistaBoss      = lazyNamed(() => import('./components/AlquimistaBoss'),      'AlquimistaBoss');

// ── Lazy: Mundo 5 ─────────────────────────────────────────────────────────────
const MenuDegustacionLevel = lazyNamed(() => import('./components/MenuDegustacionLevel'), 'MenuDegustacionLevel');
const MarinajeLevel        = lazyNamed(() => import('./components/MarinajeLevel'),        'MarinajeLevel');
const AltaCocinaLevel      = lazyNamed(() => import('./components/AltaCocinaLevel'),      'AltaCocinaLevel');
const GranChefBoss         = lazyNamed(() => import('./components/GranChefBoss'),         'GranChefBoss');

// ── Fallback de Suspense durante carga de chunk ───────────────────────────────
const RouteFallback = () => (
  <div role="status" aria-live="polite" className="flex items-center justify-center h-full min-h-[60vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" aria-hidden />
      <span className="text-sm font-semibold text-neutral-500">Cargando…</span>
    </div>
  </div>
);

const navLinks = [
  { to: '/home',     icon: Home,        label: 'Inicio',           shortLabel: 'Inicio',    exact: true },
  { to: '/cocinar',  icon: Compass,     label: 'Cocinemos',        shortLabel: 'Cocinar',   exact: false },
  { to: '/mapa',     icon: MapIcon,     label: 'Modo Aventura',    shortLabel: 'Aventura',  exact: false },
  { to: '/sabores',  icon: Globe,       label: 'Sabores del Mundo',shortLabel: 'Sabores',   exact: false },
  { to: '/academia', icon: BookOpen,    label: 'La Academia',      shortLabel: 'Academia',  exact: false },
  { to: '/milprep',  icon: CalendarDays,label: 'Mealprep',         shortLabel: 'Mealprep',  exact: false },
];

// ── Lesson viewer system ──────────────────────────────────────────────────────
interface LessonEventData {
  title: string; emoji: string; duration: string;
  levelName: string; levelColor: string; levelBg: string; levelBorder: string;
  isCompleted: boolean;
}

// ── Toast system ──────────────────────────────────────────────────────────────
interface ToastData { msg: string; type: 'info' | 'warning' | 'success' | 'error' }

// Dispatch helper — usable from anywhere
export function showToast(msg: string, type: ToastData['type'] = 'info') {
  window.dispatchEvent(new CustomEvent('sous:toast', { detail: { msg, type } }));
}

const Toast = memo(({ data, onClose }: { data: ToastData; onClose: () => void }) => {
  const colors: Record<ToastData['type'], string> = {
    info:    'bg-blue-600 text-white',
    warning: 'bg-amber-500 text-white',
    success: 'bg-emerald-600 text-white',
    error:   'bg-red-600 text-white',
  };
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl max-w-sm w-[92vw] animate-in fade-in slide-in-from-top-4 duration-300 ${colors[data.type]}`}>
      <span className="flex-1 text-sm font-semibold leading-snug">{data.msg}</span>
      <button onClick={onClose} aria-label="Cerrar notificación" className="flex-shrink-0 opacity-70 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
});
Toast.displayName = 'Toast';

// Redirect with toast (for locked level / premium routes)
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
  const [activeLesson, setActiveLesson] = useState<LessonEventData | null>(null);

  // CountryPicker one-shot: se muestra solo a usuarios que aún no han elegido
  // país (legacy users de antes del feature). El registro nuevo ya lo pide.
  const [showCountryPicker, setShowCountryPicker] = useState(() => !getUserCountry());

  const [userData, setUserData] = useState({
    username: "Cargando...",
    rank: "Iniciado",
    xp: 0,
    nextRankXp: 500,
    levelProgress: 0,
    is_admin: false
  });

  const loadUserData = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        let rank = "Iniciado";
        let nextXp = 500;
        let base = 0;
        if (user.xp >= 500) { rank = "Cocinero de Partida"; nextXp = 1500; base = 500; }
        if (user.xp >= 1500) { rank = "Sous Chef"; nextXp = 5000; base = 1500; }
        if (user.xp >= 5000) { rank = "Chef de Cuisine"; nextXp = 15000; base = 5000; }
        if (user.xp >= 15000) { rank = "Maestría Culinaria"; nextXp = 50000; base = 15000; }
        const progress = ((user.xp - base) / (nextXp - base)) * 100;
        setUserData({
          username: user.username,
          rank: rank,
          xp: user.xp,
          nextRankXp: nextXp,
          levelProgress: progress > 100 ? 100 : progress,
          is_admin: user.is_admin || false
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    loadUserData();
    window.addEventListener('userStateChange', loadUserData);
    return () => window.removeEventListener('userStateChange', loadUserData);
  }, []);

  // Toast listener
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handler = (e: Event) => {
      const { msg, type = 'info' } = (e as CustomEvent<ToastData>).detail;
      setToast({ msg, type });
      clearTimeout(timer);
      timer = setTimeout(() => setToast(null), 3500);
    };
    window.addEventListener('sous:toast', handler);
    return () => { window.removeEventListener('sous:toast', handler); clearTimeout(timer); };
  }, []);

  // Lesson viewer listener
  useEffect(() => {
    const handler = (e: Event) => {
      setActiveLesson((e as CustomEvent<LessonEventData>).detail);
    };
    window.addEventListener('sous:openLesson', handler);
    return () => window.removeEventListener('sous:openLesson', handler);
  }, []);

  const handleLogout = async () => {
    await backendLogout(); // revoca el refresh en el server (no-op si dev local)
    clearSession();
    navigate('/login');
  };

  const userInitial = userData.username?.[0]?.toUpperCase() ?? '?';

  const handleCountrySelect = (code: string) => {
    setUserCountry(code);
    setShowCountryPicker(false);
    showToast(`Listo, Sous te sugerirá recetas locales 🌎`, 'success');
  };

  const handleCountrySkip = () => {
    setUserCountry('OTHER'); // guarda OTHER para que no se vuelva a preguntar
    setShowCountryPicker(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* CountryPicker one-shot (solo si no hay país configurado) */}
      {showCountryPicker && (
        <CountryPicker
          mode="modal"
          onSelect={handleCountrySelect}
          onSkip={handleCountrySkip}
        />
      )}

      {/* Lesson viewer — renderiza sobre todo el layout */}
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

      {/* Toast */}
      {toast && <Toast data={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-neutral-100 sticky top-0 z-50 shadow-[0_1px_12px_rgba(0,0,0,0.06)]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-orange-400 to-rose-500 p-1.5 rounded-xl shadow-sm shadow-orange-200">
              <ChefHat className="text-white w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
              Sous
            </span>
            {userData.is_admin && (
              <span className="ml-1 text-xs font-bold bg-neutral-900 text-white px-2 py-0.5 rounded-md tracking-wide">
                ADMIN
              </span>
            )}
          </div>

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-2 rounded-2xl border border-orange-100">
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0 shadow-sm">
                {userInitial}
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold text-neutral-800">{userData.username}</span>
                <span className="text-xs font-semibold text-orange-500">{userData.rank}</span>
              </div>
              <div className="flex flex-col items-end gap-1 pl-1 border-l border-orange-100">
                <span className="text-xs text-neutral-400 font-medium">{userData.xp} / {userData.nextRankXp} XP</span>
                <div className="w-20 h-1.5 bg-orange-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-rose-500 rounded-full transition-all duration-700"
                    style={{ width: `${userData.levelProgress}%` }}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-150"
              title="Cerrar Sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full md:p-4 md:pb-4 pb-16 flex gap-5 md:mt-1 min-h-0">
        {/* Sidebar — solo desktop */}
        <nav className="w-56 flex-shrink-0 hidden md:flex flex-col gap-1 pt-1">
          {navLinks.map(({ to, icon: Icon, label, exact }, i) => {
            const isActive = exact
              ? location.pathname === to
              : location.pathname.startsWith(to);
            return (
              <div key={to}>
                {i === 1 && <div className="border-t border-neutral-100 my-1" />}
                <Link
                  to={to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-orange-200/60'
                      : 'text-neutral-500 hover:bg-orange-50 hover:text-orange-600'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-white' : ''} />
                  {label}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Content area — siempre empieza desde arriba */}
        <div className="flex-1 bg-white md:rounded-2xl md:shadow-sm md:border md:border-neutral-100 overflow-y-auto relative flex flex-col">
          {children}

          {isAdmin && (
            <div className="fixed bottom-20 md:bottom-8 right-8 z-[100]">
              <button
                onClick={toggleEditMode}
                className={`flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl font-bold transition-all border-2 ${
                  isEditMode
                    ? 'bg-orange-500 text-white border-orange-400 shadow-orange-500/40 animate-pulse'
                    : 'bg-neutral-900 text-white border-neutral-700 hover:bg-neutral-800'
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
                {isEditMode ? 'Constructor Visual [ON]' : 'Activar Modo Constructor'}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ── Bottom nav (móvil) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/90 backdrop-blur-md border-t border-neutral-100 shadow-[0_-1px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-stretch justify-around h-16">
          {navLinks.map(({ to, icon: Icon, shortLabel, exact }) => {
            const isActive = exact
              ? location.pathname === to
              : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 text-center transition-all duration-150 ${
                  isActive ? 'text-orange-500' : 'text-neutral-400 hover:text-orange-400'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all duration-150 ${isActive ? 'bg-orange-50' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className={`text-[10px] font-semibold leading-none ${isActive ? 'text-orange-500' : ''}`}>
                  {shortLabel}
                </span>
              </Link>
            );
          })}
        </div>
        {/* Safe area para iPhone */}
        <div className="h-safe-area-inset-bottom" />
      </nav>
    </div>
  );
};

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = localStorage.getItem('user');
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

// Premium Route Wrapper – redirige a /membresia si no tiene suscripción activa
const PremiumRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isPremiumUser()) {
    return (
      <ToastRedirect
        to="/membresia"
        msg="🔒 Este contenido es exclusivo para miembros Premium. ¡Desbloquéalo aquí!"
        type="warning"
      />
    );
  }
  return <>{children}</>;
};

// Level Route Wrapper – redirige al mapa si el nivel anterior no ha sido completado
const LevelRoute = ({ children, path }: { children: React.ReactNode; path: string }) => {
  if (!isLevelUnlocked(path)) {
    return (
      <ToastRedirect
        to="/mapa"
        msg="🔒 Completa el nivel anterior para desbloquear éste"
        type="warning"
      />
    );
  }
  return <>{children}</>;
};

// Cierra sesión cuando el backend expira el JWT y el refresh también falla.
const AuthExpiryWatcher = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = () => {
      showToast('Tu sesión expiró. Inicia sesión nuevamente.', 'warning');
      clearSession();
      navigate('/login', { replace: true });
    };
    window.addEventListener('sous:auth-expired', handler);
    return () => window.removeEventListener('sous:auth-expired', handler);
  }, [navigate]);
  return null;
};

function App() {
  return (
    <ErrorBoundary>
    <EditorProvider>
      <Router>
        <AuthExpiryWatcher />
        <Routes>
        <Route path="/login" element={<AuthScreen />} />

        {/* Protected Application Routes */}
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Navigate to="/home" replace />} />
                {/* CMS Routes */}
                <Route path="/cms-test" element={<CMSTestPage />} />
                <Route path="/home" element={<HomeMenu />} />
                <Route path="/membresia" element={<MembresiaPage />} />
                <Route path="/cocinar" element={<CookingSession />} />
                <Route path="/mapa" element={<SkillTreeMap />} />

                {/* ── Mundo 1: Isla del Cuchillo ── */}
                <Route path="/mapa/juliana"    element={<LevelRoute path="/mapa/juliana"><JulianaLevel /></LevelRoute>} />
                <Route path="/mapa/brunoise"   element={<LevelRoute path="/mapa/brunoise"><BrunoiseLevel /></LevelRoute>} />
                <Route path="/mapa/chiffonade" element={<LevelRoute path="/mapa/chiffonade"><ChiffonadeLevel /></LevelRoute>} />
                <Route path="/mapa/chef-vegetal" element={<LevelRoute path="/mapa/chef-vegetal"><ChefVegetalBoss /></LevelRoute>} />

                {/* ── Mundo 2: Valle del Fuego ── */}
                <Route path="/mapa/sofrito"    element={<LevelRoute path="/mapa/sofrito"><SofritoLevel /></LevelRoute>} />
                <Route path="/mapa/maillard"   element={<LevelRoute path="/mapa/maillard"><MaillardLevel /></LevelRoute>} />
                <Route path="/mapa/emulsion"   element={<LevelRoute path="/mapa/emulsion"><EmulsionLevel /></LevelRoute>} />
                <Route path="/mapa/flambeador" element={<LevelRoute path="/mapa/flambeador"><FlambeadorBoss /></LevelRoute>} />

                {/* ── Mundo 3: Mar de Sabores ── PREMIUM ── */}
                <Route path="/mapa/fondo-blanco"   element={<PremiumRoute><LevelRoute path="/mapa/fondo-blanco"><FondoBlancoLevel /></LevelRoute></PremiumRoute>} />
                <Route path="/mapa/fondo-oscuro"   element={<PremiumRoute><LevelRoute path="/mapa/fondo-oscuro"><FondoOscuroLevel /></LevelRoute></PremiumRoute>} />
                <Route path="/mapa/fumet"          element={<PremiumRoute><LevelRoute path="/mapa/fumet"><FumetLevel /></LevelRoute></PremiumRoute>} />
                <Route path="/mapa/maestro-salsas" element={<PremiumRoute><LevelRoute path="/mapa/maestro-salsas"><MaestroDeSalsasBoss /></LevelRoute></PremiumRoute>} />

                {/* ── Mundo 4: Pico del Maestro ── PREMIUM ── */}
                <Route path="/mapa/sous-vide"      element={<PremiumRoute><LevelRoute path="/mapa/sous-vide"><SousVideLevel /></LevelRoute></PremiumRoute>} />
                <Route path="/mapa/esferificacion" element={<PremiumRoute><LevelRoute path="/mapa/esferificacion"><EsferificacionLevel /></LevelRoute></PremiumRoute>} />
                <Route path="/mapa/fermentacion"   element={<PremiumRoute><LevelRoute path="/mapa/fermentacion"><FermentacionLevel /></LevelRoute></PremiumRoute>} />
                <Route path="/mapa/alquimista"     element={<PremiumRoute><LevelRoute path="/mapa/alquimista"><AlquimistaBoss /></LevelRoute></PremiumRoute>} />

                {/* ── Mundo 5: Castillo del Chef ── PREMIUM ── */}
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

