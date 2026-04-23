/** JulianaLevel.tsx — Nivel 1, Mundo 1: Isla del Cuchillo. Técnica de corte juliana (bastones 3×3×60 mm). */
import { LevelPage } from './LevelPage';

const STEPS = [
  {
    num: 1,
    title: 'Prepara tu mise en place',
    emoji: '🧑‍🍳',
    desc: 'Antes de cortar cualquier cosa, organiza tu estación. Necesitas: tabla de cortar limpia y antideslizante, cuchillo de chef afilado (o un santoku), y tu vegetal elegido. Recomendamos zanahoria o calabacín para empezar.',
    tip: 'Coloca un paño húmedo DEBAJO de la tabla para que no se mueva mientras cortas. Esto es lo que hace cada cocinero profesional.',
  },
  {
    num: 2,
    title: 'Estabiliza el vegetal: el corte base',
    emoji: '🔪',
    desc: 'Corta una rodaja fina del lado más largo del vegetal para crear una superficie plana. Esto es el "corte base" y evita que la zanahoria ruede mientras trabajas. Colócala con el lado plano hacia abajo: ahora es segura.',
    tip: 'Un vegetal que se mueve = un dedo en peligro. El corte base es el primer paso de todo chef profesional antes de cualquier corte.',
  },
  {
    num: 3,
    title: 'Corta láminas (planches)',
    emoji: '📏',
    desc: 'Con el vegetal estabilizado, córtalo en láminas de 3 mm de grosor a lo largo. Usa la técnica de "garra de gato": los nudillos hacia afuera y la yema de los dedos doblada hacia adentro para protegerlos. El cuchillo guía contra los nudillos.',
    tip: 'El grosor estándar de Juliana es 3 mm × 3 mm × 6 cm. En la cocina profesional se mide con calibrador. Entrena el ojo con una regla la primera vez.',
  },
  {
    num: 4,
    title: 'Apila las láminas y corta los bastones',
    emoji: '🥕',
    desc: 'Apila 3–4 láminas una sobre otra (no más, o resbalan). Ahora corta a lo largo del eje del vegetal en bastones de 3 mm de ancho. El resultado: tiras uniformes de 3mm × 3mm × 6cm. ¡Eso es Juliana!',
    tip: 'Mantén una velocidad constante y deja que el peso del cuchillo haga el trabajo. No presiones hacia abajo con fuerza. El filo corta, la fuerza no.',
  },
  {
    num: 5,
    title: 'Consistencia y uniformidad',
    emoji: '✅',
    desc: 'Revisa tus bastones: ¿tienen el mismo grosor? ¿La misma longitud? En un restaurante, si los bastones no son uniformes no salen al plato. La uniformidad no es estética — es funcional: garantiza cocción homogénea.',
    tip: 'El primer juliana nunca es perfecto. El décimo empieza a verse bien. El centésimo es profesional. La velocidad viene sola.',
  },
];

const ERRORS = [
  { icon: '↔️', error: 'Grosor inconsistente',        fix: 'Mantén el cuchillo perpendicular a la tabla y usa los nudillos como guía constante.' },
  { icon: '📐', error: 'Bastones demasiado cortos',    fix: 'Debe ser 6 cm. Si tu vegetal es más corto, úsalo entero o usa un vegetal más largo.' },
  { icon: '🌀', error: 'Láminas que resbalan al apilar', fix: 'Apila máximo 3–4 láminas. Más que eso y pierdes control sobre el corte.' },
  { icon: '🦺', error: 'Cuchillo sin filo',             fix: 'Un cuchillo sin filo es más peligroso que uno afilado. Requiere más presión y desvía el corte.' },
];

export const JulianaLevel = () => (
  <LevelPage
    worldName="Isla del Cuchillo" worldEmoji="🔪"
    levelNum={1} levelName="Corte Juliana" levelEmoji="🥕" xpReward={50}
    gradientFrom="from-emerald-500" gradientTo="to-teal-600"
    accentBg="bg-emerald-50" accentBorder="border-emerald-200"
    accentText="text-emerald-700" accentDark="text-emerald-800"
    stepActiveBg="bg-emerald-100" stepActiveTxt="text-emerald-700"
    btnBg="bg-emerald-500 hover:bg-emerald-600" btnShadow="shadow-emerald-500/30"
    missionText="Cortar <strong>una zanahoria o calabacín entero</strong> en bastones <strong>Juliana uniformes</strong>: 3 mm × 3 mm × 6 cm. Fotografía tu resultado en la tabla y súbelo para completar el nivel."
    missionTags={[
      { icon: '⏱️', label: '~20 min' },
      { icon: '📏', label: '3mm × 3mm × 6cm' },
    ]}
    steps={STEPS}
    errors={ERRORS}
    challengeHint="Fotografía tu corte juliana en la tabla, de frente, con buena luz. Necesitamos ver la uniformidad de los bastones."
    evaluationCriteria={[
      { stars: '⭐⭐⭐', label: 'Bastones uniformes, 3mm, buen filo' },
      { stars: '⭐⭐',   label: 'Grosor regular, alguna variación' },
      { stars: '⭐',     label: 'Intentaste el corte, grosor irregular' },
    ]}
  />
);
