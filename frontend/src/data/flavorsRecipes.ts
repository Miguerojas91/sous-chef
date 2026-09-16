/** Catálogo de Sabores del Mundo: regiones, países y recetas. */

export type Difficulty = 'Básico' | 'Intermedio' | 'Difícil';
export type RegionName = 'América' | 'Europa' | 'Asia';

export interface Recipe {
  name: string;
  technique: string;
  difficulty: Difficulty;
  time: string;
  ingredients: string[];
  description: string;
}

export interface Country {
  name: string;
  flag: string;
  recipes: Recipe[];
}

export interface Region {
  name: RegionName;
  countries: Country[];
}

export const REGIONS: Region[] = [
  {
    name: 'América',
    countries: [
      {
        name: 'Colombia', flag: '🇨🇴',
        recipes: [
          {
            name: 'Bandeja Paisa',
            technique: 'Mixto', difficulty: 'Difícil', time: '3h',
            ingredients: ['frijoles rojos', 'chicharrón', 'carne molida', 'chorizo', 'morcilla', 'arroz', 'huevo', 'aguacate', 'plátano maduro', 'harina de maíz precocida', 'tomate chonto', 'cebolla larga'],
            description: 'Plato típico de Antioquia. Frijoles, arroz, carne molida, chicharrón, chorizo, morcilla, huevo, plátano maduro, aguacate y arepa servidos en una sola bandeja.',
          },
          {
            name: 'Ajiaco Bogotano',
            technique: 'Caldo', difficulty: 'Intermedio', time: '2h',
            ingredients: ['papa criolla', 'papa pastusa', 'papa sabanera', 'pollo', 'mazorca', 'guascas', 'crema de leche', 'alcaparras', 'cilantro'],
            description: 'Sopa bogotana de pollo con tres tipos de papa: la criolla se deshace y espesa el caldo. Las guascas le dan su sabor herbal. Se sirve con crema, alcaparras y mazorca.',
          },
          {
            name: 'Arepa con Hogao',
            technique: 'Plancha', difficulty: 'Básico', time: '30m',
            ingredients: ['masa de maíz precocida', 'sal', 'agua', 'tomate', 'cebolla larga', 'aceite', 'comino'],
            description: 'Arepa de maíz dorada en plancha, servida con hogao casero de tomate y cebolla larga.',
          },
        ],
      },
      {
        name: 'Ecuador', flag: '🇪🇨',
        recipes: [
          {
            name: 'Seco de Pollo Ecuatoriano',
            technique: 'Estofado', difficulty: 'Intermedio', time: '1h 30m',
            ingredients: ['pollo', 'cerveza', 'cebolla', 'tomate', 'pimiento', 'ajo', 'naranjilla', 'cilantro', 'comino', 'achiote', 'arroz'],
            description: 'Guiso ecuatoriano de pollo cocinado lentamente en cerveza y naranjilla. El achiote le da el color dorado.',
          },
          {
            name: 'Llapingachos',
            technique: 'Sartén', difficulty: 'Básico', time: '45m',
            ingredients: ['papa', 'queso fresco', 'cebolla larga', 'mantequilla', 'achiote', 'maní', 'leche', 'ajo'],
            description: 'Tortillas de papa rellenas de queso, doradas en mantequilla con achiote. Acompañadas de salsa de maní y chorizo.',
          },
          {
            name: 'Caldo de Bolas de Verde',
            technique: 'Caldo', difficulty: 'Difícil', time: '2h',
            ingredients: ['plátano verde', 'carne de res', 'cerdo', 'maíz', 'yuca', 'zanahoria', 'cebolla', 'ajo', 'comino', 'cilantro', 'maní'],
            description: 'Caldo ecuatoriano de res con maíz y yuca, en el que se cocinan bolas de plátano verde rellenas de carne.',
          },
        ],
      },
      {
        name: 'Argentina', flag: '🇦🇷',
        recipes: [
          {
            name: 'Asado Argentino',
            technique: 'Parrilla', difficulty: 'Intermedio', time: '3h',
            ingredients: ['tira de asado', 'vacío', 'chorizo', 'morcilla', 'sal gruesa', 'perejil', 'ajo', 'orégano', 'vinagre', 'aceite de oliva'],
            description: 'Tira de asado y vacío a la parrilla, con chorizo, morcilla y chimichurri casero de perejil, ajo y orégano.',
          },
          {
            name: 'Empanadas Criollas',
            technique: 'Horneado', difficulty: 'Intermedio', time: '2h',
            ingredients: ['harina', 'manteca', 'carne molida', 'cebolla', 'pimiento rojo', 'huevo duro', 'aceitunas', 'pasas', 'comino', 'pimentón dulce'],
            description: 'Empanadas horneadas de carne con cebolla, huevo duro y aceitunas, cerradas con el repulgue tradicional.',
          },
          {
            name: 'Dulce de Leche Casero',
            technique: 'Reducción', difficulty: 'Básico', time: '2h',
            ingredients: ['leche entera', 'azúcar', 'bicarbonato', 'esencia de vainilla'],
            description: 'Leche y azúcar reducidos a fuego lento hasta tomar color caramelo y textura untable. En Argentina es la base de alfajores y muchos postres.',
          },
        ],
      },
    ],
  },
  {
    name: 'Europa',
    countries: [
      {
        name: 'Francia', flag: '🇫🇷',
        recipes: [
          {
            name: 'Boeuf Bourguignon',
            technique: 'Braseado', difficulty: 'Difícil', time: '4h',
            ingredients: ['res chuck', 'vino tinto Borgoña', 'tocino', 'champiñones', 'cebollitas perladas', 'zanahoria', 'tomillo', 'laurel', 'caldo de res'],
            description: 'Estofado de Borgoña: res braseada en vino tinto con tocino, champiñones y cebollitas perladas. Julia Child lo popularizó fuera de Francia.',
          },
          {
            name: 'Crème Brûlée',
            technique: 'Baño María', difficulty: 'Intermedio', time: '1h 30m',
            ingredients: ['crema para batir', 'yemas de huevo', 'azúcar', 'vaina de vainilla'],
            description: 'Crema de vainilla cocida al baño maría y caramelizada con soplete. La capa de azúcar debe crujir al romperla con la cuchara.',
          },
          {
            name: "Soupe à l'Oignon Gratinée",
            technique: 'Caramelización', difficulty: 'Intermedio', time: '1h 30m',
            ingredients: ['cebolla amarilla', 'mantequilla', 'vino blanco seco', 'caldo de res', 'pan baguette', 'queso gruyère', 'tomillo'],
            description: 'Sopa de cebolla caramelizada lentamente con caldo de res y gratinada con gruyère fundido.',
          },
        ],
      },
      {
        name: 'Portugal', flag: '🇵🇹',
        recipes: [
          {
            name: 'Bacalhau à Brás',
            technique: 'Salteado', difficulty: 'Intermedio', time: '45m',
            ingredients: ['bacalao desalado', 'papas paja', 'cebolla', 'ajo', 'huevo', 'aceitunas negras', 'perejil', 'aceite de oliva'],
            description: 'Receta lisboeta de bacalao desmigado con papas paja, ligado con huevo revuelto y terminado con aceitunas negras y perejil.',
          },
          {
            name: 'Pastel de Nata',
            technique: 'Horneado', difficulty: 'Difícil', time: '2h',
            ingredients: ['masa hojaldre', 'leche', 'azúcar', 'yemas de huevo', 'harina', 'limón', 'canela', 'vainilla'],
            description: 'Tartaleta portuguesa de hojaldre crujiente rellena de crema de yemas, con la superficie caramelizada en manchas.',
          },
          {
            name: 'Caldo Verde',
            technique: 'Caldo', difficulty: 'Básico', time: '45m',
            ingredients: ['papa', 'col rizada', 'chorizo português', 'cebolla', 'ajo', 'aceite de oliva', 'sal'],
            description: 'Sopa del norte de Portugal: crema de papa con tiras finas de col rizada y rodajas de chorizo ahumado.',
          },
        ],
      },
      {
        name: 'Alemania', flag: '🇩🇪',
        recipes: [
          {
            name: 'Schnitzel Wiener Art',
            technique: 'Frito', difficulty: 'Básico', time: '30m',
            ingredients: ['chuleta de cerdo', 'harina', 'huevo', 'pan rallado', 'mantequilla clarificada', 'limón', 'sal', 'pimienta'],
            description: 'Chuleta de cerdo batida hasta quedar delgada, pasada por harina, huevo y pan rallado, y frita en mantequilla clarificada hasta dorar.',
          },
          {
            name: 'Sauerbraten',
            technique: 'Marinado-Braseado', difficulty: 'Difícil', time: '72h',
            ingredients: ['lomo de res', 'vinagre de vino tinto', 'vino tinto', 'cebolla', 'zanahoria', 'apio', 'laurel', 'clavo', 'bayas de enebro', 'azúcar'],
            description: 'Asado alemán de res marinada 3 días en vinagre especiado y braseada hasta quedar tierna, con salsa agridulce.',
          },
          {
            name: 'Pretzels Caseros',
            technique: 'Horneado', difficulty: 'Intermedio', time: '2h',
            ingredients: ['harina', 'levadura', 'agua', 'sal', 'bicarbonato de sodio', 'mantequilla', 'sal gruesa'],
            description: 'Pretzels de corteza oscura e interior tierno. El color sale del baño en bicarbonato antes de hornear.',
          },
        ],
      },
    ],
  },
  {
    name: 'Asia',
    countries: [
      {
        name: 'Japón', flag: '🇯🇵',
        recipes: [
          {
            name: 'Ramen Tonkotsu Casero',
            technique: 'Caldo', difficulty: 'Difícil', time: '12h',
            ingredients: ['huesos de cerdo', 'panceta', 'fideos ramen', 'huevo', 'cebollín', 'jengibre', 'algas nori', 'pasta miso', 'salsa de soya'],
            description: 'Caldo de cerdo turbio cocinado 12 horas a hervor intenso. Con panceta chashu, huevo ajitsuke y fideos alkali.',
          },
          {
            name: 'Pollo Teriyaki',
            technique: 'Salteado', difficulty: 'Básico', time: '45m',
            ingredients: ['muslos de pollo', 'salsa de soya', 'mirin', 'sake', 'azúcar', 'jengibre', 'ajo', 'arroz japonés', 'sésamo'],
            description: 'Muslos de pollo con la piel crujiente, lacados en una reducción de salsa de soya, mirin y sake.',
          },
          {
            name: 'Gyoza Caseras',
            technique: 'Frito-Vapor', difficulty: 'Intermedio', time: '1h 30m',
            ingredients: ['cerdo picado', 'col china', 'cebollín', 'jengibre', 'ajo', 'aceite de sésamo', 'masa gyoza', 'salsa de soya', 'vinagre de arroz'],
            description: 'Empanadillas de cerdo y col con técnica yaki+mushi. Crujientes abajo, tiernas arriba.',
          },
        ],
      },
      {
        name: 'China', flag: '🇨🇳',
        recipes: [
          {
            name: 'Mapo Tofu',
            technique: 'Wok', difficulty: 'Intermedio', time: '30m',
            ingredients: ['tofu sedoso', 'carne molida de cerdo', 'pasta doubanjiang', 'aceite de chile', 'pimienta de Sichuan', 'ajo', 'jengibre', 'caldo', 'cebollín', 'fécula de maíz'],
            description: 'Plato de Sichuan: tofu sedoso y cerdo en salsa de doubanjiang, con pimienta de Sichuan que adormece un poco la lengua.',
          },
          {
            name: 'Pato Pekín',
            technique: 'Horneado', difficulty: 'Difícil', time: '24h',
            ingredients: ['pato entero', 'maltosa', 'vinagre de arroz', 'cinco especias', 'jengibre', 'cebollín', 'pepino', 'salsa hoisin', 'crepes de trigo'],
            description: 'Pato de piel crujiente y brillante: se laca con maltosa y se seca 24 horas antes de hornear. Se sirve con crepes, pepino, cebollín y salsa hoisin.',
          },
          {
            name: 'Dim Sum de Cerdo (Har Gow)',
            technique: 'Vapor', difficulty: 'Difícil', time: '2h',
            ingredients: ['camarón', 'cerdo picado', 'bambú en tiras', 'aceite de sésamo', 'salsa de soya', 'jengibre', 'harina de trigo', 'fécula de tapioca'],
            description: 'Empanadillas cantonesas al vapor, de masa translúcida de trigo y tapioca, rellenas de camarón y cerdo.',
          },
        ],
      },
      {
        name: 'Tailandia', flag: '🇹🇭',
        recipes: [
          {
            name: 'Pad Thai Clásico',
            technique: 'Wok', difficulty: 'Básico', time: '30m',
            ingredients: ['fideos de arroz', 'camarón', 'tofu firme', 'huevo', 'brotes de soya', 'cebollín', 'maní tostado', 'tamarindo', 'fish sauce', 'azúcar de palma', 'lima'],
            description: 'Fideos de arroz salteados en wok caliente con camarón, tofu y brotes de soya, en salsa de tamarindo, fish sauce y azúcar de palma.',
          },
          {
            name: 'Tom Kha Gai',
            technique: 'Caldo Aromático', difficulty: 'Intermedio', time: '45m',
            ingredients: ['pollo', 'leche de coco', 'galangal', 'hierba de limón', 'hojas kaffir lime', 'champiñones', 'fish sauce', 'lima', 'chile', 'cilantro'],
            description: 'Sopa de pollo en leche de coco con galangal y hierba de limón. La lima aporta la acidez y la fish sauce, la sal.',
          },
          {
            name: 'Green Curry',
            technique: 'Curry', difficulty: 'Intermedio', time: '1h',
            ingredients: ['pasta de curry verde', 'leche de coco', 'pollo', 'berenjena tailandesa', 'pimiento', 'albahaca sagrada', 'fish sauce', 'azúcar de palma', 'arroz jazmín'],
            description: 'Curry de pollo en leche de coco con berenjena tailandesa y albahaca sagrada. El sabor base viene de la pasta de curry verde.',
          },
        ],
      },
    ],
  },
];
