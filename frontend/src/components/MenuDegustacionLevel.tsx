/** MenuDegustacionLevel.tsx — Nivel 17, Mundo 5: Castillo del Chef (Premium). Diseño de menú degustación de 8 tiempos. */
import { LevelPage } from './LevelPage';

const STEPS = [
  {
    num: 1, title: 'Qué es un Menú Degustación', emoji: '🍽️',
    desc: 'Un menú degustación (tasting menu) es una secuencia de 6–12 platos pequeños diseñados para contar una historia culinaria. El orden no es aleatorio: comienza con lo más delicado (crudo, frío, ácido) y avanza hacia lo más intenso (graso, umami, dulce). El objetivo es la progresión de sensaciones.',
    tip: 'La regla general de secuencia: crudos → marinados → sopa/crema → fish course → meat course → pre-dessert → dessert → mignardises. Cada plato prepara el paladar para el siguiente.',
  },
  {
    num: 2, title: 'Diseñar la narrativa: tema y coherencia', emoji: '📖',
    desc: 'Cada menú degustación tiene un hilo conductor: ingrediente local, estación del año, región geográfica, técnica culinaria. Antes de pensar en platos, elige el tema. Luego, cada plato es una variación del mismo tema. La coherencia es lo que distingue un menú excepcional de una lista de platos.',
    tip: 'Un ejemplo de coherencia: "Otoño en el bosque" — hongos en ceviche, consomé de porcini, brioche de trufa, filete con duxelles, queso de cabra con mermelada de castañas, coulant de chocolate amargo.',
  },
  {
    num: 3, title: 'El equilibrio: ácido, graso, umami, dulce', emoji: '⚖️',
    desc: 'Cada plato dentro del menú debe tener su propio equilibrio de sabores, pero también debe equilibrarse con los platos vecinos. No pongas dos platos muy grasos seguidos. Alterna entre acidez fresca y riqueza umami. El ácido "limpia" el paladar entre platos grasos.',
    tip: 'El champán o los amuse-bouche ácidos al inicio tienen una función técnica: el ácido cierra las papilas gustativas y las prepara para percibir mejor el umami de los platos que siguen.',
  },
  {
    num: 4, title: 'La mise en place de un servicio completo', emoji: '🧑‍🍳',
    desc: 'En un menú degustación, la mise en place es absoluta. Cada elemento de cada plato debe estar preparado antes de empezar el servicio. Los salsas se tienen en baño maría. Los garnish preparados. Las proteínas en sous-vide esperando el sellado final. La ejecución del servicio no permite improvisar.',
    tip: 'La regla de oro de la mise en place para degustación: todo lo que no puedas hacer en menos de 90 segundos durante el servicio, debe estar dime place. Si necesitas más, no está listo para servicio.',
  },
  {
    num: 5, title: 'El emplatado: geometría y narrativa visual', emoji: '🎨',
    desc: 'El plato es el lienzo. Las reglas básicas del emplatado de alta cocina: nunca cubras el centro del plato (la proteína principal va descentrada, en los 2/3 izquierdo). El color es el primer sabor (contraste visual). La altura añade drama. El garnish siempre tiene función gustativa.',
    tip: 'Fotografía tus emplatados y estudia los de chefs de 3 estrellas Michelin. La geometría del emplatado tiene reglas que se aprenden por observación. El ojo se entrena mirando excelencia.',
  },
];

const ERRORS = [
  { icon: '🌪️', error: 'Falta de coherencia entre platos', fix: 'Define el tema primero. Si un plato no encaja en el tema, no va al menú aunque sea técnicamente excelente.' },
  { icon: '😴', error: 'Progresión monótona', fix: 'Asegura contraste después de cada plato: ácido post-grasoso, ligero post-intenso. La sorpresa es parte del menú.' },
  { icon: '⏱️', error: 'Platos que requieren 5 min de servicio', fix: 'Si el emplatado tarda más de 90 segundos el plato no está listo para el menú. Simplifica o prepara más mise en place.' },
  { icon: '📷', error: 'Emplatado sin punto focal', fix: 'Cada plato necesita un elemento principal y los demás apoyan. Si todo compite por atención, no hay lectura visual clara.' },
];

const RECIPE = {
  name: 'Menú Degustación de 4 Tiempos (Versión Home)',
  description: 'Un menú degustación accesible para casa. Cada tiempo es pequeño y elegante. Practica el concepto antes de escalarlo.',
  servings: '2 personas',
  time: '3–4 horas',
  difficulty: '⭐⭐⭐⭐',
  ingredients: [
    '1° TIEMPO — Amuse: 1 huevo codorniz + salmón ahumado + crema agria + eneldo',
    '2° TIEMPO — Fría: 100g de vieiras crudas + limón + aceite de oliva + flor de sal',
    '3° TIEMPO — Caliente: Consomé de pollo claro + juliana de verduras',
    '4° TIEMPO — Principal: Filete de lubina con velouté + vegetales en brunoise glaseados',
    '(Pre-postre si quieres): Sorbete de limón',
    'Petit fours: 2 trufas de chocolate por persona',
  ],
  method: [
    '1° Tiempo: Monta huevo codorniz cocido sobre tosta, salmon, punto de crema y eneldo. 1 bocado.',
    '2° Tiempo: Marina vieiras 5 min con limón, aceite, sal y pimienta. Emplata en concha con microhierbas.',
    '3° Tiempo: Cuela consomé bien claro. Sirve caliente en taza con brunoise de zanahorias.',
    '4° Tiempo: Cocina la lubina en sartén con Maillard. Monta sobre velouté y vegetales glaseados.',
    'Sirve cada tiempo a intervalos de 15 min para crear la experiencia completa de degustación.',
  ],
};

export const MenuDegustacionLevel = () => (
  <LevelPage
    worldName="Castillo del Chef" worldEmoji="👑"
    levelNum={17} levelName="Menú Degustación" levelEmoji="🍽️" xpReward={200}
    gradientFrom="from-yellow-500" gradientTo="to-amber-600"
    accentBg="bg-amber-50" accentBorder="border-amber-200"
    accentText="text-amber-700" accentDark="text-amber-800"
    stepActiveBg="bg-amber-100" stepActiveTxt="text-amber-700"
    btnBg="bg-amber-500 hover:bg-amber-600" btnShadow="shadow-amber-500/30"
    missionText="Diseñar y preparar un <strong>menú degustación de 3–4 tiempos</strong> con coherencia temática, progresión de sabores y emplatado profesional. Fotografía cada tiempo emplatado."
    missionTags={[
      { icon: '🍽️', label: '3–4 tiempos' },
      { icon: '⏱️', label: '3–4 horas' },
    ]}
    steps={STEPS}
    errors={ERRORS}
    recipe={RECIPE}
    challengeHint="Fotografía los 3–4 tiempos del menú emplatados, preferiblemente en fila para mostrar la progresión visual del menú."
    evaluationCriteria={[
      { stars: '⭐⭐⭐', label: 'Coherencia, progresión, emplatado elegante' },
      { stars: '⭐⭐', label: 'Varios tiempos bien ejecutados' },
      { stars: '⭐', label: 'Al menos un plato emplatado con cuidado' },
    ]}
  />
);
