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
import { Crown, Check, X, Loader2, Mail, ArrowLeft } from 'lucide-react';
import { checkMembership, updatePremiumStatus, isPremiumUser } from '../utils/membership';
import { FREE_CAP_SECONDS, PRO_CAP_SECONDS } from '../utils/voiceUsage';

const FREE_VOICE_MIN = FREE_CAP_SECONDS / 60;
const PREMIUM_VOICE_MIN = PRO_CAP_SECONDS / 60;

const PREMIUM_FEATURES = [
  {
    label: 'Mundos 3, 4 y 5 del Modo Aventura',
    desc: 'Fondos y salsas madre, sous-vide y fermentación, menú degustación. Con sus jefes.',
  },
  {
    label: `${PREMIUM_VOICE_MIN} minutos de voz al mes`,
    desc: `Cocina con las manos libres. En el plan gratis son ${FREE_VOICE_MIN}.`,
  },
  {
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
      <div className="flex-1 flex flex-col items-center justify-center gap-5 p-6 text-center">
        <Crown className="w-12 h-12 text-brand-700" aria-hidden />
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900">Tu membresía Premium está activa</h1>
          <p className="text-neutral-600 mt-1">Tienes acceso a los cinco mundos y a {PREMIUM_VOICE_MIN} minutos de voz al mes.</p>
        </div>
        <button
          onClick={() => navigate('/mapa')}
          className="min-h-11 px-6 bg-brand-700 hover:bg-brand-800 text-white font-semibold rounded-control transition-colors"
        >
          Ir al mapa
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50">
      <header className="flex items-center gap-1 px-2 h-12 bg-white border-b border-neutral-200">
        <button
          onClick={() => navigate(-1)}
          aria-label="Volver"
          className="w-11 h-11 flex items-center justify-center rounded-control text-neutral-700 hover:bg-neutral-100"
        >
          <ArrowLeft size={20} aria-hidden />
        </button>
        <span className="text-base font-extrabold text-neutral-900">Sous Chef Premium</span>
      </header>

      <div className="px-4 py-6 max-w-md mx-auto space-y-6">
        <section className="bg-white rounded-card border border-neutral-200 p-5">
          <p className="text-sm text-neutral-600">Membresía mensual</p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="text-4xl font-extrabold text-neutral-900">$9.99</span>
            <span className="text-neutral-600">USD al mes</span>
          </p>
          <p className="text-sm text-neutral-600 mt-1">Cancelas cuando quieras.</p>
          <a
            href={HOTMART_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex items-center justify-center gap-2 w-full min-h-12 px-6 bg-brand-700 hover:bg-brand-800 text-white font-semibold text-base rounded-control transition-colors"
          >
            Suscribirme
          </a>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-neutral-600 mb-2 px-1">Qué incluye Premium</h2>
          <ul className="bg-white rounded-card border border-neutral-200 divide-y divide-neutral-100">
            {PREMIUM_FEATURES.map(({ label, desc }) => (
              <li key={label} className="flex items-start gap-3 p-4">
                <Check size={18} className="text-brand-700 flex-shrink-0 mt-0.5" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{label}</p>
                  <p className="text-sm text-neutral-600">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-neutral-600 mb-2 px-1">Plan gratis</h2>
          <ul className="bg-white rounded-card border border-neutral-200 divide-y divide-neutral-100">
            {FREE_FEATURES.map(({ label, ok }) => (
              <li key={label} className="flex items-center gap-3 px-4 py-3">
                {ok
                  ? <Check size={16} className="text-world-1 flex-shrink-0" aria-hidden />
                  : <X size={16} className="text-neutral-500 flex-shrink-0" aria-hidden />
                }
                <span className={`text-sm ${ok ? 'text-neutral-800' : 'text-neutral-600'}`}>
                  {ok ? label : <><span className="sr-only">No incluye: </span>{label}</>}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-card border border-neutral-200 p-5">
          <h2 className="text-base font-bold text-neutral-900">¿Ya pagaste?</h2>
          <p className="text-sm text-neutral-600 mt-1 mb-3">
            Escribe el correo que usaste en Hotmart y verificamos tu acceso.
          </p>
          <label htmlFor="membresia-email" className="text-sm font-semibold text-neutral-800">Correo</label>
          <div className="relative mt-1">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden />
            <input
              id="membresia-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full min-h-11 pl-9 pr-3 text-base sm:text-sm border border-neutral-300 rounded-control focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 bg-white"
            />
          </div>
          <button
            onClick={handleVerify}
            disabled={checking || !email.trim()}
            className="mt-2 w-full flex items-center justify-center gap-2 min-h-11 px-4 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-sm font-semibold rounded-control transition-colors"
          >
            {checking
              ? <><Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden /> Verificando…</>
              : 'Verificar mi acceso'
            }
          </button>

          <div role="status" aria-live="polite">
            {result === 'found' && (
              <div className="mt-3 rounded-control bg-emerald-50 border border-emerald-200 p-3">
                <p className="text-sm font-semibold text-emerald-800">Encontramos tu membresía. Ya tienes Premium.</p>
                <button
                  onClick={() => navigate('/mapa')}
                  className="mt-2 min-h-11 px-4 bg-world-1 hover:bg-emerald-800 text-white text-sm font-semibold rounded-control"
                >
                  Ir al mapa
                </button>
              </div>
            )}
            {result === 'notfound' && (
              <p className="mt-3 rounded-control bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                No encontramos una membresía activa con ese correo. Revisa que sea el mismo de Hotmart.
                Si acabas de pagar, espera unos minutos y vuelve a intentarlo.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
