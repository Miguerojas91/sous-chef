/**
 * Wrapper de PostHog. Sin `VITE_POSTHOG_KEY` todo es no-op, así desarrollo no
 * ensucia el dashboard. `VITE_POSTHOG_HOST` por defecto es https://us.posthog.com.
 *
 * Privacidad: nunca se envían emails, contraseñas ni contenido del chat. Solo
 * pantallas, IDs internos y métricas agregadas; el distinct id es el username.
 */
const KEY  = ((import.meta.env.VITE_POSTHOG_KEY as string | undefined) ?? '').trim();
const HOST = ((import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.posthog.com').trim();
const IS_PROD = import.meta.env.PROD;

// Import dinámico: posthog-js es pesado y no debe entrar en el bundle inicial.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnalyticsClient = any;

let initialized = false;
let client: AnalyticsClient | null = null;

/** Eventos que llegan antes de que PostHog termine de cargar. */
const eventBuffer: Array<{ kind: 'track' | 'pageview' | 'identify' | 'reset'; args: unknown[] }> = [];

function flushBuffer(): void {
  if (!client) return;
  while (eventBuffer.length > 0) {
    const ev = eventBuffer.shift()!;
    try {
      if (ev.kind === 'track') client.capture(...(ev.args as [string, Record<string, unknown>?]));
      else if (ev.kind === 'pageview') client.capture('$pageview', ev.args[0]);
      else if (ev.kind === 'identify') client.identify(...(ev.args as [string, Record<string, unknown>?]));
      else if (ev.kind === 'reset') client.reset();
    } catch { /* no-op */ }
  }
}

/** Idempotente. Llamar al arrancar la app. */
export function initAnalytics(): void {
  if (initialized) return;
  initialized = true;
  if (!KEY) {
    return;
  }

  import('posthog-js').then((mod) => {
    try {
      const posthog = mod.default;
      posthog.init(KEY, {
        api_host: HOST,
        person_profiles: 'identified_only',
        capture_pageview: false,
        capture_pageleave: true,
        autocapture: { css_selector_allowlist: ['[data-ph]'] },
        disable_session_recording: !IS_PROD,
        loaded: (ph) => {
          client = ph;
          flushBuffer();
        },
      });
      if (!client) {
        // Normalmente `loaded` ya corrió dentro de init; si no, usar la instancia global.
        client = posthog;
        flushBuffer();
      }
    } catch (e) {
      console.warn('[analytics] PostHog init failed', e);
    }
  }).catch((e) => {
    console.warn('[analytics] PostHog load failed', e);
  });
}

/** Llamar tras el login. `props` no debe llevar PII. */
export function identify(userId: string, props?: Record<string, unknown>): void {
  if (!KEY) return;
  if (!client) { eventBuffer.push({ kind: 'identify', args: [userId, props] }); return; }
  try { client.identify(userId, props); } catch { /* no-op */ }
}

/** Llamar al cerrar sesión. */
export function resetIdentity(): void {
  if (!KEY) return;
  if (!client) { eventBuffer.push({ kind: 'reset', args: [] }); return; }
  try { client.reset(); } catch { /* no-op */ }
}

export function track(event: string, props?: Record<string, unknown>): void {
  if (!KEY) return;
  if (!client) { eventBuffer.push({ kind: 'track', args: [event, props] }); return; }
  try { client.capture(event, props); } catch { /* no-op */ }
}

export function trackPageview(path: string, props?: Record<string, unknown>): void {
  if (!KEY) return;
  const payload = { $current_url: window.location.origin + path, path, ...props };
  if (!client) { eventBuffer.push({ kind: 'pageview', args: [payload] }); return; }
  try { client.capture('$pageview', payload); } catch { /* no-op */ }
}

// Usa estas constantes en vez de strings sueltos: un typo crea un evento nuevo en el dashboard.
export const Events = {
  // Auth
  Registered:          'user.registered',
  LoggedIn:            'user.logged_in',
  LoggedOut:           'user.logged_out',
  CountrySelected:     'profile.country_selected',
  PreferencesChanged:  'profile.preferences_changed',

  // Cocinar (chat IA)
  CookingIntentPicked: 'cooking.intent_picked',
  CookingStarted:      'cooking.started',
  ChatMessageSent:     'chat.message_sent',
  ChatErrorFallback:   'chat.error_fallback',

  // Voz
  VoiceStarted:        'voice.started',
  VoiceCapReached:     'voice.cap_reached',
  VoiceCapBlocked:     'voice.cap_blocked_entry',
  VoiceEnded:          'voice.ended',

  // Modo Aventura
  LevelOpened:         'level.opened',
  LevelPhotoSubmitted: 'level.photo_submitted',
  LevelCompleted:      'level.completed',
  LevelEvalFailed:     'level.eval_failed',

  // Academia
  LessonOpened:        'lesson.opened',
  LessonCompleted:     'lesson.completed',

  // Premium / paywall
  PaywallShown:        'paywall.shown',
  UpgradeClicked:      'paywall.upgrade_clicked',

  // Feedback
  FeedbackOpened:      'feedback.opened',
} as const;
