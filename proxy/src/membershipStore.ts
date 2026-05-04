/**
 * proxy/src/membershipStore.ts
 *
 * Almacén persistente de membresías premium. Usa un archivo JSON en disco
 * (path configurable por env `PREMIUM_DB_PATH`, default `./premium.json`).
 *
 * En Railway, este archivo persistirá entre redeploys SOLO si la ruta apunta
 * a un Volume montado (p. ej. `PREMIUM_DB_PATH=/data/premium.json`).
 * Si no hay volumen, sigue funcionando como cache en memoria + seed por env
 * (PREMIUM_EMAILS), pero se perderá al redesplegar.
 *
 * API:
 *  - has(email)
 *  - add(email)
 *  - remove(email)
 *  - list()
 */
import * as fs from 'fs';
import * as path from 'path';

const DB_PATH = process.env.PREMIUM_DB_PATH ?? path.resolve(process.cwd(), 'premium.json');
const SEED = (process.env.PREMIUM_EMAILS ?? '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

let emails = new Set<string>(SEED);
let persistAvailable = true;

function loadFromDisk(): void {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      const arr = JSON.parse(raw) as string[];
      if (Array.isArray(arr)) {
        for (const e of arr) emails.add(e.trim().toLowerCase());
      }
    } else {
      // Crear el archivo si el directorio existe (toca disco para detectar volume).
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify([...emails]), 'utf-8');
    }
    console.log(`[membership] persistencia OK en ${DB_PATH} (${emails.size} email${emails.size === 1 ? '' : 's'})`);
  } catch (err) {
    persistAvailable = false;
    console.warn(`[membership] ⚠️  Sin persistencia en disco (${(err as Error).message}). ` +
      `Usando memoria + env PREMIUM_EMAILS. Configura un Volume en Railway y PREMIUM_DB_PATH=/data/premium.json para persistir.`);
  }
}

function saveToDisk(): void {
  if (!persistAvailable) return;
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify([...emails]), 'utf-8');
  } catch (err) {
    console.warn('[membership] No pude persistir cambio a disco:', (err as Error).message);
    persistAvailable = false;
  }
}

loadFromDisk();

export const membershipStore = {
  has(email: string): boolean {
    return emails.has(email.trim().toLowerCase());
  },
  add(email: string): void {
    const key = email.trim().toLowerCase();
    if (!emails.has(key)) {
      emails.add(key);
      saveToDisk();
    }
  },
  remove(email: string): void {
    const key = email.trim().toLowerCase();
    if (emails.has(key)) {
      emails.delete(key);
      saveToDisk();
    }
  },
  list(): string[] {
    return [...emails];
  },
};
