/** Nivel 9, Mundo 3: Mar de Sabores (Premium). Fondo blanco (receta con pollo). */
import type { LevelContent, LevelError, LevelRecipe, LevelStep } from './types';

const STEPS: LevelStep[] = [
  {
    title: 'Qué es un fondo y por qué importa',
    desc: 'Un fondo blanco (fond blanc) es la base líquida de la cocina clásica francesa. Se hace hirviendo huesos crudos, mirepoix (cebolla, zanahoria, apio) y bouquet garni en agua fría. "Blanco" porque los huesos no se tuestan. El resultado es un caldo claro, delicado y lleno de colágeno.',
    tip: 'El fondo no se sala. Funciona como ingrediente base que luego se reduce y se integra en salsas, risottos y guisos. Si lo salamos, al reducirlo se vuelve insoportablemente salado.',
  },
  {
    title: 'Blanquear los huesos (paso crítico)',
    desc: 'Cubre los huesos de pollo con agua fría. Lleva a hervor. Vas a ver espuma gris-marrón que sube: son las impurezas. Escurre todo, lava los huesos bajo agua fría y limpia la olla. Este "blanqueado" garantiza un fondo limpio y transparente.',
    tip: 'Nunca saltees este paso con huesos de pollo o ternera. Las impurezas del blanqueado se quedan en el fondo si no las eliminas, dando turbidez y sabor metálico.',
  },
  {
    title: 'Mirepoix y bouquet garni',
    desc: 'Corta en mirepoix: 2 partes cebolla, 1 parte zanahoria, 1 parte apio (en trozos de 3–4 cm, no hay que ser preciso). Prepara el bouquet garni: ata en un manojo perejil, tomillo, laurel y puerro. Añade todo a la olla con los huesos limpios y agua fría.',
    tip: 'El mirepoix para fondos no requiere brunoise ni juliana: se desecha al final. Los trozos grandes liberan sus sabores lentamente durante las horas de cocción.',
  },
  {
    title: 'Cocción lenta: temperatura y control',
    desc: 'Lleva a hervor y baja inmediatamente al mínimo. Un buen fondo nunca hierve a borbotones. Debe hacer apenas pequeñas burbujas en superficie (lo que los franceses llaman "frémir"). Cocina sin tapa durante 2–4 horas. Desespuma cada 30 minutos.',
    tip: 'La agitación del hervor fuerte hace que el fondo quede turbio. Las proteínas coaguladas se fragmentan con el movimiento y enturbian el líquido. Con fuego muy bajo, el fondo queda cristalino.',
  },
  {
    title: 'Colar, enfriar y desgrasar',
    desc: 'Cuela a través de colador fino (o manta de cielo/estameña) sin presionar los ingredientes: deja que fluya por gravedad. Enfría rápidamente en baño de hielo. Refrigera: la grasa solidificará en la superficie y podrás retirarla fácilmente con una cuchara.',
    tip: 'El fondo bien hecho gelatiniza al enfriar: eso es el colágeno que extrajiste de los huesos. Un fondo que gelatiniza es señal de calidad y cuerpo. Se conserva 5 días en frío o 3 meses congelado.',
  },
];

const ERRORS: LevelError[] = [
  { icon: '☁️', error: 'Fondo turbio', fix: 'No blanqueaste los huesos, hervor muy fuerte, o presionaste al colar. Parte de cero con huesos blanqueados y fuego muy bajo.' },
  { icon: '🧂', error: 'Fondo muy salado', fix: 'El fondo no se sala nunca. Si lo redujiste con sal, no hay corrección posible.' },
  { icon: '🍖', error: 'Fondo sin cuerpo ni gelatina', fix: 'Usaste poca cantidad de huesos o cocinaste poco tiempo. Usa 1 kg de huesos por litro de agua y mínimo 2 horas.' },
  { icon: '⏰', error: 'Demasiado tiempo de cocción (pollo)', fix: 'El pollo suelta un sabor amargo después de 4 horas. Para ternera puedes llegar a 8 horas. Respeta los tiempos por proteína.' },
];

const RECIPE: LevelRecipe = {
  name: 'Velouté de Pollo (salsa madre con fondo blanco)',
  description: 'El fondo se convierte en salsa Velouté: una de las 5 salsas madre de Escoffier y base de muchas salsas clásicas.',
  servings: '4 personas',
  time: '3–4 horas',
  difficulty: '⭐⭐⭐',
  ingredients: [
    '1 kg de carcasas y alas de pollo',
    '1 cebolla grande cortada en cuartos',
    '2 zanahorias en mirepoix',
    '2 tallos de apio en mirepoix',
    '1 puerro (parte blanca)',
    '1 bouquet garni (laurel, tomillo, perejil)',
    '2.5 litros de agua fría',
    '(Para Velouté) 60g mantequilla + 60g harina + 500ml fondo',
  ],
  method: [
    'Blanquea los huesos: cubre con agua fría, hierve 5 min, escurre y lava.',
    'Coloca huesos limpios, vegetales y agua fría en olla grande. Lleva a hervor.',
    'Baja al mínimo. Desespuma. Cocina a fuego muy bajo 3 horas sin tapa.',
    'Cuela sin presionar. Enfría en baño de hielo. Refrigera y desgrasa.',
    '(Velouté) Derrite mantequilla, agrega harina, cocina el roux 2 min.',
    'Agrega fondo caliente poco a poco batiendo hasta conseguir salsa suave y brillante.',
  ],
};

export const content: LevelContent = {
  missionText: 'Preparar un <strong>fondo blanco de pollo</strong> transparente y gelatinoso. El fondo debe quedar claro (no turbio) y gelatinizar al enfriar. Fotografía el fondo en un vaso transparente para ver su claridad.',
  missionTags: ['3–4 horas', 'Fuego muy bajo'],
  steps: STEPS,
  errors: ERRORS,
  recipe: RECIPE,
  challengeHint: 'Vierte el fondo en un vaso transparente y fotografía. Debe verse claro y dorado-pálido. Si gelatinizó en frío, muéstralo cortado con una cuchara.',
  evaluationCriteria: [
    { stars: '⭐⭐⭐', label: 'Transparente, dorado, gelatinizado' },
    { stars: '⭐⭐', label: 'Claro, buen aroma, sin gelatina' },
    { stars: '⭐', label: 'Algo turbio pero con sabor' },
  ],
};
