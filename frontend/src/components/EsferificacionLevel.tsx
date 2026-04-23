/** EsferificacionLevel.tsx — Nivel 14, Mundo 4: Pico del Maestro (Premium). Esferificación básica e inversa. */
import { LevelPage } from './LevelPage';

const STEPS = [
  {
    num: 1, title: 'La ciencia: alginato de sodio y calcio', emoji: '🔬',
    desc: 'La esferificación es una técnica de cocina molecular creada por Ferran Adrià. Mezclas un líquido con alginato de sodio y lo introduces en un baño de cloruro de calcio. La reacción química crea una membrana gelificada que encierra el líquido en una esfera que "explota" en la boca.',
    tip: 'Hay dos tipos: esferificación directa (alginato en el líquido) y esferificación inversa (calcio en el líquido). La inversa es más estable y funciona mejor con productos lácteos y alcoholes.',
  },
  {
    num: 2, title: 'Preparar el baño de alginato', emoji: '⚗️',
    desc: 'Para la esferificación directa: disuelve 2g de alginato de sodio en 500ml de líquido (jugo, caldos, purés) con batidora de mano. Deja reposar 30 minutos en nevera para que desaparezcan las burbujas. El líquido sin burbujas da esferas perfectas.',
    tip: 'El alginato no se disuelve bien en frío — bate con batidora de inmersión durante 3 minutos mínimo. Las burbujas en el líquido = esferas irregulares con agujeros. El reposo en nevera es obligatorio.',
  },
  {
    num: 3, title: 'Preparar el baño de calcio', emoji: '🛁',
    desc: 'Disuelve 5g de cloruro de calcio en 500ml de agua limpia. Mezcla bien hasta disolver completamente. Este es el baño donde sumergirás las esferas. Usa agua helada para que la membrana se forme más lentamente y resulte más uniforme.',
    tip: 'El baño de calcio no cambia de temperatura durante el proceso. Puedes reutilizarlo para varias tandas de esferas. Cambiarlo cuando se vuelva viscoso.',
  },
  {
    num: 4, title: 'Formar las esferas: la técnica de gota', emoji: '💧',
    desc: 'Con una jeringa o cuchara medidora, deja caer gotas del líquido de alginato directamente al baño de calcio desde una altura de 3–5 cm. La gota forma la esfera al contacto. Déjalas en el baño 60–90 segundos sin moverlas demasiado. Más tiempo = membrana más gruesa.',
    tip: 'La altura de la gota determina la forma de la esfera: muy alta = esfera aplanada. Muy baja = esfera irregular. 3–5 cm sobre la superficie es el rango ideal. Practica con agua primero.',
  },
  {
    num: 5, title: 'Enjuagar y servir inmediatamente', emoji: '✨',
    desc: 'Rescata las esferas con una cuchara perforada y enjuágalas suavemente en un baño de agua limpia para retirar el exceso de calcio (que da sabor amargo). Sirve INMEDIATAMENTE. Las esferas de esferificación directa siguen gelificando con el tiempo y en pocas horas son sólidas.',
    tip: 'Las esferas de esferificación inversa (con yogur, nata o productos grasos) son más estables y pueden prepararse con más anticipación. Para el servicio en restaurante, la inversa es más práctica.',
  },
];

const ERRORS = [
  { icon: '🫧', error: 'Esferas con huecos o irregulares', fix: 'El líquido de alginato tenía burbujas. Siempre reposa 30 min en nevera después de batir.' },
  { icon: '🪨', error: 'Esferas muy duras (no explotan)', fix: 'Más de 90 segundos en el baño de calcio. La membrana sigue creciendo. 60 segundos para membrana fina.' },
  { icon: '💀', error: 'Esferas que se deshacen al sacarlas', fix: 'Menos de 30 segundos en el baño. Enjuaga con más cuidado con cuchara perforada.' },
  { icon: '😖', error: 'Sabor metálico/amargo', fix: 'No enjuagaste bien el exceso de calcio. El baño de agua limpia es obligatorio antes del servicio.' },
];

const RECIPE = {
  name: 'Esferas de Mango con Menta (Esferificación Directa)',
  description: 'Un clásico de la cocina molecular: jugo de mango en pequeñas esferas que estallan en la boca. Perfecto como garnish de postres o cócteles.',
  servings: '20 esferas',
  time: '45 min',
  difficulty: '⭐⭐⭐⭐',
  ingredients: [
    '500 ml de jugo de mango natural (sin azúcar)',
    '2 g de alginato de sodio',
    '500 ml de agua limpia',
    '5 g de cloruro de calcio',
    '500 ml de agua limpia (para enjuague)',
    'Menta fresca (para servir)',
  ],
  method: [
    'Mezcla el alginato con el jugo de mango con batidora de inmersión 3 min.',
    'Cuela para retirar espuma. Reposa en nevera 30 min cubierto.',
    'Disuelve el cloruro de calcio en 500ml de agua fría.',
    'Con jeringa, suelta gotas del jugo de mango al baño de calcio desde 4 cm de altura.',
    'Espera 60 segundos sin mover. Rescata con cuchara perforada.',
    'Enjuaga en agua limpia. Sirve inmediatamente como garnish.',
  ],
};

export const EsferificacionLevel = () => (
  <LevelPage
    worldName="Pico del Maestro" worldEmoji="🏔️"
    levelNum={14} levelName="Esferificación" levelEmoji="⚗️" xpReward={150}
    gradientFrom="from-violet-500" gradientTo="to-purple-700"
    accentBg="bg-violet-50" accentBorder="border-violet-200"
    accentText="text-violet-700" accentDark="text-violet-800"
    stepActiveBg="bg-violet-100" stepActiveTxt="text-violet-700"
    btnBg="bg-violet-500 hover:bg-violet-600" btnShadow="shadow-violet-500/30"
    missionText="Crear <strong>esferas perfectas</strong> mediante esferificación directa: membrana fina, interior líquido que explote en boca, sin huecos ni forma irregular. Fotografía las esferas en una cuchara o plato."
    missionTags={[
      { icon: '⚗️', label: 'Cocina molecular' },
      { icon: '⏱️', label: '~45 min' },
    ]}
    steps={STEPS}
    errors={ERRORS}
    recipe={RECIPE}
    challengeHint="Fotografía 4–6 esferas en una cuchara china (cucharita de degustación) o en un plato blanco. Deben verse esféricas y brillantes."
    evaluationCriteria={[
      { stars: '⭐⭐⭐', label: 'Esferas perfectas, brillantes, esféricas' },
      { stars: '⭐⭐', label: 'Esferas formadas, algo irregulares' },
      { stars: '⭐', label: 'Intentaste la técnica, hay resultado' },
    ]}
  />
);
