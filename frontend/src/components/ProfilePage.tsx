/**
 * Mi perfil (`/perfil`): país, preferencias, alergias y disgustos, uso de voz
 * del mes, membresía y cierre de sesión. En móvil se llega desde el avatar del
 * encabezado.
 */
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Globe, LogOut, Crown, Edit3, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  getUser,
  getUserCountry,
  setUserCountry,
  getUserPreferences,
  getUserAllergies,
  getUserDislikes,
  setUserPreferences,
  setUserAllergies,
  setUserDislikes,
  clearSession,
  backendLogout,
} from '../utils/auth';
import { isPremiumUser } from '../utils/membership';
import { getCountry } from '../data/countries';
import { CountryPicker } from './CountryPicker';
import { PreferencesEditor } from './PreferencesEditor';
import { summarizePreferences } from '../data/recipeFilters';
import { getVoiceUsageSummary } from '../utils/voiceUsage';
import { track, resetIdentity, Events } from '../utils/analytics';
import { ScreenHeader } from './ui/ScreenHeader';

const Row = ({ label, value, onClick, to, icon: Icon, iconBg, iconColor }: {
  label: string; value: string; onClick?: () => void; to?: string;
  icon: LucideIcon; iconBg: string; iconColor: string;
}) => {
  const body = (
    <>
      <span className={`${iconBg} w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`} aria-hidden>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-xs text-neutral-400 font-bold uppercase tracking-wide">{label}</span>
        <span className="block text-sm font-bold text-neutral-800 truncate">{value}</span>
      </span>
      <Edit3 className="w-4 h-4 text-neutral-400 flex-shrink-0" aria-hidden />
    </>
  );
  const cls = 'w-full min-h-14 flex items-center gap-3 p-4 text-left hover:bg-neutral-50 transition-colors';
  return (
    <section className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
      {to
        ? <Link to={to} className={cls}>{body}</Link>
        : <button type="button" onClick={onClick} className={cls}>{body}</button>}
    </section>
  );
};

export const ProfilePage = () => {
  const navigate = useNavigate();
  const user = getUser();

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showPrefEditor, setShowPrefEditor] = useState(false);
  // Se incrementa al guardar en los modales para volver a leer los datos.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  if (!user) return null;

  void version;
  const country = getCountry(getUserCountry());
  const summary = summarizePreferences(getUserPreferences(), getUserAllergies(), getUserDislikes());
  const voice = getVoiceUsageSummary();
  const isPremium = isPremiumUser();

  const handleLogout = async () => {
    track(Events.LoggedOut);
    await backendLogout();
    clearSession();
    resetIdentity();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50">
      <ScreenHeader title="Mi perfil" onBack={() => navigate(-1)} />

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-md mx-auto w-full px-4 py-6 space-y-5">
          <section className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-extrabold text-lg shadow-sm flex-shrink-0" aria-hidden>
                {user.username?.[0]?.toUpperCase() ?? '?'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-neutral-900 truncate">{user.username}</h2>
                  {isPremium && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold uppercase flex-shrink-0">
                      <Crown size={10} aria-hidden /> Premium
                    </span>
                  )}
                </div>
                {user.email && <p className="text-xs text-neutral-500 truncate">{user.email}</p>}
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-neutral-50 rounded-lg px-3 py-2">
                <dt className="text-neutral-400 font-bold uppercase tracking-wide text-[10px]">XP</dt>
                <dd className="text-neutral-800 font-bold tabular-nums">{user.xp ?? 0}</dd>
              </div>
              <div className="bg-neutral-50 rounded-lg px-3 py-2">
                <dt className="text-neutral-400 font-bold uppercase tracking-wide text-[10px]">Voz este mes</dt>
                <dd className="text-neutral-800 font-bold tabular-nums">
                  {Math.round(voice.used / 60)} de {Math.round(voice.cap / 60)} min
                </dd>
              </div>
            </dl>
          </section>

          <Row
            icon={Globe}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            label="Cocinas desde"
            value={country ? `${country.flag} ${country.name}` : 'Sin configurar'}
            onClick={() => setShowCountryPicker(true)}
          />
          <Row
            icon={Sparkles}
            iconBg="bg-orange-100"
            iconColor="text-orange-600"
            label="Preferencias, alergias y lo que no te gusta"
            value={summary.length > 0 ? summary.join(' · ') : 'Sin configurar'}
            onClick={() => setShowPrefEditor(true)}
          />
          <Row
            icon={Crown}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            label="Membresía"
            value={isPremium ? 'Premium activo' : 'Plan gratis. Ver Premium'}
            to="/membresia"
          />

          <button
            type="button"
            onClick={handleLogout}
            className="w-full min-h-12 flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} aria-hidden /> Cerrar sesión
          </button>

          <p className="text-center text-[11px] text-neutral-400 pt-2">Sous Chef · versión beta</p>
        </div>
      </div>

      {showCountryPicker && (
        <CountryPicker
          mode="modal"
          onSelect={(code) => {
            setUserCountry(code);
            track(Events.CountrySelected, { country: code });
            setShowCountryPicker(false);
            setVersion(v => v + 1);
          }}
          onSkip={() => setShowCountryPicker(false)}
        />
      )}

      {showPrefEditor && (
        <PreferencesEditor
          mode="modal"
          initialFilterIds={getUserPreferences()}
          initialAllergies={getUserAllergies()}
          initialDislikes={getUserDislikes()}
          onClose={() => setShowPrefEditor(false)}
          onSave={({ filterIds, allergies, dislikes }) => {
            setUserPreferences(filterIds);
            setUserAllergies(allergies);
            setUserDislikes(dislikes);
            track(Events.PreferencesChanged, {
              preference_count: filterIds.length,
              allergy_count: allergies.length,
              dislike_count: dislikes.length,
            });
            setShowPrefEditor(false);
            setVersion(v => v + 1);
          }}
        />
      )}
    </div>
  );
};
