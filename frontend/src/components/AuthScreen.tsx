/**
 * Inicio de sesión y registro.
 *
 * Login: primero contra el backend JWT si está habilitado; si el backend no
 * responde (`BackendUnavailableError`), contra los usuarios locales
 * (`sous_registered_users` y el admin semilla). Un error real del backend
 * (credenciales inválidas) no cae al modo local.
 *
 * Registro en dos pasos: 1) usuario, correo y contraseña; 2) país y
 * preferencias, que se pueden saltar sin perder lo ya marcado.
 *
 * Si el usuario tiene correo, al entrar se consulta su membresía en Hotmart.
 */

import React, { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Eye, EyeOff, AlertTriangle, ArrowRight, UserPlus, LogIn, Check } from 'lucide-react';
import { LOCAL_USERS, getSeedAdmin, type LocalUser } from '../data/localUsers';
import { checkMembership } from '../utils/membership';
import {
  isBackendAuthEnabled,
  backendLogin,
  backendRegister,
  setSession,
  BackendUnavailableError,
} from '../utils/auth';
import { CountryPicker } from './CountryPicker';
import { getCountry } from '../data/countries';
import { PreferencesEditor } from './PreferencesEditor';
import { track, identify, Events } from '../utils/analytics';

function getStoredUsers(): LocalUser[] {
  try { return JSON.parse(localStorage.getItem('sous_registered_users') ?? '[]'); }
  catch { return []; }
}

function saveStoredUsers(users: LocalUser[]) {
  localStorage.setItem('sous_registered_users', JSON.stringify(users));
}

function findUser(username: string, password: string): LocalUser | undefined {
  const all = [...LOCAL_USERS, ...getSeedAdmin(), ...getStoredUsers()];
  return all.find(
    u => u.username.toLowerCase() === username.trim().toLowerCase()
      && u.password === password.trim()
  );
}

function usernameExists(username: string): boolean {
  const all = [...LOCAL_USERS, ...getSeedAdmin(), ...getStoredUsers()];
  return all.some(u => u.username.toLowerCase() === username.trim().toLowerCase());
}

const inputClass =
  'appearance-none block w-full min-h-12 px-3 py-3 border border-neutral-300 rounded-xl shadow-sm placeholder-neutral-400 text-base sm:text-sm text-neutral-900 ' +
  'focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 aria-[invalid=true]:border-red-500';

const Spinner = () => (
  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full motion-safe:animate-spin" aria-hidden />
);

const AUTH_BG =
  "bg-[url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center";

export const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    allergies: [] as string[],
    dislikes: [] as string[],
    country: '' as string,
    preferences: [] as string[],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const ids = { user: useId(), email: useId(), pass: useId(), err: useId() };
  const step2HeadingRef = useRef<HTMLHeadingElement>(null);

  // Al pasar al paso 2 el formulario cambia entero: llevar el foco al título
  // para que lector de pantalla y teclado no queden en un botón que ya no existe.
  useEffect(() => {
    if (step === 2) step2HeadingRef.current?.focus();
  }, [step]);

  const loginWithData = async (data: LocalUser) => {
    let userData: LocalUser & { isPremium?: boolean } = { ...data };
    if (data.email) {
      try {
        const isPremium = await checkMembership(data.email);
        userData = { ...userData, isPremium };
      } catch { /* sin respuesta de Hotmart: se entra como plan gratis */ }
    }
    setSession(userData);
    identify(userData.username, {
      is_admin: !!userData.is_admin,
      is_premium: !!userData.isPremium,
      country: userData.country ?? null,
    });
    track(Events.LoggedIn, { is_premium: !!userData.isPremium });
    navigate('/');
  };

  const buildNewUser = (): LocalUser => ({
    username: formData.username.trim(),
    password: formData.password.trim(),
    email: formData.email.trim() || undefined,
    xp: 0,
    rank: 'Iniciado',
    is_admin: false,
    country: formData.country || undefined,
    preferences: formData.preferences.length > 0 ? formData.preferences : undefined,
    allergies: formData.allergies.length > 0 ? formData.allergies : undefined,
    dislikes: formData.dislikes.length > 0 ? formData.dislikes : undefined,
  });

  const finishRegister = async (data: LocalUser) => {
    setIsLoading(true);
    // Se registra antes de la red para no perder el evento si la llamada falla.
    track(Events.Registered, {
      country: data.country ?? null,
      has_email: !!data.email,
      preference_count: (data.preferences ?? []).length,
      allergy_count: (data.allergies ?? []).length,
      dislike_count: (data.dislikes ?? []).length,
    });
    try {
      if (isBackendAuthEnabled() && data.email) {
        try {
          const user = await backendRegister({
            username: data.username,
            email: data.email,
            password: data.password,
            allergies: formData.allergies,
            dislikes: formData.dislikes,
          });
          await loginWithData(user);
          return;
        } catch (err) {
          if (!(err instanceof BackendUnavailableError)) {
            setError(err instanceof Error ? err.message : 'No pudimos crear la cuenta.');
            return;
          }
        }
      }
      saveStoredUsers([...getStoredUsers(), data]);
      await loginWithData({ ...data });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      setIsLoading(true);
      try {
        if (isBackendAuthEnabled()) {
          try {
            const user = await backendLogin(formData.username.trim(), formData.password.trim());
            await loginWithData(user);
            return;
          } catch (err) {
            if (!(err instanceof BackendUnavailableError)) {
              setError(err instanceof Error ? err.message : 'No pudimos iniciar sesión.');
              return;
            }
          }
        }
        const match = findUser(formData.username, formData.password);
        if (match) {
          await loginWithData({ ...match });
        } else {
          setError('Usuario o contraseña incorrectos.');
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (step === 1) {
      if (formData.username.trim().length < 3) { setError('El usuario debe tener al menos 3 caracteres.'); return; }
      if (formData.password.trim().length < 4) { setError('La contraseña debe tener al menos 4 caracteres.'); return; }
      if (usernameExists(formData.username)) { setError('Ese nombre de usuario ya está en uso.'); return; }
      setStep(2);
      return;
    }

    await finishRegister(buildNewUser());
  };

  const hasError = error.length > 0;
  const country = formData.country ? getCountry(formData.country) : undefined;

  return (
    <div className={`relative min-h-dvh bg-neutral-50 flex flex-col justify-center sm:px-6 lg:px-8 pt-[max(3rem,env(safe-area-inset-top))] pb-[max(3rem,env(safe-area-inset-bottom))] ${AUTH_BG}`}>
      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" aria-hidden />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="bg-white p-3 rounded-2xl shadow-xl">
            <ChefHat className="text-orange-500 w-12 h-12" aria-hidden />
          </div>
        </div>
        <h1 className="text-center text-3xl font-black text-white drop-shadow-md px-4">
          {isLogin ? 'Entra a tu cocina' : step === 1 ? 'Crea tu cuenta' : 'Casi listo'}
        </h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-neutral-100">

        <form className="space-y-6" onSubmit={handleSubmit}>
          {hasError && (
            <p id={ids.err} role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl">
              {error}
            </p>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label htmlFor={ids.user} className="block text-sm font-bold text-neutral-700">Usuario</label>
                <input
                  id={ids.user}
                  required
                  autoCapitalize="off"
                  autoCorrect="off"
                  autoComplete="username"
                  spellCheck={false}
                  aria-invalid={hasError}
                  aria-describedby={hasError ? ids.err : undefined}
                  className={`mt-1 ${inputClass}`}
                  placeholder="Ej. ChefGus"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              {!isLogin && (
                <div>
                  <label htmlFor={ids.email} className="block text-sm font-bold text-neutral-700">Correo</label>
                  <input
                    id={ids.email}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    className={`mt-1 ${inputClass}`}
                    placeholder="tu@correo.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-neutral-500">Es el que usarás si te suscribes a Premium en Hotmart.</p>
                </div>
              )}

              <div>
                <label htmlFor={ids.pass} className="block text-sm font-bold text-neutral-700">Contraseña</label>
                <div className="mt-1 relative">
                  <input
                    id={ids.pass}
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoCapitalize="off"
                    autoCorrect="off"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    aria-invalid={hasError}
                    aria-describedby={hasError ? ids.err : undefined}
                    className={`${inputClass} pr-12`}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={showPassword}
                    className="absolute right-0.5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-3d-primary w-full !mt-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500 disabled:cursor-not-allowed"
              >
                {isLoading
                  ? <><Spinner /> {isLogin ? 'Entrando…' : 'Continuando…'}</>
                  : isLogin ? <><LogIn size={18} aria-hidden /> Entrar</> : <><ArrowRight size={18} aria-hidden /> Continuar</>}
              </button>
            </div>
          )}

          {step === 2 && !isLogin && (
            <div className="animate-fade-in">
              {!country ? (
                <CountryPicker
                  mode="inline"
                  onSelect={(code) => setFormData(prev => ({ ...prev, country: code }))}
                />
              ) : (
                <div className="w-full mb-5 flex items-center justify-between gap-3 pl-4 pr-1 py-1 rounded-xl border border-emerald-200 bg-emerald-50">
                  <span className="flex items-center gap-3 min-w-0 py-2">
                    <span className="text-2xl" aria-hidden>{country.flag}</span>
                    <span className="min-w-0">
                      <span className="block text-xs text-emerald-600 font-bold">Cocinas desde</span>
                      <span className="block text-sm font-semibold text-emerald-900 truncate">{country.name}</span>
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, country: '' }))}
                    className="min-h-11 px-3 rounded-xl text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition-colors"
                  >
                    Cambiar
                  </button>
                </div>
              )}

              <div className="text-center mb-5">
                <AlertTriangle className="mx-auto h-10 w-10 text-orange-500 mb-1.5" aria-hidden />
                <h2 ref={step2HeadingRef} tabIndex={-1} className="text-lg font-black text-neutral-900 outline-none">
                  Tus preferencias
                </h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Sous las tiene en cuenta en cada sesión. Puedes cambiarlas después en tu perfil.
                </p>
              </div>

              <PreferencesEditor
                mode="inline"
                initialFilterIds={formData.preferences}
                initialAllergies={formData.allergies}
                initialDislikes={formData.dislikes}
                onChange={({ filterIds, allergies, dislikes }) =>
                  setFormData(prev => ({ ...prev, preferences: filterIds, allergies, dislikes }))
                }
              />

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 min-h-12 py-3 px-4 border border-neutral-200 rounded-xl shadow-sm text-sm font-bold text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-3d-primary flex-1 disabled:cursor-not-allowed"
                >
                  {isLoading ? <><Spinner /> Creando…</> : <><Check size={18} aria-hidden /> Crear cuenta</>}
                </button>
              </div>
              <button
                type="button"
                onClick={() => finishRegister(buildNewUser())}
                disabled={isLoading}
                className="w-full min-h-11 mt-2 text-xs text-neutral-400 hover:text-neutral-600 transition-colors disabled:opacity-40"
              >
                Saltar por ahora →
              </button>
            </div>
          )}
        </form>

        {step === 1 && (
          <div className="mt-6 space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden>
                <div className="w-full border-t border-neutral-200" />
              </div>
              <p className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-neutral-500">
                  {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); setStep(1); }}
              className="w-full min-h-12 flex justify-center items-center gap-2 py-3 px-4 border shadow-sm rounded-xl text-sm font-bold text-neutral-700 bg-white hover:bg-neutral-50 transition-colors border-neutral-200"
            >
              {isLogin ? <><UserPlus size={18} aria-hidden /> Crear una cuenta</> : <><LogIn size={18} aria-hidden /> Iniciar sesión</>}
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
