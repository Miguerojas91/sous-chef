/**
 * Suscripción Premium: beneficios, precio y compra en Hotmart, más la
 * verificación por correo para quien ya pagó (consulta el proxy vía
 * `checkMembership`).
 *
 * La lista de beneficios debe coincidir con lo que el código bloquea de verdad:
 * mundos 3-5 (`PremiumRoute`), el tope de voz (`voiceUsage`) y las lecciones
 * con `isPremium` en la Academia. Ver MONETIZATION.md antes de cambiarla.
 *
 * `VITE_HOTMART_URL`: URL de pago en Hotmart.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, CheckCircle, XCircle, Loader2, Mail, ArrowLeft, ArrowRight, Mountain, Mic, BookOpen } from 'lucide-react';
import { checkMembership, updatePremiumStatus, isPremiumUser } from '../utils/membership';
import { FREE_CAP_SECONDS, PRO_CAP_SECONDS } from '../utils/voiceUsage';

const FREE_VOICE_MIN = FREE_CAP_SECONDS / 60;
const PREMIUM_VOICE_MIN = PRO_CAP_SECONDS / 60;

const PREMIUM_FEATURES = [
  {
    icon: Mountain,
    label: 'Mundos 3, 4 y 5 del Modo Aventura',
    desc: 'Fondos y salsas madre, sous-vide y fermentación, menú degustación. Con sus jefes.',
  },
  {
    icon: Mic,
    label: `${PREMIUM_VOICE_MIN} minutos de voz al mes`,
    desc: `Cocina con las manos libres. En el plan gratis son ${FREE_VOICE_MIN}.`,
  },
  {
    icon: BookOpen,
    label: 'Clases avanzadas de la Academia',
    desc: 'Las lecciones marcadas como Premium.',
  },
];

const FREE_FEATURES = [
  { label: 'Mundos 1 y 2 del Modo Aventura, con sus jefes', ok: true },
  { label: 'Cocinemos por texto, sin límite', ok: true },
  { label: `${FREE_VOICE_MIN} minutos de voz al mes`, ok: true },
  { label: 'Sabores del Mundo y Mealprep', ok: true },
  { label: 'Clases básicas de la Academia', ok: true },
  { label: 'Evaluación de tus fotos en cada nivel', ok: true },
  { label: 'Mundos 3, 4 y 5', ok: false },
];

export const MembresiaPage = () => {
  const navigate = useNavigate();
  const alreadyPremium = isPremiumUser();

  const [email, setEmail] = useState(() => {
    try {
      return (JSON.parse(localStorage.getItem('user') ?? '{}') as { email?: string }).email ?? '';
    } catch { return ''; }
  });
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<'found' | 'notfound' | null>(null);

  const HOTMART_URL = (import.meta.env.VITE_HOTMART_URL as string | undefined)
    ?? 'https://pay.hotmart.com/PRODUCT_ID_AQUI';

  const handleVerify = async () => {
    if (!email.trim()) return;
    setChecking(true);
    setResult(null);
    const isPremium = await checkMembership(email.trim());
    if (isPremium) {
      updatePremiumStatus(true);
      setResult('found');
    } else {
      setResult('notfound');
    }
    setChecking(false);
  };

  if (alreadyPremium) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl" aria-hidden>
          <Crown className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-neutral-900">Tu membresía Premium está activa</h1>
          <p className="text-neutral-500 mt-1">Tienes acceso a los cinco mundos y a {PREMIUM_VOICE_MIN} minutos de voz al mes.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/mapa')}
          className="flex items-center gap-2 min-h-11 px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
        >
          <ArrowRight size={18} aria-hidden /> Ir al mapa
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white px-6 pt-4 pb-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,#f97316,transparent_60%),radial-gradient(circle_at_70%_50%,#f43f5e,transparent_60%)]" aria-hidden />
        <div className="relative z-10">
          <div className="flex justify-start -ml-3 mb-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Volver"
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <ArrowLeft size={18} aria-hidden />
            </button>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-orange-500/30" aria-hidden>
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Sous Chef <span className="text-orange-400">Premium</span></h1>

          <div className="mt-6 inline-flex flex-col items-center bg-white/10 border border-white/20 rounded-2xl px-8 py-4 backdrop-blur-sm">
            <span className="text-xs text-neutral-400 uppercase tracking-widest font-semibold mb-1">Membresía mensual</span>
            <p className="flex items-end gap-1">
              <span className="text-4xl font-black text-white">$9.99</span>
              <span className="text-neutral-400 text-sm mb-1">USD al mes</span>
            </p>
            <span className="text-xs text-green-400 font-semibold mt-1">✓ Cancelas cuando quieras.</span>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-md mx-auto space-y-6">
        <a
          href={HOTMART_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full min-h-12 py-4 px-6 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-orange-500/30 transition-all active:scale-[0.98]"
        >
          <Crown size={22} aria-hidden />
          Suscribirme
          <ArrowRight size={18} aria-hidden />
        </a>

        <section className="bg-neutral-50 rounded-2xl border border-neutral-100 p-5">
          <h2 className="text-xs font-black uppercase tracking-widest text-orange-500 mb-4">
            Qué incluye Premium
          </h2>
          <ul className="space-y-3">
            {PREMIUM_FEATURES.map(({ icon: Icon, label, desc }) => (
              <li key={label} className="flex items-start gap-3">
                <span className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" aria-hidden>
                  <Icon size={15} className="text-orange-500" />
                </span>
                <div>
                  <p className="text-sm font-bold text-neutral-800">{label}</p>
                  <p className="text-xs text-neutral-500">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-2xl border border-neutral-100 p-5 shadow-sm">
          <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">
            Plan gratis
          </h2>
          <ul className="space-y-2">
            {FREE_FEATURES.map(({ label, ok }) => (
              <li key={label} className="flex items-center gap-3">
                {ok
                  ? <CheckCircle size={16} className="text-green-500 flex-shrink-0" aria-hidden />
                  : <XCircle size={16} className="text-neutral-300 flex-shrink-0" aria-hidden />
                }
                <span className={`text-sm ${ok ? 'text-neutral-700 font-medium' : 'text-neutral-400 line-through'}`}>
                  {ok ? label : <><span className="sr-only">No incluye: </span>{label}</>}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <h2 className="text-sm font-black text-blue-800 mb-1">¿Ya pagaste?</h2>
          <p className="text-xs text-blue-600 mb-3">
            Escribe el correo que usaste en Hotmart y verificamos tu acceso.
          </p>
          <label htmlFor="membresia-email" className="sr-only">Correo</label>
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden />
              <input
                id="membresia-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full min-h-11 pl-9 pr-3 py-2.5 text-base sm:text-sm border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              />
            </div>
            <button
              type="button"
              onClick={handleVerify}
              disabled={checking || !email.trim()}
              className="flex items-center justify-center gap-2 min-h-11 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
            >
              {checking
                ? <><Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden /> Verificando…</>
                : 'Verificar mi acceso'
              }
            </button>

            <div role="status" aria-live="polite">
              {result === 'found' && (
                <div className="text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <CheckCircle size={15} aria-hidden /> Encontramos tu membresía. Ya tienes Premium.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/mapa')}
                    className="mt-2 flex items-center gap-2 min-h-11 px-4 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    <ArrowRight size={16} aria-hidden /> Ir al mapa
                  </button>
                </div>
              )}
              {result === 'notfound' && (
                <div className="flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm">
                  <XCircle size={15} className="flex-shrink-0 mt-0.5" aria-hidden />
                  <p>
                    No encontramos una membresía activa con ese correo. Revisa que sea el mismo de Hotmart.
                    Si acabas de pagar, espera unos minutos y vuelve a intentarlo.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
