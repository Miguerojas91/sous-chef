/**
 * Mi perfil (`/perfil`): país, preferencias, alergias y disgustos, uso de voz
 * del mes, membresía y cierre de sesión. En móvil se llega desde el avatar del
 * encabezado.
 */
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, LogOut } from 'lucide-react';
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

const Row = ({ label, value, onClick, to }: {
  label: string; value: string; onClick?: () => void; to?: string;
}) => {
  const body = (
    <>
      <span className="flex-1 min-w-0">
        <span className="block text-sm text-neutral-600">{label}</span>
        <span className="block text-base font-semibold text-neutral-900 truncate">{value}</span>
      </span>
      <ChevronRight size={20} className="text-neutral-500 flex-shrink-0" aria-hidden />
    </>
  );
  const cls = 'w-full min-h-14 flex items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 transition-colors';
  return to
    ? <Link to={to} className={cls}>{body}</Link>
    : <button type="button" onClick={onClick} className={cls}>{body}</button>;
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
        <div className="max-w-md mx-auto w-full px-4 py-6 space-y-6">
          <section className="flex items-center gap-3">
            <span className="w-14 h-14 rounded-full bg-brand-700 flex items-center justify-center text-white font-extrabold text-xl flex-shrink-0" aria-hidden>
              {user.username?.[0]?.toUpperCase() ?? '?'}
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-extrabold text-neutral-900 truncate">{user.username}</h2>
              {user.email && <p className="text-sm text-neutral-600 truncate">{user.email}</p>}
            </div>
            {isPremium && (
              <span className="px-2 py-1 rounded-md bg-brand-50 text-brand-800 text-xs font-bold">Premium</span>
            )}
          </section>

          <dl className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-card border border-neutral-200 px-4 py-3">
              <dt className="text-sm text-neutral-600">XP</dt>
              <dd className="text-lg font-bold text-neutral-900 tabular-nums">{user.xp ?? 0}</dd>
            </div>
            <div className="bg-white rounded-card border border-neutral-200 px-4 py-3">
              <dt className="text-sm text-neutral-600">Voz este mes</dt>
              <dd className="text-lg font-bold text-neutral-900 tabular-nums">
                {Math.round(voice.used / 60)} de {Math.round(voice.cap / 60)} min
              </dd>
            </div>
          </dl>

          <ul className="bg-white rounded-card border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
            <li>
              <Row
                label="Cocinas desde"
                value={country ? `${country.flag} ${country.name}` : 'Sin configurar'}
                onClick={() => setShowCountryPicker(true)}
              />
            </li>
            <li>
              <Row
                label="Preferencias, alergias y lo que no te gusta"
                value={summary.length > 0 ? summary.join(' · ') : 'Sin configurar'}
                onClick={() => setShowPrefEditor(true)}
              />
            </li>
            <li>
              <Row
                label="Membresía"
                value={isPremium ? 'Premium activo' : 'Plan gratis. Ver Premium'}
                to="/membresia"
              />
            </li>
          </ul>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full min-h-12 flex items-center justify-center gap-2 rounded-card bg-white border border-neutral-200 text-red-700 font-semibold text-sm hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} aria-hidden /> Cerrar sesión
          </button>

          <p className="text-center text-xs text-neutral-600">Sous Chef · versión beta</p>
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
