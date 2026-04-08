import { BossPage } from './BossPage';
import type { BossRecipe } from './BossPage';

const CHALLENGES = [
  {
    id: 1, emoji: '🧄', name: 'El Sofrito del Chef',
    desc: 'Prepara un sofrito base: cebolla pochada, ajo y pimientos. Cocina a fuego lento hasta que el aceite se separe en los bordes.',
    eval: 'Color dorado uniforme, sin partes quemadas, aceite brillante.',
  },
  {
    id: 2, emoji: '🥩', name: 'Costra Maillard Perfecta',
    desc: 'Dora un filete, pechuga o tofu a fuego muy alto. La costra debe ser color caoba uniforme, sin zonas grises.',
    eval: 'Color caoba, crujiente al tacto, interior jugoso.',
  },
  {
    id: 3, emoji: '🥚', name: 'Emulsión Estable',
    desc: 'Prepara una mayonesa o aïoli casero con emulsión firme y cremosa.',
    eval: 'Textura que mantiene su forma, sin separación de líquidos.',
  },
  {
    id: 4, emoji: '🔥', name: 'Reto del Flambeador',
    desc: 'Prepara un plato usando las tres técnicas: sofrito como base, proteína con Maillard, termina con emulsión de mantequilla. Fotografía el plato completo.',
    eval: 'Plato presentado, las tres técnicas visibles.',
  },
];

const TIPS = [
  'El Flambeador juzga sabor Y técnica. No puedes engañarlo con un plato bonito.',
  'El orden importa: sofrito primero, Maillard en proteína aparte, emulsión al final.',
  'Temperatura constante es el secreto. El fuego cambia — tú controlas.',
  'Una foto bien iluminada muestra mejor el color Maillard y la textura del sofrito.',
];

const RECIPE: BossRecipe = {
  name: 'Entrecôte à la Bordelaise',
  emoji: '🥩',
  servings: '2 personas',
  time: '50 min',
  difficulty: '★★★ Avanzado',
  ingredients: [
    '2 entrecots de 200 g c/u',
    '1 cebolla roja grande',
    '3 dientes ajo',
    '1 pimiento rojo asado',
    '150 ml vino tinto Rioja',
    '100 ml fondo de res',
    '60 g mantequilla fría (dados)',
    '1 ramita tomillo',
    '2 cdas aceite de girasol',
    'Sal gruesa y pimienta negra',
    '1 cdta azúcar moreno',
    'Perejil fresco para servir',
  ],
  steps: [
    'Sofrito: pica fina la cebolla y el ajo. Sofríe a fuego medio-bajo con 1 cda de aceite 15 min hasta dorado sin quemar. Añade el pimiento asado y el azúcar, cocina 5 min más hasta que el aceite se separe en los bordes.',
    'Salsa Bordelaise: vierte el vino sobre el sofrito, reduce a la mitad. Añade el fondo y el tomillo, reduce nuevamente a ⅓. Cuela y reserva caliente.',
    'Maillard: seca bien los entrecots con papel. Salpimenta generosamente. Calienta una sartén de hierro a fuego máximo con aceite hasta que humee. Dora los filetes 2 min por lado hasta costra caoba. Descansa 3 min en rejilla.',
    'Emulsión de mantequilla: baja el fuego al mínimo. Incorpora los dados de mantequilla fría a la salsa uno a uno fuera del fuego, girando la sartén. La salsa debe quedar brillante y napar la cuchara.',
    'Sirve el entrecot entero, napa con la salsa Bordelaise, una cucharada del sofrito a un lado y perejil picado.',
  ],
  plating: 'Sartén → plato precalentado. El filete en diagonal, la salsa en trazo limpio (no lago). Sofrito en quenelle lateral. Flor de sal encima del filete justo al servir.',
};

export const FlambeadorBoss = () => (
  <BossPage
    bossName="El Flambeador"
    bossEmoji="🍳"
    bossSubtitle="Señor del Valle del Fuego"
    levelNum={8}
    worldName="Valle del Fuego"
    worldEmoji="🔥"
    xpReward={250}
    quote="El fuego no miente. O controlas el calor o el calor te controla. Sofrito, Maillard, Emulsión — combínalos todos en un mismo plato. Eso es cocina de verdad."
    requirement="Requiere: Dominar las 3 técnicas del fuego"
    nextWorld="🌊 Mar de Sabores Desbloqueado"
    victoryDesc="El Flambeador se rinde ante tu dominio del calor. El Mar de Sabores te aguarda."
    headerGradient="from-orange-600 via-red-600 to-rose-700"
    bossGradient="from-orange-900 to-red-900"
    accentBorder="border-orange-500/50"
    accentTextColor="text-orange-400"
    accentTextLight="text-orange-300"
    accentTextFaint="text-orange-100"
    doneBg="bg-orange-500"
    doneBorder="border-orange-400"
    doneCardBg="bg-orange-50"
    uploadBorderHover="border-orange-300 bg-orange-50 hover:bg-orange-100"
    reviewOverlay="bg-orange-500/25"
    victoryGradient="from-orange-500 via-red-500 to-rose-600"
    returnGradient="from-orange-500 to-red-600 shadow-orange-500/30"
    challenges={CHALLENGES}
    tips={TIPS}
    mainRecipe={RECIPE}
  />
);
