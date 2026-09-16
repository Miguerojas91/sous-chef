/** Jefe del nivel 12 (Mar de Sabores, Premium): fondo blanco, fondo oscuro, fumet y un plato con ellos. */
import type { BossChallenge, BossContent, BossRecipe } from './types';

const CHALLENGES: BossChallenge[] = [
  {
    id: 1, emoji: '🍲', name: 'Fondo Blanco Transparente',
    desc: 'Prepara un fondo blanco de pollo. Debe quedar claro, color paja y gelatinizar al enfriar.',
    eval: 'Color translúcido en vaso, gelatina visible al enfriar.',
  },
  {
    id: 2, emoji: '🥣', name: 'Jus Oscuro Intenso',
    desc: 'Un jus de res con huesos tostados. Color marrón oscuro, brillante y concentrado.',
    eval: 'Color caoba, brillo, textura semi-espesa.',
  },
  {
    id: 3, emoji: '🐟', name: 'Fumet de Pescado Limpio',
    desc: 'Fumet de espinas de pescado blanco, exactamente 20 minutos de cocción.',
    eval: 'Color paja, aroma marino limpio, sin amargores.',
  },
  {
    id: 4, emoji: '🫕', name: 'El Gran Plato del Maestro',
    desc: 'Usa uno de tus fondos para preparar una sopa, crema o salsa completa. Fotografía el plato terminado con garnish.',
    eval: 'Plato presentado con la salsa o sopa visible y bordes limpios.',
  },
];

const TIPS: string[] = [
  'Un buen fondo se reconoce en el vaso: claro y sin grasa flotando.',
  'Si el fondo gelatiniza al enfriar, extrajiste bien el colágeno.',
  'En el plato final también cuenta el acabado: bordes limpios y garnish.',
  'Usa el fondo que mejor te salió para el plato final. Calidad sobre cantidad.',
];

const RECIPE: BossRecipe = {
  name: 'Bouillabaisse Marseillaise',
  emoji: '🐠',
  servings: '4 personas',
  time: '1 h 30 min',
  difficulty: '★★★ Avanzado',
  ingredients: [
    '500 g espinas pescado blanco',
    '400 g rape en trozos',
    '300 g mejillones limpios',
    '200 g gambas enteras',
    '1 bulbo hinojo',
    '2 tomates maduros pelados',
    '1 cebolla amarilla',
    '4 dientes ajo',
    '100 ml vino blanco seco',
    'Azafrán (½ cdta)',
    '1 cdta pimentón ahumado',
    'Aceite de oliva virgen extra',
    'Bouquet garni (laurel, tomillo, perejil)',
    'Baguette tostada y rouille para servir',
  ],
  steps: [
    'Fumet express: tuesta las espinas en el horno 200 °C 10 min. Ponlas en olla con agua fría, cebolla, el bouquet garni y el vino blanco. Cocina exactamente 20 min a fuego medio, espumando. Cuela y reserva.',
    'Sofrito provenzal: sofríe el hinojo en láminas y el ajo con aceite 8 min. Añade los tomates troceados y el pimentón, cocina 10 min hasta pasta concentrada.',
    'Infusión de azafrán: disuelve el azafrán en 2 cdas del fumet caliente 5 min. Añade al sofrito.',
    'Montaje: vierte el fumet caliente sobre el sofrito. Añade el rape y las gambas. Cocina 5 min. Incorpora los mejillones, tapa y cocina 3 min hasta que abran. Ajusta de sal.',
    'Sirve en cuencos hondos precalentados: primero el caldo, luego el pescado y los mariscos encima.',
  ],
  plating: 'Cuenco de barro precalentado. El caldo se vierte primero (traslúcido y azafranado). Los trozos de pescado sobre el caldo, mejillones con concha. Rouille en crostini flotando encima. Perejil fresco y un hilo de aceite de oliva.',
};

export const content: BossContent = {
  bossSubtitle: 'Guardián del Mar de Sabores',
  quote: 'Fondo blanco de pollo, jus de huesos tostados y fumet de 20 minutos. Muéstrame los tres en el vaso y después usa uno en un plato terminado.',
  requirement: 'Requisito: fondo blanco, fondo oscuro y fumet',
  nextWorld: 'Pico del Maestro desbloqueado',
  victoryDesc: 'Un fondo que gelatiniza al enfriar y un fumet color paja sin amargor. El Maestro de Salsas te abre el camino al Pico.',
  challenges: CHALLENGES,
  tips: TIPS,
  mainRecipe: RECIPE,
};
