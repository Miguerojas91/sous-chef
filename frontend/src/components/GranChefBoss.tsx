/** Jefe final, nivel 20 (Castillo del Chef, Premium): menú de varios tiempos con técnicas de todo el mapa. */
import { BossPage } from './BossPage';
import type { BossRecipe } from './BossPage';

const CHALLENGES = [
  {
    id: 1, emoji: '🍽️', name: 'Tu Menú Degustación',
    desc: 'Presenta un menú de 3 tiempos con coherencia temática, progresión de sabores y emplatado profesional.',
    eval: 'Coherencia, progresión, emplatado limpio en cada tiempo.',
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
  'Cuida cada tiempo antes de sumar platos: 4 tiempos bien resueltos valen más que 8 a medias.',
  'Es el último nivel del Modo Aventura: usa técnicas de los cinco mundos.',
];

const RECIPE: BossRecipe = {
  name: 'Menú Omakase · 5 Tiempos',
  emoji: '👑',
  servings: '2 personas',
  time: '3 h 30 min',
  difficulty: '★★★ Experto',
  ingredients: [
    'Aperitivo:',
    'Esferas de dashi (6 uds)',
    'Blinis de trigo sarraceno',
    'Entrante:',
    'Huevo 63°C + trufa rallada',
    'Crema de coliflor rustida',
    'Pescado:',
    '2 filetes de lubina (120 g)',
    'Fumet de almejas',
    'Kimchi de pepino (3 días)',
    'Plato principal:',
    '2 entrecots madurados 21 días',
    'Jus de res reducido 8 h',
    'Puré de apionabo (mantequilla)',
    'Postre:',
    'Crema catalana sous-vide 82°C',
    'Brunoise de mango caramelizado',
    'Chiffonade de menta fresca',
  ],
  steps: [
    'Aperitivo: esferas de dashi (alginato/calcio) sobre blini templado. Juliana de cebollino encima. Sirve en cuchara de degustación.',
    'Entrante: cuece el huevo sous-vide 63 °C / 60 min. Base de crema de coliflor rustida con mantequilla noisette. Rompe el huevo sobre la crema. Ralla trufa.',
    'Pescado: cocina la lubina sous-vide 52 °C / 18 min, dora la piel 1 min a fuego máximo (Maillard). Napa con fumet de almejas reducido. Acompaña con kimchi de pepino como contraste ácido-fermentado.',
    'Principal: sofrito de chalota en jus de res. Entrecot sous-vide 54 °C / 2 h, costra Maillard en sartén de hierro. Puré de apionabo con emulsión de mantequilla montada. Trazo de jus reducido.',
    'Postre: crema catalana sous-vide 82 °C / 1 h, enfría y glasea con azúcar quemado al momento. Brunoise de mango salteado con caramelo seco. Chiffonade de menta fresca como garnish.',
  ],
  plating: 'Cada tiempo en vajilla diferente. Aperitivo: cuchara japonesa. Entrante: plato hondo negro. Pescado: plato plano ovalado blanco. Principal: plato de piedra rectangular. Postre: cazuelita de barro individual. En cada plato: máximo 5 elementos, un punto focal claro, sin saturación.',
};

export const GranChefBoss = () => (
  <BossPage
    bossName="El Gran Chef"
    bossEmoji="👨‍🍳"
    bossSubtitle="Guardián del Castillo del Chef"
    levelNum={20}
    worldName="Castillo del Chef"
    worldEmoji="👑"
    xpReward={1000}
    world={5}
    quote="Cinco tiempos: esferas de dashi, huevo a 63 °C, lubina con la piel dorada, entrecot con jus y crema catalana quemada al momento. En cada plato quiero reconocer qué técnica usaste."
    requirement="Requisito: al menos 8 técnicas del Modo Aventura"
    nextWorld="Completaste los 20 niveles del mapa."
    victoryTitle="¡Recorrido completo!"
    victoryDesc="Del corte de la Isla del Cuchillo al azúcar quemado del postre, cada técnica se ve en tu menú. El Gran Chef lo sirve en su mesa."
    returnLabel="Ver el mapa"
    isFinalBoss
    challenges={CHALLENGES}
    tips={TIPS}
    mainRecipe={RECIPE}
  />
);
