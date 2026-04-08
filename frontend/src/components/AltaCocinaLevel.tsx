import { LevelPage } from './LevelPage';

const STEPS = [
  {
    num: 1, title: 'Qué define la alta cocina', emoji: '🌟',
    desc: 'La alta cocina (haute cuisine) no es solo ingredientes caros. Es la expresión más sofisticada de la cocina: dominio técnico absoluto combinado con creatividad artística, narrativa cultural y rigor filosófico. Un plato de alta cocina requiere que cada elemento sea intencional, técnicamente impecable y visualmente bello.',
    tip: 'Ferran Adrià dijo: "La creatividad es no copiar." Un plato de alta cocina cuenta algo que nadie más ha contado. La técnica es el vehículo — la idea es el destino.',
  },
  {
    num: 2, title: 'Ingredientes: temporalidad y proveniencia', emoji: '🌱',
    desc: 'La alta cocina trabaja con ingredientes en su punto óptimo de madurez y siempre de proveedores conocidos. La temporalidad no es tendencia de marketing — es calidad real. Una trufa de enero tiene el triple de aroma que una de agosto. Un tomate de agosto es 10 veces mejor que uno de enero.',
    tip: 'Antes de cocinar en alta cocina, investiga qué ingredientes están en temporada en tu región ahora mismo. Construye el plato desde el ingrediente perfecto, no desde la receta que quieres hacer.',
  },
  {
    num: 3, title: 'Técnicas de acabado: quenelles, xantana y gel', emoji: '✨',
    desc: 'La alta cocina tiene un vocabulario técnico propio. Una quenelle es una porción oval elegante hecha con dos cucharas. Los geles de xantana o agar crean texturas imposibles. La emulsión con lecitina de soja crea espumas. Los aceites perfumados añaden color y aroma sin peso en boca.',
    tip: 'Una quenelle perfecta requiere práctica. Usa dos cucharas del mismo tamaño, mojadas en agua caliente. El movimiento es de "pasar" la cucharada de una cuchara a la otra dando forma ovalada. Practica con helado antes de hacerlo con una merluza.',
  },
  {
    num: 4, title: 'El emplatado de alta cocina: reglas y libertad', emoji: '🎨',
    desc: 'Las reglas del emplatado de alta cocina: el fondo del plato siempre limpio en los bordes, máximo 5 elementos por plato, un punto focal claro, uso de salsa como pincelada o punto (no lago), garnish con función gustativa. Dentro de estas reglas, la libertad artística es total.',
    tip: 'Usa un bote de ketchup o squeeze bottle para la salsa. El control del trazo de salsa es uno de los gestos más identificables de la alta cocina y se aprende en minutos. El lago de salsa murió en 1985.',
  },
  {
    num: 5, title: 'El plato final: concepto → técnica → ejecución', emoji: '🏆',
    desc: 'Para crear tu plato de alta cocina: 1) Define el concepto en una frase ("el mar en primavera"). 2) Identifica las técnicas que lo expresan (fumet de crustáceos + vieiras sous-vide + gel de pepino + espuma de algas). 3) Ejecuta cada elemento por separado y ensambla en el momento del servicio.',
    tip: 'El último paso es el más difícil: todo puede estar perfecto por separado y fallará si no encaja en el conjunto. Prueba el plato ensamblado ANTES del servicio y ajusta. Los grandes chefs siempre prueban el plato completo.',
  },
];

const ERRORS = [
  { icon: '🌊', error: 'Lago de salsa en el plato', fix: 'La salsa en alta cocina es trazo, punto o pincelada. Usa squeeze bottle. El lago arruina la presentación.' },
  { icon: '🎪', error: 'Demasiados elementos (más de 5)', fix: 'Menos es más en alta cocina. Si puedes eliminar un elemento sin mermar el plato, elimínalo.' },
  { icon: '🦷', error: 'Garnish sin función gustativa', fix: 'Todo elemento del plato debe comerse y aportar sabor o textura. El perejil decorativo está prohibido en alta cocina moderna.' },
  { icon: '💤', error: 'Sin punto focal visual', fix: 'El ojo del comensal necesita saber a dónde mirar. Un elemento debe destacar sobre los demás como protagonista.' },
];

const RECIPE = {
  name: 'Vieira con Gel de Manzana, Espuma de Mar y Aceite de Eneldo',
  description: 'Un plato de alta cocina clásico moderno: vieia como protagonista con tres elementos de contraste. Técnicamente desafiante pero enseña todos los principios de la alta cocina.',
  servings: '2 personas',
  time: '90 min',
  difficulty: '⭐⭐⭐⭐⭐',
  ingredients: [
    '4 vieiras grandes frescas (con coral si posible)',
    '(Gel de manzana) 200ml jugo manzana verde + 2g agar agar',
    '(Espuma de mar) 200ml fumet + 2g lecitina de soja',
    '(Aceite de eneldo) 100ml aceite girasol + 30g eneldo',
    '(Acabado) Flores comestibles, microhierbas de mar',
    'Mantequilla clarificada, sal Maldon',
  ],
  method: [
    'Aceite de eneldo: blanquea el eneldo 30s. Tritura con aceite. Cuela y refrigera.',
    'Gel de manzana: hierve jugo con agar 2 min. Vierte en bandeja plana. Refrigera 20 min. Corta quenelles.',
    'Espuma de mar: calienta fumet. Añade lecitina. Tritura con batidora de inmersión en superficie para crear espuma.',
    'Vieiras: seca muy bien. Sella en sartén muy caliente con mantequilla clarificada 90 seg por lado. Añade coral al final.',
    'Emplatado: trazo de gel en plato. Vieira encima. Espuma al lado. Gotitas de aceite de eneldo. Flores y microhierbas. Sal Maldon.',
    'Sirve inmediatamente. El plato de alta cocina muere en 3 minutos sin servir.',
  ],
};

export const AltaCocinaLevel = () => (
  <LevelPage
    worldName="Castillo del Chef" worldEmoji="👑"
    levelNum={19} levelName="Alta Cocina" levelEmoji="🥂" xpReward={200}
    gradientFrom="from-yellow-500" gradientTo="to-amber-600"
    accentBg="bg-amber-50" accentBorder="border-amber-200"
    accentText="text-amber-700" accentDark="text-amber-800"
    stepActiveBg="bg-amber-100" stepActiveTxt="text-amber-700"
    btnBg="bg-amber-500 hover:bg-amber-600" btnShadow="shadow-amber-500/30"
    missionText="Crear un <strong>plato de alta cocina completo</strong>: máximo 5 elementos, punto focal claro, salsa en trazo o punto, garnish funcional. Fotografía el plato emplatado sobre fondo negro o blanco."
    missionTags={[
      { icon: '🎨', label: 'Arte culinario' },
      { icon: '⏱️', label: '90 min' },
    ]}
    steps={STEPS}
    errors={ERRORS}
    recipe={RECIPE}
    challengeHint="Fotografía el plato desde cenital (arriba) sobre fondo limpio. El emplatado debe mostrar técnica y haber máximo 5 elementos claramente diferenciados."
    evaluationCriteria={[
      { stars: '⭐⭐⭐', label: 'Emplatado profesional, técnica visible' },
      { stars: '⭐⭐', label: 'Buena presentación, algo de técnica' },
      { stars: '⭐', label: 'Intento de emplatado con cuidado' },
    ]}
  />
);
