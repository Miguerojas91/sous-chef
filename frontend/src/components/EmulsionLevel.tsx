import { LevelPage } from './LevelPage';

const STEPS = [
  {
    num: 1, title: 'Entiende la emulsión: aceite + agua', emoji: '🔬',
    desc: 'Una emulsión es mezclar dos líquidos que normalmente no se mezclan: aceite y agua. Para que sea estable, necesitamos un emulsionante (lecitina del huevo, mostaza) que rodea las gotas de aceite y las suspende en el agua. Sin emulsionante, la salsa se separa.',
    tip: 'La mayonesa es aceite en agua (emulsión directa). La mantequilla es agua en aceite (emulsión inversa). El huevo (lecitina) es el emulsionante más poderoso en cocina.',
  },
  {
    num: 2, title: 'Ingredientes a temperatura ambiente', emoji: '🌡️',
    desc: 'Para hacer mayonesa casera: saca el huevo y el aceite del refrigerador 30 minutos antes. Los ingredientes fríos dificultan la emulsión. La yema fría es más viscosa y no captura el aceite de forma eficiente. Temperatura ambiente = emulsión más fácil.',
    tip: 'Si usas huevo de la nevera en emergencia, tempéralo 5 minutos en agua tibia (no caliente). La temperatura del aceite también importa: nunca aceite caliente con yema.',
  },
  {
    num: 3, title: 'La técnica: agregar aceite LENTAMENTE', emoji: '💧',
    desc: 'Bate la yema con mostaza y limón. Luego agrega el aceite GOTA A GOTA al inicio, sin parar de batir. Cada gota debe integrarse antes de agregar la siguiente. Una vez que la emulsión esté establecida (mezcla espesa), puedes añadir el aceite en hilo fino.',
    tip: 'El error fatal: agregar aceite demasiado rápido al inicio. La lecitina de la yema necesita tiempo para rodear cada gotita. Si vas muy rápido, la emulsión se corta.',
  },
  {
    num: 4, title: 'Ajuste de textura y sabor', emoji: '⚗️',
    desc: 'Si la mayonesa está muy espesa, agrega unas gotas de agua o limón y bate. Si está muy líquida, sigue batiendo mientras añades más aceite. Ajusta sal, limón y mostaza. Una mayonesa perfecta mantiene su forma al cucharear: ni fluye ni es sólida.',
    tip: 'Para hacer alioli tradicional, sustituye el limón por ajo machacado finísimo. Para hacer salsa tártara, mezcla la mayonesa con pepinillos, alcaparras y cebolleta en brunoise.',
  },
  {
    num: 5, title: 'Recuperar una emulsión cortada', emoji: '🔧',
    desc: 'Si la emulsión se corta (mezcla líquida y separada), no la tires. En un bowl limpio, pon una cucharadita de mostaza. Agrega la mezcla cortada gota a gota mientras bates. La mostaza actúa como segundo emulsionante y recupera la salsa en el 90% de los casos.',
    tip: 'Una emulsión cortada es uno de los momentos más frustrantes de la cocina. Pero con esta técnica de rescate básica la recuperas casi siempre. Fue inventada precisamente para no desperdiciar.',
  },
];

const ERRORS = [
  { icon: '💔', error: 'Emulsión cortada (salsa líquida separada)', fix: 'Añadiste aceite muy rápido al inicio. Recupera en bowl nuevo con mostaza y el cortado gota a gota.' },
  { icon: '🧊', error: 'Ingredientes muy fríos', fix: 'Temperatura ambiente es clave. Deja el huevo y aceite 30 min fuera del refrigerador.' },
  { icon: '🌊', error: 'No deja de ser líquida', fix: 'Necesitas más aceite. La emulsión se espesa con más contenido graso. Añade aceite en hilo fino sin dejar de batir.' },
  { icon: '🍋', error: 'Sabor demasiado ácido', fix: 'Ajusta el limón al final, no al principio. Empieza con poca cantidad y prueba antes de añadir más.' },
];

const RECIPE = {
  name: 'Mayonesa Casera y Salsa Aïoli',
  description: 'La mayonesa casera y el aïoli son la base de docenas de salsas. Una vez que dominas la emulsión, puedes crear alioli, salsa tártara, rémoulade y más.',
  servings: '250 ml',
  time: '15 min',
  difficulty: '⭐⭐⭐',
  ingredients: [
    '2 yemas de huevo (temperatura ambiente)',
    '200 ml de aceite de girasol (o mezcla con oliva)',
    '1 cucharada de mostaza de Dijon',
    '1 cucharada de jugo de limón fresco',
    'Sal al gusto',
    '(Para aïoli: 3 dientes de ajo + aceite de oliva extra virgen)',
  ],
  method: [
    'Bate las yemas con la mostaza, una pizca de sal y el limón hasta integrar.',
    'Comienza a agregar el aceite GOTA A GOTA sin dejar de batir con varillas.',
    'Cuando la mezcla espese visiblemente (después de ~50ml de aceite), agrega el resto en hilo fino constante.',
    'Ajusta de sal y limón. Si está muy espesa, agrega 1 cucharadita de agua y bate.',
    '(Para aïoli: tritura el ajo en mortero hasta pasta. Mezcla con la yema antes de añadir aceite de oliva. Procede igual.)',
    'Reserva en refrigerador hasta 3 días cubierta con film.',
  ],
};

export const EmulsionLevel = () => (
  <LevelPage
    worldName="Valle del Fuego" worldEmoji="🔥"
    levelNum={7} levelName="Emulsión" levelEmoji="🥚" xpReward={75}
    gradientFrom="from-orange-500" gradientTo="to-red-600"
    accentBg="bg-orange-50" accentBorder="border-orange-200"
    accentText="text-orange-700" accentDark="text-orange-800"
    stepActiveBg="bg-orange-100" stepActiveTxt="text-orange-700"
    btnBg="bg-orange-500 hover:bg-orange-600" btnShadow="shadow-orange-500/30"
    missionText="Preparar una <strong>mayonesa o alioli casero</strong> con emulsión perfecta: textura firme, cremosa, sin cortar. Fotografía el resultado en un cuenco con una cuchara que muestre la consistencia."
    missionTags={[
      { icon: '⏱️', label: '~15 min' },
      { icon: '⚗️', label: 'Lecitina de huevo' },
    ]}
    steps={STEPS}
    errors={ERRORS}
    recipe={RECIPE}
    challengeHint="Fotografía la mayo en un cuenco desde arriba. Debe verse densa y cremosa. Usa una cuchara para mostrar la textura que mantiene su forma."
    evaluationCriteria={[
      { stars: '⭐⭐⭐', label: 'Emulsión perfecta, densa, cremosa' },
      { stars: '⭐⭐', label: 'Se emulsionó, algo líquida' },
      { stars: '⭐', label: 'Cortada pero intentaste recuperarla' },
    ]}
  />
);
