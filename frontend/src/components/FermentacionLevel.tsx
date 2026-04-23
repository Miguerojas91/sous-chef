/** FermentacionLevel.tsx — Nivel 15, Mundo 4: Pico del Maestro (Premium). Fermentación y masa madre. */
import { LevelPage } from './LevelPage';

const STEPS = [
  {
    num: 1, title: 'La magia de la fermentación: lactobacilos', emoji: '🦠',
    desc: 'La fermentación es uno de los procesos más antiguos del ser humano. Las bacterias lácticas (lactobacilos) convierten azúcares en ácido láctico, lo que preserva el alimento, desarrolla sabores complejos y aumenta la biodisponibilidad de nutrientes. Pan, queso, yogur, kimchi, miso — todo es fermentación.',
    tip: 'La fermentación NO es pudrir. Es transformar. Un kimchi bien fermentado es más nutritivo que el repollo crudo. Los probióticos naturales de la fermentación son la razón por la que los alimentos fermentados son tan saludables.',
  },
  {
    num: 2, title: 'El ambiente: sal, tiempo y temperatura', emoji: '🌡️',
    desc: 'La sal es el regulador: demasiado poca = fermentación caótica con bacterias no deseadas. Demasiada = inhibe todo. Para vegetales, usa 2–3% de sal en peso del vegetal (20–30g/kg). La temperatura 18–22°C es ideal. Más frío = más lento. Más caliente = demasiado rápido y ácido.',
    tip: 'Un termómetro de ambiente es vital. En verano, fermenta en lugar fresco. En invierno, un armario cerrado mantiene temperatura. La oscuridad también ayuda — la luz UV puede afectar las bacterias.',
  },
  {
    num: 3, title: 'Preparar el chucrut: corte y salado', emoji: '🥬',
    desc: 'Corta el repollo en chiffonade fino (2–3mm). Pesa y calcula el 2% de sal (20g por kilo). Mezcla el repollo con la sal en un bowl grande y amasa con fuerza durante 10 minutos hasta que el repollo libere suficiente líquido para cubrirse a sí mismo.',
    tip: 'El amasado es la extracción de jugo por presión osmótica. Ese jugo es la salmuera natural. Si después de 10 minutos de amasado no hay suficiente líquido para cubrir el repollo, agrega salmuera al 2% (20g sal / litro de agua).',
  },
  {
    num: 4, title: 'Envasar y pesar: mantener bajo el líquido', emoji: '🫙',
    desc: 'Transfiere el repollo masado a un frasco de vidrio limpio, empacando con fuerza para eliminar el aire. El repollo DEBE quedar completamente sumergido en su propio líquido. Coloca un peso (bolsa pequeña de agua salada, piedra limpia o frasco más pequeño) para mantenerlo bajo.',
    tip: 'Si el repollo flota y queda expuesto al aire, se enmohece en la superficie. El líquido salino crea el ambiente anaeróbico donde solo prosperan los lactobacilos. Sin oxígeno = sin moho.',
  },
  {
    num: 5, title: 'Fermentar, descargar gas y probar', emoji: '⏳',
    desc: 'Tapa ligeramente (no hermético) o usa una tapa con válvula de gas. Fermenta a temperatura ambiente 5–7 días. Cada 24 horas "descarga" el gas presionando el repollo hacia abajo. Prueba desde el día 3. El buen chucrut: ácido, crujiente, fresco — no agrio-amargo ni blando.',
    tip: 'Si ves moho blanco en la superficie, retíralo con cuchara limpia. El moho blanco en la superficie es normal si el repollo quedó expuesto. El chucrut de abajo sigue siendo seguro. Moho negro/verde = tira todo.',
  },
];

const ERRORS = [
  { icon: '🤢', error: 'Olor podrido o amoniaca', fix: 'Demasiado poca sal o temperatura demasiado alta. Bacterias no deseadas tomaron el control. Comienza de nuevo con más sal.' },
  { icon: '🫧', error: 'Repollo blando y no crujiente', fix: 'Fermentación a temperatura muy alta o tiempo excesivo. Prueba desde el día 3 para encontrar tu punto ideal.' },
  { icon: '❌', error: 'No hay actividad (sin burbujear)', fix: 'Temperatura demasiado baja (menos de 16°C) o demasiada sal que inhibió las bacterias. Lleva a lugar más cálido.' },
  { icon: '🟢', error: 'Moho negro o verde', fix: 'El repollo estaba expuesto al aire. No es recuperable. Para la próxima: asegúrate de que el repollo esté completamente sumergido.' },
];

const RECIPE = {
  name: 'Chucrut Clásico Casero + Kimchi de Repollo',
  description: 'El chucrut es el punto de partida de la fermentación. Una vez que lo dominas, el kimchi, el kvass y los vegetales fermentados en general son naturales. Misma técnica, distintos sabores.',
  servings: '1 frasco 1L',
  time: '5–7 días',
  difficulty: '⭐⭐',
  ingredients: [
    '1 repollo mediano (~1 kg)',
    '20g de sal marina sin yodo (2%)',
    '(Opcional para kimchi) 2 cdas pasta gochujang',
    '(Kimchi) 3 dientes de ajo rallado',
    '(Kimchi) 1 trocito de jengibre rallado ',
    '(Kimchi) 3 cebolletas picadas',
    '(Kimchi) 1 cdta azúcar de coco',
    'Frasco de vidrio esterilizado de 1L',
  ],
  method: [
    'Corta el repollo en chiffonade fino. Reserva 1–2 hojas enteras para tapar al final.',
    'Pesa el repollo. Calcula el 2% en sal. Mezcla y amasa 10 minutos vigorosamente.',
    'Cuando veas abundante líquido, transfiere al frasco compactando bien.',
    'Coloca las hojas reservadas encima como barrera. Pesa con frasco pequeño con agua.',
    '(Kimchi) Antes de envasar, mezcla el repollo con los ingredientes de kimchi.',
    'Fermenta 5–7 días a temperatura ambiente. Prueba cada día desde el tercero.',
  ],
};

export const FermentacionLevel = () => (
  <LevelPage
    worldName="Pico del Maestro" worldEmoji="🏔️"
    levelNum={15} levelName="Fermentación" levelEmoji="🍞" xpReward={150}
    gradientFrom="from-violet-500" gradientTo="to-purple-700"
    accentBg="bg-violet-50" accentBorder="border-violet-200"
    accentText="text-violet-700" accentDark="text-violet-800"
    stepActiveBg="bg-violet-100" stepActiveTxt="text-violet-700"
    btnBg="bg-violet-500 hover:bg-violet-600" btnShadow="shadow-violet-500/30"
    missionText="Preparar un <strong>chucrut casero fermentado</strong>: repollo completamente sumergido, sin moho (o solo moho blanco superficial retirado), con sabor ácido y textura crujiente. Fotografía el frasco y una pequeña muestra del día 5."
    missionTags={[
      { icon: '📅', label: '5–7 días' },
      { icon: '🦠', label: '2% sal en peso' },
    ]}
    steps={STEPS}
    errors={ERRORS}
    recipe={RECIPE}
    challengeHint="Fotografía el frasco con el chucrut visible AND una pequeña cantidad en un plato mostrando el color y textura después de la fermentación."
    evaluationCriteria={[
      { stars: '⭐⭐⭐', label: 'Ácido, crujiente, buen color, sin moho' },
      { stars: '⭐⭐', label: 'Fermentó correctamente, algo blando' },
      { stars: '⭐', label: 'Proceso iniciado, visible actividad' },
    ]}
  />
);
