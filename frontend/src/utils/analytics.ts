/**
 * utils/analytics.ts
 *
 * Wrapper de PostHog para Sous Chef.
 *
 * Activación:
 *  - `VITE_POSTHOG_KEY`  — token de proyecto PostHog. Sin esto, todas las
 *    funciones son no-op (útil en dev, no ensucia el dashboard).
 *  - `VITE_POSTHOG_HOST` — host del API (default `https://us.posthog.com`).
 *
 * Privacidad:
 *  - NO mandamos emails, passwords, ni contenido de mensajes de chat.
 *  - Sí mandamos: pantallas visitadas, IDs internos, métricas agregadas.
 *  - El user.id en distinct es el username (no PII fuerte).
 *
 * Eventos canónicos: ver `Events` enum abajo.
 */
const KEY  = ((import.meta.env.VITE_POSTHOG_KEY as string | undefined) ?? '').trim();
const HOST = ((import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.posthog.com').trim();
const IS_PROD = import.meta.env.PROD;

// Cliente PostHog cargado dinámicamente para no bloatar el bundle inicial
// (posthog-js pesa ~180 KB raw).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnalyticsClient = any;

let initialized = false;
let client: AnalyticsClient | null = null;

/** Buffer de eventos disparados mientras PostHog terminaba de cargar. */
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

/** Inicializa PostHog (carga lazy) una sola vez. Llamar al boot de la app. */
export function initAnalytics(): void {
  if (initialized) return;
  initialized = true;
  if (!KEY) {
    // Dev sin key — no-op silencioso. En desarrollo no ensuciamos el dashboard.
    return;
  }

  // Lazy import — el JS de PostHog NO se incluye en el bundle inicial.
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
        // En la mayoría de casos `loaded` se llamó dentro de init; si no,
        // forzamos el client con la instancia general.
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

/**
 * Identifica al usuario en PostHog. Llamar tras login.
 * @param userId distinct ID (usamos username — no es PII fuerte)
 * @param props rasgos del usuario (no enviar PII)
 */
export function identify(userId: string, props?: Record<string, unknown>): void {
  if (!KEY) return;
  if (!client) { eventBuffer.push({ kind: 'identify', args: [userId, props] }); return; }
  try { client.identify(userId, props); } catch { /* no-op */ }
}

/** Resetea el cliente — llamar al logout. */
export function resetIdentity(): void {
  if (!KEY) return;
  if (!client) { eventBuffer.push({ kind: 'reset', args: [] }); return; }
  try { client.reset(); } catch { /* no-op */ }
}

/** Registra un evento. Props son agregables sin restricción. */
export function track(event: string, props?: Record<string, unknown>): void {
  if (!KEY) return;
  if (!client) { eventBuffer.push({ kind: 'track', args: [event, props] }); return; }
  try { client.capture(event, props); } catch { /* no-op */ }
}

/** Pageview — llamar en cada cambio de ruta. */
export function trackPageview(path: string, props?: Record<string, unknown>): void {
  if (!KEY) return;
  const payload = { $current_url: window.location.origin + path, path, ...props };
  if (!client) { eventBuffer.push({ kind: 'pageview', args: [payload] }); return; }
  try { client.capture('$pageview', payload); } catch { /* no-op */ }
}

// ── Catálogo de eventos canónicos ────────────────────────────────────────────
// Usar SIEMPRE estas constantes en lugar de strings sueltas, para evitar typos
// y mantener el dashboard limpio.
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
