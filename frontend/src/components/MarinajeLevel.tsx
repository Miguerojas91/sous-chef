/** MarinajeLevel.tsx — Nivel 18, Mundo 5: Castillo del Chef (Premium). Maridaje de vino y gastronomía avanzada. */
import { LevelPage } from './LevelPage';

const STEPS = [
  {
    num: 1, title: 'Los 5 sabores y cómo interactúan', emoji: '👅',
    desc: 'Dulce, salado, ácido, amargo y umami son los 5 sabores básicos. El maridaje es la ciencia de cómo estos sabores en bebida y comida se potencian o neutralizan mutuamente. Un vino tinto tánico con queso azul fuerte bajan su intensidad mutuamente. Un chablis fresco eleva el sabor de una ostra.',
    tip: 'La regla del contraste vs. congruencia: maridaje por contraste (ácido + graso) o por congruencia (dulce + dulce, umami + umami). Ambos pueden funcionar. El error es no pensar en ello.',
  },
  {
    num: 2, title: 'El maridaje clásico: vino y comida', emoji: '🍷',
    desc: 'Las reglas tradicionales son puntos de partida, no mandamientos: vino blanco con pescado, tinto con carne. Pero un vino blanco oxidativo (chardonnay con barrica) puede ir perfecto con pollo rustido. Un Pinot noir ligero con salmón a la plancha es magnífico. La acidez del vino debe igualar o superar la del plato.',
    tip: 'Si el vino es menos ácido que el plato, el vino parecerá plano. Por eso los vinos muy ácidos (Riesling, Sauvignon Blanc, Champán) maridan tan bien con platos ácidos como ceviches o ensaladas con vinagreta.',
  },
  {
    num: 3, title: 'Más allá del vino: cócteles, cervezas y no alcohólicos', emoji: '🥂',
    desc: 'El maridaje moderno incluye cócteles, cervezas artesanales, kombuchas y jugos fermentados. Una IPA amarga potencia la amargura del rúcula y queso curado. Un margarita salado y ácido es el maridaje perfecto del ceviche. Un kombucha de jengibre con sushi es mejor que muchos vinos.',
    tip: 'Los maridajes no alcohólicos son el frontier del maridaje moderno. Restaurantes de 3 estrellas Michelin ahora desarrollan pairings de jugos, tés y kombucha tan complejos como los de vino. Piensa en acidez, taninos, efervescencia y dulzor.',
  },
  {
    num: 4, title: 'Crear tu propio pairing: el método sistemático', emoji: '📋',
    desc: 'Para crear un maridaje: 1) Identifica el sabor dominante del plato (graso, ácido, dulce, umami). 2) Busca la bebida que lo equilibre (acidez para graso) o lo eleve (umami en vino con umami en carne). 3) Piensa en el peso: plato ligero = bebida ligera. Plato richísimo = bebida más intensa o refrescante.',
    tip: 'El peso del plato y la bebida deben ser proporcionales. Una sopa ligera de tomate no resiste un Cabernet Sauvignon tánico — aplasta el plato. Un Rosé seco o Tempranillo ligero la elevan.',
  },
  {
    num: 5, title: 'Presenta tu maridaje: notas de cata', emoji: '📝',
    desc: 'Una nota de cata describe el vino (o bebida) en términos sensoriales: color, aromas en nariz (frutales, florales, especiados), sabor en boca (ácido, dulce, tánico, salino) y el retrogusto. Aprende a verbalizarlo porque en alta cocina el maridaje se explica al comensal con palabras.',
    tip: 'El vocabulario de cata se aprende probando y leyendo. Empieza con frutas: ¿huelo mora? ¿cereza? ¿limón? ¿manzana verde? Luego minerales: pedernal, piedra mojada. Luego especias: pimienta, canela, tabaco. El ojo se educa mirando excelencia.',
  },
];

const ERRORS = [
  { icon: '⚖️', error: 'Vino más ligero que el plato', fix: 'El plato aplasta a la bebida. Usa bebidas con el mismo peso e intensidad del plato.' },
  { icon: '🍋', error: 'Vino menos ácido que el plato', fix: 'El vino parecerá plano. Iguala o supera la acidez del plato con la bebida.' },
  { icon: '🍫', error: 'Tanninos con pescado delicado', fix: 'Los tanninos hacen que el pescado tenga sabor metálico. Vinos blancos o rosés frescos con pescados siempre.' },
  { icon: '🍰', error: 'Postre más dulce que el vino de postre', fix: 'El vino parecerá seco y agrio. Con postres, la bebida siempre debe ser más dulce que el plato.' },
];

const RECIPE = {
  name: 'Experiencia de Maridaje en Casa: 4 Pares',
  description: 'Prueba cuatro pairings distintos para desarrollar el paladar. No necesitas vinos caros — la variedad de perfiles es lo que importa.',
  servings: '2 personas',
  time: '60 min',
  difficulty: '⭐⭐',
  ingredients: [
    'PAIRING 1: Ostras o salmón crudo + Chablis o Sauvignon Blanc',
    'PAIRING 2: Queso curado (manchego, parmesano) + Amontillado o Tempranillo',
    'PAIRING 3: Chocolate 70% + Tawny Port o whisky añejo',
    'PAIRING 4: Ceviche de limón + Margarita clásica o agua de limón con sal',
    'Pan y mantequilla entre pairings (limpia el paladar)',
    'Cuaderno para notas de cata',
  ],
  method: [
    'Prepara cada pairing en porciones pequeñas (degustación).',
    'Comienza por el más delicado y termina por el más intenso.',
    'Prueba primero la comida sola, luego la bebida sola, luego ambas juntas.',
    'Anota qué cambia: ¿se potencia algo? ¿Se neutraliza? ¿Qué desaparece?',
    'Intercambia los pairings (sardina con el vino del chocolate) para sentir el contraste negativo.',
    'Escribe 3 palabras por pairing que describan la sensación de la combinación.',
  ],
};

export const MarinajeLevel = () => (
  <LevelPage
    worldName="Castillo del Chef" worldEmoji="👑"
    levelNum={18} levelName="Maridaje" levelEmoji="🍷" xpReward={200}
    gradientFrom="from-yellow-500" gradientTo="to-amber-600"
    accentBg="bg-amber-50" accentBorder="border-amber-200"
    accentText="text-amber-700" accentDark="text-amber-800"
    stepActiveBg="bg-amber-100" stepActiveTxt="text-amber-700"
    btnBg="bg-amber-500 hover:bg-amber-600" btnShadow="shadow-amber-500/30"
    missionText="Crear y documentar <strong>3 pairings de comida y bebida</strong> con justificación técnica. Fotografía los 3 pairings presentados en mesa y escribe una breve nota de cata en la foto."
    missionTags={[
      { icon: '🍷', label: '3 pairings' },
      { icon: '📝', label: 'Nota de cata' },
    ]}
    steps={STEPS}
    errors={ERRORS}
    recipe={RECIPE}
    challengeHint="Fotografía los 3 pairings en mesa (plato + bebida en copa o vaso) con etiquetas escritas describiendo cada combinación."
    evaluationCriteria={[
      { stars: '⭐⭐⭐', label: '3 pairings con justificación técnica clara' },
      { stars: '⭐⭐', label: '2 pairings bien documentados' },
      { stars: '⭐', label: 'Al menos una combinación fotografiada' },
    ]}
  />
);
