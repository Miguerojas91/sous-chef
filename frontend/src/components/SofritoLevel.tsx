import { LevelPage } from './LevelPage';

const STEPS = [
  {
    num: 1, title: 'La base aromática: mise en place', emoji: '🧄',
    desc: 'Corta en brunoise: ½ cebolla, 3 dientes de ajo, ½ pimiento verde y ½ pimiento rojo. Pela y trocea 2 tomates maduros. Todo debe estar listo antes de encender el fuego. En sofrito, el tiempo es crítico y el orden de adición lo es todo.',
    tip: 'La cebolla siempre primero. Es el vegetal que más tiempo necesita para perder su astringencia y desarrollar sabor dulce. El ajo va siempre después — si va primero, se quema.',
  },
  {
    num: 2, title: 'El aceite y la temperatura correcta', emoji: '🫒',
    desc: 'Usa aceite de oliva extra virgen. Calienta la sartén amplia a fuego MEDIO-BAJO. Agrega el aceite y espera a que brille levemente pero no humee. Si humea, bajaste demasiado tarde. El sofrito se cocina lento, nunca a fuego alto.',
    tip: 'Una sartén amplia con fondo grueso distribuye el calor uniformemente. Evita las de fondo delgado que crean puntos calientes y queman el ajo.',
  },
  {
    num: 3, title: 'Pochar la cebolla (el paso más importante)', emoji: '🧅',
    desc: 'Agrega la cebolla con una pizca de sal. Cocina a fuego medio-bajo durante 10–15 minutos, removiendo ocasionalmente. La cebolla primero se vuelve translúcida, luego libera agua, luego se ablanda y finalmente empieza a caramelizarse. Este es el punto exacto.',
    tip: 'La sal aplicada a la cebolla desde el inicio extrae su agua por ósmosis, acelerando el pochado. La cebolla bien pochada tiene sabor dulce y concentrado — nada que ver con la cruda.',
  },
  {
    num: 4, title: 'Añadir ajo y pimientos', emoji: '🌶️',
    desc: 'Cuando la cebolla esté translúcida y suave, agrega el ajo. Cocina 1 minuto removiendo. Luego añade los pimientos con una pizca más de sal. Cocina 8–10 minutos hasta que los pimientos estén suaves y el ajo integrado.',
    tip: 'El ajo en brunoise se integra más rápido. Si lo ves empezar a dorar en bordes, baja el fuego inmediatamente. El ajo quemado amarga todo el sofrito y no tiene solución.',
  },
  {
    num: 5, title: 'El tomate: reducción y concentración', emoji: '🍅',
    desc: 'Agrega el tomate triturado o en concassé. Mezcla todo. Sube ligeramente el fuego y deja reducir el agua del tomate durante 15–20 minutos, removiendo cada 2–3 minutos. El sofrito está listo cuando el aceite se separa levemente en los bordes y el conjunto brilla.',
    tip: 'La separación del aceite es la señal clave de un sofrito bien reducido. En catalán se llama "a punt" — cuando ves el brillo aceitoso en bordes, tu sofrito está perfecto.',
  },
];

const ERRORS = [
  { icon: '🔥', error: 'Fuego demasiado alto', fix: 'El sofrito se hace a fuego LENTO. Alto = quemado exterior, crudo interior, sin desarrollo de sabor.' },
  { icon: '🧄', error: 'Ajo quemado', fix: 'El ajo va después de la cebolla, nunca al mismo tiempo. Si el ajo amarga, debes empezar desde cero.' },
  { icon: '💦', error: 'Sofrito aguado', fix: 'No tapaste la sartén y redujiste correctamente. Cocina 5 minutos más sin tapa a fuego medio hasta que concentre.' },
  { icon: '⏱️', error: 'Cebolla cruda y astringente', fix: 'No cortaste el proceso. La cebolla necesita mínimo 10 minutos reales a fuego suave para transformarse.' },
];

const RECIPE = {
  name: 'Pollo al Sofrito Mediterráneo',
  description: 'El sofrito que aprendes aquí es la base de este guiso mediterráneo clásico. Domina la base y el resultado se eleva solo.',
  servings: '4 personas',
  time: '55 min',
  difficulty: '⭐⭐⭐',
  ingredients: [
    '4 muslos de pollo (con piel y hueso)',
    '1 cebolla grande en brunoise',
    '4 dientes de ajo picados',
    '1 pimiento rojo en brunoise',
    '1 pimiento verde en brunoise',
    '400 g de tomate triturado natural',
    '150 ml de vino blanco seco',
    '200 ml de caldo de pollo',
    '1 hoja de laurel, tomillo y perejil',
    'Aceite de oliva, sal y pimienta',
  ],
  method: [
    'Salpimenta el pollo. Dora en aceite caliente (fuego alto) 4 minutos por lado hasta piel crujiente. Reserva.',
    'En la misma sartén a fuego medio-bajo, agrega la cebolla con sal. Pocha 12 minutos.',
    'Agrega ajo y pimientos. Cocina 8 minutos más.',
    'Añade el tomate. Reduce 15 minutos hasta sofrito brillante.',
    'Vierte el vino. Sube el fuego y reduce a la mitad (3 min). Agrega el caldo y las hierbas.',
    'Coloca el pollo sobre el sofrito. Tapa y cocina a fuego bajo 25 minutos hasta que el pollo esté tierno.',
    'Sirve con arroz blanco o pan para aprovechar el sofrito.',
  ],
};

export const SofritoLevel = () => (
  <LevelPage
    worldName="Valle del Fuego" worldEmoji="🔥"
    levelNum={5} levelName="Sofrito" levelEmoji="🧄" xpReward={75}
    gradientFrom="from-orange-500" gradientTo="to-red-600"
    accentBg="bg-orange-50" accentBorder="border-orange-200"
    accentText="text-orange-700" accentDark="text-orange-800"
    stepActiveBg="bg-orange-100" stepActiveTxt="text-orange-700"
    btnBg="bg-orange-500 hover:bg-orange-600" btnShadow="shadow-orange-500/30"
    missionText="Preparar un <strong>sofrito base perfecto</strong>: cebolla bien pochada, ajo integrado sin quemar, pimiento suave y tomate reducido a punto brillante. Fotografía el sofrito en la sartén al final."
    missionTags={[
      { icon: '⏱️', label: '~30 min' },
      { icon: '🔥', label: 'Fuego lento' },
    ]}
    steps={STEPS}
    errors={ERRORS}
    recipe={RECIPE}
    challengeHint="Fotografía el sofrito en la sartén cuando el aceite se separe en los bordes. Debe verse brillante y concentrado."
    evaluationCriteria={[
      { stars: '⭐⭐⭐', label: 'Sofrito brillante, concentrado, sin quemar' },
      { stars: '⭐⭐', label: 'Buen color, algo de exceso de agua' },
      { stars: '⭐', label: 'Intentaste, se vea la cebolla pochada' },
    ]}
  />
);
