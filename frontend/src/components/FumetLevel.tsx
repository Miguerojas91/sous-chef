/** FumetLevel.tsx — Nivel 11, Mundo 3: Mar de Sabores (Premium). Elaboración de fumet de pescado. */
import { LevelPage } from './LevelPage';

const STEPS = [
  {
    num: 1, title: 'Qué es el fumet y por qué es diferente', emoji: '🐟',
    desc: 'El fumet de pescado (fumet de poisson) es el fondo base del mar. A diferencia del fondo de carne, el fumet se cocina solo 20–25 minutos. Las espinas de pescado, si se cocinan más, liberan un sabor amargo y gelatinoso desagradable. Rapidez es la clave.',
    tip: 'El fumet usa espinas de pescados blancos: lenguado, lubina, rodaballo, merluza. NUNCA azules como sardina o salmón — sus aceites enturbian y amargan el fondo en minutos.',
  },
  {
    num: 2, title: 'Preparar las espinas: limpiar y desangrar', emoji: '🔪',
    desc: 'Lava las espinas bajo agua fría corriente durante 10 minutos para eliminar la sangre que generaría turbidez y amargor. Retira las agallas (si hay) porque amargan mucho. Trocea las espinas y las cabezas para que quepan en la olla y liberen mejor su sabor.',
    tip: 'El agua del lavado debe salir clara antes de pasar al siguiente paso. Si el agua sigue roja, lava más tiempo. La sangre = turbidez + amargor. No hay atajo aquí.',
  },
  {
    num: 3, title: 'Sudar la mirepoix de mariscos', emoji: '🥂',
    desc: 'En la olla, derrite mantequilla a fuego suave. Suda (cocina sin color) la mirepoix blanca: cebolla, apio, puerro — sin zanahoria porque añade color y dulzor. 5 minutos hasta translúcida. Agrega las espinas y suda 5 minutos más.',
    tip: 'La mirepoix blanca (sin zanahoria ni tomate) es la base del fumet clásico, que debe quedar claro y de color paja. Con zanahoria se oscurece y cambia el perfil de sabor.',
  },
  {
    num: 4, title: 'Vino blanco y agua: la cocción de 20 min', emoji: '🍾',
    desc: 'Agrega vino blanco seco (150 ml), lleva a hervor y reduce 2 minutos para evaporar el alcohol. Agrega agua fría y el bouquet garni (laurel, perejil, eneldo). Sube a hervor suave, desespuma y cocina exactamente 20 minutos. No más.',
    tip: 'El eneldo es el compañero clásico del pescado. Si no tienes, usa solo perejil y laurel. El tiempo de 20 min no es sugerencia — es la diferencia entre fumet elegante y caldo amargo.',
  },
  {
    num: 5, title: 'Colar fino y usar inmediatamente', emoji: '✨',
    desc: 'Cuela a través de colador fino o manta de cielo sin presionar. El fumet debe quedar color paja claro y translúcido. Úsalo inmediatamente o enfría rápidamente. El fumet de pescado se conserva 2 días en frío y 1 mes congelado.',
    tip: 'El fumet fresco huele a mar, limpio y fresco. Si huele fuerte a "pescado viejo" es que las espinas no estaban frescas. Siempre pide las espinas del día en la pescadería.',
  },
];

const ERRORS = [
  { icon: '⏰', error: 'Cocción demasiado larga', fix: 'Más de 25 min y las espinas sueltan gelatina amarga. El reloj es tu mejor herramienta en este nivel.' },
  { icon: '🐠', error: 'Olor muy intenso a pescado', fix: 'Espinas no frescas o agallas no retiradas. Solo espinas muy frescas dan fumet limpio.' },
  { icon: '☁️', error: 'Fumet turbio', fix: 'No lavaste las espinas lo suficiente para eliminar la sangre. El proceso de desangrado es obligatorio.' },
  { icon: '🍊', error: 'Sabor demasiado dulce/naranja', fix: 'Usaste zanahoria en la mirepoix. Para fumet blanco, solo cebolla, apio y puerro.' },
];

const RECIPE = {
  name: 'Chupe de Mariscos con Fumet Artesanal',
  description: 'El chupe es la aplicación reina del fumet. Un caldo rico de mariscos que muestra la diferencia entre usar agua de grifo y un fumet bien hecho.',
  servings: '4 personas',
  time: '45 min + 20 min fumet',
  difficulty: '⭐⭐⭐',
  ingredients: [
    '500g de espinas de pescado blanco (para fumet)',
    '300g de almejas o mejillones',
    '200g de gambas o camarones',
    '200g de calamar limpio en aros',
    '1 cebolla blanca en brunoise',
    '2 dientes de ajo laminados',
    '1 pimiento verde en brunoise',
    '200g de tomate triturado',
    '1 vaso de vino blanco seco',
    'Aceite de oliva, sal, azafrán, perejil',
  ],
  method: [
    'Prepara el fumet según la técnica aprendida: 20 min exactos. Cuela y reserva.',
    'En cazuela, pocha la cebolla y pimiento en aceite 10 min.',
    'Añade el ajo y el tomate. Sofríe 8 min hasta reducir.',
    'Agrega el vino, reduce 2 min. Vierte el fumet caliente.',
    'Infusiona el azafrán en el caldo. Añade los mariscos por orden de cocción: calamar (5 min), gambas (2 min), almejas (2 min).',
    'Rectifica sal. Sirve con perejil fresco y tostadas.',
  ],
};

export const FumetLevel = () => (
  <LevelPage
    worldName="Mar de Sabores" worldEmoji="🌊"
    levelNum={11} levelName="Fumet de Pescado" levelEmoji="🐟" xpReward={100}
    gradientFrom="from-blue-500" gradientTo="to-cyan-600"
    accentBg="bg-blue-50" accentBorder="border-blue-200"
    accentText="text-blue-700" accentDark="text-blue-800"
    stepActiveBg="bg-blue-100" stepActiveTxt="text-blue-700"
    btnBg="bg-blue-500 hover:bg-blue-600" btnShadow="shadow-blue-500/30"
    missionText="Preparar un <strong>fumet de pescado blanco</strong> limpio y translúcido: color paja, aroma marino limpio, sin amargores. Fotografía el fumet colado en un vaso o tazón claro."
    missionTags={[
      { icon: '⏱️', label: '20 minutos exactos' },
      { icon: '🐟', label: 'Espinas de pescado blanco' },
    ]}
    steps={STEPS}
    errors={ERRORS}
    recipe={RECIPE}
    challengeHint="Fotografía el fumet en un vaso transparente. Debe verse de color paja claro, no turbio. Muéstralo junto a las espinas usadas para contexto."
    evaluationCriteria={[
      { stars: '⭐⭐⭐', label: 'Color paja, transparente, aroma marino' },
      { stars: '⭐⭐', label: 'Claro, buen aroma, algo más intenso' },
      { stars: '⭐', label: 'Intentaste, espinas de pescado blanco' },
    ]}
  />
);
