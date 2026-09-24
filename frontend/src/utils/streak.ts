/**
 * Racha diaria: días en los que el usuario cocinó o aprendió algo (nivel,
 * clase o sesión de Cocinemos). Vive en localStorage como lista de fechas
 * locales `AAAA-MM-DD`. Todo falla en silencio: sin almacenamiento no hay racha.
 */

import { emitUserStateChange } from './events';

const KEY = 'sous_activity_days';
/** Con 60 días alcanza para la racha y la semana; el resto se descarta. */
const MAX_DAYS = 60;

function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function readDays(): string[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(data) ? data.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Marca hoy como día activo. Solo avisa al header si hoy era nuevo. */
export function markActivityToday(): void {
  const today = dayKey(new Date());
  const days = readDays();
  if (days.includes(today)) return;
  const next = [...days, today].sort().slice(-MAX_DAYS);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage lleno */ }
  emitUserStateChange();
}

/**
 * Días seguidos con actividad. Si hoy todavía no hay actividad, la racha que
 * terminó ayer sigue viva (se pierde al pasar el día sin cocinar).
 */
export function getStreak(): number {
  const days = new Set(readDays());
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function isActiveToday(): boolean {
  return readDays().includes(dayKey(new Date()));
}

export interface WeekDay { label: string; active: boolean; isToday: boolean; isFuture: boolean }

/** Semana actual de lunes a domingo para el indicador de racha. */
export function getWeek(): WeekDay[] {
  const days = new Set(readDays());
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const labels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const todayKey = dayKey(now);
  return labels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = dayKey(d);
    return { label, active: days.has(key), isToday: key === todayKey, isFuture: key > todayKey };
  });
}

/** La racha más larga guardada (hasta 60 días atrás). */
export function getBestStreak(): number {
  const days = readDays().sort();
  let best = 0, run = 0, prev: Date | null = null;
  for (const key of days) {
    const [y, m, d] = key.split('-').map(Number);
    const cur = new Date(y, m - 1, d);
    const diff = prev ? Math.round((cur.getTime() - prev.getTime()) / 86400000) : 0;
    run = prev && diff === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = cur;
  }
  return best;
}
