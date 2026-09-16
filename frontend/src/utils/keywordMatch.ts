/**
 * Búsqueda de palabras clave en nombres de ingredientes, compartida por las
 * categorías de la lista de mercado y los sustitutos.
 *
 * Se compara por palabras completas, sin tildes y aceptando el plural:
 * "res" no coincide dentro de "fresco", "col" no coincide con "chocolate" y
 * "camarón" sí coincide con "Camarones pelados". Si varias claves coinciden,
 * gana la más larga ("leche de coco" antes que "leche"); en empate, la que
 * aparece primero en la tabla.
 */

export interface KeywordEntry<T> {
  keywords: string[];
  value: T;
}

interface PreparedKeyword<T> {
  words: string[];
  length: number;
  value: T;
}

/** Tabla lista para `matchLongestKeyword`. Se arma una vez al cargar el módulo. */
export type KeywordTable<T> = readonly PreparedKeyword<T>[];

function toWords(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

const sameWord = (word: string, keyword: string) =>
  word === keyword || word === `${keyword}s` || word === `${keyword}es`;

export function prepareKeywordTable<T>(entries: KeywordEntry<T>[]): KeywordTable<T> {
  return entries
    .flatMap(({ keywords, value }) => keywords.map(keyword => ({ words: toWords(keyword), length: keyword.length, value })))
    .filter(k => k.words.length > 0)
    // sort es estable: en empate se respeta el orden de la tabla.
    .sort((a, b) => b.length - a.length);
}

export function matchLongestKeyword<T>(table: KeywordTable<T>, name: string): T | undefined {
  const words = toWords(name);
  const found = table.find(({ words: kw }) => {
    for (let start = 0; start + kw.length <= words.length; start++) {
      if (kw.every((k, i) => sameWord(words[start + i], k))) return true;
    }
    return false;
  });
  return found?.value;
}
