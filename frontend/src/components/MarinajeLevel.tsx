/** Nivel 18, Mundo 5: Castillo del Chef (Premium). Maridaje de comida y bebida. */
import { LevelPage } from './LevelPage';

const STEPS = [
  {
    num: 1, title: 'Los 5 sabores y cómo interactúan', emoji: '👅',
    desc: 'Dulce, salado, ácido, amargo y umami son los 5 sabores básicos. El maridaje estudia cómo estos sabores en bebida y comida se potencian o neutralizan mutuamente. Un vino tinto tánico con queso azul fuerte bajan su intensidad mutuamente. Un chablis fresco eleva el sabor de una ostra.',
    tip: 'La regla del contraste vs. congruencia: maridaje por contraste (ácido + graso) o por congruencia (dulce + dulce, umami + umami). Ambos pueden funcionar. El error es no pensar en ello.',
  },
  {
    num: 2, title: 'El maridaje clásico: vino y comida', emoji: '🍷',
    desc: 'Las reglas tradicionales son puntos de partida, no mandamientos: vino blanco con pescado, tinto con carne. Pero un vino blanco oxidativo (chardonnay con barrica) puede ir muy bien con pollo asado. Un Pinot noir ligero funciona con salmón a la plancha. La acidez del vino debe igualar o superar la del plato.',
    tip: 'Si el vino es menos ácido que el plato, el vino parecerá plano. Por eso los vinos muy ácidos (Riesling, Sauvignon Blanc, Champán) maridan tan bien con platos ácidos como ceviches o ensaladas con vinagreta.',
  },
  {
    num: 3, title: 'Más allá del vino: cócteles, cervezas y no alcohólicos', emoji: '🥂',
    desc: 'El maridaje moderno incluye cócteles, cervezas artesanales, kombuchas y jugos fermentados. Una IPA amarga potencia la amargura de la rúcula y el queso curado. Una margarita, salada y ácida, acompaña muy bien el ceviche. Una kombucha de jengibre funciona con sushi.',
    tip: 'Los maridajes sin alcohol ganan espacio: varios restaurantes de alta cocina ya ofrecen pairings de jugos, tés y kombucha. Piensa en acidez, taninos, efervescencia y dulzor.',
  },
  {
    num: 4, title: 'Crear tu propio pairing: el método sistemático', emoji: '📋',
    desc: 'Para crear un maridaje: 1) Identifica el sabor dominante del plato (graso, ácido, dulce, umami). 2) Busca la bebida que lo equilibre (acidez para graso) o lo eleve (umami en vino con umami en carne). 3) Piensa en el peso: plato ligero = bebida ligera. Plato muy intenso = bebida más intensa o refrescante.',
    tip: 'El peso del plato y la bebida deben ser proporcionales. Una sopa ligera de tomate no resiste un Cabernet Sauvignon tánico: lo aplasta. Un rosado seco o un Tempranillo ligero la acompañan mejor.',
  },
  {
    num: 5, title: 'Presenta tu maridaje: notas de cata', emoji: '📝',
    desc: 'Una nota de cata describe el vino (o bebida) en términos sensoriales: color, aromas en nariz (frutales, florales, especiados), sabor en boca (ácido, dulce, tánico, salino) y el retrogusto. Aprende a verbalizarlo porque en alta cocina el maridaje se explica al comensal con palabras.',
    tip: 'El vocabulario de cata se aprende probando y leyendo. Empieza con frutas: ¿huelo mora? ¿cereza? ¿limón? ¿manzana verde? Luego minerales: pedernal, piedra mojada. Luego especias: pimienta, canela, tabaco.',
  },
];

const ERRORS = [
  { icon: '⚖️', error: 'Vino más ligero que el plato', fix: 'El plato aplasta a la bebida. Usa bebidas con el mismo peso e intensidad del plato.' },
  { icon: '🍋', error: 'Vino menos ácido que el plato', fix: 'El vino parecerá plano. Iguala o supera la acidez del plato con la bebida.' },
  { icon: '🍫', error: 'Taninos con pescado delicado', fix: 'Los taninos hacen que el pescado tenga sabor metálico. Con pescados, elige vinos blancos o rosados frescos.' },
  { icon: '🍰', error: 'Postre más dulce que el vino de postre', fix: 'El vino parecerá seco y agrio. Con postres, la bebida siempre debe ser más dulce que el plato.' },
];

const RECIPE = {
  name: 'Experiencia de Maridaje en Casa: 4 Pares',
  description: 'Prueba cuatro pairings distintos para desarrollar el paladar. No necesitas vinos caros: lo que importa es la variedad de perfiles.',
  servings: '2 personas',
  time: '60 min',
  difficulty: '⭐⭐',
  ingredients: [
    'Par 1: Ostras o salmón crudo + Chablis o Sauvignon Blanc',
    'Par 2: Queso curado (manchego, parmesano) + Amontillado o Tempranillo',
    'Par 3: Chocolate 70% + Tawny Port o whisky añejo',
    'Par 4: Ceviche de limón + Margarita clásica o agua de limón con sal',
    'Pan y mantequilla entre pairings (limpia el paladar)',
    'Cuaderno para notas de cata',
  ],
  method: [
    'Prepara cada pairing en porciones pequeñas (degustación).',
    'Comienza por el más delicado y termina por el más intenso.',
    'Prueba primero la comida sola, luego la bebida sola, luego ambas juntas.',
    'Anota qué cambia: ¿se potencia algo? ¿Se neutraliza? ¿Qué desaparece?',
    'Intercambia los pairings (el ceviche con la bebida del chocolate) para sentir el contraste negativo.',
    'Escribe 3 palabras por pairing que describan la sensación de la combinación.',
  ],
};

export const MarinajeLevel = () => (
  <LevelPage
    worldName="Castillo del Chef" worldEmoji="👑"
    levelNum={18} levelName="Maridaje" levelEmoji="🍷" xpReward={200}
    world={5}
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
