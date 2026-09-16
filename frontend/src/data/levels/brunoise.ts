/** Nivel 2, Mundo 1: Isla del Cuchillo. Técnica de corte brunoise (cubos de 2–3 mm). */
import type { LevelContent, LevelError, LevelRecipe, LevelStep } from './types';

const STEPS: LevelStep[] = [
  {
    title: 'Prepara el vegetal: corte base',
    desc: 'Pela la cebolla o el pimiento. Córtale los extremos para crear superficies planas. El corte base es fundamental: el vegetal debe quedar estable sobre la tabla antes de cualquier otro corte.',
    tip: 'Deja la raíz de la cebolla intacta mientras cortas. Hace de ancla y evita que los anillos se separen. Solo la retiras al final.',
  },
  {
    title: 'Corta en planchas uniformes',
    desc: 'Coloca el vegetal con la cara plana hacia abajo. Córtalo en láminas verticales de 2–3 mm de grosor, sin llegar hasta la raíz. Las láminas deben quedar unidas por la base (en el caso de la cebolla, por la raíz).',
    tip: 'Usa la técnica de "acordeón": cortes paralelos sin separar. Así el vegetal se mantiene unido y facilita el siguiente paso.',
  },
  {
    title: 'Cortes horizontales (clave en la cebolla)',
    desc: 'Con el vegetal aún unido, haz 2–3 cortes horizontales paralelos a la tabla. Esto crea la tercera dimensión del cubo. Este paso es opcional en vegetales pequeños como el pimiento, pero esencial en la cebolla para lograr el cubo exacto.',
    tip: 'Mantén los dedos bien protegidos con la garra de gato. El cuchillo va hacia adentro y siempre paralelo a la tabla. Nunca hacia arriba.',
  },
  {
    title: 'Corte final: los cubos',
    desc: 'Gira el vegetal 90° y realiza cortes perpendiculares a los anteriores, a 2–3 mm de distancia. Cada corte suelta cubos de 2–3 mm. Avanza de forma consistente y controla el grosor con los nudillos.',
    tip: 'El brunoise clásico mide 2–3 mm × 2–3 mm × 2–3 mm. El brunoise fino (brunoise fine) mide 1–1.5 mm. Se usa en guarniciones, salsas y quenelles.',
  },
  {
    title: 'Verificación y uniformidad',
    desc: 'Extiende los cubos sobre la tabla. ¿Son todos del mismo tamaño? ¿Cubos, no triángulos? Los bordes irregulares de los extremos del vegetal los puedes picar aparte. En cocina profesional solo se usan los cubos parejos.',
    tip: 'El brunoise se usa como base de sofrito, en salsas madre, como guarnición decorativa y como relleno. La uniformidad garantiza cocción igual en todos los trozos.',
  },
];

const ERRORS: LevelError[] = [
  { icon: '📐', error: 'Cubos desiguales', fix: 'Mantén el mismo intervalo entre cortes. Usa los nudillos como guía de medida constante.' },
  { icon: '🌀', error: 'Cebolla se deshace al cortar', fix: 'Mantén la raíz intacta. Solo la retiras cuando terminas de cortar toda la cebolla.' },
  { icon: '🔺', error: 'Salen triángulos, no cubos', fix: 'Asegúrate de hacer primero los cortes horizontales antes del corte final perpendicular.' },
  { icon: '💦', error: 'Mucho líquido al cortar', fix: 'Trabaja rápido con cuchillo bien afilado. El filo limpio minimiza la rotura celular y el jugo.' },
];

const RECIPE: LevelRecipe = {
  name: 'Sofrito Base de Brunoise',
  description: 'El sofrito es la base de muchos platos, y aquí usas el brunoise que acabas de practicar.',
  servings: '4 personas',
  time: '25 min',
  difficulty: '⭐⭐',
  ingredients: [
    '1 cebolla blanca mediana',
    '2 dientes de ajo',
    '1 pimiento rojo pequeño',
    '1 pimiento verde pequeño',
    '2 tomates maduros (pelados y despepitados)',
    '3 cucharadas de aceite de oliva extra virgen',
    'Sal y pimienta al gusto',
    '1 hoja de laurel',
  ],
  method: [
    'Corta la cebolla, los pimientos y los tomates en brunoise de 2–3 mm. Reserva por separado.',
    'Calienta el aceite en sartén ancha a fuego medio-bajo. Agrega la cebolla con una pizca de sal.',
    'Cocina la cebolla 8 minutos hasta que esté translúcida y suave, sin dorar.',
    'Agrega el ajo picado fino y los pimientos. Cocina 5 minutos más.',
    'Incorpora el tomate y el laurel. Reduce 10 minutos hasta que concentre y pierda el exceso de agua.',
    'Ajusta de sal y pimienta. Retira el laurel. ¡Tu sofrito base está listo!',
  ],
};

export const content: LevelContent = {
  missionText: 'Cortar <strong>una cebolla o pimiento entero</strong> en <strong>cubos brunoise parejos</strong>: 2–3 mm × 2–3 mm × 2–3 mm. Fotografía el resultado disperso en la tabla para que se vea la uniformidad.',
  missionTags: ['~20 min', '2–3mm × 2–3mm'],
  steps: STEPS,
  errors: ERRORS,
  recipe: RECIPE,
  challengeHint: 'Esparce los cubos sobre la tabla y fotografía desde arriba, con buena luz. Debe verse la uniformidad de los cubos.',
  evaluationCriteria: [
    { stars: '⭐⭐⭐', label: 'Cubos perfectos, todos iguales, 2-3mm' },
    { stars: '⭐⭐', label: 'Tamaño regular, alguna variación' },
    { stars: '⭐', label: 'Intentaste el corte, forma irregular' },
  ],
};
