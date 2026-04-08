import { LevelPage } from './LevelPage';

const STEPS = [
  {
    num: 1, title: 'Selecciona y lava las hojas', emoji: '🌿',
    desc: 'Elige hojas grandes y flexibles: albahaca, espinaca, menta o col. Lávalas con agua fría y sécalas muy bien. Las hojas mojadas se adhieren al cuchillo y hacen oxidar el corte más rápido. Seca con papel absorbente o centrifugadora.',
    tip: 'La albahaca es el vegetal más delicado para chiffonade. Se oxida rápidamente al contacto con el aire. Siempre corta en el último momento y no refrigeres después de cortar.',
  },
  {
    num: 2, title: 'Apila las hojas en orden de tamaño', emoji: '📚',
    desc: 'Pon las hojas más grandes abajo y las más pequeñas arriba. Áplastalas suavemente para que queden bien alineadas. El apilado correcto garantiza que todos los cortes tengan el mismo ancho al final.',
    tip: 'Trabaja con máximo 6–8 hojas apiladas. Más que eso pierdes control y la pila se desliza. Si las hojas son muy grandes, dobla por la mitad a lo largo antes de apilar.',
  },
  {
    num: 3, title: 'Enrolla las hojas como un cigarro', emoji: '🌀',
    desc: 'Enrolla el apilado de hojas apretadamente desde un lado, formando un cilindro compacto. El rollo debe ser firme — cuanto más apretado, más finas y uniformes saldrán las tiras. Sostén el rollo con la garra de gato.',
    tip: 'En chiffonade profesional el rollo es la clave. Si el rollo está flojo y se desarma, las tiras salen irregulares. Practica el enrollado antes de pasar al corte.',
  },
  {
    num: 4, title: 'Corta el rollo en tiras finas', emoji: '🔪',
    desc: 'Coloca el rollo en la tabla con la costura hacia abajo. Con el cuchillo bien afilado, corta con movimiento de balanceo de talón a punta (no de sierra), en rebanadas de 1–3 mm de ancho. Tiras finas = chiffonade fino. 5–6 mm = chiffonade grueso.',
    tip: 'Mueve el cuchillo siempre adelante y atrás, no de arriba abajo. El corte de balanceo mantiene el filo en contacto constante y produce tiras más limpias sin magullar la hoja.',
  },
  {
    num: 5, title: 'Separa y esponja las tiras', emoji: '✨',
    desc: 'Pasa los dedos por las tiras para separarlas con suavidad. Las tiras deben ser largas, finas, uniformes y rizadas naturalmente. Si las hojas se apelmazan, las tiras son demasiado anchas o el rollo estaba muy flojo.',
    tip: 'Usa el chiffonade inmediatamente: como garnish, en ensaladas, sobre sopas o cremas. Las tiras de albahaca en chiffonade sobre una bruschetta o pizza margarita es el uso clásico.',
  },
];

const ERRORS = [
  { icon: '🟫', error: 'Hojas oxidadas/marrones', fix: 'Corta con cuchillo muy afilado en el último momento. El filo romo magulla las células y acelera la oxidación.' },
  { icon: '📎', error: 'Tiras pegadas entre sí', fix: 'Asegúrate de que las hojas estén perfectamente secas antes de enrollar.' },
  { icon: '↔️', error: 'Tiras de diferente ancho', fix: 'Mantén el rollo más firme y mueve el cuchillo a intervalos exactos. Practica el ojo midiendo.' },
  { icon: '🔄', error: 'El rollo se deshace al cortar', fix: 'Envuelve más apretado y sostén el rollo con la parte más ancha de la garra de gato.' },
];

const RECIPE = {
  name: 'Pasta al Pesto con Chiffonade de Albahaca',
  description: 'El pesto auténtico requiere albahaca fresca, y el chiffonade es la guarnición perfecta para el plato final. Un clásico genovés que muestra tu técnica.',
  servings: '2 personas',
  time: '30 min',
  difficulty: '⭐⭐',
  ingredients: [
    '160 g de espagueti o linguini',
    '40 g de hojas de albahaca fresca (para pesto)',
    '20 g chiffonade de albahaca (para garnish)',
    '30 g de piñones tostados',
    '50 g de queso parmesano rallado fresco',
    '1 diente de ajo pequeño',
    '80 ml de aceite de oliva extra virgen (frío)',
    'Sal gruesa y pimienta negra',
    'Agua de cocción reservada',
  ],
  method: [
    'Tuesta los piñones en sartén seca a fuego bajo 3 min. Reserva y deja enfriar.',
    'En licuadora: albahaca, piñones, ajo, parmesano y aceite. Tritura hasta obtener pasta verde brillante. Ajusta de sal.',
    'Cocina la pasta en agua con mucha sal hasta al dente. Reserva 100 ml del agua de cocción.',
    'Mezcla la pasta caliente con el pesto fuera del fuego. Agrega agua de cocción cucharada a cucharada hasta obtener la consistencia deseada.',
    'Sirve de inmediato con chiffonade de albahaca encima, piñones adicionales y un hilo de aceite de oliva.',
  ],
};

export const ChiffonadeLevel = () => (
  <LevelPage
    worldName="Isla del Cuchillo" worldEmoji="🔪"
    levelNum={3} levelName="Chiffonade" levelEmoji="🌿" xpReward={50}
    gradientFrom="from-emerald-500" gradientTo="to-teal-600"
    accentBg="bg-emerald-50" accentBorder="border-emerald-200"
    accentText="text-emerald-700" accentDark="text-emerald-800"
    stepActiveBg="bg-emerald-100" stepActiveTxt="text-emerald-700"
    btnBg="bg-emerald-500 hover:bg-emerald-600" btnShadow="shadow-emerald-500/30"
    missionText="Cortar <strong>un manojo de albahaca o espinacas</strong> en chiffonade <strong>uniforme y fino</strong>: tiras de 1–2 mm de ancho, sin magullar ni oxidar las hojas. Fotografía el resultado esponjado sobre la tabla."
    missionTags={[
      { icon: '⏱️', label: '~15 min' },
      { icon: '📏', label: '1–3 mm de ancho' },
    ]}
    steps={STEPS}
    errors={ERRORS}
    recipe={RECIPE}
    challengeHint="Esponja el chiffonade sobre fondo blanco o tabla limpia. La foto debe mostrar tiras finas y uniformes, sin oscurecimiento."
    evaluationCriteria={[
      { stars: '⭐⭐⭐', label: 'Tiras finas y uniformes, sin oxidar' },
      { stars: '⭐⭐', label: 'Tiras regulares, algo de variación' },
      { stars: '⭐', label: 'Intentaste, tiras anchas o irregulares' },
    ]}
  />
);
