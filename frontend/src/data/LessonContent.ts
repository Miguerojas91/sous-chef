export interface LessonSection {
  type: 'text' | 'list' | 'tip' | 'warning' | 'steps' | 'table';
  title?: string;
  content: string | string[] | { col1: string; col2: string }[];
}

export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface LessonData {
  id: string;
  intro: string;
  sections: LessonSection[];
  keyPoints: string[];
  quiz: QuizQuestion[];
}

export const LESSON_CONTENT: Record<string, LessonData> = {
  'HigieneySeguridadenlaCocina': {
    id: 'higiene',
    intro: 'Una cocina segura no es opcional — es la base de todo. El 70% de las intoxicaciones alimentarias ocurren en entornos domésticos por prácticas incorrectas. Esta lección te da las herramientas para protegerte a ti y a quienes cocinan contigo.',
    sections: [
      {
        type: 'text',
        title: 'La Zona de Peligro de Temperatura',
        content: 'Los patógenos (bacterias, virus, parásitos) se multiplican de forma exponencial entre 4°C y 60°C. A 37°C — temperatura corporal — una bacteria puede duplicarse cada 20 minutos. En 8 horas, una sola bacteria se convierte en más de 16 millones.',
      },
      {
        type: 'table',
        title: 'Temperaturas críticas',
        content: [
          { col1: 'Por debajo de 4°C', col2: 'Refrigeración segura — el crecimiento se detiene' },
          { col1: '4°C – 60°C', col2: 'ZONA DE PELIGRO — multiplicación activa' },
          { col1: '60°C – 74°C', col2: 'Zona de cocción — los patógenos empiezan a morir' },
          { col1: 'Por encima de 74°C', col2: 'Cocción segura — destrucción de la mayoría de patógenos' },
        ],
      },
      {
        type: 'warning',
        content: 'Nunca dejes alimentos cocidos a temperatura ambiente por más de 2 horas. En días calurosos (>32°C), ese límite se reduce a 1 hora.',
      },
      {
        type: 'text',
        title: 'Contaminación Cruzada',
        content: 'La contaminación cruzada ocurre cuando patógenos de un alimento se transfieren a otro, generalmente de alimentos crudos a cocidos. Es la causa número uno de intoxicaciones en cocinas domésticas.',
      },
      {
        type: 'list',
        title: 'Reglas para evitar contaminación cruzada',
        content: [
          'Usa tablas de corte separadas: roja para carnes, verde para verduras, azul para pescados',
          'Nunca cortes vegetales frescos en la misma tabla donde cortaste pollo crudo',
          'Lava y desinfecta la tabla entre cada tipo de alimento',
          'Guarda carnes crudas en el estante inferior del refrigerador, siempre selladas',
          'Nunca uses el mismo utensilio para alimentos crudos y cocidos sin lavarlo',
        ],
      },
      {
        type: 'steps',
        title: 'Técnica correcta de lavado de manos',
        content: [
          'Moja las manos con agua tibia',
          'Aplica jabón y frota durante al menos 20 segundos — incluye el dorso, entre los dedos y debajo de las uñas',
          'Enjuaga completamente con agua corriente',
          'Seca con papel desechable (no tela reutilizable)',
          'Cierra el grifo con el papel para evitar recontaminación',
        ],
      },
      {
        type: 'tip',
        content: 'Lava tus manos cada vez que cambies de tarea: después de manipular carne cruda, antes de tocar alimentos listos para consumir, después de estornudar o tocar tu cara, y al inicio de cualquier sesión de cocina.',
      },
      {
        type: 'text',
        title: 'Almacenamiento Seguro',
        content: 'El sistema PEPS (Primero en Entrar, Primero en Salir) garantiza que los alimentos más antiguos se usen antes. Etiqueta todo con fecha de entrada y usa siempre el producto más antiguo al frente.',
      },
      {
        type: 'list',
        title: 'Tiempos máximos de refrigeración (4°C)',
        content: [
          'Carnes crudas de res/cerdo: 3–5 días',
          'Pollo crudo: 1–2 días',
          'Pescado crudo: 1–2 días',
          'Sobras cocidas: 3–4 días',
          'Huevos: 3–5 semanas en cáscara',
        ],
      },
    ],
    keyPoints: [
      'La zona de peligro es 4°C–60°C: nunca dejes comida ahí más de 2 horas',
      'Usa tablas separadas por color para cada tipo de alimento',
      'El lavado de manos dura mínimo 20 segundos con jabón',
      'PEPS: lo más viejo se usa primero',
      'Pollo crudo solo dura 1–2 días en el refrigerador',
    ],
    quiz: [
      {
        q: '¿Cuál es la temperatura máxima de la zona de peligro?',
        options: ['40°C', '55°C', '60°C', '74°C'],
        correct: 2,
        explanation: 'La zona de peligro termina a 60°C. Por encima de esa temperatura los patógenos comienzan a morir. La cocción segura generalmente requiere llegar a 74°C o más.',
      },
      {
        q: '¿Cuánto tiempo máximo puedes dejar alimentos cocidos a temperatura ambiente?',
        options: ['30 minutos', '1 hora', '2 horas', '4 horas'],
        correct: 2,
        explanation: 'El límite es 2 horas a temperatura normal. En ambientes calurosos (>32°C) se reduce a 1 hora porque las bacterias se multiplican más rápido.',
      },
      {
        q: '¿Cuánto tiempo debe durar el lavado correcto de manos?',
        options: ['5 segundos', '10 segundos', '20 segundos', '60 segundos'],
        correct: 2,
        explanation: '20 segundos es el mínimo recomendado por organizaciones de salud mundial. Un truco: canta "Cumpleaños Feliz" dos veces, eso dura exactamente 20 segundos.',
      },
    ],
  },

  'AnatomíadelCuchillodeChef': {
    id: 'cuchillo',
    intro: 'El cuchillo de chef es la extensión de tu mano en la cocina. Un cuchillo bien afilado y bien sostenido corta con menos fuerza, menos fatiga y menos riesgo de accidente. Conocer cada parte te permite mantenerlo en óptimas condiciones de por vida.',
    sections: [
      {
        type: 'list',
        title: 'Las partes del cuchillo de chef',
        content: [
          'Punta (tip): el extremo delgado, ideal para cortes de precisión y trabajo fino',
          'Filo (edge): el borde cortante. Su ángulo determina qué tan afilado puede estar',
          'Lomo (spine): el lado opuesto al filo, más grueso. Sirve de guía al cortar',
          'Talón (heel): la parte más ancha del filo, para cortar cosas duras',
          'Guarda (bolster): el engrosamiento entre la hoja y el mango, protege los dedos',
          'Mango (handle): donde agarra la mano. Puede ser madera, plástico o composite',
          'Remaches (rivets): fijan la espiga al mango en cuchillos de construcción clásica',
          'Espiga (tang): la extensión de la hoja dentro del mango. Espiga completa = mejor balance',
        ],
      },
      {
        type: 'text',
        title: 'Acero inoxidable vs. Acero al carbono',
        content: 'La elección del acero afecta directamente cómo se afila el cuchillo, cuánto mantiene el filo y qué cuidados necesita. No hay un "mejor" absoluto — depende de tu uso y disciplina de mantenimiento.',
      },
      {
        type: 'table',
        title: 'Comparación de aceros',
        content: [
          { col1: 'Acero inoxidable', col2: 'Acero al carbono' },
          { col1: 'Resiste la oxidación y manchas', col2: 'Se oxida si no se seca bien' },
          { col1: 'Más fácil de mantener', col2: 'Requiere más cuidado' },
          { col1: 'Filo bueno pero no excepcional', col2: 'Filo más fino y duradero' },
          { col1: 'Ideal para uso doméstico', col2: 'Preferido por chefs profesionales' },
        ],
      },
      {
        type: 'steps',
        title: 'Cómo afilar con piedra de agua',
        content: [
          'Sumerge la piedra en agua 10 minutos antes de usarla (para piedras de agua)',
          'Coloca la piedra sobre un paño húmedo antideslizante en la mesa',
          'Sostén el cuchillo a 15–20° respecto a la piedra (aproximadamente el grosor de dos monedas apiladas)',
          'Desliza el filo hacia adelante con presión suave y constante, como si quisieras "afeitar" la piedra',
          'Haz 10 pasadas por cada lado, alternando para mantener la simetría',
          'Termina con la piedra de grano fino para pulir el filo',
          'Limpia el cuchillo con un paño y prueba el filo cortando papel: debe hacerlo limpiamente',
        ],
      },
      {
        type: 'tip',
        content: 'La chaira NO afila el cuchillo — lo realinea. Usa la chaira antes de cada sesión de cocina para mantener el filo recto. Usa la piedra cuando el cuchillo ya no corta bien aunque la chaira no ayude.',
      },
      {
        type: 'steps',
        title: 'Técnica correcta con la chaira',
        content: [
          'Sostén la chaira verticalmente con la punta apoyada en la tabla de corte',
          'Apoya el talón del cuchillo en la parte superior de la chaira a 15–20°',
          'Desliza el cuchillo hacia abajo y hacia ti, manteniendo el ángulo constante',
          'Alterna lado izquierdo y derecho: 5 pasadas por cada lado',
        ],
      },
      {
        type: 'warning',
        content: 'Un cuchillo desafilado es más peligroso que uno afilado. El filo romo requiere más fuerza, lo que aumenta la probabilidad de que resbale. Afila tus cuchillos con regularidad.',
      },
    ],
    keyPoints: [
      'La espiga completa (full tang) garantiza mejor balance y durabilidad',
      'El ángulo de afilado correcto es 15–20° para la mayoría de cuchillos occidentales',
      'La chaira realinea el filo, la piedra lo afila — son herramientas diferentes',
      'El acero al carbono mantiene mejor filo pero necesita más cuidado que el inoxidable',
      'Nunca pongas cuchillos buenos en el lavavajillas — destruye el filo y el mango',
    ],
    quiz: [
      {
        q: '¿Cuál es la función principal de la chaira?',
        options: ['Afilar el cuchillo removiendo acero', 'Realinear el filo sin remover material', 'Pulir el acabado de la hoja', 'Endurecer el acero'],
        correct: 1,
        explanation: 'La chaira realinea los microscópicos dientes del filo que se doblan con el uso. No remueve acero como la piedra de afilar. Se usa frecuentemente (antes de cada uso), mientras que la piedra se usa ocasionalmente.',
      },
      {
        q: '¿A qué ángulo se afila un cuchillo de chef occidental?',
        options: ['5–10°', '15–20°', '25–30°', '45°'],
        correct: 1,
        explanation: '15–20° es el ángulo estándar para cuchillos occidentales. Los cuchillos japoneses se afilan a 10–15° (filo más fino pero más frágil). El ángulo correcto es fundamental para un buen resultado.',
      },
      {
        q: '¿Qué significa que un cuchillo tiene "espiga completa" (full tang)?',
        options: ['Que está hecho de acero al carbono', 'Que la hoja se extiende a lo largo de todo el mango', 'Que tiene un guarda de metal', 'Que es de fabricación japonesa'],
        correct: 1,
        explanation: 'La espiga completa significa que el metal de la hoja se extiende hasta el final del mango. Esto da mejor balance, mayor durabilidad y se considera un indicador de calidad en cuchillos profesionales.',
      },
    ],
  },

  'CorteJuliana:TécnicayPráctica': {
    id: 'juliana',
    intro: 'La Juliana es el corte de bastones más fundamental en cocina clásica: 3 mm × 3 mm × 6 cm. Aparece en ensaladas, salteados, sopas y guarniciones de todo el mundo. Dominarlo significa dominar la base de docenas de preparaciones.',
    sections: [
      {
        type: 'text',
        title: '¿Por qué importan las medidas exactas?',
        content: 'En cocina profesional, la uniformidad no es estética — es funcional. Si los bastones tienen diferente grosor, los delgados se queman mientras los gruesos quedan crudos. La Juliana clásica de 3 mm garantiza cocción pareja en 2–3 minutos de salteado.',
      },
      {
        type: 'table',
        title: 'Variantes del corte en bastón',
        content: [
          { col1: 'Juliana clásica', col2: '3mm × 3mm × 6cm — la más usada' },
          { col1: 'Juliana fina (allumette)', col2: '1.5mm × 1.5mm × 6cm — para guarniciones delicadas' },
          { col1: 'Jardinera', col2: '5mm × 5mm × 4cm — para guisos y estofados' },
          { col1: 'Bastón (batonnet)', col2: '6mm × 6mm × 6cm — base del dado grande' },
        ],
      },
      {
        type: 'steps',
        title: 'Técnica paso a paso con zanahoria',
        content: [
          'Lava y pela la zanahoria. Córtala en segmentos de 6 cm de largo',
          'Corta una cara plana en el segmento para estabilizarlo sobre la tabla — nunca cortes un cilindro que rueda',
          'Lamina el segmento en planchas de 3 mm de grosor, manteniendo presión constante con los nudillos doblados en garra',
          'Apila 3–4 láminas y alinéalas con precisión',
          'Corta las láminas apiladas en bastones de 3 mm — de nuevo con la garra de gato guiando el cuchillo',
          'Revisa: coloca 10 bastones juntos. Si los bordes son parejos, la técnica es correcta',
        ],
      },
      {
        type: 'tip',
        title: 'La garra de gato',
        content: 'Dobla los dedos hacia adentro formando una garra. Los nudillos actúan como guía del cuchillo — el filo nunca toca las yemas. Esto te permite mover la mano hacia atrás con velocidad y seguridad, controlando el grosor de cada lámina.',
      },
      {
        type: 'list',
        title: 'Errores comunes y cómo corregirlos',
        content: [
          'Bastones de grosor irregular → revisa que las láminas tengan grosor uniforme antes de apilar',
          'La pila se desmorona al cortar → asegúrate de que las láminas están bien alineadas y planas',
          'El cuchillo se atasca → afila el cuchillo o usa más longitud de hoja con movimiento de arrastre',
          'Los bastones tienen diferentes longitudes → usa un segmento de exactamente 6 cm como guía inicial',
        ],
      },
      {
        type: 'list',
        title: 'Aplicaciones de la juliana',
        content: [
          'Ramen y pho: zanahoria juliana como topping clásico',
          'Pad Thai y salteados asiáticos: zanahoria, pepino y puerro',
          'Ensalada de col (coleslaw): repollo en juliana fina',
          'Consommé garnish: vegetales en juliana como brunoise de la sopa',
          'Primavera rolls y spring rolls: zanahoria, pepino, pimiento',
        ],
      },
    ],
    keyPoints: [
      'La medida exacta es 3mm × 3mm × 6cm — la uniformidad es funcional, no solo visual',
      'Siempre crea una base plana antes de laminar para evitar que el alimento ruede',
      'La garra de gato protege los dedos y controla el grosor del corte',
      'Lamina primero, apila y alinea, luego corta en bastones',
      'La juliana es la base del brunoise: si dominas la juliana, el brunoise es solo un paso más',
    ],
    quiz: [
      {
        q: '¿Cuáles son las medidas exactas de la Juliana clásica?',
        options: ['1mm × 1mm × 4cm', '3mm × 3mm × 6cm', '5mm × 5mm × 5cm', '2mm × 2mm × 8cm'],
        correct: 1,
        explanation: '3mm × 3mm × 6cm es la medida estándar de la Juliana clásica en cocina profesional. Estas medidas garantizan cocción uniforme y presentación consistente.',
      },
      {
        q: '¿Por qué es importante crear una base plana antes de cortar?',
        options: ['Para que el corte sea más decorativo', 'Para estabilizar el alimento y evitar que ruede', 'Para reducir el desperdicio', 'Porque lo exige la técnica francesa'],
        correct: 1,
        explanation: 'La base plana estabiliza el alimento sobre la tabla de corte. Sin ella, el vegetal (especialmente los cilíndricos como zanahoria o pepino) rueda, lo que hace el corte peligroso e impreciso.',
      },
      {
        q: '¿Qué es la "garra de gato" en el corte?',
        options: ['Una herramienta especial para corte fino', 'La posición de los dedos doblados que guía el cuchillo', 'Una técnica para afilar cuchillos', 'El movimiento de arrastre del cuchillo'],
        correct: 1,
        explanation: 'La garra de gato es la posición donde los dedos se doblan hacia adentro, exponiendo los nudillos como guía del cuchillo. Protege las yemas y permite control preciso del grosor.',
      },
    ],
  },

  'TemperaturasSegurasdeCocción': {
    id: 'temperaturas',
    intro: 'Las temperaturas internas de cocción son la última línea de defensa contra patógenos alimentarios. Cocinar por vista y tacto es impreciso — un termómetro de cocina es la única forma de saber con certeza si un alimento es seguro.',
    sections: [
      {
        type: 'table',
        title: 'Temperaturas internas mínimas seguras',
        content: [
          { col1: 'Aves (pollo, pavo)', col2: '74°C (165°F) — sin excepción' },
          { col1: 'Carnes molidas (res, cerdo)', col2: '71°C (160°F)' },
          { col1: 'Res, cordero (entero)', col2: '63°C (145°F) + 3 min reposo' },
          { col1: 'Cerdo (entero)', col2: '63°C (145°F) + 3 min reposo' },
          { col1: 'Pescados y mariscos', col2: '63°C (145°F)' },
          { col1: 'Huevos (preparaciones)', col2: '71°C (160°F)' },
          { col1: 'Rellenos y guisos', col2: '74°C (165°F)' },
        ],
      },
      {
        type: 'warning',
        content: 'Las aves tienen tolerancia CERO. A diferencia de la carne de res que puede servirse a 63°C (término medio), el pollo siempre debe llegar a 74°C en su parte más gruesa — generalmente el muslo cerca del hueso.',
      },
      {
        type: 'steps',
        title: 'Cómo usar correctamente el termómetro',
        content: [
          'Inserta el termómetro en la parte más gruesa del alimento',
          'Evita tocar huesos, grasa o el fondo del sartén — darán lecturas falsas',
          'Espera 5–10 segundos hasta que la lectura se estabilice',
          'En aves enteras, mide en el muslo entre el hueso y la parte gruesa',
          'Para hamburguesas o carnes molidas, inserta desde el lado hasta el centro',
          'Limpia el termómetro entre mediciones para evitar contaminación cruzada',
        ],
      },
      {
        type: 'text',
        title: 'El tiempo de reposo',
        content: 'Cuando retiras la carne del fuego, la temperatura interna continúa subiendo 3–5°C por conducción residual (carryover cooking). El reposo también permite que los jugos se redistribuyan. Para carnes enteras, deja reposar 5–10 minutos antes de cortar.',
      },
      {
        type: 'tip',
        content: 'Para el pollo, si no tienes termómetro, inserta un cuchillo en la parte más gruesa y presiona. Si los jugos salen completamente transparentes (sin rastro rosado), está cocido. Pero un termómetro es siempre más confiable.',
      },
      {
        type: 'list',
        title: 'Temperaturas de servicio para alimentos calientes y fríos',
        content: [
          'Alimentos calientes: mantener a 60°C o más durante el servicio',
          'Alimentos fríos: mantener a 4°C o menos',
          'Buffets: cambiar los recipientes cada 2 horas si no tienen control de temperatura',
          'Recalentar sobras: llevar a 74°C antes de servir',
        ],
      },
    ],
    keyPoints: [
      'Aves siempre a 74°C — es el único alimento sin excepción posible',
      'La carne de res entera puede servirse a 63°C (punto medio-bien) con 3 min de reposo',
      'Inserta el termómetro en la parte más gruesa, lejos de huesos',
      'El carryover cooking sube la temperatura 3–5°C después de retirar del fuego',
      'Recalentar siempre a 74°C — nunca "solo hasta que esté caliente"',
    ],
    quiz: [
      {
        q: '¿A qué temperatura interna debe llegar el pollo?',
        options: ['63°C', '68°C', '71°C', '74°C'],
        correct: 3,
        explanation: '74°C (165°F) es la temperatura mínima para aves sin excepción. A diferencia de otras carnes, el pollo no tiene un "término medio" seguro — siempre debe cocinarse completamente.',
      },
      {
        q: '¿Por qué no debes tocar el hueso al medir temperatura?',
        options: ['Porque el hueso no conduce calor', 'Porque el hueso da lecturas más altas y engañosas', 'Porque daña el termómetro', 'Porque el hueso siempre está más frío que la carne'],
        correct: 1,
        explanation: 'El hueso conduce el calor de forma diferente a la carne y suele dar lecturas más altas. Podrías creer que el alimento está listo cuando la carne todavía no alcanzó la temperatura segura.',
      },
      {
        q: '¿Qué es el "carryover cooking"?',
        options: ['Una técnica de cocción lenta', 'El aumento de temperatura que continúa después de retirar del fuego', 'Cocinar múltiples alimentos al mismo tiempo', 'Recalentar comida del día anterior'],
        correct: 1,
        explanation: 'El carryover cooking es el calor residual que sigue cocinando la carne después de retirarla del fuego. Por eso se retiran los cortes 3–5°C antes de la temperatura objetivo y se deja reposar.',
      },
    ],
  },

  'MiseenPlace:ElArtedelaPreparación': {
    id: 'miseenplace',
    intro: 'Mise en place es el principio más importante de la cocina profesional. Traducido del francés como "cada cosa en su lugar", transforma el caos de cocinar bajo presión en un proceso fluido y controlado. Todo gran chef lo practica antes de encender el primer fuego.',
    sections: [
      {
        type: 'text',
        title: 'El concepto y su origen',
        content: 'El sistema fue formalizado por Auguste Escoffier en el siglo XIX para gestionar las brigadas de grandes hoteles parisinos. La idea es simple: todo lo que vas a necesitar durante la cocción debe estar listo, medido, cortado y en su lugar antes de empezar a cocinar. Así, cuando el tiempo importa, solo ejecutas — no buscas ni preparas.',
      },
      {
        type: 'steps',
        title: 'Cómo organizar tu mise en place',
        content: [
          'Lee la receta completa antes de tocar cualquier ingrediente — entiende el flujo total',
          'Prepara y limpia tu estación de trabajo (tabla, cuchillo, trapos)',
          'Saca todos los ingredientes y verifica que los tienes todos',
          'Pesa, mide y organiza los ingredientes en bowls o recipientes por orden de uso',
          'Prepara las herramientas: sartenes, ollas, espátulas, termómetro',
          'Corta y procesa todos los vegetales, carnes y proteínas antes de encender el fuego',
          'Prepara salsas base, fondos o cualquier componente previo',
        ],
      },
      {
        type: 'tip',
        content: 'En cocina profesional, cuando el chef grita "¡servicio!" o empieza el turno, todo ya debe estar listo. La mise en place fue hecha antes. Durante el servicio solo se cocina — nunca se busca, nunca se mide.',
      },
      {
        type: 'list',
        title: 'Beneficios concretos de la mise en place',
        content: [
          'Elimina los errores por olvido de ingredientes a mitad de la cocción',
          'Reduce el tiempo real de cocina hasta un 40%',
          'Permite cocinar múltiples platos simultáneamente sin perder el control',
          'Reduce el estrés — sabes exactamente qué viene después',
          'Identifica faltantes antes de que sea tarde para ir al mercado',
        ],
      },
      {
        type: 'text',
        title: 'La mise en place mental',
        content: 'Además de la física, existe la mise en place mental: visualizar la receta completa antes de ejecutarla. Los chefs experimentados "cocinan" la receta en su cabeza identificando los puntos críticos, los timings simultáneos y posibles problemas antes de empezar.',
      },
      {
        type: 'warning',
        content: 'El error más común al aprender cocina: empezar a saltear cuando los vegetales aún no están cortados. El aceite se quema, la cocción falla. Mise en place primero, fuego después.',
      },
    ],
    keyPoints: [
      'Mise en place significa "cada cosa en su lugar" antes de encender el fuego',
      'Lee la receta completa antes de tocar cualquier ingrediente',
      'Mide, corta y organiza todo en recipientes por orden de uso',
      'Prepara las herramientas igual que los ingredientes',
      'La mise en place mental (visualizar) es tan importante como la física',
    ],
    quiz: [
      {
        q: '¿Qué significa "mise en place"?',
        options: ['Receta completa', 'Cada cosa en su lugar', 'Lista de ingredientes', 'Estación de trabajo'],
        correct: 1,
        explanation: '"Mise en place" es francés para "cada cosa en su lugar". El concepto implica tener todo preparado, medido y organizado antes de comenzar a cocinar.',
      },
      {
        q: '¿Cuándo debes leer la receta completa?',
        options: ['Mientras cocinas', 'Antes de tocar cualquier ingrediente', 'Solo al inicio de la cocción', 'Cuando no sabes qué sigue'],
        correct: 1,
        explanation: 'Leer la receta completa antes de empezar te permite entender el flujo, identificar técnicas especiales, anticipar timings y verificar que tienes todos los ingredientes.',
      },
      {
        q: '¿Cuál es el error más común relacionado con la mise en place?',
        options: ['Medir ingredientes con anticipación', 'Empezar a cocinar antes de terminar de preparar', 'Usar demasiados recipientes', 'Preparar ingredientes en orden inverso'],
        correct: 1,
        explanation: 'Empezar a cocinar (encender el fuego, saltear) antes de tener todos los ingredientes listos es el error más frecuente. El aceite se sobrecalienta y la cocción sale mal.',
      },
    ],
  },

  'ManejoyConservacióndeProteínas': {
    id: 'proteinas',
    intro: 'Las proteínas animales son el ingrediente más caro y el más peligroso si se maneja mal. Conocer cómo comprar, almacenar y preparar carnes, aves y pescados correctamente es la diferencia entre un plato extraordinario y una intoxicación alimentaria.',
    sections: [
      {
        type: 'list',
        title: 'Señales de frescura en carnes',
        content: [
          'Res: color rojo cereza brillante (no café ni grisáceo), sin olor fuerte',
          'Cerdo: color rosado pálido a rosado oscuro, sin pegajosidad',
          'Aves: piel de color marfil o amarillo claro, sin manchas grises, sin olor amoniacal',
          'Pescado: ojos brillantes y salientes (no hundidos), agallas rojas, escamas adheridas, olor a mar (no a amoniaco)',
          'Mariscos vivos: deben moverse o cerrarse al tocarlos',
        ],
      },
      {
        type: 'table',
        title: 'Almacenamiento en refrigerador (4°C)',
        content: [
          { col1: 'Res entera o en trozo', col2: '3–5 días' },
          { col1: 'Carne molida de res', col2: '1–2 días' },
          { col1: 'Pollo entero o en piezas', col2: '1–2 días' },
          { col1: 'Pescado fresco', col2: '1–2 días (idealmente 24h)' },
          { col1: 'Mariscos (crudos)', col2: '1–2 días' },
          { col1: 'Embutidos abiertos', col2: '3–5 días' },
        ],
      },
      {
        type: 'steps',
        title: 'Descongelación segura (3 métodos)',
        content: [
          'Refrigerador (preferido): 12–24h para piezas pequeñas, 24–48h para piezas grandes. Seguro y preserva textura',
          'Agua fría: sumergir en bolsa sellada en agua fría, cambiar el agua cada 30 minutos. 1–3 horas para piezas normales',
          'Microondas: solo si vas a cocinar inmediatamente después — el microondas crea zonas calientes que favorecen bacterias',
          'NUNCA en el mesón a temperatura ambiente — es la forma más peligrosa y más usada',
        ],
      },
      {
        type: 'warning',
        content: 'No recongelar proteínas descongeladas a menos que las hayas cocinado primero. Al descongelar y recongelar se forman cristales de hielo que destruyen la textura y se facilita la multiplicación bacteriana.',
      },
      {
        type: 'text',
        title: 'El sistema PEPS para proteínas',
        content: 'Primero En entrar, Primero en Salir (FIFO en inglés). Cuando recibas proteínas nuevas, coloca las antiguas al frente del refrigerador. Etiqueta con fecha de compra. En restaurantes, este sistema es obligatorio por ley sanitaria.',
      },
      {
        type: 'tip',
        content: 'Almacena las carnes crudas siempre en el estante inferior del refrigerador, dentro de bolsas o recipientes sellados. Esto evita que los jugos goteen sobre otros alimentos y contaminen frutas, vegetales o alimentos listos para comer.',
      },
    ],
    keyPoints: [
      'El pescado fresco huele a mar, no a amoniaco — si huele fuerte, está pasado',
      'Pollo y pescado solo duran 1–2 días en refrigeración',
      'Nunca descongeles en el mesón a temperatura ambiente',
      'Las carnes crudas van en el estante inferior del refrigerador',
      'No recongelar sin cocinar primero',
    ],
    quiz: [
      {
        q: '¿Cuánto tiempo máximo dura el pollo crudo en el refrigerador?',
        options: ['4–5 días', '3 días', '1–2 días', '1 semana'],
        correct: 2,
        explanation: 'El pollo crudo solo dura 1–2 días en el refrigerador a 4°C. Si no lo vas a usar en ese tiempo, congélalo inmediatamente.',
      },
      {
        q: '¿Cuál es el método de descongelación más seguro?',
        options: ['Mesón a temperatura ambiente', 'Agua caliente', 'Refrigerador (12–24h)', 'Microondas siempre'],
        correct: 2,
        explanation: 'El refrigerador es el método más seguro porque mantiene la proteína en temperatura fría durante todo el proceso. El mesón es el más peligroso porque pasa tiempo en la zona de peligro (4–60°C).',
      },
      {
        q: '¿Qué significa PEPS en el contexto de almacenamiento?',
        options: ['Proteína En Perfectas condiciones Siempre', 'Primero En entrar, Primero en Salir', 'Proceso Estándar de Proteínas y Seguridad', 'Procedimiento para Evaluar Proteínas Seguras'],
        correct: 1,
        explanation: 'PEPS (FIFO en inglés) significa que los alimentos más antiguos se usan antes que los nuevos. Es un sistema de rotación que garantiza que nada se venza.',
      },
    ],
  },

  'FondosBásicos:ElAlmadelaCocina': {
    id: 'fondos',
    intro: 'Los fondos son la base de toda la cocina clásica europea. No son opcionales para un cocinero serio — son el vocabulario. Con un fondo bien hecho puedes construir cualquier salsa, cualquier guiso y cualquier consommé. Sin ellos, el sabor siempre tendrá un techo.',
    sections: [
      {
        type: 'text',
        title: 'Qué es un fondo y por qué importa',
        content: 'Un fondo es un líquido de cocción concentrado, resultante de hervir huesos, carcasas o espinas con vegetales aromáticos y hierbas a fuego suave durante horas. Es la diferencia entre una salsa de restaurante y una sopa de sobre. Escoffier escribió: "sin fondos no hay cocina".',
      },
      {
        type: 'table',
        title: 'Los 4 fondos clásicos',
        content: [
          { col1: 'Fondo Blanco (Fond Blanc)', col2: 'Huesos crudos de ternera o pollo + mirepoix. Base de salsas blancas (velouté, crema)' },
          { col1: 'Fondo Oscuro (Fond Brun)', col2: 'Huesos de res tostados + mirepoix caramelizado. Base de salsas oscuras (demi-glace)' },
          { col1: 'Fumet de Pescado', col2: 'Espinas de pescado blanco + vino blanco. Solo 20–30 min de cocción' },
          { col1: 'Fondo de Vegetales', col2: 'Vegetales de temporada. Base de cocina vegetariana y vegana' },
        ],
      },
      {
        type: 'steps',
        title: 'Fondo Blanco de Pollo — técnica básica',
        content: [
          'Blanquea los huesos: cubrirlos con agua fría, llevar a hervor, botar el agua. Esto limpia impurezas',
          'Cubre los huesos limpios con agua fría (nunca caliente — esto es fundamental)',
          'Lleva a hervor muy suave (80–90°C), retirando la espuma gris que sube (skimming)',
          'Agrega mirepoix: 2 partes cebolla, 1 parte zanahoria, 1 parte apio',
          'Agrega bouquet garni: laurel, tomillo, perejil, pimienta en grano',
          'Cocina a fuego muy bajo sin tapar: 3–4 horas para pollo, 6–8 para ternera',
          'Cuela, enfría en baño de hielo, refrigera. Retira la capa de grasa solidificada',
        ],
      },
      {
        type: 'tip',
        content: 'El secreto de un fondo limpio es empezar con agua fría y nunca hervir fuerte. El hervor suave extrae gelatina sin enturbiar el líquido. Un fondo turbio no es malo de sabor, pero sí de presentación.',
      },
      {
        type: 'steps',
        title: 'Fondo Oscuro — el paso extra: tostado',
        content: [
          'Tuesta los huesos en horno a 200°C hasta dorarlos (30–40 min) — esto crea la reacción de Maillard que da color oscuro y sabor profundo',
          'Carameliza el mirepoix en una olla con poco aceite',
          'Agrega pasta de tomate y cocina 2 min para reducir acidez',
          'Desglasa con vino tinto, rasca el fondo de la olla',
          'Continúa igual que el fondo blanco: agua fría, fuego suave, colar',
        ],
      },
      {
        type: 'warning',
        content: 'El fumet de pescado NO debe cocinarse más de 30 minutos. Las espinas de pescado liberan compuestos amargos después de ese tiempo. Es el único fondo que tiene un límite de tiempo tan corto.',
      },
    ],
    keyPoints: [
      'Empieza siempre con agua fría — el agua caliente enturbia el fondo',
      'El hervor debe ser apenas perceptible (80–90°C), nunca burbujeo violento',
      'El tostado de huesos es lo que da color oscuro y sabor profundo al fondo oscuro',
      'El fumet solo se cocina 20–30 min máximo o amarga',
      'Después de colar, enfría en baño de hielo para evitar la zona de peligro',
    ],
    quiz: [
      {
        q: '¿Por qué se comienza un fondo con agua fría?',
        options: ['Para ahorrar energía', 'Para extraer gradualmente la gelatina sin enturbiar', 'Porque el agua caliente quema los huesos', 'No importa la temperatura inicial'],
        correct: 1,
        explanation: 'El agua fría extrae las proteínas y la gelatina de los huesos de forma gradual. El agua caliente las coagula de golpe, dispersándolas en el líquido y causando turbidez.',
      },
      {
        q: '¿Cuánto tiempo máximo debe cocinarse el fumet de pescado?',
        options: ['1 hora', '2 horas', '30 minutos', '45 minutos'],
        correct: 2,
        explanation: 'El fumet de pescado solo requiere 20–30 minutos. Más tiempo libera compuestos amargos de las espinas que arruinan el sabor del fondo.',
      },
      {
        q: '¿Qué proceso le da el color oscuro al Fond Brun?',
        options: ['Agregar salsa de soya', 'Tostar los huesos en el horno (reacción de Maillard)', 'Cocinar durante más horas', 'Agregar pasta de tomate'],
        correct: 1,
        explanation: 'Los huesos se tuestan en horno a 200°C antes de hacer el fondo. Esta reacción de Maillard crea cientos de compuestos de sabor y el color café oscuro característico.',
      },
    ],
  },

  'CienciadelasEmulsiones': {
    id: 'emulsiones',
    intro: 'Una emulsión es la unión estable de dos líquidos que normalmente no se mezclan: aceite y agua. Mayonesa, holandesa, vinagreta y béarnaise — todas son emulsiones. Entender la ciencia detrás te permite prepararlas perfectamente y rescatarlas cuando se cortan.',
    sections: [
      {
        type: 'text',
        title: 'La física de una emulsión',
        content: 'El aceite y el agua se repelen mutuamente. Para crear una emulsión estable necesitas un emulsificante — una molécula que tenga un extremo que ame el agua (hidrófilo) y otro que ame el aceite (lipófilo). El emulsificante actúa como "pegamento" que mantiene las dos fases unidas.',
      },
      {
        type: 'list',
        title: 'Emulsificantes naturales en cocina',
        content: [
          'Lecitina del huevo (yema): el más poderoso y versátil — mayonesa, holandesa',
          'Mostaza: contiene mucílago que actúa como emulsificante — vinagretas',
          'Ajo: emulsificante natural suave — aioli tradicional',
          'Miel: ayuda a estabilizar vinagretas dulces',
        ],
      },
      {
        type: 'table',
        title: 'Tipos de emulsión',
        content: [
          { col1: 'Permanente (estable)', col2: 'Mayonesa, holandesa — requieren emulsificante fuerte' },
          { col1: 'Semipermanente', col2: 'Vinagreta con mostaza — se separa en horas' },
          { col1: 'Temporal', col2: 'Vinagreta simple — se separa en minutos' },
        ],
      },
      {
        type: 'steps',
        title: 'Técnica de mayonesa casera',
        content: [
          'Usa ingredientes a temperatura ambiente — el frío impide la emulsión',
          'Bate la yema de huevo con mostaza, sal y un poco de limón',
          'Comienza a agregar el aceite gota a gota mientras bateas continuamente — esta es la fase crítica',
          'Una vez que la emulsión está establecida (se vuelve espesa), puedes agregar el aceite en hilo delgado',
          'Si se corta: añade una nueva yema en un bowl limpio y agrega la mayonesa cortada poco a poco, batiendo',
        ],
      },
      {
        type: 'text',
        title: 'Por qué se corta una emulsión',
        content: 'Una emulsión se "corta" (se separa) cuando las gotas de aceite se fusionan entre sí y se separan del agua. Causas principales: aceite agregado demasiado rápido, temperatura incorrecta, demasiado aceite en proporción a la yema, o agitación insuficiente.',
      },
      {
        type: 'tip',
        content: 'La regla de proporción para mayonesa: una yema puede emulsionar hasta 200 ml de aceite. Si agregas más, la emulsión se cortará. Si tu mayonesa queda líquida, probablemente usaste demasiado aceite por yema.',
      },
    ],
    keyPoints: [
      'Una emulsión une aceite y agua gracias a un emulsificante',
      'La yema de huevo es el emulsificante más poderoso en cocina — por su lecitina',
      'El aceite debe agregarse gota a gota al principio, luego en hilo',
      'Los ingredientes a temperatura ambiente son clave para una emulsión exitosa',
      'Una yema puede emulsionar hasta 200 ml de aceite',
    ],
    quiz: [
      {
        q: '¿Qué componente de la yema de huevo actúa como emulsificante?',
        options: ['Proteínas', 'Lecitina', 'Colesterol', 'Agua'],
        correct: 1,
        explanation: 'La lecitina es una molécula con un extremo que ama el agua y otro que ama el aceite. Esta característica la hace perfecta como emulsificante — "abraza" las gotas de aceite y las mantiene suspendidas en el agua.',
      },
      {
        q: '¿Por qué se agrega el aceite gota a gota al principio?',
        options: ['Para controlar el sabor', 'Para que la emulsión se establezca gradualmente antes de agregar más', 'Porque el aceite es costoso', 'Por tradición culinaria'],
        correct: 1,
        explanation: 'Al inicio de una emulsión, los emulsificantes necesitan "capturar" cada gota de aceite individualmente. Si se agrega demasiado rápido, hay más aceite del que los emulsificantes pueden manejar y la emulsión se corta.',
      },
      {
        q: '¿Cómo se rescata una mayonesa cortada?',
        options: ['Agregando más aceite y batiendo fuerte', 'Calentándola ligeramente', 'Añadiendo una yema nueva y agregando la mayonesa cortada poco a poco', 'No se puede rescatar'],
        correct: 2,
        explanation: 'Una nueva yema tiene emulsificantes frescos que pueden "volver a capturar" el aceite de la mayonesa cortada. Se agrega la mayonesa cortada gota a gota sobre la yema nueva mientras se bate.',
      },
    ],
  },

  'ReaccióndeMaillard:ElSecretodelSabor': {
    id: 'maillard',
    intro: 'La reacción de Maillard es la reacción química más importante en cocina. Es responsable del color dorado y el sabor intenso del pan tostado, la carne asada, el café, el chocolate y cientos de preparaciones. Sin esta reacción, la comida sería pálida y sosa.',
    sections: [
      {
        type: 'text',
        title: 'La química simplificada',
        content: 'La reacción de Maillard ocurre cuando aminoácidos (de proteínas) reaccionan con azúcares reductores (glucosa, fructosa) a altas temperaturas. El resultado son cientos de nuevos compuestos que crean los sabores y colores característicos del dorado. No es caramelización — esa solo involucra azúcares.',
      },
      {
        type: 'table',
        title: 'Diferencia entre Maillard y Caramelización',
        content: [
          { col1: 'Reacción de Maillard', col2: 'Caramelización' },
          { col1: 'Requiere proteínas + azúcares', col2: 'Solo requiere azúcares' },
          { col1: 'Ocurre desde 140°C', col2: 'Ocurre desde 160°C' },
          { col1: 'Ejemplo: carne dorada, pan tostado', col2: 'Ejemplo: azúcar quemado, salsa de caramelo' },
          { col1: 'Produce cientos de sabores complejos', col2: 'Produce sabores de caramelo' },
        ],
      },
      {
        type: 'warning',
        content: 'El mito del "sellado para retener jugos" es completamente falso. La costra dorada NO crea una barrera impermeable. La función del sellado es exclusivamente generar sabor y color via Maillard. Los jugos se retienen con el punto de cocción correcto, no con el sellado.',
      },
      {
        type: 'list',
        title: 'Condiciones que favorecen la reacción de Maillard',
        content: [
          'Temperatura alta: mínimo 140°C, óptimo 150–180°C',
          'Superficie seca: la humedad baja la temperatura de la superficie. Seca bien la carne antes de sellar',
          'pH ligeramente alcalino: por eso la soda (bicarbonato) acelera el dorado en galletas y pretzels',
          'Tiempo adecuado: suficiente contacto con la superficie caliente',
        ],
      },
      {
        type: 'steps',
        title: 'Técnica para sellar carne perfectamente',
        content: [
          'Saca la carne del refrigerador 30 min antes — la carne fría baja la temperatura del sartén',
          'Seca muy bien la superficie con papel absorbente — la humedad es el enemigo del dorado',
          'Calienta el sartén (preferiblemente de hierro) hasta que humee',
          'Agrega aceite de alto punto de humo (maíz, aguacate) justo antes de la carne',
          'Coloca la carne y no la muevas durante 2–3 minutos — el movimiento impide la costra',
          'Sella también los lados si el corte es grueso',
          'Termina en horno si es un corte grueso para cocción interior sin quemar exterior',
        ],
      },
      {
        type: 'tip',
        content: 'El sonido correcto al poner la carne es un "chissss" fuerte e inmediato. Si el sonido es débil, el sartén no está suficientemente caliente y la carne se va a cocer en sus propios jugos en lugar de dorarse.',
      },
    ],
    keyPoints: [
      'Maillard = proteínas + azúcares + calor (>140°C) = sabor y color',
      'No es lo mismo que caramelización (que solo involucra azúcares)',
      'El sellado NO retiene jugos — solo genera sabor y color',
      'La superficie debe estar completamente seca para que ocurra Maillard',
      'El sartén debe estar muy caliente — si suena débil al poner la carne, no está listo',
    ],
    quiz: [
      {
        q: '¿Qué componentes reaccionan en la reacción de Maillard?',
        options: ['Solo azúcares con calor', 'Proteínas con azúcares a alta temperatura', 'Grasas con agua', 'Proteínas con sal'],
        correct: 1,
        explanation: 'La reacción de Maillard es específicamente entre aminoácidos (de proteínas) y azúcares reductores a temperaturas de 140°C o más. Esto la diferencia de la caramelización, que solo involucra azúcares.',
      },
      {
        q: '¿Por qué debes secar bien la carne antes de sellarla?',
        options: ['Para que absorba mejor el condimento', 'Porque la humedad baja la temperatura de la superficie e impide el dorado', 'Por higiene', 'Para reducir el tiempo de cocción'],
        correct: 1,
        explanation: 'La humedad en la superficie de la carne se evapora a 100°C, lo que mantiene la temperatura de la superficie en 100°C. Maillard necesita 140°C mínimo. La superficie húmeda simplemente hierve en lugar de dorarse.',
      },
      {
        q: '¿El sellado de la carne retiene los jugos?',
        options: ['Sí, crea una barrera impermeable', 'Parcialmente, reduce las pérdidas', 'No, el sellado solo genera sabor y color', 'Solo si se hace a temperatura muy alta'],
        correct: 2,
        explanation: 'El mito del sellado para retener jugos ha sido refutado científicamente múltiples veces. La carne sellada pierde los mismos jugos que la no sellada. La función del sellado es 100% flavor — crear la costra sabrosa por reacción de Maillard.',
      },
    ],
  },

  'Las5SalsasMadreFrancesas': {
    id: 'salsasmadre',
    intro: 'Auguste Escoffier sistematizó las 5 salsas madre en el siglo XX y cambió la cocina occidental para siempre. Dominar estas 5 salsas base significa poder preparar más de 200 salsas derivadas. Son el lenguaje de la cocina clásica.',
    sections: [
      {
        type: 'table',
        title: 'Las 5 Salsas Madre',
        content: [
          { col1: 'Bechamel', col2: 'Roux blanco + leche. Base de lasaña, croque monsieur, soufflé' },
          { col1: 'Velouté', col2: 'Roux rubio + fondo claro (pollo/ternera). Base de suprema, allemande' },
          { col1: 'Española', col2: 'Roux oscuro + fondo oscuro. Base de demi-glace, bordalesa' },
          { col1: 'Tomate (francesa)', col2: 'Tomate + fondo de cerdo + mirepoix. Diferente a la italiana' },
          { col1: 'Holandesa', col2: 'Yemas + mantequilla clarificada. Base de béarnaise, maltesa' },
        ],
      },
      {
        type: 'steps',
        title: 'Roux — la base de Bechamel y Velouté',
        content: [
          'Derrite mantequilla en sartén a fuego medio (igual peso que la harina)',
          'Agrega la harina de golpe y mezcla con paleta durante 1–2 minutos',
          'Roux blanco: cocina 1 min — para Bechamel',
          'Roux rubio: cocina 3–4 min hasta color avellana — para Velouté',
          'Roux oscuro: cocina 8–10 min hasta color café oscuro — para Española',
          'Agrega el líquido (leche o fondo) frío sobre el roux caliente batiendo constantemente',
        ],
      },
      {
        type: 'tip',
        content: 'El secreto del roux sin grumos: líquido frío sobre roux caliente (o líquido caliente sobre roux frío). Nunca los dos a la misma temperatura. La diferencia de temperatura previene la formación de grumos.',
      },
      {
        type: 'steps',
        title: 'Bechamel perfecta',
        content: [
          'Haz roux blanco (mantequilla + harina, 1 minuto)',
          'Infusiona la leche con laurel, nuez moscada y pimienta blanca (opcional)',
          'Agrega la leche fría al roux caliente en 3 partes, batiendo cada vez',
          'Cocina a fuego medio-bajo 10 minutos revolviendo constantemente',
          'Sazona con sal, pimienta blanca y nuez moscada rallada',
          'Consistencia correcta: cubre el dorso de una cuchara y queda una línea cuando la pasas con el dedo',
        ],
      },
      {
        type: 'text',
        title: 'Salsa Holandesa — la más técnica',
        content: 'La holandesa es una emulsión caliente — la más difícil de las 5. Se prepara con yemas de huevo y mantequilla clarificada. La temperatura es crítica: muy baja y no emulsiona, muy alta y las yemas se cocinan (se corta). La temperatura correcta es 62–65°C.',
      },
      {
        type: 'list',
        title: 'Salsas derivadas más importantes',
        content: [
          'De Bechamel: Mornay (queso), Soubise (cebolla), Nantua (crustáceos)',
          'De Velouté: Suprema (crema), Allemande (yema + limón), Aurora (tomate)',
          'De Española: Demi-glace, Bordalesa (vino tinto), Cazadora',
          'De Holandesa: Béarnaise (estragón), Choron (tomate), Maltesa (naranja)',
        ],
      },
    ],
    keyPoints: [
      'Las 5 salsas madre son la base de más de 200 salsas clásicas',
      'El roux es igual peso de mantequilla y harina — su color define qué salsa madre',
      'Líquido frío sobre roux caliente para evitar grumos',
      'La holandesa es una emulsión caliente — temperatura crítica de 62–65°C',
      'La salsa española francesa no tiene nada que ver con la cocina española',
    ],
    quiz: [
      {
        q: '¿Cuál es la diferencia entre Bechamel y Velouté?',
        options: ['El tipo de grasa usada', 'El líquido base: leche vs fondo claro', 'El color del roux', 'La cantidad de mantequilla'],
        correct: 1,
        explanation: 'Bechamel usa leche como líquido base, mientras que Velouté usa fondo claro (pollo o ternera). Ambas usan roux, pero el de Velouté se cocina un poco más (roux rubio) que el de Bechamel (roux blanco).',
      },
      {
        q: '¿Qué técnica se usa para evitar grumos en el roux?',
        options: ['Usar harina tamizada', 'Agregar líquido frío sobre roux caliente', 'Batir a alta velocidad', 'Cocinar el roux más tiempo'],
        correct: 1,
        explanation: 'La diferencia de temperatura previene la formación de grumos. También funciona el método inverso: roux frío sobre líquido caliente. Lo que no funciona es mezclar ambos a la misma temperatura.',
      },
      {
        q: '¿A qué temperatura se prepara la salsa holandesa?',
        options: ['50–55°C', '62–65°C', '75–80°C', '90–95°C'],
        correct: 1,
        explanation: '62–65°C es la temperatura correcta para la holandesa. Por debajo, las yemas no se emulsionan. Por encima, se cocinan y la salsa se corta (scrambled eggs). Algunos chefs usan baño María para mayor control.',
      },
    ],
  },

  'CortesAvanzadosdeVerduras': {
    id: 'cortesavanzados',
    intro: 'Más allá de la juliana y el brunoise, la cocina profesional usa una familia completa de cortes clásicos. Cada uno tiene su nombre, sus medidas precisas y sus aplicaciones específicas. Conocerlos te permite leer una receta profesional y ejecutarla con precisión.',
    sections: [
      {
        type: 'table',
        title: 'Los cortes clásicos y sus medidas',
        content: [
          { col1: 'Juliana', col2: '3mm × 3mm × 6cm — bastones finos' },
          { col1: 'Brunoise', col2: '3mm × 3mm × 3mm — cubos de juliana' },
          { col1: 'Brunoise grueso', col2: '5mm × 5mm × 5mm — para guisos' },
          { col1: 'Chiffonade', col2: 'Tiras finas de hojas (2–5mm) — solo para hierbas y hojas' },
          { col1: 'Macedonia', col2: '5mm × 5mm × 5mm — frutas y vegetales para ensaladas' },
          { col1: 'Jardinera', col2: '5mm × 5mm × 4cm — guisos y acompañamientos' },
          { col1: 'Paisana', col2: 'Cuadrado plano, 1cm × 1cm × 2mm — sopas' },
          { col1: 'Tournée', col2: 'Forma de balón de rugby, 7 caras — presentación' },
        ],
      },
      {
        type: 'steps',
        title: 'Brunoise — derivado de la juliana',
        content: [
          'Prepara julianas perfectas de 3mm × 3mm × 6cm',
          'Agrupa en manojos de 4–5 bastones bien alineados',
          'Corta transversalmente a 3mm de intervalo',
          'El resultado debe ser cubos perfectos de 3mm × 3mm × 3mm',
          'La clave: la juliana debe ser perfecta antes de hacer brunoise',
        ],
      },
      {
        type: 'steps',
        title: 'Chiffonade de albahaca',
        content: [
          'Apila 5–6 hojas de albahaca, las más grandes abajo',
          'Enrolla las hojas en un cilindro compacto',
          'Corta el cilindro transversalmente en tiras de 2–3mm',
          'Despega las tiras suavemente — resultan en cintas perfectas',
          'Usa inmediatamente — la albahaca se oxida rápido y se pone negra',
        ],
      },
      {
        type: 'tip',
        content: 'El tornear (tournée) es el corte más difícil y se usa principalmente para concursos y alta cocina. Requiere un cuchillo tournée (pequeño y curvo). Se práctica con zanahoria, calabacín o papa, tornando 7 caras exactamente simétricas.',
      },
      {
        type: 'list',
        title: 'Aplicaciones por corte',
        content: [
          'Brunoise: sofrito base, guarniciones de consommé, rellenos de pasta',
          'Chiffonade: decoración de platos, ensaladas de hojas, topping de sopas',
          'Macedonia: ensalada de frutas, pickles variados, guarniciones frías',
          'Jardinera: vegetales salteados, menestra, guisos de legumbres',
          'Paisana: minestrone y sopas campesinas — da textura sin cubrir los ingredientes',
        ],
      },
    ],
    keyPoints: [
      'El brunoise es simplemente juliana cortada transversalmente en cubos',
      'La chiffonade es el corte en cintas para hojas y hierbas — enrollar y cortar',
      'Las medidas exactas garantizan cocción uniforme, no solo buena presentación',
      'El tournée tiene exactamente 7 caras y se usa en alta cocina',
      'Si la juliana sale imperfecta, el brunoise también saldrá mal',
    ],
    quiz: [
      {
        q: '¿Cuál es la diferencia entre brunoise y macedonia?',
        options: ['El tamaño: brunoise 3mm, macedonia 5mm', 'Los ingredientes usados', 'La técnica de corte es diferente', 'No hay diferencia'],
        correct: 0,
        explanation: 'Brunoise: 3mm × 3mm × 3mm. Macedonia: 5mm × 5mm × 5mm. La técnica es igual (primero juliana, luego corte transversal), pero las medidas son diferentes y cada uno tiene aplicaciones distintas.',
      },
      {
        q: '¿Cómo se hace la chiffonade de hierbas?',
        options: ['Picando con el cuchillo como un dado', 'Apilando, enrollando y cortando en cintas finas', 'Usando tijeras de cocina', 'Con un mandolin especial'],
        correct: 1,
        explanation: 'La técnica correcta de chiffonade es apilar las hojas, enrollarlas en un cilindro compacto y cortar transversalmente en tiras finas. Esto minimiza el daño a las células y reduce la oxidación.',
      },
      {
        q: '¿Para qué tipo de preparación se usa el corte paisana?',
        options: ['Alta cocina y presentación elegante', 'Sopas y minestrone', 'Salteados y woks', 'Rellenos de pasta'],
        correct: 1,
        explanation: 'El corte paisana (cuadrado plano 1cm × 1cm × 2mm) es típico de sopas campesinas como el minestrone. Su forma plana y tamaño mediano permite que los vegetales se cocinen uniformemente sin domininar visualmente el plato.',
      },
    ],
  },

  'CocciónHúmedavs.CocciónSeca': {
    id: 'cocciones',
    intro: 'Elegir el método de cocción correcto transforma un ingrediente ordinario en algo extraordinario. Un corte duro cocinado en seco queda gomoso; el mismo corte braseado queda tierno y meloso. Entender los principios de cada método te permite adaptar cualquier receta.',
    sections: [
      {
        type: 'table',
        title: 'Métodos de cocción húmeda',
        content: [
          { col1: 'Hervir (100°C)', col2: 'Pastas, verduras, legumbres. Rápido pero puede sobre-cocinar' },
          { col1: 'Pochar (70–85°C)', col2: 'Huevos, pescados, frutas. Suave, preserva textura delicada' },
          { col1: 'Vapor', col2: 'Vegetales, mariscos, dim sum. Preserva nutrientes y color' },
          { col1: 'Brasear', col2: 'Carnes duras (costilla, osobuco). Largo en líquido tapado' },
          { col1: 'Estofar', col2: 'Similar al brasear pero más líquido. Guisos, ragús' },
        ],
      },
      {
        type: 'table',
        title: 'Métodos de cocción seca',
        content: [
          { col1: 'Saltear (sauté)', col2: 'Vegetales tiernos, carnes finas. Rápido, alto calor' },
          { col1: 'Freír en sartén', col2: 'Carnes con poca grasa, hasta dorar' },
          { col1: 'Asar (roasting)', col2: 'Aves, vegetales, cortes grandes. Horno con aire seco' },
          { col1: 'Grilla / Parrilla', col2: 'Carnes, pescados, vegetales. Calor directo intenso' },
          { col1: 'Horneado (baking)', col2: 'Panes, pasteles. Calor envolvente uniforme' },
        ],
      },
      {
        type: 'text',
        title: 'El principio fundamental',
        content: 'Los cortes duros (ricos en colágeno) necesitan calor húmedo y largo para convertir el colágeno en gelatina. Los cortes tiernos (pocos tejidos conectivos) se benefician del calor seco y rápido. Confundir esto arruina el plato.',
      },
      {
        type: 'list',
        title: 'Cortes duros vs. cortes tiernos',
        content: [
          'Cortes duros (brasear/estofar): osobuco, costilla, carrillera, mejillas, rabo de res',
          'Cortes tiernos (sartén/grilla): lomo, solomillo, entrecot, pechuga de pollo, filete de pescado',
          'Regla: si el músculo trabaja mucho en el animal (patas, cuello), necesita cocción larga',
          'Regla: si el músculo trabaja poco (lomo), es tierno y necesita cocción rápida',
        ],
      },
      {
        type: 'steps',
        title: 'Técnica de brasear — para cortes duros',
        content: [
          'Sella el corte en aceite caliente por todos lados (Maillard)',
          'Retira la carne y sofríe la mirepoix (cebolla, zanahoria, apio)',
          'Agrega el líquido (vino, fondo) hasta cubrir la mitad de la carne',
          'Tapa y cocina en horno a 160°C o fuego muy bajo',
          'Tiempo: 2–4 horas hasta que la carne se deshaga al pincharla',
          'Cuela los jugos y reduce para hacer la salsa',
        ],
      },
      {
        type: 'tip',
        content: 'El brasear es el método más indulgente: es difícil arruinarlo una vez que empezó. Si no está listo, se agrega tiempo. La temperatura baja y el líquido son lo que hace que funcione.',
      },
    ],
    keyPoints: [
      'Cortes duros (con colágeno) = cocción húmeda larga (brasear, estofar)',
      'Cortes tiernos = cocción seca rápida (sartén, grilla, horno)',
      'El pochar es cocción húmeda a 70–85°C, mucho más suave que hervir',
      'El brasear siempre empieza sellando la carne — para sabor, no para retener jugos',
      'Si el músculo trabaja mucho en el animal, requiere cocción larga',
    ],
    quiz: [
      {
        q: '¿Qué método de cocción convierte el colágeno duro en gelatina suave?',
        options: ['Saltear a fuego alto', 'Grilla directa', 'Brasear (cocción húmeda larga)', 'Hornear a 220°C'],
        correct: 2,
        explanation: 'El colágeno de los cortes duros se convierte en gelatina (que da la textura melosa característica) con calor húmedo prolongado — mínimo 2 horas a temperatura baja. El calor seco solo endurece el colágeno.',
      },
      {
        q: '¿A qué temperatura se pocha un huevo?',
        options: ['100°C (hervor)', '70–85°C', '60°C', '50°C'],
        correct: 1,
        explanation: 'El pochado ocurre a 70–85°C, por debajo del punto de ebullición. Esta temperatura baja coagula suavemente las proteínas del huevo sin endurecerlas. A 100°C el blanco quedaría gomoso.',
      },
      {
        q: '¿Qué tipo de cortes son ideales para la grilla o el saltear?',
        options: ['Cortes ricos en colágeno como osobuco', 'Cortes de músculos que trabajan mucho', 'Cortes tiernos con pocos tejidos conectivos', 'No importa el tipo de corte'],
        correct: 2,
        explanation: 'Los cortes tiernos (lomo, solomillo, pechuga) tienen pocos tejidos conectivos y se benefician del calor seco rápido que los dora sin resecarlos. Los cortes duros en calor seco quedan gomosos.',
      },
    ],
  },

  'FermentaciónBásica:MasaMadre': {
    id: 'fermentacion',
    intro: 'La masa madre es uno de los alimentos más antiguos de la humanidad — el pan de masa madre existe desde hace más de 5.000 años. Crear tu propio starter de masa madre es un proceso biológico fascinante que combina levaduras silvestres y bacterias lácticas para transformar harina y agua en algo extraordinario.',
    sections: [
      {
        type: 'text',
        title: 'La biología de la masa madre',
        content: 'Una masa madre sana contiene dos tipos de microorganismos que trabajan en simbiosis: levaduras silvestres (como Saccharomyces cerevisiae y otras especies) que producen CO₂ (las burbujas que hacen subir el pan) y bacterias lácticas (Lactobacillus) que producen ácido láctico y ácido acético, responsables del sabor ácido característico.',
      },
      {
        type: 'steps',
        title: 'Cómo crear un starter desde cero (5–7 días)',
        content: [
          'Día 1: mezcla 50g de harina integral + 50g agua a 25°C en un frasco limpio. Tapa sin sellar. Deja a temperatura ambiente',
          'Día 2–3: verás burbujas pequeñas — las levaduras están activas. Puede haber mal olor (bacterias acéticas temporales) — es normal',
          'Día 3–4: descarta la mitad (25g) y agrega 25g harina + 25g agua. Esto se llama "refrescar"',
          'Día 5–6: el starter debe doblar su tamaño en 4–8 horas después de refrescar. El olor cambia a yogur/vinagre agradable',
          'Día 7: prueba de flotación — pon una cucharada de starter en agua. Si flota, está listo para usar',
        ],
      },
      {
        type: 'tip',
        content: 'La temperatura es crítica: entre 24–28°C es el rango óptimo. En invierno, pon el frasco cerca de una fuente de calor. En verano, puede fermentar más rápido. Las levaduras son organismos vivos — las condiciones importan.',
      },
      {
        type: 'table',
        title: 'Hidratación de la masa',
        content: [
          { col1: '60% hidratación', col2: 'Masa firme, fácil de manejar. Buena para principiantes' },
          { col1: '70% hidratación', col2: 'Masa estándar para pan rústico. Buen equilibrio' },
          { col1: '80% hidratación', col2: 'Masa muy húmeda, alvéolos grandes. Requiere técnica' },
          { col1: '100% hidratación', col2: 'Igual peso de agua y harina. Para ciabatta y pan de alta hidratación' },
        ],
      },
      {
        type: 'steps',
        title: 'El proceso de panificación con masa madre',
        content: [
          'Refresca el starter 4–8h antes de usarlo (debe estar en su pico de actividad)',
          'Mezcla starter + agua + harina + sal (sal siempre al final, inhibe las levaduras)',
          'Autólisis: deja reposar 30 min después de mezclar — el gluten se desarrolla solo',
          'Primera fermentación (bulk): 4–12 horas a temperatura ambiente con pliegues cada hora las primeras 4h',
          'Formado: da forma al pan con tensión superficial',
          'Segunda fermentación: en molde en el refrigerador 8–16 horas (cold retard)',
          'Hornea en horno con vapor a 250°C los primeros 20 min, luego sin vapor 20 min más',
        ],
      },
      {
        type: 'warning',
        content: 'La sal inhibe las levaduras y las bacterias — nunca la mezcles directamente con el starter. Agrégala siempre después de combinar la harina con el agua y el starter.',
      },
    ],
    keyPoints: [
      'Una masa madre sana tiene levaduras (CO₂) y bacterias lácticas (sabor ácido)',
      'Refrescar significa descartar la mitad y agregar harina + agua fresca',
      'La prueba de flotación indica que el starter está listo: si flota, úsalo',
      'La sal siempre va al final — inhibe las levaduras si se mezcla directamente',
      'El cold retard (fermentación en frío) desarrolla más sabor y es más fácil de manejar',
    ],
    quiz: [
      {
        q: '¿Qué producen las bacterias lácticas en la masa madre?',
        options: ['CO₂ que hace subir el pan', 'Ácido láctico que da el sabor ácido', 'Gluten que da estructura', 'Azúcares que alimentan las levaduras'],
        correct: 1,
        explanation: 'Las bacterias lácticas (Lactobacillus) producen ácido láctico y ácido acético, que son responsables del sabor ácido característico del pan de masa madre. Las levaduras producen el CO₂.',
      },
      {
        q: '¿Qué indica que un starter está listo para usar?',
        options: ['Que tiene color café', 'Que huele fuerte', 'Que flota en agua (prueba de flotación)', 'Que lleva 7 días exactos'],
        correct: 2,
        explanation: 'La prueba de flotación es el indicador más confiable. Un starter activo tiene suficientes burbujas de CO₂ para flotar. Esto indica que está en su pico de actividad y listo para levantar el pan.',
      },
      {
        q: '¿Por qué se agrega la sal al final en la masa de pan?',
        options: ['Por tradición culinaria', 'La sal inhibe las levaduras si se mezcla directamente con el starter', 'Para que se distribuya mejor', 'La sal endurece el gluten prematuramente'],
        correct: 1,
        explanation: 'La sal a concentración alta inhibe o mata las levaduras. Al agregarla después de que harina, agua y starter ya están mezclados, se distribuye en la masa sin concentrarse directamente sobre los microorganismos.',
      },
    ],
  },

  'CocinaSous-VideyPasteurización': {
    id: 'sousvide',
    intro: 'Sous-vide (al vacío en francés) es la técnica de cocinar alimentos sellados en bolsas plásticas a temperatura exactamente controlada en un baño de agua. Es la técnica que democratizó la precisión de los mejores restaurantes del mundo.',
    sections: [
      {
        type: 'text',
        title: 'Por qué sous-vide es revolucionario',
        content: 'En una sartén o horno, el gradiente de temperatura es enorme: el exterior llega a 200°C mientras el interior llega a la temperatura objetivo. Sous-vide elimina ese gradiente — toda la pieza está exactamente a la temperatura deseada, de borde a borde. Una pechuga sous-vide a 63°C estará en ese punto exacto en toda su superficie.',
      },
      {
        type: 'table',
        title: 'Temperaturas y tiempos sous-vide',
        content: [
          { col1: 'Pechuga de pollo (jugosa)', col2: '63°C / 2–4 horas' },
          { col1: 'Muslo de pollo', col2: '74°C / 4–6 horas' },
          { col1: 'Carne de res (punto medio)', col2: '55°C / 1–4 horas' },
          { col1: 'Salmón (muy jugoso)', col2: '52°C / 30 min' },
          { col1: 'Costillas de cerdo', col2: '74°C / 24–48 horas' },
          { col1: 'Huevo pochado perfecto', col2: '63°C / 1 hora' },
        ],
      },
      {
        type: 'text',
        title: 'Pasteurización por tiempo y temperatura',
        content: 'La seguridad alimentaria sous-vide no requiere llegar a 74°C si se mantiene una temperatura menor por suficiente tiempo. El pollo se pasteuriza a 63°C si se mantiene esa temperatura por 4 minutos. A 74°C es instantáneo. Este principio se llama pasteurización equivalente.',
      },
      {
        type: 'steps',
        title: 'Proceso completo sous-vide',
        content: [
          'Sazona el alimento antes de sellar — las bolsas amplifican los sabores',
          'Sella al vacío (con maquina o bolsa zip con técnica de desplazamiento de agua)',
          'Precalienta el baño de agua a la temperatura exacta con el circulador',
          'Sumerge la bolsa — asegúrate de que no flote y que el agua circula',
          'Cocina el tiempo indicado — no hay sobre-cocción dentro del rango correcto',
          'Retira, seca bien la superficie con papel absorbente',
          'Sella en sartén MUY caliente 30–60 segundos por lado para costra (Maillard)',
          'Sirve inmediatamente',
        ],
      },
      {
        type: 'tip',
        content: 'El paso más crítico post-sous-vide es el sellado. La carne está perfectamente cocida pero sin color ni costra. La sartén debe estar extremadamente caliente y el tiempo de sellado debe ser muy breve para no sobre-cocinar el interior.',
      },
      {
        type: 'warning',
        content: 'No cocines sous-vide por debajo de 52°C por períodos muy largos con proteínas animales — especialmente pollo. Las temperaturas muy bajas y tiempos muy largos crean condiciones favorables para Clostridium botulinum. Sigue siempre tablas de tiempo/temperatura validadas.',
      },
    ],
    keyPoints: [
      'Sous-vide cocina al punto exacto toda la pieza — sin gradientes de temperatura',
      'La pasteurización puede ocurrir a menor temperatura si se mantiene el tiempo suficiente',
      'Sella siempre después del sous-vide — la costra se crea en sartén muy caliente, muy brevemente',
      'Sazona antes de sellar — las bolsas concentran los sabores',
      'El huevo a 63°C × 1 hora produce el huevo pochado perfecto',
    ],
    quiz: [
      {
        q: '¿Cuál es el principal beneficio del sous-vide sobre la cocción tradicional?',
        options: ['Es más rápido', 'Toda la pieza llega exactamente a la temperatura objetivo sin gradientes', 'No necesita equipamiento especial', 'Da mejor color a los alimentos'],
        correct: 1,
        explanation: 'En cocción tradicional el exterior está más cocinado que el interior. Sous-vide elimina ese gradiente — toda la pieza está a la temperatura exacta de borde a borde, garantizando el punto perfecto en cada bocado.',
      },
      {
        q: '¿Por qué se sella la carne DESPUÉS del sous-vide?',
        options: ['Para retener los jugos', 'Para crear costra dorada por reacción de Maillard', 'Para matar bacterias que sobrevivieron', 'Porque sous-vide no puede cocinar la carne completamente'],
        correct: 1,
        explanation: 'El sous-vide cocina perfectamente el interior pero no produce la reacción de Maillard porque las temperaturas son bajas. El sellado post-cocción es exclusivamente para crear la costra dorada y los sabores complejos del dorado.',
      },
      {
        q: '¿A qué temperatura se cocina un huevo pochado perfecto sous-vide?',
        options: ['52°C', '63°C', '74°C', '80°C'],
        correct: 1,
        explanation: '63°C × 1 hora produce el huevo pochado perfecto: clara completamente coagulada y yema cremosa y fluida. Es la aplicación más popular del sous-vide para usuarios domésticos porque no requiere circulador industrial.',
      },
    ],
  },

  'EsferificaciónBásicaeInversa': {
    id: 'esferificacion',
    intro: 'La esferificación es la técnica creada por Ferran Adrià en El Bulli que revolucionó la gastronomía moderna. Permite crear esferas de líquido que estallan en la boca. La versión básica usa alginato de sodio y cloruro de calcio; la inversa invierte los ingredientes para trabajar con lácteos.',
    sections: [
      {
        type: 'text',
        title: 'La química detrás',
        content: 'El alginato de sodio es un polisacárido extraído de algas marinas. Cuando entra en contacto con iones de calcio (del cloruro de calcio), forma un gel instantáneo. Si el proceso ocurre en la superficie de una gota de líquido, se crea una membrana gelatinosa exterior que contiene el líquido en su interior — una esfera.',
      },
      {
        type: 'table',
        title: 'Directa vs. Inversa',
        content: [
          { col1: 'Esferificación Directa', col2: 'Esferificación Inversa' },
          { col1: 'Alginato en el líquido a esferificar', col2: 'Calcio en el líquido a esferificar' },
          { col1: 'Baño de calcio externo', col2: 'Baño de alginato externo' },
          { col1: 'Para jugos, caldos, agua', col2: 'Para lácteos, líquidos con calcio' },
          { col1: 'Membrana delgada, se sigue gelificando', col2: 'La membrana no avanza al retirar del baño' },
        ],
      },
      {
        type: 'steps',
        title: 'Esferificación directa — paso a paso',
        content: [
          'Licúa 500g de jugo + 2.5g de alginato de sodio. Deja reposar 30 min para eliminar burbujas',
          'Prepara el baño: 500g agua + 2.5g cloruro de calcio. Revuelve bien',
          'Llena una cuchara medidora (o jeringa) con la mezcla de jugo+alginato',
          'Deja caer la gota en el baño de calcio desde cerca de la superficie (sin salpicar)',
          'Deja 1 minuto exacto para caviar o 2–3 minutos para esferas más grandes',
          'Retira con cuchara perforada y enjuaga en agua limpia',
          'Sirve inmediatamente — la gelificación continúa dentro del agua también',
        ],
      },
      {
        type: 'warning',
        content: 'En esferificación directa, la membrana continúa gelificándose mientras la esfera está en el líquido. Si se deja mucho tiempo o se prepara con anticipación, el centro también se gelifica y se pierde el efecto de "estallar". Las esferas directas se sirven inmediatamente.',
      },
      {
        type: 'tip',
        content: 'Para la esferificación inversa (con lácteos), el líquido a esferificar necesita calcio natural (yogur, crema, leche) o calcio añadido (cloruro de calcio 0.5%). La ventaja: la esfera inversa puede prepararse horas antes porque la membrana deja de crecer al retirarla del baño de alginato.',
      },
      {
        type: 'list',
        title: 'Aplicaciones creativas',
        content: [
          'Caviar de frutas: melón, mango, maracuyá para postres y cócteles',
          'Aceitunas esféricas (el clásico de El Bulli): aceite de oliva en esfera',
          'Yema de huevo falsa: esferas de zanahoria o mango con apariencia de yema',
          'Caviar de vino para maridajes',
          'Ravioli esféricos de caldo para sopas',
        ],
      },
    ],
    keyPoints: [
      'El alginato de sodio forma gel al contacto con iones de calcio',
      'Esferificación directa: alginato en el líquido, baño de calcio externo',
      'Esferificación inversa: calcio en el líquido, baño de alginato externo',
      'Las esferas directas deben servirse inmediatamente — la gelificación continúa',
      'Las esferas inversas son más estables y se pueden preparar con anticipación',
    ],
    quiz: [
      {
        q: '¿Qué sustancia crea la membrana en la esferificación?',
        options: ['Gelatina', 'Alginato de sodio en contacto con calcio', 'Metilcelulosa', 'Agar-agar'],
        correct: 1,
        explanation: 'El alginato de sodio forma un gel instantáneo al entrar en contacto con iones de calcio. Este gel forma la membrana exterior de la esfera que contiene el líquido dentro.',
      },
      {
        q: '¿Por qué se usa esferificación inversa con productos lácteos?',
        options: ['Por tradición culinaria', 'Los lácteos contienen calcio que impediría la esferificación directa', 'Porque la inversa da mejor sabor', 'Por costos de los materiales'],
        correct: 1,
        explanation: 'Los lácteos (leche, crema, yogur) contienen calcio naturalmente. Si se agrega alginato al lácteo (directa), se gelifican en el recipiente antes de poder esferificarlos. La técnica inversa pone el calcio en el producto y el alginato en el baño externo.',
      },
      {
        q: '¿Cuál es la ventaja de la esferificación inversa vs directa?',
        options: ['Es más barata', 'La membrana deja de crecer al retirar del baño — pueden prepararse con anticipación', 'Produce esferas más perfectas visualmente', 'Requiere menos precisión'],
        correct: 1,
        explanation: 'En esferificación directa la membrana sigue creciendo dentro del agua (o en el plato), lo que obliga a servir inmediatamente. La inversa produce esferas estables que mantienen el líquido interior indefinidamente.',
      },
    ],
  },

  'Geles,EspumasyCocinaMolecular': {
    id: 'molecular',
    intro: 'La cocina molecular (o gastronomía tecno-emocional) aplica principios científicos para crear texturas y presentaciones imposibles con técnicas tradicionales. No es magia — es bioquímica. Agar-agar, lecitina de soja y maltodextrina son herramientas que cualquier cocinero curioso puede usar.',
    sections: [
      {
        type: 'table',
        title: 'Gelificantes: agar vs gelatina',
        content: [
          { col1: 'Agar-agar (vegetal)', col2: 'Gelatina (animal)' },
          { col1: 'Se gelifica a 35–40°C', col2: 'Se gelifica a 15–20°C' },
          { col1: 'Gel firme a temperatura ambiente', col2: 'Se derrite a temperatura del plato' },
          { col1: 'Resistente al calor', col2: 'No resiste el calor' },
          { col1: 'Puede hacerse "gel caliente" (espaguetis calientes de caldo)', col2: 'Solo funciona frío' },
          { col1: 'Origen: algas rojas', col2: 'Origen: huesos y cartílagos animales' },
        ],
      },
      {
        type: 'steps',
        title: 'Espaguetis de agar-agar (gel caliente)',
        content: [
          'Disuelve 2g agar-agar por cada 500ml de líquido en frío',
          'Lleva a hervor revolviendo constantemente',
          'Carga el líquido caliente en una jeringa o pipeta',
          'Inyecta a través de un tubo de silicona flexible sumergido en agua con hielo',
          'Cuando el gel se forme (30 segundos), empuja con el émbolo para sacar el espagueti',
          'El resultado: espaguetis que pueden servirse calientes porque el agar mantiene la forma',
        ],
      },
      {
        type: 'steps',
        title: 'Espumas con lecitina de soja',
        content: [
          'Prepara el líquido base (caldo, jugo, infusión) a temperatura ambiente',
          'Agrega 0.5–1% de lecitina de soja en polvo (5–10g por litro)',
          'Mezcla con batidora de mano hasta disolver completamente',
          'Inclina el recipiente y sumerge la batidora justo en la superficie del líquido',
          'Bate a alta velocidad para incorporar aire — se forma la espuma en la superficie',
          'Recoge la espuma con cuchara y coloca sobre el plato inmediatamente',
        ],
      },
      {
        type: 'tip',
        content: 'La lecitina de soja produce espumas livianas y translúcidas, perfectas para platos salados (espuma de caldo, de aceite de oliva, de tomate). La lecitina en polvo funciona mejor que la líquida para espumas.',
      },
      {
        type: 'text',
        title: 'Aceite en polvo con maltodextrina',
        content: 'La maltodextrina de tapioca es un almidón modificado que puede absorber aceites y grasas convirtiéndolos en polvo. Se usa para crear "polvo de aceite de oliva", "polvo de chocolate" y texturas sorprendentes. Proporción: 60g maltodextrina de tapioca por 100g de aceite.',
      },
      {
        type: 'list',
        title: 'Aplicaciones prácticas en el menú',
        content: [
          'Agar: gelatinas de gazpacho para platos calientes, espaguetis de caldo, perlas de aceite',
          'Lecitina: aire de parmesano sobre pasta, espuma de beurre blanc, niebla de trufa',
          'Maltodextrina: polvo de aceite de oliva en ensalada, tierra de chocolate, crumble de foie',
          'Metilcelulosa: texturas que se solidifican en caliente y se licúan en frío (efecto inverso)',
        ],
      },
    ],
    keyPoints: [
      'El agar-agar gelifica a 35°C y resiste el calor — puede hacer geles que se sirven calientes',
      'La lecitina de soja crea espumas con cualquier líquido usando una batidora de mano',
      'La maltodextrina de tapioca convierte aceites en polvo seco',
      'La cocina molecular no es solo estética — crea experiencias táctiles y gustativas nuevas',
      'Empezar con lecitina de soja es el punto de entrada más fácil a la cocina molecular',
    ],
    quiz: [
      {
        q: '¿Por qué el agar-agar puede usarse para geles calientes y la gelatina no?',
        options: ['El agar es más elástico', 'El agar se gelifica a 35–40°C y mantiene su forma a temperatura ambiente', 'La gelatina tiene sabor que interfiere', 'El agar es más económico'],
        correct: 1,
        explanation: 'El agar-agar forma un gel estable que no se derrite hasta los 85°C aproximadamente. La gelatina animal se derrite a 35°C (temperatura corporal), por eso los platos con gelatina animal deben servirse fríos.',
      },
      {
        q: '¿Qué porcentaje de lecitina de soja se usa para espumas?',
        options: ['0.1%', '0.5–1%', '5%', '10%'],
        correct: 1,
        explanation: '0.5–1% (5–10g por litro) es la proporción estándar para espumas con lecitina de soja. Más lecitina produce espuma más densa y estable; menos produce espuma más ligera.',
      },
      {
        q: '¿Qué material convierte aceites en polvo seco?',
        options: ['Agar-agar', 'Alginato de sodio', 'Maltodextrina de tapioca', 'Metilcelulosa'],
        correct: 2,
        explanation: 'La maltodextrina de tapioca tiene alta capacidad de absorción de grasa — puede absorber hasta el 60% de su peso en aceite y mantenerse en forma de polvo. Al entrar en contacto con humedad (la boca), libera el aceite.',
      },
    ],
  },

  'PaletasdeSaboryCreatividadCulinaria': {
    id: 'paletassabor',
    intro: 'Crear un plato desde cero requiere entender el sabor como un sistema. Los cinco sabores básicos, el concepto de contraste y armonía, y cómo los ingredientes interactúan entre sí son las herramientas del chef creativo. Esta lección te enseña a pensar en sabor, no solo en recetas.',
    sections: [
      {
        type: 'table',
        title: 'Los 5 sabores básicos',
        content: [
          { col1: 'Dulce', col2: 'Azúcares, miel, frutas maduras — energía, palatabilidad' },
          { col1: 'Salado', col2: 'Sodio — amplifica todos los demás sabores' },
          { col1: 'Ácido', col2: 'Limón, vinagre, yogur — frescura, equilibrio de grasas' },
          { col1: 'Amargo', col2: 'Café, chocolate oscuro, rúcula — complejidad, profundidad' },
          { col1: 'Umami', col2: 'Glutamato — parmesan, tomate, setas, miso — redondez, satisfacción' },
        ],
      },
      {
        type: 'text',
        title: 'Umami: el quinto sabor',
        content: 'El umami fue identificado por el científico japonés Kikunae Ikeda en 1908. Es producido principalmente por el glutamato monosódico (MSG) natural y los nucleótidos IMP y GMP. Los alimentos más ricos en umami: parmesano, anchovas, tomate maduro, setas secas, salsa de soya, miso y algas kombu.',
      },
      {
        type: 'list',
        title: 'Contraste vs. armonía — cuándo usar cada uno',
        content: [
          'Contraste: sabores opuestos que se realzan mutuamente. Ejemplo: melón con jamón (dulce+salado+umami), chocolate negro con sal marina',
          'Armonía: sabores similares que se complementan y amplifican. Ejemplo: tomate + albahaca + mozzarella (umami+herbal+lácteo)',
          'La mayoría de los platos exitosos usan ambos: armonía en los ingredientes principales, contraste en el acabado',
        ],
      },
      {
        type: 'steps',
        title: 'Cómo crear un plato desde cero',
        content: [
          'Elige un ingrediente protagonista — define todo lo demás a partir de él',
          'Identifica qué sabores básicos tiene el protagonista y cuáles le faltan',
          'Agrega un ácido: limón, vinagre, vino. Equilibra grasas y amplifica sabores',
          'Asegura presencia de umami: parmesan, anchoa, tomate concentrado o setas',
          'Añade textura contrastante: crujiente sobre cremoso, suave sobre firme',
          'Aplica un elemento de temperatura contrastante si es posible',
          'Prueba, ajusta sal al final, y añade acidez si siente "plano" o pesado',
        ],
      },
      {
        type: 'tip',
        content: 'La sal y el ácido son los correctores más importantes en cocina. Un plato que sabe "sin gracia" generalmente necesita sal. Un plato que sabe "pesado" o "plano" generalmente necesita ácido (un poco de limón o vinagre). Aprende a distinguir entre los dos.',
      },
      {
        type: 'list',
        title: 'Combinaciones de ingredientes con base científica',
        content: [
          'Chocolate + queso azul: ambos tienen compuestos aromáticos similares (pirazinas)',
          'Fresas + parmesano: umami del queso realza los ésteres de la fresa',
          'Coliflor + chocolate blanco: ambos tienen trimetilpirrolizina (compuesto aromático)',
          'Café + ajo: compuestos de azufre que crean armonía inesperada',
          'Anchoas + carne: el umami de la anchoa intensifica el sabor cárnico sin sabor a mar',
        ],
      },
    ],
    keyPoints: [
      'Los 5 sabores son dulce, salado, ácido, amargo y umami — el equilibrio entre ellos define un gran plato',
      'El umami (glutamato) da redondez y satisfacción — está en parmesano, anchoas, miso y setas',
      'Un plato "sin gracia" necesita sal; un plato "pesado" necesita ácido',
      'El contraste (opuestos) y la armonía (similares) deben coexistir en un plato exitoso',
      'Siempre prueba y ajusta antes de servir — la receta es un punto de partida',
    ],
    quiz: [
      {
        q: '¿Qué sabor básico amplifica todos los demás?',
        options: ['Dulce', 'Ácido', 'Salado', 'Umami'],
        correct: 2,
        explanation: 'El sodio (salado) tiene la propiedad única de amplificar la intensidad de todos los demás sabores. Por eso una pizca de sal en un postre lo hace más dulce, y sal sobre fruta madura la hace más sápida.',
      },
      {
        q: '¿Qué corrección aplicarías a un plato que sabe "pesado" o "aburrido"?',
        options: ['Más sal', 'Más ácido (limón o vinagre)', 'Más grasa', 'Más dulce'],
        correct: 1,
        explanation: 'Un plato que sabe "plano" o "pesado" generalmente necesita ácido — unas gotas de limón o vinagre cortan la grasa, aportan frescura y "levantan" los sabores. La sal es para cuando sabe insípido.',
      },
      {
        q: '¿En qué alimentos comunes se encuentra el umami de forma natural?',
        options: ['Lechuga y pepino', 'Parmesano, anchovas, tomate maduro y setas', 'Azúcar y miel', 'Limón y naranja'],
        correct: 1,
        explanation: 'El umami es generado principalmente por glutamato monosódico natural. Los alimentos más ricos en umami son parmesano, anchovas (anchoas en salazón), tomate concentrado, setas shiitake y kombu — todos con altas concentraciones de glutamato.',
      },
    ],
  },

  'DespieceCompletodeResyCerdo': {
    id: 'despiece',
    intro: 'Conocer el despiece es entender el animal completo. Saber de dónde viene cada corte — qué músculo es, cuánto trabaja, cuánta grasa tiene — te permite elegir el corte correcto para cada preparación y maximizar el aprovechamiento sin desperdiciar nada.',
    sections: [
      {
        type: 'text',
        title: 'Por qué importa conocer el despiece',
        content: 'Un lomo de res y un osobuco son el mismo animal pero técnicas completamente opuestas: uno necesita calor seco y rápido, el otro calor húmedo y largo. El músculo que más trabaja tiene más colágeno y tejido conectivo — es más duro pero más sabroso. El que menos trabaja (lomo, solomillo) es tierno pero menos intenso en sabor.',
      },
      {
        type: 'table',
        title: 'Cortes principales de res y sus usos',
        content: [
          { col1: 'Solomillo (tenderloin)', col2: 'El más tierno. Medallones, filet mignon. Sartén o parrilla rápida' },
          { col1: 'Lomo alto / Entrecot', col2: 'Buen marmoleado. Bife de chorizo, ribeye. Parrilla o sartén' },
          { col1: 'Lomo bajo / Sirloin', col2: 'Menos graso que el alto. Steaks, roast beef. Horno o sartén' },
          { col1: 'Paleta (chuck)', col2: 'Mucho colágeno. Guisos, hamburguesas, pulled beef. Brasear' },
          { col1: 'Pecho (brisket)', col2: 'Grasa intramuscular. Ahumado, corned beef. Cocción muy larga' },
          { col1: 'Costilla (short ribs)', col2: 'Sabor intenso, mucho colágeno. Brasear 3–4 horas o ahumar' },
          { col1: 'Osobuco (shin)', col2: 'Hueso central con médula. El ossobuco milanés clásico. Brasear' },
          { col1: 'Rabo (oxtail)', col2: 'Máximo colágeno. Rabo estofado. Cocción 4–6 horas' },
        ],
      },
      {
        type: 'table',
        title: 'Cortes principales de cerdo y sus usos',
        content: [
          { col1: 'Lomo de cerdo', col2: 'El más magro. Chuletas, medallones. No sobre-cocinar — se reseca' },
          { col1: 'Solomillo de cerdo', col2: 'Muy tierno y magro. Medallones rápidos. Cuidado con la temperatura' },
          { col1: 'Paleta (shoulder)', col2: 'Mucho colágeno. Pulled pork, carnitas. Brasear o ahumar largo' },
          { col1: 'Panceta (belly)', col2: 'Alta grasa. Tocino, panceta curada, chicharrón' },
          { col1: 'Pernil (leg)', col2: 'El jamón fresco. Asado entero o curado para jamón serrano' },
          { col1: 'Costilla de cerdo', col2: 'Baby back o spareribs. BBQ, glaseadas. Brasear + acabado en horno' },
          { col1: 'Cabeza y cachete', col2: 'Muy gelatinosa. Queso de cabeza, rillettes, guanciale' },
        ],
      },
      {
        type: 'tip',
        content: 'La regla universal del despiece: cuanto más trabaja el músculo en el animal, más sabroso pero más duro. El lomo está en la espalda y prácticamente no se mueve — es tierno. La paleta mueve la pata todo el día — es dura pero llena de sabor.',
      },
      {
        type: 'steps',
        title: 'Blanquear y deshuesar una paleta de cerdo',
        content: [
          'Identifica los huesos: escápula (pala) y húmero (brazo) con sus articulaciones',
          'Separa la piel si la hay, reserva para chicharrón',
          'Introduce el cuchillo deshuesador siguiendo el contorno del hueso, no cortes la carne',
          'Raspa el hueso limpiamente para aprovechar todo el colágeno — guarda los huesos para fondo',
          'Divide la paleta en 2–3 porciones según el uso: una para guiso, otra para picar',
        ],
      },
      {
        type: 'list',
        title: 'Aprovechamiento total: regla de cocina de zero waste',
        content: [
          'Huesos → fondo oscuro o blanco (el colágeno da cuerpo y brillo)',
          'Grasa de cobertura → manteca o grasa de cerdo para saltear',
          'Recortes de carne → picado para hamburguesas, rellenos o albóndigas',
          'Médula ósea → tostar y servir sobre tostadas (ossobuco) o agregar a salsas',
          'Piel de cerdo → chicharrón o gelatina para pâtés',
        ],
      },
      {
        type: 'warning',
        content: 'El solomillo de cerdo se reseca fácilmente. Nunca debe cocinarse más allá de 63°C interno. A diferencia del pollo, el cerdo moderno puede servirse rosado y jugoso — la triquinosis prácticamente desapareció con las prácticas modernas de cría.',
      },
    ],
    keyPoints: [
      'El músculo que más trabaja = más duro, más colágeno, más sabroso — requiere cocción larga',
      'El lomo y solomillo no trabajan mucho = tiernos, menos intensos — requieren cocción rápida',
      'Todos los huesos van al fondo — el colágeno da cuerpo y brillo a las salsas',
      'El cerdo puede servirse a 63°C (rosado) — no hay riesgo con carne moderna',
      'Zero waste: cada parte del animal tiene un uso culinario específico',
    ],
    quiz: [
      {
        q: '¿Por qué la paleta de res o cerdo requiere cocción lenta y húmeda?',
        options: ['Por su forma irregular', 'Porque es un músculo que trabaja mucho y tiene alto contenido de colágeno', 'Porque es más grande', 'Por tradición culinaria'],
        correct: 1,
        explanation: 'La paleta es un músculo de trabajo constante — mueve la pata del animal. Esto genera alto contenido de tejido conectivo (colágeno) que solo se convierte en gelatina suave con calor húmedo prolongado (brasear 3–4 horas).',
      },
      {
        q: '¿A qué temperatura interna puede servirse el lomo de cerdo?',
        options: ['74°C (bien cocido)', '63°C (ligeramente rosado)', '52°C (muy rosado)', 'Debe estar completamente gris'],
        correct: 1,
        explanation: '63°C es la temperatura segura para cerdo. A diferencia del pollo, el cerdo puede servirse ligeramente rosado y jugoso. El cerdo moderno no tiene el riesgo de triquinosis del pasado.',
      },
      {
        q: '¿Para qué se usan los huesos de res o cerdo después del despiece?',
        options: ['Se descartan porque no tienen uso culinario', 'Para hacer fondos — el colágeno da cuerpo y brillo a las salsas', 'Solo para decoración del plato', 'Para hacer harina de hueso'],
        correct: 1,
        explanation: 'Los huesos son ricos en colágeno que al hervir suavemente se convierte en gelatina, dando cuerpo, brillo y profundidad a los fondos y salsas. Es literalmente la base de toda la cocina clásica francesa.',
      },
    ],
  },

  'PasteleríaAvanzada:CremasyRellenos': {
    id: 'pasteleria',
    intro: 'La pastelería clásica francesa descansa sobre cuatro pilares: crema pastelera, ganache, crème brûlée y mousse de chocolate. Dominar estas cuatro preparaciones abre las puertas a cientos de postres. La diferencia entre un postre memorable y uno ordinario está en la técnica de cada una.',
    sections: [
      {
        type: 'text',
        title: 'La crema pastelera — la madre de las cremas',
        content: 'La crème pâtissière es la crema base de la pastelería francesa. Es una crema espesada con almidón (maizena o harina) y yemas, cocida hasta que hierve. Parece sencilla pero tiene dos enemigos: los grumos (por calor desigual) y el huevo cocido (por calor excesivo). La técnica correcta la elimina ambos.',
      },
      {
        type: 'steps',
        title: 'Crema pastelera perfecta',
        content: [
          'Calienta la leche con vainilla hasta casi hervir (90°C) — no hervir',
          'Bate yemas + azúcar hasta blanquear (ribbon stage: cinta espesa al levantar)',
          'Agrega maizena a las yemas y mezcla bien',
          'Vierte la leche caliente sobre las yemas en hilo delgado, batiendo constantemente (templado)',
          'Regresa todo a la olla y cocina a fuego medio revolviendo sin parar con espátula',
          'Cocina hasta que hierva y espese — debe hervir 1–2 minutos para activar la maizena completamente',
          'Vierte en bandeja, cubre con film a contacto (toca la crema para evitar piel)',
          'Enfría en nevera mínimo 2 horas antes de usar',
        ],
      },
      {
        type: 'tip',
        content: 'El "templado" (tempering) es la clave de las cremas con huevo: agregar el líquido caliente gradualmente sobre las yemas frías eleva la temperatura de las yemas lentamente, sin cocinarlas de golpe. Si se vierte toda la leche de una vez, el huevo se cuaja y quedan grumos.',
      },
      {
        type: 'table',
        title: 'Variantes de crema pastelera',
        content: [
          { col1: 'Crème légère', col2: 'Pastelera + crema batida. Más liviana para éclairs y tartas' },
          { col1: 'Crème mousseline', col2: 'Pastelera + mantequilla. Para fraisier y layer cakes' },
          { col1: 'Crème diplomate', col2: 'Pastelera + gelatina + crema batida. Para milhojas' },
          { col1: 'Crema de limón (curd)', col2: 'Sin almidón, solo yemas + mantequilla + limón. Para tartas' },
        ],
      },
      {
        type: 'steps',
        title: 'Ganache perfecta — proporciones y texturas',
        content: [
          'Ganache cobertura (glazeado): 1 parte chocolate : 1 parte crema caliente',
          'Ganache para relleno (trufa): 2 partes chocolate : 1 parte crema',
          'Ganache montada (como mousse): 1:1, enfriar y batir hasta doblar volumen',
          'Calienta la crema hasta casi hervir — NO hervir (destruye emulsión)',
          'Vierte sobre el chocolate picado fino en 3 partes, mezcla en espiral desde el centro',
          'Agrega mantequilla fría en cubos al final para brillo y sedosidad (opcional)',
          'Para glasear: usar a 35–40°C. Para relleno: enfriar a temperatura ambiente',
        ],
      },
      {
        type: 'steps',
        title: 'Crème brûlée clásica',
        content: [
          'Infusiona crema con vainilla a 80°C durante 20 minutos',
          'Mezcla yemas + azúcar hasta integrar (no blanquear — no se quiere incorporar aire)',
          'Templa la crema caliente sobre las yemas lentamente',
          'Cuela la mezcla y llena los ramequines',
          'Hornea en baño maría a 150°C hasta que el centro tiemble ligeramente (30–40 min)',
          'Enfría completamente en nevera mínimo 4 horas',
          'Al servir: espolvorea azúcar fino uniforme y quema con soplete en movimientos circulares',
        ],
      },
      {
        type: 'warning',
        content: 'En la crème brûlée, el baño maría es obligatorio — no opcional. Sin él, el exterior se cocinará demasiado rápido mientras el centro queda líquido. El agua regula la temperatura máxima a 100°C.',
      },
      {
        type: 'text',
        title: 'Mousse de chocolate — el poder de la aireación',
        content: 'Una mousse es esencialmente un ganache al que se le incorpora aire. Puede hacerse con claras montadas, crema batida o ambas. La clave es incorporar el aire con movimientos envolventes (fold), nunca revolviendo, para no perder las burbujas que dan la textura aérea.',
      },
    ],
    keyPoints: [
      'El templado es la técnica clave: agregar el líquido caliente gradualmente sobre las yemas para no cocinarlas',
      'La crema pastelera debe hervir 1–2 minutos para activar completamente la maizena',
      'El ganache tiene 3 proporciones: 1:1 glaseado, 2:1 relleno firme, 1:1 enfriado y batido = montada',
      'La crème brûlée necesita baño maría — sin él el calor del horno es demasiado violento',
      'La mousse se hace con movimientos envolventes (fold) para preservar las burbujas de aire',
    ],
    quiz: [
      {
        q: '¿Qué es el "templado" en la elaboración de cremas con huevo?',
        options: ['Enfriar la crema rápidamente', 'Agregar el líquido caliente gradualmente sobre las yemas para no cocinarlas de golpe', 'Batir las yemas a temperatura ambiente', 'Calentar los huevos antes de usarlos'],
        correct: 1,
        explanation: 'El templado eleva la temperatura de las yemas lentamente añadiendo el líquido caliente en hilo delgado mientras se bate. Si se vierte todo de golpe, las proteínas del huevo se coagulan instantáneamente formando grumos de huevo cocido.',
      },
      {
        q: '¿Qué proporción de chocolate:crema se usa para un ganache de relleno firme?',
        options: ['1:1 (igual proporción)', '2:1 (más chocolate que crema)', '1:2 (más crema que chocolate)', '3:1 (mucho más chocolate)'],
        correct: 1,
        explanation: 'Para rellenos firmes (bombones, tartas) se usa 2 partes de chocolate por 1 de crema. Esto da una textura densa que mantiene su forma. La proporción 1:1 es para glasear (más fluido) y 1:1 enfriado+batido para ganache montada.',
      },
      {
        q: '¿Por qué la crème brûlée se hornea en baño maría?',
        options: ['Para darle más sabor', 'Para que la superficie quede plana', 'El agua limita la temperatura a 100°C, evitando que el exterior se cueza demasiado', 'Por tradición francesa'],
        correct: 2,
        explanation: 'El baño maría actúa como regulador térmico: el agua no puede superar los 100°C, lo que protege la crema de calor excesivo. Sin él, el horno a 150°C coagularía el exterior antes de que el centro se cuajara.',
      },
    ],
  },
};
