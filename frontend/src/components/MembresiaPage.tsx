import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown, Lock, CheckCircle, XCircle, Loader2,
  Flame, Waves, Mountain, Castle, ChefHat, ArrowRight, Mail
} from 'lucide-react';
import { checkMembership, updatePremiumStatus, isPremiumUser } from '../utils/membership';

// ─── Beneficios premium ───────────────────────────────────────────────────────
const PREMIUM_FEATURES = [
  { icon: Waves,    label: 'Mundo 3: Mar de Sabores',        desc: 'Fondos, fumet y salsas maestras' },
  { icon: Mountain, label: 'Mundo 4: Pico del Maestro',      desc: 'Sous-vide, esferificación, fermentación' },
  { icon: Castle,   label: 'Mundo 5: Castillo del Chef',     desc: 'Menú degustación y alta cocina' },
  { icon: ChefHat,  label: 'Evaluación IA ilimitada',        desc: 'Sube tus fotos y recibe feedback real' },
  { icon: Crown,    label: 'Batallas contra Chef Bosses',    desc: 'Desafíos con voz en tiempo real' },
];

const FREE_FEATURES = [
  { icon: ChefHat,  label: 'Mundo 1: Isla del Cuchillo', ok: true },
  { icon: Flame,    label: 'Mundo 2: Valle del Fuego',   ok: true },
  { icon: ChefHat,  label: 'Cocinemos (IA + voz)',       ok: true },
  { icon: ChefHat,  label: 'Sabores del Mundo',          ok: true },
  { icon: ChefHat,  label: 'La Academia + Mealprep',     ok: true },
  { icon: Lock,     label: 'Mundos 3, 4 y 5',            ok: false },
];

// ─── Componente ───────────────────────────────────────────────────────────────
export const MembresiaPage = () => {
  const navigate = useNavigate();
  const alreadyPremium = isPremiumUser();

  const [email, setEmail]       = useState(() => {
    try {
      return (JSON.parse(localStorage.getItem('user') ?? '{}') as { email?: string }).email ?? '';
    } catch { return ''; }
  });
  const [checking, setChecking] = useState(false);
  const [result,   setResult]   = useState<'found' | 'notfound' | null>(null);

  const HOTMART_URL = (import.meta.env.VITE_HOTMART_URL as string | undefined)
    ?? 'https://pay.hotmart.com/PRODUCT_ID_AQUI';

  // ── "Ya pagué" – verifica membresía ────────────────────────────────────────
  const handleVerify = async () => {
    if (!email.trim()) return;
    setChecking(true);
    setResult(null);
    const isPremium = await checkMembership(email.trim());
    if (isPremium) {
      updatePremiumStatus(true);
      setResult('found');
      setTimeout(() => navigate('/mapa'), 1500);
    } else {
      setResult('notfound');
    }
    setChecking(false);
  };

  // ── Si ya es premium, mostrar pantalla de confirmación ────────────────────
  if (alreadyPremium) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl">
          <Crown className="w-10 h-10 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-neutral-900">¡Ya eres miembro Premium!</h2>
          <p className="text-neutral-500 mt-1">Tienes acceso completo a todos los mundos de Sous.</p>
        </div>
        <button
          onClick={() => navigate('/mapa')}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          <ArrowRight size={18} /> Ir al Mapa de Aventura
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white px-6 py-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,#f97316,transparent_60%),radial-gradient(circle_at_70%_50%,#f43f5e,transparent_60%)]" />
        <div className="relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-orange-500/30">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Sous <span className="text-orange-400">Premium</span></h1>
          <p className="text-neutral-400 mt-2 max-w-sm mx-auto text-sm leading-relaxed">
            Desbloquea los 3 mundos avanzados y lleva tus habilidades culinarias al siguiente nivel.
          </p>

          {/* Precio */}
          <div className="mt-6 inline-flex flex-col items-center bg-white/10 border border-white/20 rounded-2xl px-8 py-4 backdrop-blur-sm">
            <span className="text-xs text-neutral-400 uppercase tracking-widest font-semibold mb-1">Membresía mensual</span>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-black text-white">$9.99</span>
              <span className="text-neutral-400 text-sm mb-1">USD/mes</span>
            </div>
            <span className="text-xs text-green-400 font-semibold mt-1">✓ Cancela cuando quieras</span>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-md mx-auto space-y-6">
        {/* Botón principal – Hotmart */}
        <a
          href={HOTMART_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-orange-500/30 transition-all active:scale-[0.98]"
        >
          <Crown size={22} />
          Suscribirme ahora
          <ArrowRight size={18} />
        </a>

        {/* Beneficios premium */}
        <div className="bg-neutral-50 rounded-2xl border border-neutral-100 p-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-orange-500 mb-4">
            Incluido en Premium
          </h3>
          <div className="space-y-3">
            {PREMIUM_FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={15} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-800">{label}</p>
                  <p className="text-xs text-neutral-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparación libre vs premium */}
        <div className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">
            Plan Gratuito
          </h3>
          <div className="space-y-2">
            {FREE_FEATURES.map(({ label, ok }) => (
              <div key={label} className="flex items-center gap-3">
                {ok
                  ? <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                  : <XCircle   size={16} className="text-neutral-300 flex-shrink-0" />
                }
                <span className={`text-sm ${ok ? 'text-neutral-700 font-medium' : 'text-neutral-400 line-through'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* "Ya pagué" – verificar membresía */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <h3 className="text-sm font-black text-blue-800 mb-1">¿Ya completaste el pago?</h3>
          <p className="text-xs text-blue-600 mb-3">
            Ingresa el correo que usaste en Hotmart para verificar tu acceso.
          </p>
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              />
            </div>
            <button
              onClick={handleVerify}
              disabled={checking || !email.trim()}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
            >
              {checking
                ? <><Loader2 size={15} className="animate-spin" /> Verificando...</>
                : 'Verificar mi acceso'
              }
            </button>

            {result === 'found' && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-sm font-semibold">
                <CheckCircle size={15} /> ¡Membresía activa! Redirigiendo...
              </div>
            )}
            {result === 'notfound' && (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm">
                <XCircle size={15} />
                <span>
                  No encontramos tu membresía activa. Verifica que el correo sea el mismo que usaste en Hotmart,
                  o espera unos minutos y vuelve a intentarlo.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
