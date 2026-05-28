/**
 * ProfilePage.tsx
 *
 * Página "Mi perfil" — pantalla central donde el usuario puede:
 *  - Ver y editar país.
 *  - Ver y editar preferencias dietéticas, alergias, disgustos.
 *  - Ver stats: XP, voz usada del mes, status premium.
 *  - Acceder a membresía.
 *  - Cerrar sesión.
 *
 * Accesible vía `/perfil`. Hoy se llega clicando en el avatar/nombre del
 * header (registrado en App.tsx).
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Globe, LogOut, Crown, Edit3, Sparkles } from 'lucide-react';
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
import { PreferencesEditor, summarizePreferences } from './PreferencesEditor';
import { getVoiceUsageSummary } from '../utils/voiceUsage';
import { track, resetIdentity, Events } from '../utils/analytics';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const user = getUser();

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showPrefEditor, setShowPrefEditor] = useState(false);
  // Bump para re-render al guardar cambios desde los modales
  const [version, setVersion] = useState(0);

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  // Lecturas frescas (se actualizan con `version`)
  void version;
  const country = getCountry(getUserCountry());
  const prefs = getUserPreferences();
  const allergies = getUserAllergies();
  const dislikes = getUserDislikes();
  const summary = summarizePreferences(prefs, allergies, dislikes);
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
    <div className="flex flex-col h-full bg-neutral-50 overflow-y-auto">
      {/* Header */}
      <header className="flex items-center px-4 py-3 border-b border-neutral-100 bg-white sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          aria-label="Volver"
          className="p-1.5 rounded-full hover:bg-neutral-100 transition-colors mr-2"
        >
          <ArrowLeft className="w-4 h-4 text-neutral-600" />
        </button>
        <h1 className="text-base font-bold text-neutral-800">Mi perfil</h1>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 space-y-5">
        {/* Identidad */}
        <section className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              {user.username?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-neutral-900 truncate">{user.username}</h2>
                {isPremium && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold uppercase">
                    <Crown size={10} /> Pro
                  </span>
                )}
              </div>
              {user.email && <p className="text-xs text-neutral-500 truncate">{user.email}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-neutral-50 rounded-lg px-3 py-2">
              <div className="text-neutral-400 font-bold uppercase tracking-wide text-[10px]">XP</div>
              <div className="text-neutral-800 font-bold">{user.xp ?? 0}</div>
            </div>
            <div className="bg-neutral-50 rounded-lg px-3 py-2">
              <div className="text-neutral-400 font-bold uppercase tracking-wide text-[10px]">Voz este mes</div>
              <div className="text-neutral-800 font-bold">
                {Math.round(voice.used / 60)} / {Math.round(voice.cap / 60)} min
              </div>
            </div>
          </div>
        </section>

        {/* País */}
        <section className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowCountryPicker(true)}
            className="w-full flex items-center gap-3 p-4 hover:bg-neutral-50 transition-colors text-left"
          >
            <div className="bg-emerald-100 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-neutral-400 font-bold uppercase tracking-wide">Cocinas desde</div>
              <div className="text-sm font-bold text-neutral-800">
                {country ? `${country.flag} ${country.name}` : 'Sin configurar'}
              </div>
            </div>
            <Edit3 className="w-4 h-4 text-neutral-400" />
          </button>
        </section>

        {/* Preferencias */}
        <section className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowPrefEditor(true)}
            className="w-full flex items-start gap-3 p-4 hover:bg-neutral-50 transition-colors text-left"
          >
            <div className="bg-orange-100 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-neutral-400 font-bold uppercase tracking-wide">Preferencias</div>
              <div className="text-sm font-bold text-neutral-800 truncate">
                {summary.length > 0 ? summary.join(' · ') : 'Sin preferencias configuradas'}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Sous las respeta en todas tus sesiones de cocina.
              </div>
            </div>
            <Edit3 className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          </button>
        </section>

        {/* Membresía */}
        <section className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <Link
            to="/membresia"
            className="w-full flex items-center gap-3 p-4 hover:bg-neutral-50 transition-colors text-left"
          >
            <div className="bg-amber-100 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-neutral-400 font-bold uppercase tracking-wide">Membresía</div>
              <div className="text-sm font-bold text-neutral-800">
                {isPremium ? 'Plan Pro activo' : 'Plan gratuito · Ver Pro'}
              </div>
            </div>
            <Edit3 className="w-4 h-4 text-neutral-400" />
          </Link>
        </section>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} /> Cerrar sesión
        </button>

        <p className="text-center text-[11px] text-neutral-400 pt-2">
          Versión beta — Sous Chef
        </p>
      </main>

      {/* Modales */}
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
