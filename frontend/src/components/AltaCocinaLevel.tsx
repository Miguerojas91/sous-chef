/** Nivel 19, Mundo 5: Castillo del Chef (Premium). Alta cocina: concepto, técnicas de acabado y emplatado. */
import { LevelPage } from './LevelPage';

const STEPS = [
  {
    num: 1, title: 'Qué define la alta cocina', emoji: '🌟',
    desc: 'La alta cocina (haute cuisine) combina técnica precisa con una idea propia. En un plato de alta cocina cada elemento está ahí por una razón y está bien ejecutado.',
    tip: 'Ferran Adrià dijo: "La creatividad es no copiar." Un plato de alta cocina parte de una idea propia y usa la técnica para expresarla.',
  },
  {
    num: 2, title: 'Ingredientes: temporalidad y proveniencia', emoji: '🌱',
    desc: 'La alta cocina trabaja con ingredientes en su punto de madurez y de proveedores conocidos. Un ingrediente en su temporada tiene mucho más aroma que fuera de ella.',
    tip: 'Antes de cocinar en alta cocina, investiga qué ingredientes están en temporada en tu región ahora mismo. Construye el plato a partir del mejor ingrediente que consigas y después elige la receta.',
  },
  {
    num: 3, title: 'Técnicas de acabado: quenelles, xantana y gel', emoji: '✨',
    desc: 'La alta cocina tiene un vocabulario técnico propio. Una quenelle es una porción oval elegante hecha con dos cucharas. Los geles de xantana o agar dan texturas que no logras con harina o maicena. La emulsión con lecitina de soja crea espumas. Los aceites perfumados añaden color y aroma sin peso en boca.',
    tip: 'La quenelle requiere práctica. Usa dos cucharas del mismo tamaño, mojadas en agua caliente. El movimiento es de "pasar" la cucharada de una cuchara a la otra dando forma ovalada. Practica con helado antes de hacerlo con una merluza.',
  },
  {
    num: 4, title: 'El emplatado de alta cocina: reglas y libertad', emoji: '🎨',
    desc: 'Las reglas del emplatado de alta cocina: el fondo del plato siempre limpio en los bordes, máximo 5 elementos por plato, un punto focal claro, uso de salsa como pincelada o punto (no lago), garnish con función gustativa. Dentro de estas reglas, la libertad artística es total.',
    tip: 'Usa un bote de ketchup o squeeze bottle para la salsa. El control del trazo de salsa es uno de los gestos más identificables de la alta cocina y se aprende en minutos.',
  },
  {
    num: 5, title: 'El plato final: concepto → técnica → ejecución', emoji: '🏆',
    desc: 'Para crear tu plato de alta cocina: 1) Define el concepto en una frase ("el mar en primavera"). 2) Identifica las técnicas que lo expresan (fumet de crustáceos + vieiras sous-vide + gel de pepino + espuma de algas). 3) Ejecuta cada elemento por separado y ensambla en el momento del servicio.',
    tip: 'El último paso es el más difícil: cada elemento puede estar bien por separado y el plato fallar si no encajan. Prueba el plato ensamblado antes del servicio y ajusta.',
  },
];

const ERRORS = [
  { icon: '🌊', error: 'Lago de salsa en el plato', fix: 'La salsa en alta cocina es trazo, punto o pincelada. Usa squeeze bottle. El lago arruina la presentación.' },
  { icon: '🎪', error: 'Demasiados elementos (más de 5)', fix: 'Si puedes eliminar un elemento sin mermar el plato, elimínalo.' },
  { icon: '🦷', error: 'Garnish sin función gustativa', fix: 'Todo elemento del plato debe comerse y aportar sabor o textura. El perejil solo decorativo sobra.' },
  { icon: '💤', error: 'Sin punto focal visual', fix: 'El ojo del comensal necesita saber a dónde mirar. Un elemento debe destacar sobre los demás como protagonista.' },
];

const RECIPE = {
  name: 'Vieira con Gel de Manzana, Espuma de Mar y Aceite de Eneldo',
  description: 'Un plato de alta cocina clásico moderno: vieira como protagonista con tres elementos de contraste. Es exigente y reúne los principios de este nivel.',
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
    'Sirve de inmediato: la espuma se baja en pocos minutos.',
  ],
};

export const AltaCocinaLevel = () => (
  <LevelPage
    worldName="Castillo del Chef" worldEmoji="👑"
    levelNum={19} levelName="Alta Cocina" levelEmoji="🥂" xpReward={200}
    world={5}
    missionText="Crear un <strong>plato de alta cocina completo</strong>: máximo 5 elementos, punto focal claro, salsa en trazo o punto, garnish funcional. Fotografía el plato emplatado sobre fondo negro o blanco."
    missionTags={[
      { icon: '🎨', label: 'Emplatado' },
      { icon: '⏱️', label: '90 min' },
    ]}
    steps={STEPS}
    errors={ERRORS}
    recipe={RECIPE}
    challengeHint="Fotografía el plato desde arriba sobre fondo limpio. El emplatado debe mostrar técnica, con máximo 5 elementos claramente diferenciados."
    evaluationCriteria={[
      { stars: '⭐⭐⭐', label: 'Emplatado profesional, técnica visible' },
      { stars: '⭐⭐', label: 'Buena presentación, algo de técnica' },
      { stars: '⭐', label: 'Intento de emplatado con cuidado' },
    ]}
  />
);
