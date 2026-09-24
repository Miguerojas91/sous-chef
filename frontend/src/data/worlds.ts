/**
 * Clases de color de cada mundo del Modo Aventura.
 *
 * Todas son cadenas completas escritas a mano: Tailwind solo genera las clases
 * que encuentra literales en el código, nunca las armadas en runtime.
 */

export type WorldId = 1 | 2 | 3 | 4 | 5;

/** Mapa: degradado del modal del nivel y de su botón principal. */
interface MapTheme {
  gradient: string;
}

/** Pantalla de nivel normal. Los mismos valores para todos los niveles del mundo. */
export interface LevelTheme {
  /** Clases `from-*`/`to-*` del encabezado, banners y botón de volver. */
  gradient: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  accentDark: string;
  stepActiveBg: string;
  stepActiveTxt: string;
  /** Botón de marcar paso. */
  btn: string;
  /** Fondo sólido del paso completado y de los puntos de ingredientes. */
  solid: string;
  shadow: string;
}

/** Pantalla de jefe. */
export interface BossTheme {
  header: string;
  card: string;
  border: string;
  text: string;
  textLight: string;
  textFaint: string;
  doneBg: string;
  doneBorder: string;
  doneCardBg: string;
  upload: string;
  reviewOverlay: string;
  victory: string;
  return: string;
}

/** Academia y visor de clase (niveles Cimientos, Técnica, Maestría, Élite). */
export interface AcademyTheme {
  color: string;
  bg: string;
  border: string;
  /** Punto de los temas y relleno de la barra del nivel. */
  dot: string;
  /** Punto de las listas dentro del visor. */
  viewerDot: string;
  /** Pregunta actual en los puntos del quiz. */
  quizDot: string;
  btn: string;
}

export interface WorldTheme {
  map: MapTheme;
  level: LevelTheme;
  boss: BossTheme;
  academy: AcademyTheme;
}

export const WORLD_THEME: Record<WorldId, WorldTheme> = {
  1: {
    map: { gradient: 'from-emerald-400 to-teal-600' },
    level: {
      gradient: 'from-emerald-500 to-teal-600',
      accentBg: 'bg-emerald-50', accentBorder: 'border-emerald-200',
      accentText: 'text-emerald-700', accentDark: 'text-emerald-800',
      stepActiveBg: 'bg-emerald-100', stepActiveTxt: 'text-emerald-700',
      btn: 'bg-emerald-500 hover:bg-emerald-600', solid: 'bg-emerald-500', shadow: 'shadow-emerald-500/30',
    },
    boss: {
      header: 'from-emerald-500 via-teal-600 to-cyan-700',
      card: 'from-emerald-900 via-teal-900 to-cyan-900',
      border: 'border-emerald-500/50',
      text: 'text-emerald-400', textLight: 'text-emerald-300', textFaint: 'text-emerald-100',
      doneBg: 'bg-emerald-500', doneBorder: 'border-emerald-400', doneCardBg: 'bg-emerald-50',
      upload: 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100',
      reviewOverlay: 'bg-emerald-500/25',
      victory: 'from-emerald-400 via-teal-500 to-cyan-600',
      return: 'from-emerald-500 to-teal-600 shadow-emerald-500/30',
    },
    academy: {
      color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200',
      dot: 'bg-emerald-400', viewerDot: 'bg-emerald-400', quizDot: 'bg-emerald-700',
      btn: 'bg-emerald-500 hover:bg-emerald-600',
    },
  },
  2: {
    map: { gradient: 'from-orange-400 to-red-600' },
    level: {
      gradient: 'from-orange-500 to-red-600',
      accentBg: 'bg-orange-50', accentBorder: 'border-orange-200',
      accentText: 'text-orange-700', accentDark: 'text-orange-800',
      stepActiveBg: 'bg-orange-100', stepActiveTxt: 'text-orange-700',
      btn: 'bg-orange-600 hover:bg-orange-700', solid: 'bg-orange-600', shadow: 'shadow-orange-500/30',
    },
    boss: {
      header: 'from-orange-600 via-red-600 to-rose-700',
      card: 'from-orange-900 to-red-900',
      border: 'border-orange-500/50',
      text: 'text-orange-400', textLight: 'text-orange-300', textFaint: 'text-orange-100',
      doneBg: 'bg-orange-600', doneBorder: 'border-orange-400', doneCardBg: 'bg-orange-50',
      upload: 'border-orange-300 bg-orange-50 hover:bg-orange-100',
      reviewOverlay: 'bg-orange-500/25',
      victory: 'from-orange-500 via-red-500 to-rose-600',
      return: 'from-orange-500 to-red-600 shadow-orange-500/30',
    },
    // Ningún nivel de la Academia usa el mundo 2; es el naranja por defecto del visor.
    academy: {
      color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200',
      dot: 'bg-orange-400', viewerDot: 'bg-orange-400', quizDot: 'bg-orange-700',
      btn: 'bg-orange-600 hover:bg-orange-700',
    },
  },
  3: {
    map: { gradient: 'from-blue-400 to-cyan-600' },
    level: {
      gradient: 'from-blue-500 to-cyan-600',
      accentBg: 'bg-blue-50', accentBorder: 'border-blue-200',
      accentText: 'text-blue-700', accentDark: 'text-blue-800',
      stepActiveBg: 'bg-blue-100', stepActiveTxt: 'text-blue-700',
      btn: 'bg-blue-500 hover:bg-blue-600', solid: 'bg-blue-500', shadow: 'shadow-blue-500/30',
    },
    boss: {
      header: 'from-blue-600 via-cyan-600 to-teal-700',
      card: 'from-blue-900 to-cyan-900',
      border: 'border-blue-500/50',
      text: 'text-blue-400', textLight: 'text-blue-300', textFaint: 'text-blue-100',
      doneBg: 'bg-blue-500', doneBorder: 'border-blue-400', doneCardBg: 'bg-blue-50',
      upload: 'border-blue-300 bg-blue-50 hover:bg-blue-100',
      reviewOverlay: 'bg-blue-500/25',
      victory: 'from-blue-500 via-cyan-500 to-teal-600',
      return: 'from-blue-500 to-cyan-600 shadow-blue-500/30',
    },
    academy: {
      color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200',
      dot: 'bg-blue-400', viewerDot: 'bg-blue-400', quizDot: 'bg-blue-700',
      btn: 'bg-blue-500 hover:bg-blue-600',
    },
  },
  4: {
    map: { gradient: 'from-violet-500 to-purple-700' },
    level: {
      gradient: 'from-violet-500 to-purple-700',
      accentBg: 'bg-violet-50', accentBorder: 'border-violet-200',
      accentText: 'text-violet-700', accentDark: 'text-violet-800',
      stepActiveBg: 'bg-violet-100', stepActiveTxt: 'text-violet-700',
      btn: 'bg-violet-500 hover:bg-violet-600', solid: 'bg-violet-500', shadow: 'shadow-violet-500/30',
    },
    boss: {
      header: 'from-violet-700 via-purple-700 to-fuchsia-700',
      card: 'from-violet-900 to-purple-900',
      border: 'border-violet-500/50',
      text: 'text-violet-400', textLight: 'text-violet-300', textFaint: 'text-violet-100',
      doneBg: 'bg-violet-500', doneBorder: 'border-violet-400', doneCardBg: 'bg-violet-50',
      upload: 'border-violet-300 bg-violet-50 hover:bg-violet-100',
      reviewOverlay: 'bg-violet-500/25',
      victory: 'from-violet-600 via-purple-600 to-fuchsia-700',
      return: 'from-violet-500 to-purple-700 shadow-violet-500/30',
    },
    academy: {
      color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200',
      dot: 'bg-violet-400', viewerDot: 'bg-violet-400', quizDot: 'bg-violet-700',
      btn: 'bg-violet-500 hover:bg-violet-600',
    },
  },
  5: {
    map: { gradient: 'from-amber-700 to-amber-800' },
    level: {
      gradient: 'from-amber-700 to-amber-800',
      accentBg: 'bg-amber-50', accentBorder: 'border-amber-200',
      accentText: 'text-amber-700', accentDark: 'text-amber-800',
      stepActiveBg: 'bg-amber-100', stepActiveTxt: 'text-amber-700',
      btn: 'bg-amber-700 hover:bg-amber-800', solid: 'bg-amber-700', shadow: 'shadow-amber-500/30',
    },
    boss: {
      header: 'from-amber-700 via-amber-700 to-amber-800',
      card: 'from-amber-900 via-yellow-900 to-orange-900',
      border: 'border-yellow-500/50',
      text: 'text-yellow-400', textLight: 'text-yellow-300', textFaint: 'text-yellow-100',
      doneBg: 'bg-amber-500', doneBorder: 'border-amber-400', doneCardBg: 'bg-amber-50',
      upload: 'border-amber-300 bg-amber-50 hover:bg-amber-100',
      reviewOverlay: 'bg-amber-500/25',
      victory: 'from-amber-600 via-amber-700 to-amber-800',
      return: 'from-amber-700 to-amber-800 shadow-amber-500/30',
    },
    // Élite: el visor antiguo no tenía punto amarillo y caía en el naranja.
    academy: {
      color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-amber-200',
      dot: 'bg-yellow-400', viewerDot: 'bg-orange-400', quizDot: 'bg-yellow-700',
      btn: 'bg-amber-700 hover:bg-amber-800',
    },
  },
};
