/** MaestroDeSalsasBoss.tsx — Jefe 12, Mundo 3: Mar de Sabores (Premium). Desafío de fondos y salsas clásicas. */
import { BossPage } from './BossPage';
import type { BossRecipe } from './BossPage';

const CHALLENGES = [
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
    eval: 'Plato presentado con la salsa/sopa visible y profesional.',
  },
];

const TIPS = [
  'El Maestro conoce el sabor de los fondos con un solo sorbo. La calidad se ve en el vaso.',
  'Fondo gelatinizado = colágeno bien extraído = técnica correcta.',
  'La presentación del plato final evalúa también el acabado profesional.',
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

export const MaestroDeSalsasBoss = () => (
  <BossPage
    bossName="Maestro de Salsas"
    bossEmoji="🫕"
    bossSubtitle="Guardián del Mar de Sabores"
    levelNum={12}
    worldName="Mar de Sabores"
    worldEmoji="🌊"
    xpReward={300}
    quote="Los fondos son el alma de la cocina. Sin ellos, solo tienes agua caliente con ingredientes. Demuéstrame que entiendes la diferencia entre blanco, oscuro y marino. Luego, hazme un plato digno."
    requirement="Requiere: Dominar los 3 tipos de fondos"
    nextWorld="🏔️ Pico del Maestro Desbloqueado"
    victoryDesc="El Maestro te entrega las llaves del Mar de Sabores. La profundidad de los fondos vive en tus manos."
    headerGradient="from-blue-600 via-cyan-600 to-teal-700"
    bossGradient="from-blue-900 to-cyan-900"
    accentBorder="border-blue-500/50"
    accentTextColor="text-blue-400"
    accentTextLight="text-blue-300"
    accentTextFaint="text-blue-100"
    doneBg="bg-blue-500"
    doneBorder="border-blue-400"
    doneCardBg="bg-blue-50"
    uploadBorderHover="border-blue-300 bg-blue-50 hover:bg-blue-100"
    reviewOverlay="bg-blue-500/25"
    victoryGradient="from-blue-500 via-cyan-500 to-teal-600"
    returnGradient="from-blue-500 to-cyan-600 shadow-blue-500/30"
    challenges={CHALLENGES}
    tips={TIPS}
    mainRecipe={RECIPE}
  />
);
