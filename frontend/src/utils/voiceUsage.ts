/**
 * utils/voiceUsage.ts
 *
 * Tracking del consumo mensual de voz (Gemini Live) por usuario.
 *
 * Caps según el plan (ver MONETIZATION.md):
 *  - Free:    15 min/mes = 900 s
 *  - Pro:     60 min/mes = 3,600 s
 *
 * Storage:
 *  - localStorage['sous_voice_usage'] = JSON { "2026-05": 421, "2026-06": 0 }
 *  - Cada mes se almacena por separado (formato YYYY-MM).
 *  - Limpieza automática de meses con >12 meses de antigüedad para no inflar
 *    el localStorage.
 *
 * Seguridad:
 *  - El tracking es client-side (suficiente para un MVP / good actor).
 *  - Un usuario técnico puede borrar el storage para resetear. Para producción
 *    seria conviene validar también server-side en el WS del proxy.
 */

import { isPremiumUser } from './membership';

const STORAGE_KEY = 'sous_voice_usage';

const FREE_CAP_SECONDS = 15 * 60;  // 900
const PRO_CAP_SECONDS  = 60 * 60;  // 3,600

interface UsageStore {
  [yearMonth: string]: number; // segundos consumidos en ese mes
}

function thisMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function loadStore(): UsageStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as UsageStore;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function pruneOldMonths(store: UsageStore): UsageStore {
  // Mantener solo los últimos 12 meses para no llenar localStorage.
  const keys = Object.keys(store).sort();
  if (keys.length <= 12) return store;
  const pruned: UsageStore = {};
  keys.slice(-12).forEach(k => { pruned[k] = store[k]; });
  return pruned;
}

function saveStore(store: UsageStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruneOldMonths(store)));
  } catch {
    /* storage lleno o no disponible — fallar silencioso */
  }
}

// ── API pública ──────────────────────────────────────────────────────────────

/** Cap (segundos) de voz disponible para el usuario actual este mes. */
export function getCapSeconds(): number {
  return isPremiumUser() ? PRO_CAP_SECONDS : FREE_CAP_SECONDS;
}

/** Segundos consumidos este mes. */
export function getUsedSecondsThisMonth(): number {
  const store = loadStore();
  return store[thisMonthKey()] ?? 0;
}

/** Segundos restantes este mes (puede ser 0). */
export function getRemainingSeconds(): number {
  return Math.max(0, getCapSeconds() - getUsedSecondsThisMonth());
}

/** Minutos restantes redondeados hacia abajo (para mostrar en UI). */
export function getRemainingMinutes(): number {
  return Math.floor(getRemainingSeconds() / 60);
}

/** `true` si el usuario ya consumió todo el cap del mes. */
export function hasReachedCap(): boolean {
  return getRemainingSeconds() <= 0;
}

/**
 * Añade `seconds` al consumo del mes actual.
 * Si excede el cap, lo trunca al cap (no acumula "deuda").
 */
export function addUsedSeconds(seconds: number): void {
  if (seconds <= 0 || !Number.isFinite(seconds)) return;
  const store = loadStore();
  const key = thisMonthKey();
  const current = store[key] ?? 0;
  const cap = getCapSeconds();
  store[key] = Math.min(cap, current + Math.floor(seconds));
  saveStore(store);
  window.dispatchEvent(new Event('sous:voice-usage-changed'));
}

/**
 * Resumen para UI — usado en banners y modales.
 * Ej.: { used: 320, cap: 900, remaining: 580, isPremium: false, minutesLeft: 9 }
 */
export interface VoiceUsageSummary {
  used: number;
  cap: number;
  remaining: number;
  isPremium: boolean;
  minutesLeft: number;
  percentUsed: number; // 0-100
  reached: boolean;
}

export function getVoiceUsageSummary(): VoiceUsageSummary {
  const cap = getCapSeconds();
  const used = getUsedSecondsThisMonth();
  const remaining = Math.max(0, cap - used);
  return {
    used,
    cap,
    remaining,
    isPremium: isPremiumUser(),
    minutesLeft: Math.floor(remaining / 60),
    percentUsed: cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0,
    reached: remaining <= 0,
  };
}

/**
 * Test helper — resetea el consumo del mes actual. SOLO para QA/dev.
 * No exportar a UI sin protección admin.
 */
export function resetCurrentMonth(): void {
  const store = loadStore();
  delete store[thisMonthKey()];
  saveStore(store);
  window.dispatchEvent(new Event('sous:voice-usage-changed'));
}
