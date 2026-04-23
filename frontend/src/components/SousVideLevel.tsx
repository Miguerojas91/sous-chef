/** SousVideLevel.tsx — Nivel 13, Mundo 4: Pico del Maestro (Premium). Cocción sous-vide y pasteurización. */
import { LevelPage } from './LevelPage';

const STEPS = [
  {
    num: 1, title: 'Qué es sous-vide y por qué cambia todo', emoji: '🌡️',
    desc: 'Sous-vide ("bajo vacío" en francés) es una técnica donde el alimento se sella al vacío en una bolsa y se cocina en agua a temperatura precisamente controlada. La temperatura exacta garantiza cocción perfecta de centro a borde, sin margen de error.',
    tip: 'Con sous-vide, un filete a 54°C durante 2 horas estará en término medio-rojo perfecto de centro a borde. Es imposible sobrecocinar porque el agua nunca sube de esa temperatura.',
  },
  {
    num: 2, title: 'Equipamiento básico: circulador y sellado', emoji: '⚙️',
    desc: 'Necesitas un circulador de inmersión (sous-vide stick) o una olla con control de temperatura. Para el sellado: una bolsa ziploc con método de desplazamiento de agua funciona perfectamente si no tienes selladora al vacío. El objetivo es eliminar el aire.',
    tip: 'Truco del desplazamiento: llena un recipiente con agua, introduce la bolsa con el alimento y ciérrala justo antes de que el borde toque el agua. La presión expulsa casi todo el aire. 95% eficiente.',
  },
  {
    num: 3, title: 'Temperatura y tiempo: la tabla de sous-vide', emoji: '📊',
    desc: 'La temperatura determina la textura final; el tiempo, la terneza. Huevo a 63°C = yema líquida pero clara cuajada. Pollo a 60°C = jugoso pero pasteurizado. Salmón a 52°C = sedoso y mantecoso. Cada proteína tiene su punto ideal y es ciencia, no intuición.',
    tip: 'La tabla de temperaturas sous-vide es tu nuevo mejor amigo. A diferencia de la cocina convencional donde "más tiempo = más seco", en sous-vide dentro del rango correcto el tiempo no seca la proteína.',
  },
  {
    num: 4, title: 'Sazonar correctamente para bolsa', emoji: '🧂',
    desc: 'La sal para sous-vide funciona diferente: con tiempo prolongado, la sal extrae jugo que luego se reabsorbe. Para carnes de larga cocción (más de 4h), sala justo antes de cocinar, con menos cantidad. Agrega aromáticos directamente a la bolsa: ajo, hierbas, mantequilla.',
    tip: 'Evita ajo crudo entero en cocciones muy largas (más de 6h) — puede generar sabores amargos. Usa ajo en polvo o confitado. Las hierbas frescas intensifican mucho más en sous-vide que en cocina convencional.',
  },
  {
    num: 5, title: 'El sellado final: Maillard post sous-vide', emoji: '🔥',
    desc: 'El sous-vide garantiza la cocción interna perfecta, pero la proteína no tiene costra ni Maillard. Después de sacarlo de la bolsa, seca completamente la superficie y dora en sartén o soplete muy caliente durante 45–60 segundos por lado. Mínimo tiempo = no subir la temperatura interna.',
    tip: 'El sellado post sous-vide debe ser RÁPIDO. La proteína ya está cocinada — solo necesitas la costra Maillard. Sartén o plancha al máximo. Si tardas más de 90 segundos por lado, estás sobrecocinando el interior.',
  },
];

const ERRORS = [
  { icon: '🌊', error: 'Bolsa flotante', fix: 'El aire atrapado hace que la bolsa flote y el alimento no se cocine uniformemente. Desplaza mejor el aire o usa pesos.' },
  { icon: '⏰', error: 'Temperatura incorrecta', fix: 'No improvises las temperaturas. Usa tablas de referencia. 1°C de diferencia en sous-vide cambia completamente la textura.' },
  { icon: '💦', error: 'Costra gris post sellado', fix: 'La superficie no estaba seca al sellar. El vapor impide el Maillard. Seca con papel muy bien antes del sellado.' },
  { icon: '🤢', error: 'Sabor metálico o extraño', fix: 'Verifica que usas bolsas aptas para sous-vide (BPA-free). Bolsas no aptas pueden liberar compuestos a altas temperaturas.' },
];

const RECIPE = {
  name: 'Salmón Sous-Vide con Beurre Blanc',
  description: 'El salmón sous-vide a 52°C durante 30 minutos produce una textura sedosa, casi mantecosa, imposible de lograr de otra manera. La beurre blanc complementa con elegancia.',
  servings: '2 personas',
  time: '45 min (30 min sous-vide)',
  difficulty: '⭐⭐⭐',
  ingredients: [
    '2 lomos de salmón de 150g (sin piel)',
    '20g de mantequilla fría',
    '2 ramas de eneldo fresco',
    'Sal, pimienta y limón',
    '(Para beurre blanc) 100ml vino blanco + 2 chalotas + 150g mantequilla fría',
    'Aceite de girasol para sellar',
  ],
  method: [
    'Precalienta el circluador a 52°C. Salpimenta el salmón ligeramente.',
    'Coloca en bolsa con mantequilla fría y eneldo. Elimina el aire.',
    'Sumerge en agua a 52°C durante 30 minutos exactos.',
    'Para beurre blanc: reduce vino con chalotas hasta 2 cucharadas. Fuera del fuego, incorpora mantequilla fría en cubos batiendo.',
    'Saca el salmón de la bolsa. Seca muy bien. Sella en sartén muy caliente 45 seg cada lado.',
    'Sirve inmediatamente sobre la beurre blanc.',
  ],
};

export const SousVideLevel = () => (
  <LevelPage
    worldName="Pico del Maestro" worldEmoji="🏔️"
    levelNum={13} levelName="Sous-Vide" levelEmoji="🌡️" xpReward={150}
    gradientFrom="from-violet-500" gradientTo="to-purple-700"
    accentBg="bg-violet-50" accentBorder="border-violet-200"
    accentText="text-violet-700" accentDark="text-violet-800"
    stepActiveBg="bg-violet-100" stepActiveTxt="text-violet-700"
    btnBg="bg-violet-500 hover:bg-violet-600" btnShadow="shadow-violet-500/30"
    missionText="Preparar una <strong>proteína sous-vide</strong> a la temperatura correcta y sellarla con costra Maillard. Fotografía la pieza cortada para mostrar el interior de cocción perfecta."
    missionTags={[
      { icon: '🌡️', label: 'Temperatura exacta' },
      { icon: '⏱️', label: '30–120 min' },
    ]}
    steps={STEPS}
    errors={ERRORS}
    recipe={RECIPE}
    challengeHint="Fotografía la proteína cortada por la mitad mostrando el interior de cocción perfecta y la costra dorada exterior."
    evaluationCriteria={[
      { stars: '⭐⭐⭐', label: 'Interior perfecto, costra Maillard, no seco' },
      { stars: '⭐⭐', label: 'Buen interior, algo de costra' },
      { stars: '⭐', label: 'Sous-vide intentado con resultado visible' },
    ]}
  />
);
