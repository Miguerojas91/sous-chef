/** Nivel 10, Mundo 3: Mar de Sabores (Premium). Elaboración de fondo oscuro de res. */
import { LevelPage } from './LevelPage';

const STEPS = [
  {
    num: 1, title: 'La diferencia: huesos tostados', emoji: '🔥',
    desc: 'El fondo oscuro (fond brun) usa huesos tostados en horno a 220°C hasta que sean de color marrón profundo. Este tostado crea reacción de Maillard en los huesos, que aporta sabores que un fondo blanco no tiene.',
    tip: 'Busca un color caoba oscuro. Si los huesos se ven grises o negros, están quemados y amargan. La línea entre tostado y quemado es de 10 minutos. Vigila el horno.',
  },
  {
    num: 2, title: 'Tostar los huesos y la mirepoix', emoji: '🦴',
    desc: 'Coloca los huesos en una bandeja de horno aceitada. Hornea a 220°C por 30–40 minutos hasta color caoba. En los últimos 15 minutos, agrega la mirepoix (cebolla, zanahoria, apio) a la bandeja para que también se tueste. Voltea los huesos a mitad.',
    tip: 'El tostado de la mirepoix junto al hueso añade capas de sabor. La cebolla quemada en sus bordes añade el color oscuro característico del jus y las salsas oscuras.',
  },
  {
    num: 3, title: 'Desglasar la bandeja', emoji: '🥂',
    desc: 'Transfiere los huesos y la mirepoix tostados a la olla. A la bandeja caliente vacía, agrega vino tinto o agua y raspa todos los residuos adheridos al fondo (el "fond"): esos depósitos son azúcares caramelizados y proteínas con sabor concentrado.',
    tip: 'Este proceso es "desglasar". Los residuos del fondo de la bandeja se llaman "sucs" en cocina francesa. Son el sabor más concentrado de toda la preparación.',
  },
  {
    num: 4, title: 'Pasta de tomate y cocción larga', emoji: '🍅',
    desc: 'En la olla con huesos añade la concentración de la bandeja, pasta de tomate (1 cucharada), agua fría y bouquet garni. Lleva a hervor suave. Cocina a fuego muy bajo 6–8 horas. Desespuma la primera hora. No tapes.',
    tip: 'La pasta de tomate le da acidez, cuerpo y el color oscuro característico. Sin ella el fondo es marrón pálido. Agrégala directamente sobre los huesos y cocina un minuto antes de añadir el agua.',
  },
  {
    num: 5, title: 'Reducción final: el jus', emoji: '✨',
    desc: 'Después de colar, reduce el fondo a la mitad a fuego medio. Este proceso concentra y crea "jus de veau" o jus de res. Para "glace de viande", reduce hasta 1/10 hasta obtener textura de almíbar espeso.',
    tip: 'Una cucharada de glace de viande añadida a cualquier salsa la intensifica de inmediato.',
  },
];

const ERRORS = [
  { icon: '⬛', error: 'Huesos quemados (negro/amargo)', fix: '220°C máx y vigila cada 10 min los últimos 20 min. Si están negros, amargan. No tiene arreglo: empieza de nuevo.' },
  { icon: '💧', error: 'Fondo turbio', fix: 'El hervor fuerte fragmenta las proteínas. Fuego muy bajo, solo pequeñas burbujas. Desespuma los primeros 30 min.' },
  { icon: '😞', error: 'Sin cuerpo ni color', fix: 'Los huesos no estaban tostados lo suficiente. El tostado es la clave del fondo oscuro. Busca color caoba.' },
  { icon: '⏰', error: 'Tiempo insuficiente', fix: 'El fondo oscuro necesita 6–8 horas. Con menos tiempo no extraes el colágeno ni desarrollas complejidad.' },
];

const RECIPE = {
  name: 'Jus de Res y Salsa Demi-Glace',
  description: 'La demi-glace es la base de las salsas oscuras de la cocina francesa clásica, como la périgueux, la bordelesa y la chasseur.',
  servings: '6 personas',
  time: '8 horas',
  difficulty: '⭐⭐⭐⭐',
  ingredients: [
    '2 kg de huesos de res con tuétano',
    '500 g de mirepoix (cebolla, zanahoria, apio)',
    '2 cucharadas de pasta de tomate',
    '300 ml de vino tinto seco',
    '3 litros de agua fría',
    '1 bouquet garni grande (laurel, tomillo, perejil, romero)',
    '(Para demi-glace) fondo oscuro + espesante opcional',
  ],
  method: [
    'Hornea los huesos a 220°C por 40 min hasta color caoba. Voltea a la mitad.',
    'Añade mirepoix los últimos 15 min del tostado.',
    'Desglasa la bandeja con vino tinto, raspando todos los sucs.',
    'Transfiere todo a olla grande. Agrega pasta de tomate, agua fría y bouquet garni.',
    'Hierve, baja al mínimo. Cocina 8 horas a fuego muy bajo sin tapa. Desespuma la primera hora.',
    'Cuela sin presionar. Reduce a la mitad para obtener jus. Reduce a 1/4 para demi-glace espesa.',
  ],
};

export const FondoOscuroLevel = () => (
  <LevelPage
    worldName="Mar de Sabores" worldEmoji="🌊"
    levelNum={10} levelName="Fondo Oscuro" levelEmoji="🥣" xpReward={100}
    world={3}
    missionText="Preparar un <strong>fondo oscuro/jus de res</strong> con huesos tostados: color marrón profundo, rico en gelatina y sabor complejo. Fotografía el jus reducido en una cuchara o vaso corto mostrando su color oscuro y brillante."
    missionTags={[
      { icon: '⏱️', label: '6–8 horas' },
      { icon: '🔥', label: 'Tostado en horno' },
    ]}
    steps={STEPS}
    errors={ERRORS}
    recipe={RECIPE}
    challengeHint="Muestra una cucharada del jus o un vaso corto con el fondo. El color debe ser marrón oscuro y brillante. Si gelatinizó, muéstralo cortado."
    evaluationCriteria={[
      { stars: '⭐⭐⭐', label: 'Color oscuro brillante, gelatinizado' },
      { stars: '⭐⭐', label: 'Buen color, buen aroma, algo líquido' },
      { stars: '⭐', label: 'Huesos tostados, aunque resultado claro' },
    ]}
  />
);
