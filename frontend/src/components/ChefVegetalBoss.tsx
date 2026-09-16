/** Jefe del nivel 4 (Isla del Cuchillo): juliana, brunoise y chiffonade en un mismo reto. */
import { BossPage } from './BossPage';
import type { BossRecipe } from './BossPage';

const CHALLENGES = [
  {
    id: 1, emoji: '🥕', name: 'Juliana de Zanahoria',
    desc: 'Corta una zanahoria entera en juliana: bastones de 3 mm × 3 mm × 6 cm.',
    eval: 'Uniformidad de bastones y longitud constante.',
  },
  {
    id: 2, emoji: '🧅', name: 'Brunoise de Cebolla',
    desc: 'Corta media cebolla en brunoise: cubos de 2 a 3 mm, todos del mismo tamaño.',
    eval: 'Todos los cubos del mismo tamaño, sin irregularidades.',
  },
  {
    id: 3, emoji: '🌿', name: 'Chiffonade de Albahaca',
    desc: 'Corta 10 hojas de albahaca fresca en chiffonade fino de 1 a 2 mm.',
    eval: 'Tiras finas y uniformes, sin oxidar ni magullar.',
  },
  {
    id: 4, emoji: '🥦', name: 'Trofeo del Chef Vegetal',
    desc: 'Fotografía los tres cortes juntos en la misma tabla: juliana, brunoise y chiffonade.',
    eval: 'Presentación clara, los tres cortes visibles y diferenciados.',
  },
];

const TIPS = [
  'El Chef Vegetal mira cada corte de cerca: un milímetro de diferencia se nota en la foto.',
  'El tiempo de preparación también se valora. Organiza tu mise en place antes de empezar.',
  'Un cuchillo sin filo es tu peor enemigo aquí. Afila antes de empezar.',
  'La presentación final en la tabla es tu carta de presentación. Limpia la tabla antes de fotografiar.',
];

const RECIPE: BossRecipe = {
  name: 'Jardinière de Légumes',
  emoji: '🥗',
  servings: '2 personas',
  time: '35 min',
  difficulty: '★★☆ Intermedio',
  ingredients: [
    '2 zanahorias medianas',
    '1 nabo pequeño',
    '1 calabacín joven',
    '100 g judías verdes',
    '1 puerro (parte blanca)',
    '30 g mantequilla',
    '1 ramita tomillo fresco',
    '150 ml fondo de pollo',
    'Sal y pimienta blanca',
    '1 cdta azúcar (para glasear)',
  ],
  steps: [
    'Corta la zanahoria y el nabo en juliana fina (3 × 3 × 60 mm). Corta el puerro en chiffonade y el calabacín en brunoise de 3 mm.',
    'Blanquea cada verdura por separado en agua hirviendo con sal: zanahoria 3 min, nabo 2 min, judías 2 min, calabacín 1 min. Enfría en agua con hielo.',
    'En un sauté, derrite la mantequilla a fuego medio. Glasea la zanahoria y el nabo con el azúcar y el fondo de pollo hasta que el líquido reduzca a napa.',
    'Añade el puerro, el calabacín y las judías. Saltea 1 minuto, ajusta de sal y pimienta.',
    'Retira el tomillo. Emplata distribuyendo cada verdura en secciones diferenciadas para que los tres cortes sean visibles.',
  ],
  plating: 'Usa un aro de 8 cm: juliana en base, brunoise en el centro, chiffonade encima como corona. Un hilo de mantequilla glaseada alrededor. Garnish: brote de guisante o flor de tomillo.',
};

export const ChefVegetalBoss = () => (
  <BossPage
    bossName="Chef Vegetal"
    bossEmoji="🥦"
    bossSubtitle="Guardián de la Isla del Cuchillo"
    levelNum={4}
    worldName="Isla del Cuchillo"
    worldEmoji="🔪"
    xpReward={200}
    world={1}
    quote="Juliana, brunoise y chiffonade en la misma tabla. Si los bastones, los cubos y las tiras salen parejos, te abro el paso al Valle del Fuego."
    requirement="Requisito: juliana, brunoise y chiffonade"
    nextWorld="Valle del Fuego desbloqueado"
    victoryDesc="Bastones de 3 mm, cubos parejos y albahaca sin magullar. El Chef Vegetal aprueba tu tabla."
    returnLabel="Volver al mapa"
    challenges={CHALLENGES}
    tips={TIPS}
    mainRecipe={RECIPE}
  />
);
