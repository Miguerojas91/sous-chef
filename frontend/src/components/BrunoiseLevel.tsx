/** BrunoiseLevel.tsx — Nivel 2, Mundo 1: Isla del Cuchillo. Técnica de corte brunoise (cubos 3×3×3 mm). */
import { LevelPage } from './LevelPage';

const STEPS = [
  {
    num: 1, title: 'Prepara el vegetal: corte base', emoji: '🔪',
    desc: 'Pela la cebolla o el pimiento. Córtale los extremos para crear superficies planas. El corte base es fundamental: el vegetal debe quedar estable sobre la tabla antes de cualquier otro corte. Sin estabilidad, no hay precisión.',
    tip: 'Deja la raíz de la cebolla intacta mientras cortas. Hace de ancla y evita que los anillos se separen. Solo la retiras al final.',
  },
  {
    num: 2, title: 'Corta en planchas uniformes', emoji: '📏',
    desc: 'Coloca el vegetal con la cara plana hacia abajo. Córtalo en láminas verticales de 2–3 mm de grosor, sin llegar hasta la raíz. Las láminas deben quedar unidas por la base (en el caso de la cebolla, por la raíz).',
    tip: 'Usa la técnica de "acordeón": cortes paralelos sin separar. Así el vegetal se mantiene unido y facilita el siguiente paso.',
  },
  {
    num: 3, title: 'Cortes horizontales (optional para cebolla)', emoji: '↔️',
    desc: 'Con el vegetal aún unido, haz 2–3 cortes horizontales paralelos a la tabla. Esto crea la tercera dimensión del cubo. Este paso es opcional en vegetales pequeños como el pimiento, pero esencial en la cebolla para lograr el cubo exacto.',
    tip: 'Mantén los dedos bien protegidos con la garra de gato. El cuchillo va hacia adentro y siempre paralelo a la tabla. Nunca hacia arriba.',
  },
  {
    num: 4, title: 'Corte final: los cubos', emoji: '🧅',
    desc: 'Gira el vegetal 90° y realiza cortes perpendiculares a los anteriores, a 2–3 mm de distancia. Cada corte libera cubos perfectos. Avanza de forma consistente y controla el grosor con los nudillos.',
    tip: 'El brunoise perfecto mide 2–3 mm × 2–3 mm × 2–3 mm. El brunoise fino (brunoise fine) mide 1–1.5 mm. Se usa en guarniciones, salsas y quenelles.',
  },
  {
    num: 5, title: 'Verificación y uniformidad', emoji: '✅',
    desc: 'Extiende los cubos sobre la tabla. ¿Son todos del mismo tamaño? ¿Cubos, no triángulos? Los bordes irregulares de los extremos del vegetal los puedes picar aparte. En cocina profesional, solo pasan los cubos perfectos.',
    tip: 'El brunoise se usa como base de sofrito, en salsas madre, como guarnición decorativa y como relleno. La uniformidad garantiza cocción igual en todos los trozos.',
  },
];

const ERRORS = [
  { icon: '📐', error: 'Cubos desiguales', fix: 'Mantén el mismo intervalo entre cortes. Usa los nudillos como guía de medida constante.' },
  { icon: '🌀', error: 'Cebolla se deshace al cortar', fix: 'Mantén la raíz intacta. Solo la retiras cuando terminas de cortar toda la cebolla.' },
  { icon: '🔺', error: 'Salen triángulos, no cubos', fix: 'Asegúrate de hacer primero los cortes horizontales ANTES del corte final perpendicular.' },
  { icon: '💦', error: 'Mucho líquido al cortar', fix: 'Trabaja rápido con cuchillo bien afilado. El filo limpio minimiza la rotura celular y el jugo.' },
];

const RECIPE = {
  name: 'Sofrito Base de Brunoise',
  description: 'El sofrito es la base de cientos de platos. Dominar el brunoise aquí se convierte en habilidad diaria en la cocina profesional.',
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
    'Corta la cebolla, los pimientos y los tomates en brunoise perfecta (2–3 mm). Reserva por separado.',
    'Calienta el aceite en sartén ancha a fuego medio-bajo. Agrega la cebolla con una pizca de sal.',
    'Cocina la cebolla 8 minutos hasta que esté translúcida y suave, sin dorar.',
    'Agrega el ajo picado fino y los pimientos. Cocina 5 minutos más.',
    'Incorpora el tomate y el laurel. Reduce 10 minutos hasta que concentre y pierda el exceso de agua.',
    'Ajusta de sal y pimienta. Retira el laurel. ¡Tu sofrito base está listo!',
  ],
};

export const BrunoiseLevel = () => (
  <LevelPage
    worldName="Isla del Cuchillo" worldEmoji="🔪"
    levelNum={2} levelName="Brunoise" levelEmoji="🧅" xpReward={50}
    gradientFrom="from-emerald-500" gradientTo="to-teal-600"
    accentBg="bg-emerald-50" accentBorder="border-emerald-200"
    accentText="text-emerald-700" accentDark="text-emerald-800"
    stepActiveBg="bg-emerald-100" stepActiveTxt="text-emerald-700"
    btnBg="bg-emerald-500 hover:bg-emerald-600" btnShadow="shadow-emerald-500/30"
    missionText="Cortar <strong>una cebolla o pimiento entero</strong> en cubos <strong>brunoise perfectos</strong>: 2–3 mm × 2–3 mm × 2–3 mm. Fotografía el resultado disperso en la tabla para que se vea la uniformidad."
    missionTags={[
      { icon: '⏱️', label: '~20 min' },
      { icon: '📏', label: '2–3mm × 2–3mm' },
    ]}
    steps={STEPS}
    errors={ERRORS}
    recipe={RECIPE}
    challengeHint="Esparce los cubos sobre la tabla y fotografía desde arriba, con buena luz. Necesitamos ver la uniformidad de los cubos."
    evaluationCriteria={[
      { stars: '⭐⭐⭐', label: 'Cubos perfectos, todos iguales, 2-3mm' },
      { stars: '⭐⭐', label: 'Tamaño regular, alguna variación' },
      { stars: '⭐', label: 'Intentaste el corte, forma irregular' },
    ]}
  />
);
