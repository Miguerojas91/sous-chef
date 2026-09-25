/** Catálogo de Sabores del Mundo: regiones, países y recetas. */

export type Difficulty = 'Básico' | 'Intermedio' | 'Difícil';
export type RegionName = 'América' | 'Europa' | 'Asia';

/** Cantidad para UNA porción; se multiplica por las porciones elegidas. */
export interface Ingredient {
  name: string;
  amount: number;
  /** 'g', 'ml' o la pieza que se compra ('ud', 'diente', 'tallo'…). */
  unit: string;
}

export interface Recipe {
  name: string;
  technique: string;
  difficulty: Difficulty;
  time: string;
  ingredients: Ingredient[];
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
            ingredients: [
              { name: 'frijoles rojos', amount: 80, unit: 'g' },
              { name: 'chicharrón', amount: 80, unit: 'g' },
              { name: 'carne molida', amount: 100, unit: 'g' },
              { name: 'chorizo', amount: 1, unit: 'ud' },
              { name: 'morcilla', amount: 1, unit: 'ud' },
              { name: 'arroz', amount: 80, unit: 'g' },
              { name: 'huevo', amount: 1, unit: 'ud' },
              { name: 'aguacate', amount: 0.5, unit: 'ud' },
              { name: 'plátano maduro', amount: 1, unit: 'ud' },
              { name: 'harina de maíz precocida', amount: 50, unit: 'g' },
              { name: 'tomate chonto', amount: 1, unit: 'ud' },
              { name: 'cebolla larga', amount: 1, unit: 'ud' },
            ],
            description: 'Plato típico de Antioquia. Frijoles, arroz, carne molida, chicharrón, chorizo, morcilla, huevo, plátano maduro, aguacate y arepa servidos en una sola bandeja.',
          },
          {
            name: 'Ajiaco Bogotano',
            technique: 'Caldo', difficulty: 'Intermedio', time: '2h',
            ingredients: [
              { name: 'papa criolla', amount: 150, unit: 'g' },
              { name: 'papa pastusa', amount: 150, unit: 'g' },
              { name: 'papa sabanera', amount: 100, unit: 'g' },
              { name: 'pollo', amount: 150, unit: 'g' },
              { name: 'mazorca', amount: 1, unit: 'ud' },
              { name: 'guascas', amount: 5, unit: 'g' },
              { name: 'crema de leche', amount: 30, unit: 'ml' },
              { name: 'alcaparras', amount: 15, unit: 'g' },
              { name: 'cilantro', amount: 5, unit: 'g' },
            ],
            description: 'Sopa bogotana de pollo con tres tipos de papa: la criolla se deshace y espesa el caldo. Las guascas le dan su sabor herbal. Se sirve con crema, alcaparras y mazorca.',
          },
          {
            name: 'Arepa con Hogao',
            technique: 'Plancha', difficulty: 'Básico', time: '30m',
            ingredients: [
              { name: 'masa de maíz precocida', amount: 80, unit: 'g' },
              { name: 'sal', amount: 2, unit: 'g' },
              { name: 'agua', amount: 100, unit: 'ml' },
              { name: 'tomate', amount: 1, unit: 'ud' },
              { name: 'cebolla larga', amount: 0.5, unit: 'ud' },
              { name: 'aceite', amount: 10, unit: 'ml' },
              { name: 'comino', amount: 1, unit: 'g' },
            ],
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
            ingredients: [
              { name: 'pollo', amount: 250, unit: 'g' },
              { name: 'cerveza', amount: 60, unit: 'ml' },
              { name: 'cebolla', amount: 0.5, unit: 'ud' },
              { name: 'tomate', amount: 1, unit: 'ud' },
              { name: 'pimiento', amount: 0.5, unit: 'ud' },
              { name: 'ajo', amount: 1, unit: 'diente' },
              { name: 'naranjilla', amount: 1, unit: 'ud' },
              { name: 'cilantro', amount: 5, unit: 'g' },
              { name: 'comino', amount: 1, unit: 'g' },
              { name: 'achiote', amount: 5, unit: 'ml' },
              { name: 'arroz', amount: 80, unit: 'g' },
            ],
            description: 'Guiso ecuatoriano de pollo cocinado lentamente en cerveza y naranjilla. El achiote le da el color dorado.',
          },
          {
            name: 'Llapingachos',
            technique: 'Sartén', difficulty: 'Básico', time: '45m',
            ingredients: [
              { name: 'papa', amount: 250, unit: 'g' },
              { name: 'queso fresco', amount: 60, unit: 'g' },
              { name: 'cebolla larga', amount: 0.5, unit: 'ud' },
              { name: 'mantequilla', amount: 15, unit: 'g' },
              { name: 'achiote', amount: 5, unit: 'ml' },
              { name: 'maní', amount: 30, unit: 'g' },
              { name: 'leche', amount: 50, unit: 'ml' },
              { name: 'ajo', amount: 1, unit: 'diente' },
            ],
            description: 'Tortillas de papa rellenas de queso, doradas en mantequilla con achiote. Acompañadas de salsa de maní y chorizo.',
          },
          {
            name: 'Caldo de Bolas de Verde',
            technique: 'Caldo', difficulty: 'Difícil', time: '2h',
            ingredients: [
              { name: 'plátano verde', amount: 1.5, unit: 'ud' },
              { name: 'carne de res', amount: 120, unit: 'g' },
              { name: 'cerdo', amount: 60, unit: 'g' },
              { name: 'maíz', amount: 40, unit: 'g' },
              { name: 'yuca', amount: 80, unit: 'g' },
              { name: 'zanahoria', amount: 0.5, unit: 'ud' },
              { name: 'cebolla', amount: 0.5, unit: 'ud' },
              { name: 'ajo', amount: 1, unit: 'diente' },
              { name: 'comino', amount: 1, unit: 'g' },
              { name: 'cilantro', amount: 5, unit: 'g' },
              { name: 'maní', amount: 30, unit: 'g' },
            ],
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
            ingredients: [
              { name: 'tira de asado', amount: 250, unit: 'g' },
              { name: 'vacío', amount: 200, unit: 'g' },
              { name: 'chorizo', amount: 1, unit: 'ud' },
              { name: 'morcilla', amount: 1, unit: 'ud' },
              { name: 'sal gruesa', amount: 10, unit: 'g' },
              { name: 'perejil', amount: 10, unit: 'g' },
              { name: 'ajo', amount: 2, unit: 'diente' },
              { name: 'orégano', amount: 2, unit: 'g' },
              { name: 'vinagre', amount: 15, unit: 'ml' },
              { name: 'aceite de oliva', amount: 30, unit: 'ml' },
            ],
            description: 'Tira de asado y vacío a la parrilla, con chorizo, morcilla y chimichurri casero de perejil, ajo y orégano.',
          },
          {
            name: 'Empanadas Criollas',
            technique: 'Horneado', difficulty: 'Intermedio', time: '2h',
            ingredients: [
              { name: 'harina', amount: 125, unit: 'g' },
              { name: 'manteca', amount: 30, unit: 'g' },
              { name: 'carne molida', amount: 120, unit: 'g' },
              { name: 'cebolla', amount: 1, unit: 'ud' },
              { name: 'pimiento rojo', amount: 0.5, unit: 'ud' },
              { name: 'huevo duro', amount: 0.5, unit: 'ud' },
              { name: 'aceitunas', amount: 20, unit: 'g' },
              { name: 'pasas', amount: 15, unit: 'g' },
              { name: 'comino', amount: 1, unit: 'g' },
              { name: 'pimentón dulce', amount: 2, unit: 'g' },
            ],
            description: 'Empanadas horneadas de carne con cebolla, huevo duro y aceitunas, cerradas con el repulgue tradicional.',
          },
          {
            name: 'Dulce de Leche Casero',
            technique: 'Reducción', difficulty: 'Básico', time: '2h',
            ingredients: [
              { name: 'leche entera', amount: 250, unit: 'ml' },
              { name: 'azúcar', amount: 75, unit: 'g' },
              { name: 'bicarbonato', amount: 0.5, unit: 'g' },
              { name: 'esencia de vainilla', amount: 2, unit: 'ml' },
            ],
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
            ingredients: [
              { name: 'res chuck', amount: 200, unit: 'g' },
              { name: 'vino tinto Borgoña', amount: 150, unit: 'ml' },
              { name: 'tocino', amount: 40, unit: 'g' },
              { name: 'champiñones', amount: 80, unit: 'g' },
              { name: 'cebollitas perladas', amount: 60, unit: 'g' },
              { name: 'zanahoria', amount: 1, unit: 'ud' },
              { name: 'tomillo', amount: 1, unit: 'g' },
              { name: 'laurel', amount: 1, unit: 'hoja' },
              { name: 'caldo de res', amount: 150, unit: 'ml' },
            ],
            description: 'Estofado de Borgoña: res braseada en vino tinto con tocino, champiñones y cebollitas perladas. Julia Child lo popularizó fuera de Francia.',
          },
          {
            name: 'Crème Brûlée',
            technique: 'Baño María', difficulty: 'Intermedio', time: '1h 30m',
            ingredients: [
              { name: 'crema para batir', amount: 120, unit: 'ml' },
              { name: 'yemas de huevo', amount: 2, unit: 'ud' },
              { name: 'azúcar', amount: 30, unit: 'g' },
              { name: 'vaina de vainilla', amount: 0.25, unit: 'ud' },
            ],
            description: 'Crema de vainilla cocida al baño maría y caramelizada con soplete. La capa de azúcar debe crujir al romperla con la cuchara.',
          },
          {
            name: "Soupe à l'Oignon Gratinée",
            technique: 'Caramelización', difficulty: 'Intermedio', time: '1h 30m',
            ingredients: [
              { name: 'cebolla amarilla', amount: 250, unit: 'g' },
              { name: 'mantequilla', amount: 20, unit: 'g' },
              { name: 'vino blanco seco', amount: 50, unit: 'ml' },
              { name: 'caldo de res', amount: 350, unit: 'ml' },
              { name: 'pan baguette', amount: 60, unit: 'g' },
              { name: 'queso gruyère', amount: 50, unit: 'g' },
              { name: 'tomillo', amount: 1, unit: 'g' },
            ],
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
            ingredients: [
              { name: 'bacalao desalado', amount: 120, unit: 'g' },
              { name: 'papas paja', amount: 80, unit: 'g' },
              { name: 'cebolla', amount: 0.5, unit: 'ud' },
              { name: 'ajo', amount: 1, unit: 'diente' },
              { name: 'huevo', amount: 2, unit: 'ud' },
              { name: 'aceitunas negras', amount: 20, unit: 'g' },
              { name: 'perejil', amount: 5, unit: 'g' },
              { name: 'aceite de oliva', amount: 20, unit: 'ml' },
            ],
            description: 'Receta lisboeta de bacalao desmigado con papas paja, ligado con huevo revuelto y terminado con aceitunas negras y perejil.',
          },
          {
            name: 'Pastel de Nata',
            technique: 'Horneado', difficulty: 'Difícil', time: '2h',
            ingredients: [
              { name: 'masa hojaldre', amount: 100, unit: 'g' },
              { name: 'leche', amount: 125, unit: 'ml' },
              { name: 'azúcar', amount: 50, unit: 'g' },
              { name: 'yemas de huevo', amount: 2, unit: 'ud' },
              { name: 'harina', amount: 12, unit: 'g' },
              { name: 'limón', amount: 0.25, unit: 'ud' },
              { name: 'canela', amount: 1, unit: 'g' },
              { name: 'vainilla', amount: 2, unit: 'ml' },
            ],
            description: 'Tartaleta portuguesa de hojaldre crujiente rellena de crema de yemas, con la superficie caramelizada en manchas.',
          },
          {
            name: 'Caldo Verde',
            technique: 'Caldo', difficulty: 'Básico', time: '45m',
            ingredients: [
              { name: 'papa', amount: 200, unit: 'g' },
              { name: 'col rizada', amount: 60, unit: 'g' },
              { name: 'chorizo português', amount: 40, unit: 'g' },
              { name: 'cebolla', amount: 0.5, unit: 'ud' },
              { name: 'ajo', amount: 1, unit: 'diente' },
              { name: 'aceite de oliva', amount: 15, unit: 'ml' },
              { name: 'sal', amount: 3, unit: 'g' },
            ],
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
            ingredients: [
              { name: 'chuleta de cerdo', amount: 180, unit: 'g' },
              { name: 'harina', amount: 30, unit: 'g' },
              { name: 'huevo', amount: 1, unit: 'ud' },
              { name: 'pan rallado', amount: 60, unit: 'g' },
              { name: 'mantequilla clarificada', amount: 30, unit: 'g' },
              { name: 'limón', amount: 0.25, unit: 'ud' },
              { name: 'sal', amount: 3, unit: 'g' },
              { name: 'pimienta', amount: 1, unit: 'g' },
            ],
            description: 'Chuleta de cerdo batida hasta quedar delgada, pasada por harina, huevo y pan rallado, y frita en mantequilla clarificada hasta dorar.',
          },
          {
            name: 'Sauerbraten',
            technique: 'Marinado-Braseado', difficulty: 'Difícil', time: '72h',
            ingredients: [
              { name: 'lomo de res', amount: 250, unit: 'g' },
              { name: 'vinagre de vino tinto', amount: 60, unit: 'ml' },
              { name: 'vino tinto', amount: 100, unit: 'ml' },
              { name: 'cebolla', amount: 0.5, unit: 'ud' },
              { name: 'zanahoria', amount: 0.5, unit: 'ud' },
              { name: 'apio', amount: 1, unit: 'tallo' },
              { name: 'laurel', amount: 1, unit: 'hoja' },
              { name: 'clavo', amount: 2, unit: 'ud' },
              { name: 'bayas de enebro', amount: 3, unit: 'ud' },
              { name: 'azúcar', amount: 10, unit: 'g' },
            ],
            description: 'Asado alemán de res marinada 3 días en vinagre especiado y braseada hasta quedar tierna, con salsa agridulce.',
          },
          {
            name: 'Pretzels Caseros',
            technique: 'Horneado', difficulty: 'Intermedio', time: '2h',
            ingredients: [
              { name: 'harina', amount: 125, unit: 'g' },
              { name: 'levadura', amount: 3, unit: 'g' },
              { name: 'agua', amount: 75, unit: 'ml' },
              { name: 'sal', amount: 3, unit: 'g' },
              { name: 'bicarbonato de sodio', amount: 15, unit: 'g' },
              { name: 'mantequilla', amount: 15, unit: 'g' },
              { name: 'sal gruesa', amount: 5, unit: 'g' },
            ],
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
            ingredients: [
              { name: 'huesos de cerdo', amount: 400, unit: 'g' },
              { name: 'panceta', amount: 100, unit: 'g' },
              { name: 'fideos ramen', amount: 120, unit: 'g' },
              { name: 'huevo', amount: 1, unit: 'ud' },
              { name: 'cebollín', amount: 15, unit: 'g' },
              { name: 'jengibre', amount: 10, unit: 'g' },
              { name: 'algas nori', amount: 2, unit: 'hoja' },
              { name: 'pasta miso', amount: 20, unit: 'g' },
              { name: 'salsa de soya', amount: 20, unit: 'ml' },
            ],
            description: 'Caldo de cerdo turbio cocinado 12 horas a hervor intenso. Con panceta chashu, huevo ajitsuke y fideos alkali.',
          },
          {
            name: 'Pollo Teriyaki',
            technique: 'Salteado', difficulty: 'Básico', time: '45m',
            ingredients: [
              { name: 'muslos de pollo', amount: 200, unit: 'g' },
              { name: 'salsa de soya', amount: 30, unit: 'ml' },
              { name: 'mirin', amount: 20, unit: 'ml' },
              { name: 'sake', amount: 15, unit: 'ml' },
              { name: 'azúcar', amount: 10, unit: 'g' },
              { name: 'jengibre', amount: 5, unit: 'g' },
              { name: 'ajo', amount: 1, unit: 'diente' },
              { name: 'arroz japonés', amount: 80, unit: 'g' },
              { name: 'sésamo', amount: 3, unit: 'g' },
            ],
            description: 'Muslos de pollo con la piel crujiente, lacados en una reducción de salsa de soya, mirin y sake.',
          },
          {
            name: 'Gyoza Caseras',
            technique: 'Frito-Vapor', difficulty: 'Intermedio', time: '1h 30m',
            ingredients: [
              { name: 'cerdo picado', amount: 120, unit: 'g' },
              { name: 'col china', amount: 80, unit: 'g' },
              { name: 'cebollín', amount: 15, unit: 'g' },
              { name: 'jengibre', amount: 5, unit: 'g' },
              { name: 'ajo', amount: 1, unit: 'diente' },
              { name: 'aceite de sésamo', amount: 5, unit: 'ml' },
              { name: 'masa gyoza', amount: 8, unit: 'ud' },
              { name: 'salsa de soya', amount: 20, unit: 'ml' },
              { name: 'vinagre de arroz', amount: 10, unit: 'ml' },
            ],
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
            ingredients: [
              { name: 'tofu sedoso', amount: 200, unit: 'g' },
              { name: 'carne molida de cerdo', amount: 80, unit: 'g' },
              { name: 'pasta doubanjiang', amount: 20, unit: 'g' },
              { name: 'aceite de chile', amount: 10, unit: 'ml' },
              { name: 'pimienta de Sichuan', amount: 2, unit: 'g' },
              { name: 'ajo', amount: 2, unit: 'diente' },
              { name: 'jengibre', amount: 5, unit: 'g' },
              { name: 'caldo', amount: 120, unit: 'ml' },
              { name: 'cebollín', amount: 15, unit: 'g' },
              { name: 'fécula de maíz', amount: 8, unit: 'g' },
            ],
            description: 'Plato de Sichuan: tofu sedoso y cerdo en salsa de doubanjiang, con pimienta de Sichuan que adormece un poco la lengua.',
          },
          {
            name: 'Pato Pekín',
            technique: 'Horneado', difficulty: 'Difícil', time: '24h',
            ingredients: [
              { name: 'pato entero', amount: 0.25, unit: 'ud' },
              { name: 'maltosa', amount: 15, unit: 'g' },
              { name: 'vinagre de arroz', amount: 15, unit: 'ml' },
              { name: 'cinco especias', amount: 2, unit: 'g' },
              { name: 'jengibre', amount: 10, unit: 'g' },
              { name: 'cebollín', amount: 20, unit: 'g' },
              { name: 'pepino', amount: 0.5, unit: 'ud' },
              { name: 'salsa hoisin', amount: 30, unit: 'g' },
              { name: 'crepes de trigo', amount: 4, unit: 'ud' },
            ],
            description: 'Pato de piel crujiente y brillante: se laca con maltosa y se seca 24 horas antes de hornear. Se sirve con crepes, pepino, cebollín y salsa hoisin.',
          },
          {
            name: 'Dim Sum de Cerdo (Har Gow)',
            technique: 'Vapor', difficulty: 'Difícil', time: '2h',
            ingredients: [
              { name: 'camarón', amount: 80, unit: 'g' },
              { name: 'cerdo picado', amount: 40, unit: 'g' },
              { name: 'bambú en tiras', amount: 20, unit: 'g' },
              { name: 'aceite de sésamo', amount: 5, unit: 'ml' },
              { name: 'salsa de soya', amount: 10, unit: 'ml' },
              { name: 'jengibre', amount: 3, unit: 'g' },
              { name: 'harina de trigo', amount: 40, unit: 'g' },
              { name: 'fécula de tapioca', amount: 15, unit: 'g' },
            ],
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
            ingredients: [
              { name: 'fideos de arroz', amount: 100, unit: 'g' },
              { name: 'camarón', amount: 100, unit: 'g' },
              { name: 'tofu firme', amount: 60, unit: 'g' },
              { name: 'huevo', amount: 1, unit: 'ud' },
              { name: 'brotes de soya', amount: 60, unit: 'g' },
              { name: 'cebollín', amount: 15, unit: 'g' },
              { name: 'maní tostado', amount: 20, unit: 'g' },
              { name: 'tamarindo', amount: 20, unit: 'ml' },
              { name: 'fish sauce', amount: 20, unit: 'ml' },
              { name: 'azúcar de palma', amount: 15, unit: 'g' },
              { name: 'lima', amount: 0.5, unit: 'ud' },
            ],
            description: 'Fideos de arroz salteados en wok caliente con camarón, tofu y brotes de soya, en salsa de tamarindo, fish sauce y azúcar de palma.',
          },
          {
            name: 'Tom Kha Gai',
            technique: 'Caldo Aromático', difficulty: 'Intermedio', time: '45m',
            ingredients: [
              { name: 'pollo', amount: 150, unit: 'g' },
              { name: 'leche de coco', amount: 200, unit: 'ml' },
              { name: 'galangal', amount: 15, unit: 'g' },
              { name: 'hierba de limón', amount: 1, unit: 'tallo' },
              { name: 'hojas kaffir lime', amount: 3, unit: 'ud' },
              { name: 'champiñones', amount: 60, unit: 'g' },
              { name: 'fish sauce', amount: 15, unit: 'ml' },
              { name: 'lima', amount: 0.5, unit: 'ud' },
              { name: 'chile', amount: 1, unit: 'ud' },
              { name: 'cilantro', amount: 5, unit: 'g' },
            ],
            description: 'Sopa de pollo en leche de coco con galangal y hierba de limón. La lima aporta la acidez y la fish sauce, la sal.',
          },
          {
            name: 'Green Curry',
            technique: 'Curry', difficulty: 'Intermedio', time: '1h',
            ingredients: [
              { name: 'pasta de curry verde', amount: 30, unit: 'g' },
              { name: 'leche de coco', amount: 200, unit: 'ml' },
              { name: 'pollo', amount: 150, unit: 'g' },
              { name: 'berenjena tailandesa', amount: 80, unit: 'g' },
              { name: 'pimiento', amount: 0.5, unit: 'ud' },
              { name: 'albahaca sagrada', amount: 10, unit: 'g' },
              { name: 'fish sauce', amount: 15, unit: 'ml' },
              { name: 'azúcar de palma', amount: 10, unit: 'g' },
              { name: 'arroz jazmín', amount: 80, unit: 'g' },
            ],
            description: 'Curry de pollo en leche de coco con berenjena tailandesa y albahaca sagrada. El sabor base viene de la pasta de curry verde.',
          },
        ],
      },
    ],
  },
];
