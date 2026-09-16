/**
 * Consumo mensual de voz (Gemini Live), guardado por mes en
 * localStorage['sous_voice_usage'] como { "YYYY-MM": segundos }.
 * Topes por plan en MONETIZATION.md: gratis 15 min, Premium 60 min.
 *
 * El control es del lado del cliente: alguien técnico puede borrar el storage.
 * El proxy limita duración y conexiones por IP, pero no minutos por usuario.
 */

import { isPremiumUser } from './membership';

const STORAGE_KEY = 'sous_voice_usage';

export const FREE_CAP_SECONDS = 15 * 60;
export const PRO_CAP_SECONDS  = 60 * 60;

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
  // Solo los últimos 12 meses, para no llenar localStorage.
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
    /* storage lleno o bloqueado: no se registra el uso */
  }
}

export function getCapSeconds(): number {
  return isPremiumUser() ? PRO_CAP_SECONDS : FREE_CAP_SECONDS;
}

export function getUsedSecondsThisMonth(): number {
  const store = loadStore();
  return store[thisMonthKey()] ?? 0;
}

export function getRemainingSeconds(): number {
  return Math.max(0, getCapSeconds() - getUsedSecondsThisMonth());
}

export function getRemainingMinutes(): number {
  return Math.floor(getRemainingSeconds() / 60);
}

export function hasReachedCap(): boolean {
  return getRemainingSeconds() <= 0;
}

/** Suma al consumo del mes sin pasar del tope (no acumula deuda). */
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

/** Reinicia el consumo del mes actual. Solo para QA; no exponer en la UI. */
export function resetCurrentMonth(): void {
  const store = loadStore();
  delete store[thisMonthKey()];
  saveStore(store);
  window.dispatchEvent(new Event('sous:voice-usage-changed'));
}
