/** Nivel 17, Mundo 5: Castillo del Chef (Premium). Diseño de un menú degustación por tiempos. */
import { LevelPage } from './LevelPage';

const STEPS = [
  {
    num: 1, title: 'Qué es un Menú Degustación', emoji: '🍽️',
    desc: 'Un menú degustación (tasting menu) es una secuencia de 6–12 platos pequeños diseñados para contar una historia culinaria. El orden no es aleatorio: comienza con lo más delicado (crudo, frío, ácido) y avanza hacia lo más intenso (graso, umami, dulce). El objetivo es la progresión de sensaciones.',
    tip: 'La regla general de secuencia: crudos → marinados → sopa/crema → fish course → meat course → pre-dessert → dessert → mignardises. Cada plato prepara el paladar para el siguiente.',
  },
  {
    num: 2, title: 'Diseñar la narrativa: tema y coherencia', emoji: '📖',
    desc: 'Cada menú degustación tiene un hilo conductor: ingrediente local, estación del año, región geográfica, técnica culinaria. Antes de pensar en platos, elige el tema. Luego, cada plato es una variación del mismo tema. Sin ese hilo, el menú es solo una lista de platos.',
    tip: 'Un ejemplo de coherencia: "Otoño en el bosque": hongos en ceviche, consomé de porcini, brioche de trufa, filete con duxelles, queso de cabra con mermelada de castañas, coulant de chocolate amargo.',
  },
  {
    num: 3, title: 'El equilibrio: ácido, graso, umami, dulce', emoji: '⚖️',
    desc: 'Cada plato dentro del menú debe tener su propio equilibrio de sabores, pero también debe equilibrarse con los platos vecinos. No pongas dos platos muy grasos seguidos. Alterna entre acidez fresca y riqueza umami. El ácido "limpia" el paladar entre platos grasos.',
    tip: 'Por eso muchos menús abren con un bocado ácido o un espumoso: el ácido hace salivar y deja el paladar listo para los platos que siguen.',
  },
  {
    num: 4, title: 'La mise en place de un servicio completo', emoji: '🧑‍🍳',
    desc: 'En un menú degustación, la mise en place tiene que estar completa. Cada elemento de cada plato debe estar preparado antes de empezar el servicio. Las salsas se tienen en baño maría. Los garnish preparados. Las proteínas en sous-vide esperando el sellado final. La ejecución del servicio no permite improvisar.',
    tip: 'Una regla útil para degustación: todo lo que no puedas hacer en menos de 90 segundos durante el servicio debe quedar listo antes. Si necesitas más, no está listo para servicio.',
  },
  {
    num: 5, title: 'El emplatado: geometría y narrativa visual', emoji: '🎨',
    desc: 'Las reglas básicas del emplatado de alta cocina: nunca cubras el centro del plato (la proteína principal va descentrada, en los 2/3 izquierdo). El contraste de color es lo primero que ve el comensal. La altura da volumen. El garnish siempre tiene función gustativa.',
    tip: 'Fotografía tus emplatados y estudia los de chefs de 3 estrellas Michelin. La geometría del emplatado se aprende observando.',
  },
];

const ERRORS = [
  { icon: '🌪️', error: 'Falta de coherencia entre platos', fix: 'Define el tema primero. Si un plato no encaja en el tema, no va al menú aunque sea técnicamente excelente.' },
  { icon: '😴', error: 'Progresión monótona', fix: 'Asegura contraste después de cada plato: ácido post-grasoso, ligero post-intenso. La sorpresa es parte del menú.' },
  { icon: '⏱️', error: 'Platos que requieren 5 min de servicio', fix: 'Si el emplatado tarda más de 90 segundos el plato no está listo para el menú. Simplifica o prepara más mise en place.' },
  { icon: '📷', error: 'Emplatado sin punto focal', fix: 'Cada plato necesita un elemento principal y los demás apoyan. Si todo compite por atención, no hay lectura visual clara.' },
];

const RECIPE = {
  name: 'Menú Degustación de 4 Tiempos (versión casera)',
  description: 'Un menú degustación accesible para casa. Cada tiempo es pequeño y elegante. Practica el concepto antes de escalarlo.',
  servings: '2 personas',
  time: '3–4 horas',
  difficulty: '⭐⭐⭐⭐',
  ingredients: [
    'Primer tiempo (amuse): 1 huevo de codorniz + salmón ahumado + crema agria + eneldo',
    'Segundo tiempo (frío): 100g de vieiras crudas + limón + aceite de oliva + flor de sal',
    'Tercer tiempo (caliente): consomé de pollo claro + juliana de verduras',
    'Cuarto tiempo (principal): filete de lubina con velouté + vegetales en brunoise glaseados',
    '(Pre-postre si quieres): Sorbete de limón',
    'Petit fours: 2 trufas de chocolate por persona',
  ],
  method: [
    'Primer tiempo: monta el huevo de codorniz cocido sobre una tosta con salmón, un punto de crema y eneldo. Un bocado.',
    'Segundo tiempo: marina vieiras 5 min con limón, aceite, sal y pimienta. Emplata en concha con microhierbas.',
    'Tercer tiempo: cuela consomé bien claro. Sirve caliente en taza con brunoise de zanahorias.',
    'Cuarto tiempo: cocina la lubina en sartén con Maillard. Monta sobre velouté y vegetales glaseados.',
    'Sirve cada tiempo a intervalos de 15 min para crear la experiencia completa de degustación.',
  ],
};

export const MenuDegustacionLevel = () => (
  <LevelPage
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
