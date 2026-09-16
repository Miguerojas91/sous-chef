import type { AcademyLevel } from './types';

export const TECNICA: AcademyLevel = {
  id: 'tecnica',
  name: 'Técnica',
  tag: 'Intermedio',
  world: 3,
  lessons: [
    {
      id: 'emulsiones',
      emoji: '🥚',
      title: 'Ciencia de las Emulsiones',
      duration: '22:15',
      description: 'La física y la química detrás de mayonesas, vinagretas y salsa holandesa. Por qué se cortan y cómo rescatarlas.',
      topics: ['Emulsiones permanentes vs temporales', 'El papel de la lecitina del huevo', 'Salsa holandesa y béarnaise', 'Técnica de vinagreta estable'],
      content: {
        intro: 'Una emulsión es la unión estable de dos líquidos que normalmente no se mezclan: aceite y agua. Mayonesa, holandesa, vinagreta y béarnaise son emulsiones. Entender cómo funcionan te ayuda a que no se corten y a rescatarlas cuando pasa.',
        sections: [
          {
            type: 'text',
            title: 'La física de una emulsión',
            content: 'El aceite y el agua se repelen mutuamente. Para crear una emulsión estable necesitas un emulsificante: una molécula que tenga un extremo que ame el agua (hidrófilo) y otro que ame el aceite (lipófilo). El emulsificante actúa como "pegamento" que mantiene las dos fases unidas.',
          },
          {
            type: 'list',
            title: 'Emulsificantes naturales en cocina',
            content: [
              'Lecitina del huevo (yema): el más poderoso y versátil. Para mayonesa y holandesa',
              'Mostaza: contiene mucílago que actúa como emulsificante. Para vinagretas',
              'Ajo: emulsificante natural suave. Para aioli tradicional',
              'Miel: ayuda a estabilizar vinagretas dulces',
            ],
          },
          {
            type: 'table',
            title: 'Tipos de emulsión',
            content: [
              { col1: 'Permanente (estable)', col2: 'Mayonesa, holandesa. Requieren emulsificante fuerte' },
              { col1: 'Semipermanente', col2: 'Vinagreta con mostaza. Se separa en horas' },
              { col1: 'Temporal', col2: 'Vinagreta simple. Se separa en minutos' },
            ],
          },
          {
            type: 'steps',
            title: 'Técnica de mayonesa casera',
            content: [
              'Usa ingredientes a temperatura ambiente, porque el frío impide la emulsión',
              'Bate la yema de huevo con mostaza, sal y un poco de limón',
              'Comienza a agregar el aceite gota a gota mientras bates sin parar. Esta es la fase crítica',
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
          'La yema de huevo, por su lecitina, es el emulsificante más poderoso en cocina',
          'El aceite debe agregarse gota a gota al principio, luego en hilo',
          'Los ingredientes a temperatura ambiente son clave para una emulsión exitosa',
          'Una yema puede emulsionar hasta 200 ml de aceite',
        ],
        quiz: [
          {
            q: '¿Qué componente de la yema de huevo actúa como emulsificante?',
            options: ['Proteínas', 'Lecitina', 'Colesterol', 'Agua'],
            correct: 1,
            explanation: 'La lecitina es una molécula con un extremo que ama el agua y otro que ama el aceite. Por eso funciona tan bien como emulsificante: "abraza" las gotas de aceite y las mantiene suspendidas en el agua.',
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
    },
    {
      id: 'maillard',
      emoji: '🥩',
      title: 'Reacción de Maillard y el Dorado',
      duration: '19:30',
      description: 'La reacción entre azúcares y aminoácidos que dora la comida y le da sabor tostado. Cómo lograr una costra dorada y pareja en carnes, pan y vegetales.',
      topics: ['Química: azúcares + aminoácidos', 'Temperatura óptima (>140°C)', 'Por qué sellar no "retiene los jugos"', 'Técnicas de sellado en sartén y horno'],
      content: {
        intro: 'La reacción de Maillard es la que dora la comida. Es responsable del color dorado y el sabor tostado del pan, la carne asada, el café, el chocolate y muchas otras preparaciones.',
        sections: [
          {
            type: 'text',
            title: 'La química simplificada',
            content: 'La reacción de Maillard ocurre cuando aminoácidos (de proteínas) reaccionan con azúcares reductores (glucosa, fructosa) a altas temperaturas. El resultado son cientos de nuevos compuestos que crean los sabores y colores característicos del dorado. La caramelización es otra cosa: solo involucra azúcares.',
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
            content: 'El "sellado para retener jugos" es un mito. La costra dorada no crea una barrera impermeable. El sellado sirve para generar sabor y color por reacción de Maillard. Los jugos se retienen con el punto de cocción correcto, no con el sellado.',
          },
          {
            type: 'list',
            title: 'Condiciones que favorecen la reacción de Maillard',
            content: [
              'Temperatura alta: mínimo 140°C, óptimo 150 a 180°C',
              'Superficie seca: la humedad baja la temperatura de la superficie. Seca bien la carne antes de sellar',
              'pH ligeramente alcalino: por eso la soda (bicarbonato) acelera el dorado en galletas y pretzels',
              'Tiempo adecuado: suficiente contacto con la superficie caliente',
            ],
          },
          {
            type: 'steps',
            title: 'Técnica para sellar carne',
            content: [
              'Saca la carne del refrigerador 30 min antes: la carne fría baja la temperatura del sartén',
              'Seca muy bien la superficie con papel absorbente: la humedad impide el dorado',
              'Calienta el sartén (preferiblemente de hierro) hasta que humee',
              'Agrega aceite de alto punto de humo (maíz, aguacate) justo antes de la carne',
              'Coloca la carne y no la muevas durante 2 a 3 minutos: si la mueves, no se forma la costra',
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
          'El sellado no retiene jugos: genera sabor y color',
          'La superficie debe estar completamente seca para que ocurra Maillard',
          'El sartén debe estar muy caliente: si suena débil al poner la carne, no está listo',
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
            explanation: 'Las pruebas de cocina muestran que la carne sellada pierde tantos jugos como la no sellada. El sellado sirve para el sabor: crea la costra dorada por reacción de Maillard.',
          },
        ],
      },
    },
    {
      id: 'salsasmadre',
      emoji: '🥫',
      title: 'Las 5 Salsas Madre Francesas',
      duration: '35:00',
      description: 'Bechamel, velouté, española, tomate y holandesa. Con estas 5 puedes preparar cientos de salsas derivadas.',
      topics: ['Bechamel y roux blanco', 'Velouté con fondo claro', 'Española con fondo oscuro', 'Salsa de tomate francesa vs italiana'],
      content: {
        intro: 'Auguste Escoffier ordenó las 5 salsas madre a comienzos del siglo XX. Con estas 5 salsas base puedes preparar cientos de salsas derivadas.',
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
            title: 'Roux: la base de Bechamel y Velouté',
            content: [
              'Derrite mantequilla en sartén a fuego medio (igual peso que la harina)',
              'Agrega la harina de golpe y mezcla con paleta durante 1 a 2 minutos',
              'Roux blanco: cocina 1 min, para Bechamel',
              'Roux rubio: cocina 3 a 4 min hasta color avellana, para Velouté',
              'Roux oscuro: cocina 8 a 10 min hasta color café oscuro, para Española',
              'Agrega el líquido (leche o fondo) frío sobre el roux caliente batiendo constantemente',
            ],
          },
          {
            type: 'tip',
            content: 'Para un roux sin grumos: líquido frío sobre roux caliente (o líquido caliente sobre roux frío). Nunca los dos a la misma temperatura. La diferencia de temperatura previene la formación de grumos.',
          },
          {
            type: 'steps',
            title: 'Bechamel paso a paso',
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
            title: 'Salsa Holandesa: la más técnica',
            content: 'La holandesa es una emulsión caliente y la más difícil de las 5. Se prepara con yemas de huevo y mantequilla clarificada. La temperatura es crítica: muy baja y no emulsiona, muy alta y las yemas se cocinan (se corta). La temperatura correcta está entre 62 y 65°C.',
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
          'Las 5 salsas madre son la base de cientos de salsas clásicas',
          'El roux es igual peso de mantequilla y harina: su color define qué salsa madre',
          'Líquido frío sobre roux caliente para evitar grumos',
          'La holandesa es una emulsión caliente: temperatura crítica de 62 a 65°C',
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
            options: ['50 a 55°C', '62 a 65°C', '75 a 80°C', '90 a 95°C'],
            correct: 1,
            explanation: 'La temperatura correcta para la holandesa está entre 62 y 65°C. Por debajo, las yemas no se emulsionan. Por encima, se cocinan y la salsa se corta (scrambled eggs). Algunos chefs usan baño María para mayor control.',
          },
        ],
      },
    },
    {
      id: 'cortesavanzados',
      emoji: '🌿',
      title: 'Cortes Avanzados de Verduras',
      duration: '20:00',
      description: 'Juliana, brunoise, paisana, chiffonade, tournée y barrel. Los cortes clásicos de la cocina profesional, con sus tamaños y usos.',
      topics: ['Brunoise fino (3mm) y grueso', 'Juliana clásica y chiffonade de hierbas', 'Tornear vegetales (tournée)', 'Macedonia y jardinera'],
      content: {
        intro: 'Más allá de la juliana y el brunoise, la cocina profesional usa una familia completa de cortes clásicos. Cada uno tiene su nombre, sus medidas precisas y sus aplicaciones específicas. Conocerlos te permite leer una receta profesional y ejecutarla con precisión.',
        sections: [
          {
            type: 'table',
            title: 'Los cortes clásicos y sus medidas',
            content: [
              { col1: 'Juliana', col2: '3mm × 3mm × 6cm: bastones finos' },
              { col1: 'Brunoise', col2: '3mm × 3mm × 3mm: cubos de juliana' },
              { col1: 'Brunoise grueso', col2: '5mm × 5mm × 5mm: para guisos' },
              { col1: 'Chiffonade', col2: 'Tiras finas de hojas (2 a 5mm), solo para hierbas y hojas' },
              { col1: 'Macedonia', col2: '5mm × 5mm × 5mm: frutas y vegetales para ensaladas' },
              { col1: 'Jardinera', col2: '5mm × 5mm × 4cm: guisos y acompañamientos' },
              { col1: 'Paisana', col2: 'Cuadrado plano, 1cm × 1cm × 2mm. Para sopas' },
              { col1: 'Tournée', col2: 'Forma de balón de rugby, 7 caras. Para presentación' },
            ],
          },
          {
            type: 'steps',
            title: 'Brunoise: derivado de la juliana',
            content: [
              'Prepara julianas parejas de 3mm × 3mm × 6cm',
              'Agrupa en manojos de 4 a 5 bastones bien alineados',
              'Corta transversalmente a 3mm de intervalo',
              'El resultado deben ser cubos de 3mm × 3mm × 3mm',
              'La clave: si la juliana sale pareja, el brunoise también',
            ],
          },
          {
            type: 'steps',
            title: 'Chiffonade de albahaca',
            content: [
              'Apila 5 a 6 hojas de albahaca, las más grandes abajo',
              'Enrolla las hojas en un cilindro compacto',
              'Corta el cilindro transversalmente en tiras de 2 a 3mm',
              'Despega las tiras suavemente para separar las cintas',
              'Úsala de inmediato: la albahaca se oxida rápido y se pone negra',
            ],
          },
          {
            type: 'tip',
            content: 'El tornear (tournée) es el corte más difícil y se usa principalmente para concursos y alta cocina. Requiere un cuchillo tournée (pequeño y curvo). Se practica con zanahoria, calabacín o papa, tornando 7 caras exactamente simétricas.',
          },
          {
            type: 'list',
            title: 'Aplicaciones por corte',
            content: [
              'Brunoise: sofrito base, guarniciones de consommé, rellenos de pasta',
              'Chiffonade: decoración de platos, ensaladas de hojas, topping de sopas',
              'Macedonia: ensalada de frutas, pickles variados, guarniciones frías',
              'Jardinera: vegetales salteados, menestra, guisos de legumbres',
              'Paisana: minestrone y sopas campesinas. Da textura sin tapar los ingredientes',
            ],
          },
        ],
        keyPoints: [
          'El brunoise es simplemente juliana cortada transversalmente en cubos',
          'La chiffonade es el corte en cintas para hojas y hierbas: enrollar y cortar',
          'Las medidas exactas garantizan cocción uniforme, no solo buena presentación',
          'El tournée tiene exactamente 7 caras y se usa en alta cocina',
          'Si la juliana sale dispareja, el brunoise también saldrá mal',
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
            explanation: 'El corte paisana (cuadrado plano 1cm × 1cm × 2mm) es típico de sopas campesinas como el minestrone. Su forma plana y tamaño mediano permite que los vegetales se cocinen uniformemente sin dominar visualmente el plato.',
          },
        ],
      },
    },
    {
      id: 'cocciones',
      emoji: '💧',
      title: 'Cocción Húmeda vs. Cocción Seca',
      duration: '28:00',
      description: 'Cuándo brasear, cuándo hornear, cuándo saltear y cuándo hervir. El método que eliges cambia la textura y el sabor del resultado.',
      topics: ['Métodos secos: grilla, horno, saltear', 'Métodos húmedos: pochar, hervir, vapor, brasear', 'Temperatura baja y lenta vs alta y rápida', 'Cuándo usar cada método según el corte'],
      content: {
        intro: 'El método de cocción cambia por completo el resultado. Un corte duro cocinado en seco queda gomoso; el mismo corte braseado queda tierno y meloso. Con los principios de cada método puedes adaptar cualquier receta.',
        sections: [
          {
            type: 'table',
            title: 'Métodos de cocción húmeda',
            content: [
              { col1: 'Hervir (100°C)', col2: 'Pastas, verduras, legumbres. Rápido pero puede sobre-cocinar' },
              { col1: 'Pochar (70 a 85°C)', col2: 'Huevos, pescados, frutas. Suave, preserva textura delicada' },
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
            title: 'Técnica de brasear para cortes duros',
            content: [
              'Sella el corte en aceite caliente por todos lados (Maillard)',
              'Retira la carne y sofríe la mirepoix (cebolla, zanahoria, apio)',
              'Agrega el líquido (vino, fondo) hasta cubrir la mitad de la carne',
              'Tapa y cocina en horno a 160°C o fuego muy bajo',
              'Tiempo: 2 a 4 horas hasta que la carne se deshaga al pincharla',
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
          'El pochar es cocción húmeda a 70 a 85°C, mucho más suave que hervir',
          'El brasear empieza sellando la carne para dar sabor (el sellado no retiene jugos)',
          'Si el músculo trabaja mucho en el animal, requiere cocción larga',
        ],
        quiz: [
          {
            q: '¿Qué método de cocción convierte el colágeno duro en gelatina suave?',
            options: ['Saltear a fuego alto', 'Grilla directa', 'Brasear (cocción húmeda larga)', 'Hornear a 220°C'],
            correct: 2,
            explanation: 'El colágeno de los cortes duros se convierte en gelatina (que da la textura melosa característica) con calor húmedo prolongado: mínimo 2 horas a temperatura baja. El calor seco solo endurece el colágeno.',
          },
          {
            q: '¿A qué temperatura se pocha un huevo?',
            options: ['100°C (hervor)', '70 a 85°C', '60°C', '50°C'],
            correct: 1,
            explanation: 'El pochado ocurre entre 70 y 85°C, por debajo del punto de ebullición. Esta temperatura baja coagula suavemente las proteínas del huevo sin endurecerlas. A 100°C el blanco quedaría gomoso.',
          },
          {
            q: '¿Qué tipo de cortes son ideales para la grilla o el saltear?',
            options: ['Cortes ricos en colágeno como osobuco', 'Cortes de músculos que trabajan mucho', 'Cortes tiernos con pocos tejidos conectivos', 'No importa el tipo de corte'],
            correct: 2,
            explanation: 'Los cortes tiernos (lomo, solomillo, pechuga) tienen pocos tejidos conectivos y se benefician del calor seco rápido que los dora sin resecarlos. Los cortes duros en calor seco quedan gomosos.',
          },
        ],
      },
    },
    {
      id: 'fermentacion',
      emoji: '🍞',
      title: 'Fermentación Básica: Masa Madre',
      duration: '30:00',
      isPremium: true,
      description: 'Inicia tu primer cultivo de masa madre y entiende la fermentación láctica que convierte harina y agua en pan.',
      topics: ['Levaduras silvestres y bacterias lácticas', 'Refrescar un starter', 'Hidratación de la masa (60-80%)', 'Primera y segunda fermentación'],
      content: {
        intro: 'La masa madre es una de las formas más antiguas de hacer pan. Tu propio starter combina levaduras silvestres y bacterias lácticas que convierten harina y agua en una masa que leva y da sabor.',
        sections: [
          {
            type: 'text',
            title: 'La biología de la masa madre',
            content: 'Una masa madre sana contiene dos tipos de microorganismos que trabajan en simbiosis: levaduras silvestres (como Saccharomyces cerevisiae y otras especies) que producen CO₂ (las burbujas que hacen subir el pan) y bacterias lácticas (Lactobacillus) que producen ácido láctico y ácido acético, responsables del sabor ácido característico.',
          },
          {
            type: 'steps',
            title: 'Cómo crear un starter desde cero (5 a 7 días)',
            content: [
              'Día 1: mezcla 50g de harina integral + 50g agua a 25°C en un frasco limpio. Tapa sin sellar. Deja a temperatura ambiente',
              'Días 2 y 3: verás burbujas pequeñas. Las levaduras están activas. Puede haber mal olor (bacterias acéticas temporales), y es normal',
              'Días 3 y 4: descarta la mitad (25g) y agrega 25g harina + 25g agua. Esto se llama "refrescar"',
              'Días 5 y 6: el starter debe doblar su tamaño en 4 a 8 horas después de refrescar. El olor cambia a yogur/vinagre agradable',
              'Día 7: haz la prueba de flotación. Pon una cucharada de starter en agua. Si flota, está listo para usar',
            ],
          },
          {
            type: 'tip',
            content: 'La temperatura es crítica: entre 24 y 28°C es el rango óptimo. En invierno, pon el frasco cerca de una fuente de calor. En verano, puede fermentar más rápido. Las levaduras son organismos vivos y responden al ambiente.',
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
              'Refresca el starter 4 a 8h antes de usarlo (debe estar en su pico de actividad)',
              'Mezcla starter + agua + harina + sal (sal siempre al final, inhibe las levaduras)',
              'Autólisis: deja reposar 30 min después de mezclar. El gluten se desarrolla solo',
              'Primera fermentación (bulk): 4 a 12 horas a temperatura ambiente con pliegues cada hora las primeras 4h',
              'Formado: da forma al pan con tensión superficial',
              'Segunda fermentación: en molde en el refrigerador 8 a 16 horas (cold retard)',
              'Hornea en horno con vapor a 250°C los primeros 20 min, luego sin vapor 20 min más',
            ],
          },
          {
            type: 'warning',
            content: 'La sal inhibe las levaduras y las bacterias. Nunca la mezcles directamente con el starter. Agrégala siempre después de combinar la harina con el agua y el starter.',
          },
        ],
        keyPoints: [
          'Una masa madre sana tiene levaduras (CO₂) y bacterias lácticas (sabor ácido)',
          'Refrescar significa descartar la mitad y agregar harina + agua fresca',
          'La prueba de flotación indica que el starter está listo: si flota, úsalo',
          'La sal siempre va al final: inhibe las levaduras si se mezcla directamente',
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
    },
  ],
};
