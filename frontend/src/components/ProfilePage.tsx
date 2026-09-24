/**
 * Mi perfil (`/perfil`): país, preferencias, alergias y disgustos, uso de voz
 * del mes, membresía y cierre de sesión. En móvil se llega desde el avatar del
 * encabezado.
 */
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Globe, LogOut, Crown, Edit3, Sparkles, Flame, Star, Map as MapIcon, BookOpen, Shield, UtensilsCrossed, Palmtree, Library, Mic } from 'lucide-react';
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
import { RANKS } from '../utils/rank';
import { getAchievements, getProgressStats, type Achievement, type AchievementIcon } from '../utils/achievements';
import { XpBar } from './ui/GameStats';
import { useGameState } from '../hooks/useGameState';

const Row = ({ label, value, onClick, to, icon: Icon, iconBg, iconColor }: {
  label: string; value: string; onClick?: () => void; to?: string;
  icon: LucideIcon; iconBg: string; iconColor: string;
}) => {
  const body = (
    <>
      <span className={`${iconBg} w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0`} aria-hidden>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-base font-black text-ink">{label}</span>
        <span className="block text-sm font-bold text-neutral-500 truncate">{value}</span>
      </span>
      <Edit3 className="w-5 h-5 text-neutral-500 flex-shrink-0" aria-hidden />
    </>
  );
  const cls = 'w-full min-h-14 flex items-center gap-3 p-4 text-left hover:bg-neutral-50 transition-colors';
  return (
    <section className="card-tactile overflow-hidden">
      {to
        ? <Link to={to} className={cls}>{body}</Link>
        : <button type="button" onClick={onClick} className={cls}>{body}</button>}
    </section>
  );
};

const BADGE_ICON: Record<AchievementIcon, LucideIcon> = {
  knife: UtensilsCrossed, star: Star, flame: Flame, book: BookOpen, crown: Crown, island: Palmtree, shield: Shield, books: Library,
};
const BADGE_TONE: Record<Achievement['tone'], string> = {
  green: 'bg-emerald-100 border-emerald-600 text-emerald-600 shadow-[0_4px_0_theme(colors.emerald.600)]',
  gold: 'bg-amber-100 border-amber-600 text-amber-600 shadow-[0_4px_0_theme(colors.amber.600)]',
  flame: 'bg-flame-soft border-flame text-flame shadow-[0_4px_0_theme(colors.flame.DEFAULT)]',
  violet: 'bg-violet-100 border-violet-500 text-violet-500 shadow-[0_4px_0_theme(colors.violet.500)]',
  red: 'bg-orange-100 border-orange-600 text-orange-600 shadow-[0_4px_0_theme(colors.orange.600)]',
};

function Badge({ a }: { a: Achievement }) {
  const Icon = BADGE_ICON[a.icon];
  return (
    <li className="flex flex-col items-center gap-2 text-center" title={a.hint}>
      <span className={`w-[72px] h-[72px] rounded-3xl border-[3px] flex items-center justify-center ${a.earned ? `${BADGE_TONE[a.tone]} -rotate-3` : 'bg-neutral-100 border-dashed border-neutral-300 text-neutral-400'}`}>
        <Icon size={32} strokeWidth={2.3} aria-hidden />
      </span>
      <span className={`text-[13px] font-black leading-tight ${a.earned ? 'text-ink' : 'text-neutral-500'}`}>{a.name}</span>
      <span className="sr-only">{a.earned ? 'Logro obtenido' : `Pendiente: ${a.hint}`}</span>
    </li>
  );
}

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

  const game = useGameState();

  if (!user) return null;

  void version;
  const country = getCountry(getUserCountry());
  const summary = summarizePreferences(getUserPreferences(), getUserAllergies(), getUserDislikes());
  const voice = getVoiceUsageSummary();
  const isPremium = isPremiumUser();
  const stats = getProgressStats();
  const achievements = getAchievements(game.rank.xp);
  const earned = achievements.filter(a => a.earned).length;

  const handleLogout = async () => {
    track(Events.LoggedOut);
    await backendLogout();
    clearSession();
    resetIdentity();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-xl mx-auto w-full px-4 pt-2 pb-8 md:py-6 space-y-5">
          <section className="flex items-center gap-4">
            <span className="w-[88px] h-[88px] rounded-[30px] bg-orange-600 flex items-center justify-center text-white font-black text-[40px] flex-shrink-0 shadow-[0_5px_0_theme(colors.orange.800)]" aria-hidden>
              {user.username?.[0]?.toUpperCase() ?? '?'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[26px] font-extrabold text-ink truncate">{user.username}</h1>
                {isPremium && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-ink text-[11px] font-black uppercase flex-shrink-0">
                    <Crown size={11} aria-hidden /> Premium
                  </span>
                )}
              </div>
              <p className="flex items-center gap-1.5 text-[15px] font-extrabold text-neutral-500">
                <Shield size={17} strokeWidth={2.4} className="text-amber-600" aria-hidden />
                {game.rank.rank} · {game.rank.xp} XP
              </p>
              {user.email && <p className="text-xs font-semibold text-neutral-500 truncate">{user.email}</p>}
            </div>
          </section>

          <dl className="grid grid-cols-2 gap-3">
            {[
              { icon: <Flame size={26} strokeWidth={2.4} className="text-flame" />, value: `${game.streak} ${game.streak === 1 ? 'día' : 'días'}`, label: 'Racha' },
              { icon: <Star size={26} className="fill-amber-500 text-amber-600" />, value: String(stats.totalStars), label: 'Estrellas' },
              { icon: <MapIcon size={26} strokeWidth={2.4} className="text-emerald-600" />, value: `${stats.levelsDone} de ${stats.totalLevels}`, label: 'Niveles' },
              { icon: <BookOpen size={26} strokeWidth={2.4} className="text-violet-500" />, value: String(stats.lessons), label: 'Clases' },
            ].map(s => (
              <div key={s.label} className="card-tactile p-3.5 flex items-center gap-2.5">
                <span aria-hidden>{s.icon}</span>
                <span className="flex flex-col-reverse">
                  <dt className="text-[13px] font-extrabold text-neutral-500">{s.label}</dt>
                  <dd className="font-display text-xl font-extrabold text-ink">{s.value}</dd>
                </span>
              </div>
            ))}
          </dl>

          <section className="card-tactile p-4 flex flex-col gap-3.5" aria-labelledby="camino">
            <div className="flex justify-between items-baseline gap-2">
              <h2 id="camino" className="text-xl font-extrabold text-ink">Tu camino</h2>
              {game.rank.next && <span className="text-sm font-extrabold text-neutral-500">{game.rank.nextRankXp - game.rank.xp} XP para subir</span>}
            </div>
            <XpBar percent={game.rank.progress} label="Progreso al siguiente rango" />
            <ol className="flex flex-col gap-3">
              {RANKS.map((r, i) => {
                const current = i === game.rank.index;
                const reached = i < game.rank.index;
                return (
                  <li key={r.name} className="flex items-center gap-3">
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-black ${current ? 'bg-amber-500 text-ink shadow-[0_3px_0_theme(colors.amber.600)]' : reached ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-500'}`}>
                      {current || reached ? <Shield size={20} strokeWidth={2.4} aria-hidden /> : i + 1}
                    </span>
                    <span className="flex-1 flex flex-col">
                      <span className={`text-base font-black ${current ? 'text-ink' : 'text-neutral-600'}`}>{r.name}</span>
                      <span className="text-[13px] font-extrabold text-neutral-500">{r.minXp.toLocaleString('es-CO')} XP</span>
                    </span>
                    {current && <span className="h-7 px-3 rounded-full bg-amber-100 border-2 border-amber-500 text-amber-800 text-xs font-black flex items-center">Tú estás aquí</span>}
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="card-tactile p-4 flex flex-col gap-4" aria-labelledby="logros">
            <div className="flex justify-between items-baseline">
              <h2 id="logros" className="text-xl font-extrabold text-ink">Logros</h2>
              <span className="text-sm font-extrabold text-neutral-500">{earned} de {achievements.length}</span>
            </div>
            <ul className="grid grid-cols-3 gap-x-2 gap-y-5">
              {achievements.map(a => <Badge key={a.id} a={a} />)}
            </ul>
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
          <section className="card-tactile p-4 flex items-center gap-3">
            <span className="bg-blue-100 w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" aria-hidden>
              <Mic className="w-5 h-5 text-blue-500" />
            </span>
            <span className="flex-1">
              <span className="block text-base font-black text-ink">Voz este mes</span>
              <span className="block text-sm font-bold text-neutral-500">{Math.round(voice.used / 60)} de {Math.round(voice.cap / 60)} min</span>
            </span>
          </section>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full min-h-[52px] flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border-2 border-red-200 text-red-700 font-black text-base hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} aria-hidden /> Cerrar sesión
          </button>

          <p className="text-center text-[13px] font-bold text-neutral-500 pt-2">Sous Chef · versión beta</p>
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
