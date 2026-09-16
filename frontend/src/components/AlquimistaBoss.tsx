/** Jefe del nivel 16 (Pico del Maestro, Premium): sous-vide, esferificación y fermentación. */
import { BossPage } from './BossPage';
import type { BossRecipe } from './BossPage';

const CHALLENGES = [
  {
    id: 1, emoji: '🌡️', name: 'Sous-vide al punto',
    desc: 'Proteína cocinada sous-vide a temperatura precisa con costra Maillard exterior. Interior de cocción uniforme.',
    eval: 'Interior del mismo color de borde a borde, costra crujiente, sin franja gris.',
  },
  {
    id: 2, emoji: '⚗️', name: 'Esferas de alginato',
    desc: 'Mínimo 6 esferas de esferificación directa: esféricas, brillantes, sin huecos.',
    eval: 'Forma esférica regular, interior líquido.',
  },
  {
    id: 3, emoji: '🍞', name: 'Fermentado Vivo',
    desc: 'Chucrut o kimchi con fermentación activa: burbujeando o ya ácido y crujiente.',
    eval: 'Color, textura crujiente, acidez correcta.',
  },
  {
    id: 4, emoji: '🔬', name: 'El Plato del Alquimista',
    desc: 'Crea un plato final que combine al menos dos de las tres técnicas avanzadas aprendidas. Presenta con garnish y fotografía.',
    eval: 'Plato profesional con dos técnicas visibles y buena presentación.',
  },
];

const TIPS = [
  'El Alquimista juzga la precisión. Cada técnica tiene parámetros exactos: aquí el ojo no basta.',
  'Para el plato final: piensa en contraste de texturas. Sous-vide + esfera aportan suavidad y explosión líquida.',
  'La presentación cuenta como técnica en este nivel. Un plato mal emplatado pierde puntos aunque la técnica sea correcta.',
  'Documenta tiempos y temperaturas. El Alquimista valora el proceso tanto como el resultado.',
];

const RECIPE: BossRecipe = {
  name: 'Huevo 63°C, Esferas de Piquillo y Kimchi Crujiente',
  emoji: '🥚',
  servings: '2 personas',
  time: '2 h + 48 h fermentación',
  difficulty: '★★★ Élite',
  ingredients: [
    '2 huevos frescos (clase A)',
    '200 g pimiento del piquillo',
    '2 g alginato sódico',
    '1 g cloruro cálcico',
    '300 g col china (napa)',
    '20 g sal kosher',
    '10 g pasta gochugaru',
    '5 g jengibre rallado',
    '2 dientes ajo rallado',
    '30 ml aceite de sésamo tostado',
    'Micro brotes y flor de sal',
    'Crema de queso (para base)',
  ],
  steps: [
    'Kimchi (48 h antes): masajea la col con sal 1 h, escurre bien. Mezcla con gochugaru, ajo y jengibre. Fermenta en tarro hermético a temperatura ambiente 48 h hasta actividad burbujente. Refrigera.',
    'Sous-vide: calibra el circulador a exactamente 63,0 °C. Introduce los huevos con cáscara. Cocina 60 min. La clara debe estar apenas cuajada, la yema sedosa y fluida.',
    'Baño de alginato: disuelve 2 g de alginato en 500 ml de agua fría con batidora. Reposa 30 min para eliminar burbujas. Tritura los piquillos, cuela fino.',
    'Baño de calcio: disuelve 1 g de cloruro cálcico en 500 ml agua. Usa una cuchara esférica para sumergir el piquillo en alginato, luego en calcio 90 segundos. Enjuaga en agua limpia.',
    'Montaje: unta crema de queso en el plato. Rompe el huevo sobre ella cuidadosamente. Dispón 3 esferas de piquillo, kimchi crujiente escurrido, y un hilo de aceite de sésamo.',
  ],
  plating: 'Plato plano blanco. Crema de queso en trazo grueso diagonal. Huevo entero sobre la crema (yema intacta). Tres esferas en triángulo alrededor. Kimchi en pequeño nido lateral. Micro brotes y flor de sal encima de la yema justo al servir.',
};

export const AlquimistaBoss = () => (
  <BossPage
    bossName="El Alquimista"
    bossEmoji="🔬"
    bossSubtitle="Guardián del Pico del Maestro"
    levelNum={16}
    worldName="Pico del Maestro"
    worldEmoji="🏔️"
    xpReward={400}
    world={4}
    quote="63 °C durante 60 minutos, 90 segundos en el baño de calcio, 48 horas de fermentación. Aquí se cocina con termómetro y cronómetro: anota tus tiempos y respétalos."
    requirement="Requisito: sous-vide, esferificación y fermentación"
    nextWorld="Castillo del Chef desbloqueado"
    victoryDesc="Yema fluida a 63 °C, esferas de piquillo con el centro líquido y un kimchi ácido y crujiente. El Alquimista anota tu receta en su cuaderno."
    challenges={CHALLENGES}
    tips={TIPS}
    mainRecipe={RECIPE}
  />
);
