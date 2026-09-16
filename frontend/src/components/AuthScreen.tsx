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
import { ChefHat, Eye, EyeOff } from 'lucide-react';
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
  'block w-full min-h-12 px-3 border border-neutral-300 rounded-control placeholder:text-neutral-500 text-base sm:text-sm text-neutral-900 ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:border-transparent aria-[invalid=true]:border-red-700';

const Spinner = () => (
  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full motion-safe:animate-spin" aria-hidden />
);

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
    <div className="min-h-dvh bg-white flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="w-full max-w-md mx-auto px-6 pt-10 pb-8 flex-1 flex flex-col">
        <div className="flex items-center gap-2">
          <span className="bg-brand-700 p-2 rounded-control">
            <ChefHat className="text-white w-6 h-6" aria-hidden />
          </span>
          <span className="text-xl font-extrabold text-neutral-900">Sous Chef</span>
        </div>

        <h1 className="mt-8 text-3xl font-extrabold text-neutral-900 tracking-tight">
          {isLogin ? 'Entra a tu cocina' : step === 1 ? 'Crea tu cuenta' : 'Casi listo'}
        </h1>

        <form className="mt-6 flex-1 flex flex-col" onSubmit={handleSubmit}>
          {hasError && (
            <p id={ids.err} role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-800 text-sm font-medium px-4 py-3 rounded-control">
              {error}
            </p>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor={ids.user} className="block text-sm font-semibold text-neutral-800">Usuario</label>
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
                  <label htmlFor={ids.email} className="block text-sm font-semibold text-neutral-800">Correo</label>
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
                  <p className="mt-1 text-sm text-neutral-600">Es el que usarás si te suscribes a Premium en Hotmart.</p>
                </div>
              )}

              <div>
                <label htmlFor={ids.pass} className="block text-sm font-semibold text-neutral-800">Contraseña</label>
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
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={showPassword}
                    className="absolute right-0.5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-control text-neutral-600 hover:text-neutral-900"
                  >
                    {showPassword ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-12 mt-2 flex justify-center items-center gap-2 px-4 rounded-control text-base font-semibold text-white bg-brand-700 hover:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-700 transition-colors disabled:opacity-60"
              >
                {isLoading
                  ? <><Spinner /> {isLogin ? 'Entrando…' : 'Continuando…'}</>
                  : isLogin ? 'Entrar' : 'Continuar'}
              </button>
            </div>
          )}

          {step === 2 && !isLogin && (
            <div className="flex-1 flex flex-col">
              {!country ? (
                <CountryPicker
                  mode="inline"
                  onSelect={(code) => setFormData(prev => ({ ...prev, country: code }))}
                />
              ) : (
                <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-card border border-neutral-200 bg-neutral-50">
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl" aria-hidden>{country.flag}</span>
                    <span className="min-w-0">
                      <span className="block text-sm text-neutral-600">Cocinas desde</span>
                      <span className="block text-base font-semibold text-neutral-900 truncate">{country.name}</span>
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, country: '' }))}
                    className="min-h-11 px-3 rounded-control text-sm font-semibold text-brand-800 hover:bg-brand-50"
                  >
                    Cambiar
                  </button>
                </div>
              )}

              <h2 ref={step2HeadingRef} tabIndex={-1} className="mt-8 text-xl font-extrabold text-neutral-900 outline-none">
                Tus preferencias
              </h2>
              <p className="text-sm text-neutral-600 mt-1 mb-5">
                Sous las tiene en cuenta en cada sesión. Puedes cambiarlas después en tu perfil.
              </p>

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
                  className="flex-1 min-h-12 px-4 border border-neutral-300 rounded-control text-sm font-semibold text-neutral-800 bg-white hover:bg-neutral-50 transition-colors"
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 min-h-12 flex justify-center items-center gap-2 px-4 rounded-control text-sm font-semibold text-white bg-brand-700 hover:bg-brand-800 transition-colors disabled:opacity-60"
                >
                  {isLoading ? <><Spinner /> Creando…</> : 'Crear cuenta'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => finishRegister(buildNewUser())}
                disabled={isLoading}
                className="w-full min-h-11 mt-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900 transition-colors disabled:opacity-50"
              >
                Saltar por ahora
              </button>
            </div>
          )}
        </form>

        {step === 1 && (
          <div className="mt-8 pt-6 border-t border-neutral-200 text-center">
            <p className="text-sm text-neutral-600">{isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}</p>
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setError(''); setStep(1); }}
              className="mt-2 w-full min-h-12 px-4 border border-neutral-300 rounded-control text-sm font-semibold text-neutral-900 bg-white hover:bg-neutral-50 transition-colors"
            >
              {isLogin ? 'Crear una cuenta' : 'Iniciar sesión'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
