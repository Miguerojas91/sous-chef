/** GranChefBoss.tsx — Jefe 20, Mundo 5: Castillo del Chef (Premium). Desafío final de alta cocina. Maestría Culinaria. */
import { BossPage } from './BossPage';
import type { BossRecipe } from './BossPage';

const CHALLENGES = [
  {
    id: 1, emoji: '🍽️', name: 'Tu Menú Degustación',
    desc: 'Presenta un menú de 3 tiempos con coherencia temática, progresión de sabores y emplatado profesional.',
    eval: 'Coherencia, progresión, emplatado elegante en cada tiempo.',
  },
  {
    id: 2, emoji: '🍷', name: 'Tres Pairings Documentados',
    desc: 'Tres pairings de comida y bebida con justificación técnica escrita de por qué funcionan.',
    eval: 'Justificación técnica clara, contraste o congruencia demostrada.',
  },
  {
    id: 3, emoji: '🥂', name: 'El Plato de Alta Cocina',
    desc: 'Un plato con máximo 5 elementos, emplatado profesional (salsa en trazo, garnish funcional), fotografiado sobre fondo limpio.',
    eval: 'Máximo 5 elementos, punto focal, trazo de salsa, no lago.',
  },
  {
    id: 4, emoji: '👨‍🍳', name: 'El Gran Reto del Chef',
    desc: 'Crea un menú de 4 tiempos completo usando al menos 8 técnicas aprendidas en el Modo Aventura. Cada técnica visible e identificable en la foto.',
    eval: 'Menú completo presentado, mínimo 8 técnicas identificadas por escrito.',
  },
];

const TIPS = [
  'El Gran Chef juzga el conjunto de todo lo aprendido. Cada plato debe mostrar una técnica diferente.',
  'La narrativa importa: escribe qué técnica usaste en cada elemento del reto final.',
  'Perfección es mejor que cantidad. Un menú de 4 tiempos impecable supera uno de 8 mediocre.',
  'Este es el nivel más alto del Modo Aventura. Muestra todo lo que eres capaz de crear.',
];

const RECIPE: BossRecipe = {
  name: 'Menú Omakase · 5 Tiempos',
  emoji: '👑',
  servings: '2 personas',
  time: '3 h 30 min',
  difficulty: '★★★ Maestría',
  ingredients: [
    '— APERITIVO —',
    'Esferas de dashi (6 uds)',
    'Blinis de trigo sarraceno',
    '— ENTRANTE —',
    'Huevo 63°C + trufa rallada',
    'Crema de coliflor rustida',
    '— FISH COURSE —',
    '2 filetes de lubina (120 g)',
    'Fumet de almejas',
    'Kimchi de pepino (3 días)',
    '— PLATO PRINCIPAL —',
    '2 entrecots madurados 21 días',
    'Jus de res reducido 8 h',
    'Puré de apionabo (mantequilla)',
    '— POSTRE —',
    'Crema catalana sous-vide 82°C',
    'Brunoise de mango caramelizado',
    'Chiffonade de menta fresca',
  ],
  steps: [
    'APERITIVO — Esferas de dashi (alginato/calcio) sobre blini templado. Juliana de cebollino encima. Sirve en cuchara de degustación.',
    'ENTRANTE — Cuece el huevo sous-vide 63 °C / 60 min. Base de crema de coliflor rustida con mantequilla noisette. Rompe el huevo sobre la crema. Ralla trufa.',
    'FISH COURSE — Cocina la lubina sous-vide 52 °C / 18 min, dora la piel 1 min a fuego máximo (Maillard). Napa con fumet de almejas reducido. Acompaña con kimchi de pepino como contraste ácido-fermentado.',
    'PRINCIPAL — Sofrito de chalota en jus de res. Entrecot sous-vide 54 °C / 2 h, costra Maillard en sartén de hierro. Puré de apionabo con emulsión de mantequilla montada. Trazo de jus reducido.',
    'POSTRE — Crema catalana sous-vide 82 °C / 1 h, enfría y glasea con azúcar quemado al momento. Brunoise de mango salteado con caramelo seco. Chiffonade de menta fresca como garnish.',
  ],
  plating: 'Cada tiempo en vajilla diferente. Aperitivo: cuchara japonesa. Entrante: plato hondo negro. Fish course: plato plano ovalado blanco. Principal: plato de piedra rectangular. Postre: cazuelita de barro individual. En cada plato: máximo 5 elementos, un punto focal claro, sin saturación.',
};

export const GranChefBoss = () => (
  <BossPage
    bossName="El Gran Chef"
    bossEmoji="👨‍🍳"
    bossSubtitle="Maestro del Castillo del Chef"
    levelNum={20}
    worldName="Castillo del Chef"
    worldEmoji="👑"
    xpReward={1000}
    quote="Has viajado por la Isla del Cuchillo, cruzado el Valle del Fuego, navegado el Mar de Sabores y escalado el Pico del Maestro. Ahora debes demostrar que todo lo aprendido vive en tus manos. Un chef Maestro no domina técnicas — domina la cocina."
    requirement="Requiere: Todo el conocimiento del Modo Aventura"
    nextWorld="🏆 Rango: Maestría Culinaria desbloqueado"
    victoryTitle="¡MAESTRÍA CULINARIA!"
    victoryDesc="Has completado el Modo Aventura completo. Los 5 mundos conquistados, los 5 jefes derrotados. Eres un Gran Chef."
    returnLabel="🗺️ Ver Mapa Completo"
    isFinalBoss
    headerGradient="from-yellow-500 via-amber-500 to-orange-500"
    bossGradient="from-amber-900 via-yellow-900 to-orange-900"
    accentBorder="border-yellow-500/50"
    accentTextColor="text-yellow-400"
    accentTextLight="text-yellow-300"
    accentTextFaint="text-yellow-100"
    doneBg="bg-amber-500"
    doneBorder="border-amber-400"
    doneCardBg="bg-amber-50"
    uploadBorderHover="border-amber-300 bg-amber-50 hover:bg-amber-100"
    reviewOverlay="bg-amber-500/25"
    victoryGradient="from-yellow-400 via-amber-400 to-orange-500"
    returnGradient="from-yellow-500 to-amber-600 shadow-amber-500/30"
    challenges={CHALLENGES}
    tips={TIPS}
    mainRecipe={RECIPE}
  />
);
