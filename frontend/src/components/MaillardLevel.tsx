/** Nivel 6, Mundo 2: Valle del Fuego. Reacción de Maillard y sellado de carnes. */
import { LevelPage } from './LevelPage';

const STEPS = [
  {
    num: 1, title: 'Comprende la reacción: qué es Maillard', emoji: '🔬',
    desc: 'La reacción de Maillard ocurre entre 140–165 °C entre aminoácidos y azúcares. Produce los compuestos de sabor, aroma y color que asociamos con carne asada, pan tostado y café. Sin ese dorado, la carne queda gris y sin sabor a asado.',
    tip: 'Maillard y caramelización son distintas: la caramelización solo involucra azúcares y Maillard ocurre entre proteínas y azúcares. Por eso ocurre en carne, pan y huevo, no solo en dulces.',
  },
  {
    num: 2, title: 'Prepara la proteína: seca y salpimenta', emoji: '🥩',
    desc: 'Saca la carne del refrigerador 30 minutos antes. Sécala por completo con papel absorbente: la humedad en la superficie genera vapor que impide el Maillard. El vapor cuece, no dora. Salpimenta justo antes de cocinar.',
    tip: 'Es el error más común: si la proteína entra húmeda a la sartén, suelta vapor y queda gris, sin costra. La costra solo ocurre cuando la superficie está seca y la temperatura es alta.',
  },
  {
    num: 3, title: 'La sartén: temperatura muy alta', emoji: '🌡️',
    desc: 'Usa una sartén de hierro fundido o acero inoxidable grueso, nunca antiadherente a fuego alto. Calienta la sartén vacía a fuego alto durante 3–4 minutos. Añade aceite de punto de humo alto (canola, girasol o ghee). Espera 30 segundos más, hasta que el aceite brille y humee levemente.',
    tip: 'La prueba de la gota de agua: agrega una gota al sartén caliente. Si baila y desaparece en 2 segundos (efecto Leidenfrost), la sartén está lista para Maillard.',
  },
  {
    num: 4, title: 'Dorar: coloca y no muevas', emoji: '🍳',
    desc: 'Coloca el filete y no lo muevas durante 2–3 minutos. Si intentas levantarlo y resiste, no está listo: se suelta solo cuando la costra se forma. Una vez dorado, notarás que se despega fácilmente. Voltea una sola vez. Dora el otro lado igual.',
    tip: 'El "sizzle" (chisporroteo) al agregar la proteína debe ser intenso y fuerte. Si es suave, la sartén está fría y la carne se está cociendo, no dorando.',
  },
  {
    num: 5, title: 'Acabado y reposo', emoji: '⏸️',
    desc: 'Al final, agrega mantequilla fría con ajo y hierbas. Inclina la sartén y baña la carne con la mantequilla espumosa durante 60 segundos. Retira del fuego y deja reposar 5 minutos. El reposo redistribuye los jugos y completa la cocción interna.',
    tip: 'Si cortas de inmediato, los jugos se derraman en el plato. Si reposas, se redistribuyen y cada bocado queda jugoso. Esos 5 minutos se notan.',
  },
];

const ERRORS = [
  { icon: '💧', error: 'Carne gris sin costra', fix: 'La proteína estaba húmeda o el sartén frío. Siempre seca completamente y precalienta bien el sartén.' },
  { icon: '🔄', error: 'Mover la carne constantemente', fix: 'Coloca y olvida. Moverla evita la formación de la costra de Maillard y enfría el sartén.' },
  { icon: '🌡️', error: 'Temperatura insuficiente', fix: 'Usa fuego muy alto. Maillard requiere 140°C mínimo en la superficie. Un sartén antiadherente no aguanta estas temperaturas.' },
  { icon: '⏰', error: 'No reposar la carne', fix: 'Sin reposo, todos los jugos salen al cortar. 5 minutos mínimo para piezas gruesas, 2 minutos para delgadas.' },
];

const RECIPE = {
  name: 'Filete de Res al Punto con Mantequilla de Hierbas',
  description: 'Maillard aplicado a un filete: costra intensa, interior jugoso. Esta técnica aplica a cualquier proteína: pollo, cerdo, pescado, tofu.',
  servings: '2 personas',
  time: '20 min',
  difficulty: '⭐⭐⭐',
  ingredients: [
    '2 filetes de res de 2 cm de grosor (ribeye o NY strip)',
    '2 cucharadas de aceite de girasol o canola',
    '50 g de mantequilla sin sal fría',
    '3 dientes de ajo aplastados (con piel)',
    '3 ramas de tomillo fresco',
    '2 ramas de romero fresco',
    'Sal gruesa y pimienta negra recién molida',
  ],
  method: [
    'Saca los filetes 30 min antes. Sécalos muy bien. Salpimenta generosamente en ambos lados justo antes de cocinar.',
    'Precalienta una sartén de hierro a fuego muy alto durante 4 minutos.',
    'Agrega el aceite. Espera 30 segundos. Coloca los filetes con cuidado.',
    'No los muevas durante 3 min. Voltea una vez. Cocina 3 más (término medio).',
    'Baja el fuego a medio. Agrega mantequilla, ajo y hierbas. Inclina la sartén y baña la carne 60 segundos.',
    'Retira. Reposa 5 minutos en tabla. Sirve con el jugo del reposo y mantequilla de hierbas.',
  ],
};

export const MaillardLevel = () => (
  <LevelPage
    missionText="Dorar una proteína (carne, pollo o incluso tofu) con <strong>costra Maillard pareja</strong>: color marrón dorado uniforme, crujiente al tacto, sin zonas grises. Fotografía la pieza en la sartén o en el plato."
    missionTags={[
      { icon: '⏱️', label: '~20 min' },
      { icon: '🌡️', label: '140-165°C' },
    ]}
    steps={STEPS}
    errors={ERRORS}
    recipe={RECIPE}
    challengeHint="Fotografía la costra dorada de cerca. Debe verse color caoba uniforme, brillante por la mantequilla, sin partes grises."
    evaluationCriteria={[
      { stars: '⭐⭐⭐', label: 'Costra uniforme, color caoba, sin gris' },
      { stars: '⭐⭐', label: 'Buen dorado en zonas, algo de gris' },
      { stars: '⭐', label: 'Intentaste, hay color aunque irregular' },
    ]}
  />
);
