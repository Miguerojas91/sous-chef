/**
 * countries.ts
 *
 * Catálogo de países hispanohablantes soportados por Sous Chef + bloque de
 * conocimiento que se inyecta al system prompt del Chef IA para que use
 * ingredientes locales, nombres regionales y referencias culturales correctas.
 *
 * Esto resuelve la falencia #2 del informe de mercado (5,421 likes de quejas
 * por recetas no localizadas).
 *
 * Para agregar un país nuevo:
 *  - Añadirlo a `COUNTRIES` con su flag, nombre y código.
 *  - Añadir un bloque de `localContext` con ingredientes/jerga típica.
 */

export type CountryCode =
  | 'CO'  // Colombia
  | 'MX'  // México
  | 'AR'  // Argentina
  | 'ES'  // España
  | 'CL'  // Chile
  | 'PE'  // Perú
  | 'VE'  // Venezuela
  | 'EC'  // Ecuador
  | 'UY'  // Uruguay
  | 'BO'  // Bolivia
  | 'PY'  // Paraguay
  | 'CR'  // Costa Rica
  | 'PA'  // Panamá
  | 'DO'  // República Dominicana
  | 'GT'  // Guatemala
  | 'US'  // Estados Unidos (hispano)
  | 'OTHER';

export interface Country {
  code: CountryCode;
  name: string;
  flag: string;
  /** Bloque de contexto que se inyecta al system prompt del chef. */
  localContext: string;
}

export const COUNTRIES: Country[] = [
  {
    code: 'CO',
    name: 'Colombia',
    flag: '🇨🇴',
    localContext: `El usuario cocina desde Colombia.
- Ingredientes locales accesibles: panela, yuca, plátano (verde/maduro/dominico), arepa, ahogao (sofrito de tomate + cebolla larga), ají, cilantro, cebolla larga, queso costeño, queso campesino, papa criolla, papa pastusa, frijol cargamanto, hogao.
- Usa nombres locales: aguacate (no palta), cilantro (no culantro), cebolla larga (no cebolla de verdeo), fríjol (no judía), maíz tierno (no choclo), papa (no patata), tomate (no jitomate).
- Platos referencia: bandeja paisa, ajiaco, sancocho, sudado, fríjoles, arroz con coco, mondongo, lechona.
- Evita: aceite de oliva extra virgen como base (es caro), parmesano fresco, anchoas, ricotta — sugiérelos solo si el usuario los menciona.`,
  },
  {
    code: 'MX',
    name: 'México',
    flag: '🇲🇽',
    localContext: `El usuario cocina desde México.
- Ingredientes locales accesibles: masa de maíz (nixtamalizada), tortillas de maíz/harina, chile (poblano, jalapeño, serrano, guajillo, chipotle, ancho, pasilla), tomatillo (tomate verde), cilantro, epazote, cebolla blanca, queso fresco (Oaxaca, panela, cotija), crema mexicana, frijol negro/pinto, aguacate, lima, jitomate.
- Usa nombres locales: jitomate (rojo) / tomate verde (tomatillo), papa (no patata), elote (no choclo ni mazorca), aguacate, chile (no ají ni pimiento picante).
- Platos referencia: tacos, enchiladas, mole, pozole, chilaquiles, sopes, tamales, tinga, picadillo, frijoles charros.
- Evita: anchoas, parmesano fresco como base. La sal "kosher" no se vende — usa sal de mesa o de grano.`,
  },
  {
    code: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    localContext: `El usuario cocina desde Argentina.
- Ingredientes locales accesibles: yerba mate, dulce de leche, carne (asado, bife, vacío, matambre, entraña), chimichurri (perejil + ajo + orégano + vinagre + aceite + ají molido), provoleta, queso cremoso, queso rallado, harina 000/0000, masa de empanada, ñoquis, milanesa.
- Usa nombres locales: choclo (no maíz ni elote), zapallo (no calabaza, no auyama), durazno (no melocotón), palta (no aguacate), morrón (no pimentón ni chile dulce), papa (no patata), banana (no plátano).
- Platos referencia: asado, milanesa, empanadas, ñoquis, locro, guiso de lentejas, pastel de papa, pizza estilo argentino.
- Evita: cilantro como hierba base (poco usado), tortillas de maíz, masa de hojaldre no estándar.`,
  },
  {
    code: 'ES',
    name: 'España',
    flag: '🇪🇸',
    localContext: `El usuario cocina desde España.
- Ingredientes locales accesibles: aceite de oliva virgen extra (base de casi todo), pimentón dulce/picante (de la Vera, Murcia), jamón serrano/ibérico, chorizo, jamón cocido, queso manchego, ajo, perejil, tomate, pimiento (rojo/verde), patata, judía verde, garbanzo, arroz bomba, fideos finos.
- Usa nombres locales: patata (no papa), judía verde (no chaucha ni vainita), pimiento (no morrón ni ají), maíz (no choclo), tomate (no jitomate), aguacate, vainilla.
- Platos referencia: tortilla de patata, paella, gazpacho, salmorejo, cocido madrileño, lentejas estofadas, fabada, croquetas, pisto, ajoarriero.
- Evita: cilantro como base (poco usado fuera de Canarias), chile picante fuerte (gastronomía suave en general).`,
  },
  {
    code: 'CL',
    name: 'Chile',
    flag: '🇨🇱',
    localContext: `El usuario cocina desde Chile.
- Ingredientes locales accesibles: palta, choclo, poroto verde/granado/negro, papa, zapallo, cebolla, tomate, ají verde/cristal/cacho de cabra, merkén, cilantro, queso fresco, longaniza, charqui, mariscos (almeja, machas, choritos, locos).
- Usa nombres locales: palta (no aguacate), choclo (no maíz), poroto (no fríjol), zapallo (no calabaza), durazno (no melocotón), porotos verdes (no chauchas o ejotes), guata (estómago).
- Platos referencia: cazuela, pastel de choclo, porotos con riendas, charquicán, empanadas de pino, completo, curanto, sopaipillas.
- Evita: ingredientes muy específicos de cocina mexicana o argentina sin confirmar.`,
  },
  {
    code: 'PE',
    name: 'Perú',
    flag: '🇵🇪',
    localContext: `El usuario cocina desde Perú.
- Ingredientes locales accesibles: ají amarillo, ají panca, rocoto, huacatay, choclo serrano, papa (nativa: amarilla, huayro, etc.), camote, yuca, quinua, kiwicha, leche evaporada, queso fresco serrano, pisco, limón sutil, culantro (=cilantro).
- Usa nombres locales: culantro (cilantro), palta, papa (variedades específicas), choclo, camote (no batata salvo aclaración), zapallo loche.
- Platos referencia: ceviche, lomo saltado, ají de gallina, papa a la huancaína, aji de fideos, pollo a la brasa, anticuchos, causa, rocoto relleno, arroz chaufa.
- Evita: salsas comerciales europeas, ingredientes que no sean accesibles fuera de Lima sin confirmarlo.`,
  },
  {
    code: 'VE',
    name: 'Venezuela',
    flag: '🇻🇪',
    localContext: `El usuario cocina desde Venezuela.
- Ingredientes locales accesibles: harina de maíz precocida (P.A.N.), plátano verde/maduro, yuca, queso blanco rallado/de mano, caraotas negras, aguacate, cilantro, ajo, cebolla, tomate, papelón (panela), guayaba, papa, auyama.
- Usa nombres locales: caraotas (no fríjol negro), auyama (no calabaza), papelón (no panela), parchita (no maracuyá), cambur (no banana, no plátano dulce), aguacate, ají dulce.
- Platos referencia: arepa, pabellón criollo, hallaca, tequeño, asado negro, cachapa, perico (huevos con tomate y cebolla), pisillo, sancocho, mondongo.
- Evita: ingredientes europeos exquisitos sin confirmar accesibilidad (la disponibilidad varía mucho).`,
  },
  {
    code: 'EC',
    name: 'Ecuador',
    flag: '🇪🇨',
    localContext: `El usuario cocina desde Ecuador.
- Ingredientes locales accesibles: yuca, plátano verde (verde, maduro), choclo, camote, mote, papa chola, queso fresco, achiote, cilantro, ajo, cebolla blanca/paiteña, tomate de árbol, aguacate.
- Usa nombres locales: choclo, mote (maíz hervido y pelado), guineo (banano pequeño), maduro (plátano dulce maduro), papa chola, ají criollo, cuy.
- Platos referencia: encebollado, ceviche ecuatoriano, locro de papa, arroz con menestra, llapingachos, hornado, fritada, bolón de verde, encocado.
- Evita: ingredientes especializados sin confirmar.`,
  },
  {
    code: 'UY',
    name: 'Uruguay',
    flag: '🇺🇾',
    localContext: `El usuario cocina desde Uruguay.
- Similar a Argentina: dulce de leche, mate, carne de excelente calidad, asado, milanesa.
- Ingredientes locales: muzzarella (queso), morrón, choclo, durazno, palta, harina 000.
- Usa nombres locales: chivito (sándwich emblema, NO cabrito), palta, morrón, choclo, frutilla (no fresa).
- Platos referencia: chivito, asado, milanesa, torta frita, pasta dominguera, chajá.`,
  },
  {
    code: 'BO',
    name: 'Bolivia',
    flag: '🇧🇴',
    localContext: `El usuario cocina desde Bolivia.
- Ingredientes locales accesibles: papa (muchas variedades, incluso chuño), maíz, quinua, ají amarillo/colorado, llajwa (salsa), locoto, queso criollo, charque, plátano (oriente), yuca.
- Platos referencia: salteñas, silpancho, sajta de pollo, pique macho, fricasé, anticucho, chuño phuti, api con pastel.
- Usa nombres locales: choclo, locoto (similar a rocoto), llajwa, chuño.`,
  },
  {
    code: 'PY',
    name: 'Paraguay',
    flag: '🇵🇾',
    localContext: `El usuario cocina desde Paraguay.
- Ingredientes locales accesibles: mandioca (yuca), harina de maíz, queso paraguay, locro, poroto, choclo, batata, cebolla, ajo.
- Platos referencia: sopa paraguaya (no es sopa, es tipo torta), chipa, mbeju, vorí vorí, chipa guasú, locro, mbaipy.
- Usa nombres locales: mandioca, chipa, kivevé (zapallo dulce).`,
  },
  {
    code: 'CR',
    name: 'Costa Rica',
    flag: '🇨🇷',
    localContext: `El usuario cocina desde Costa Rica.
- Ingredientes locales accesibles: gallo pinto (frijol negro o rojo + arroz), plátano maduro, yuca, queso turrialba, natilla, salsa Lizano (importante en muchas recetas), tomate, cilantro, culantro coyote, chiverre, palmito.
- Platos referencia: gallo pinto, casado, olla de carne, picadillo, tamales, sopa negra, chifrijo, arreglados.
- Usa nombres locales: gallo pinto, casado, chayote, pejibaye, frescos (jugos), tico/tica.`,
  },
  {
    code: 'PA',
    name: 'Panamá',
    flag: '🇵🇦',
    localContext: `El usuario cocina desde Panamá.
- Ingredientes locales accesibles: arroz, frijoles, plátano, yuca, ñame, otoe, culantro, ají chombo, queso blanco, achiote, sao (limón con cebolla y ají).
- Platos referencia: sancocho panameño (con culantro), arroz con guandú, ropa vieja, hojaldra, carimañola, tamales, patacones.
- Usa nombres locales: guandú (frijol específico), patacones, ñame, otoe.`,
  },
  {
    code: 'DO',
    name: 'República Dominicana',
    flag: '🇩🇴',
    localContext: `El usuario cocina desde República Dominicana.
- Ingredientes locales accesibles: arroz, habichuelas (rojas, negras), plátano (verde y maduro), yuca, batata, ñame, auyama, cilantro ancho (culantro), ají cubanela, cebolla, ajo, tomate.
- Platos referencia: la bandera (arroz + habichuelas + carne), mangú, mofongo dominicano, sancocho, locrio, asopado, habichuelas con dulce, sancocho de siete carnes.
- Usa nombres locales: habichuelas (no frijoles), mangú, tostones, plátano maduro frito.`,
  },
  {
    code: 'GT',
    name: 'Guatemala',
    flag: '🇬🇹',
    localContext: `El usuario cocina desde Guatemala.
- Ingredientes locales accesibles: maíz, frijol negro, chile (chiltepe, guaque, pasa, chipilín), cilantro, miltomate (tomate verde), tomate, cebolla, achiote, queso seco, recado (salsa local).
- Platos referencia: pepián, kak'ik, jocón, hilachas, tamales colorados/negros, fiambre, chiles rellenos, atol de elote, tortillas de maíz, chuchitos.
- Usa nombres locales: pepián, recado, chilaquila, chipilín, izote.`,
  },
  {
    code: 'US',
    name: 'EE.UU. (hispano)',
    flag: '🇺🇸',
    localContext: `El usuario cocina desde Estados Unidos (probablemente comunidad hispana).
- Ingredientes accesibles: gran variedad en supermercados (Walmart, HEB, Whole Foods, mercados latinos como Fiesta, Northgate, etc.).
- Productos importados: la mayoría de ingredientes latinos disponibles en tiendas especializadas (Goya, Iberia, Maseca, Knorr).
- Usa medidas en sistema métrico O imperial según el usuario indique; muchos hispanos en EE.UU. usan ambos. Por defecto usa métrico y entre paréntesis imperial si es útil.
- Platos referencia: variará según país de origen del usuario — pregúntale si tiene preferencia.
- Considera el contexto: el usuario puede tener acceso a ingredientes asiáticos o europeos también; pero NO los asumas — sigue la regla inviolable.`,
  },
  {
    code: 'OTHER',
    name: 'Otro',
    flag: '🌎',
    localContext: `El usuario cocina desde un país no especificado.
- Usa español neutro y términos genéricos cuando sea posible.
- Cuando uses un ingrediente, da el nombre genérico Y entre paréntesis 1-2 sinónimos comunes ("aguacate (palta)", "plátano (banana macho / cambur)").
- Pregunta al usuario por su país si se vuelve relevante para la receta.
- No asumas accesibilidad de ingredientes regionales.`,
  },
];

/** Helper para obtener el bloque de contexto de un país por código. */
export function getCountryContext(code: string | undefined | null): string {
  if (!code) return '';
  const found = COUNTRIES.find(c => c.code === code);
  return found?.localContext ?? '';
}

/** Helper para obtener un país completo por código. */
export function getCountry(code: string | undefined | null): Country | undefined {
  if (!code) return undefined;
  return COUNTRIES.find(c => c.code === code);
}
