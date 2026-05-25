# Política de Monetización — Sous Chef

**Última actualización**: 2026-05-17
**Estado**: Vigente · v1.0
**Responsable de cambios**: Miguel Rojas

---

## 🎯 Tesis de negocio

Sous Chef es **freemium**, no "premium con teaser gratis". El contenido y la
asistencia básica son **gratis para siempre y sin límite**. La monetización
viene de:

1. **Topes razonables de voz** (recurso caro).
2. **Contenido avanzado curado** (Modo Aventura mundos 3-5, lecciones de
   Academia para nivel profesional/avanzado).
3. **Productividad** (planificación automática semanal, lista de compras
   auto-generada — cuando se implementen).

### Regla de oro

> "Si la queja #1 del mercado es 'cobra por funciones básicas' (417 menciones,
> 12.59% del dataset), entonces lo básico se queda gratis. Punto."

Yummly cerró por violar esta regla. Cookpad creció por respetarla.

---

## 💰 Tarifas (USD)

| Plan | Precio | A quién va dirigido |
|---|---|---|
| **Free** | $0 | Cualquier persona que quiera aprender a cocinar o usar un chef IA |
| **Pro** | **$9.99/mes** | Cocineros que quieran contenido avanzado y voz frecuente |
| (Futuro) Pro+ | $19.99/mes | Profesionales / cocineros intensivos de voz |
| (Futuro) Familia | $14.99/mes | 1 plan, hasta 5 perfiles, XP compartido |
| (Futuro) Lifetime | $199 one-shot | Early adopters convencidos |

---

## 🟢 SIEMPRE GRATIS — sin tocar nunca

Estas features definen al producto y NUNCA se mueven a paywall, sin importar
el crecimiento o las presiones de monetización:

| Feature | Justificación |
|---|---|
| Chat IA en `/cocinar` (texto, SSE) | Diferenciador #1. Costo IA ínfimo ($0.001/sesión). El 24% del mercado pide IA confiable — es nuestra adquisición. |
| Evaluación de fotos con IA en niveles | Costo IA ínfimo ($0.0002/foto). Genera el "wow moment" inicial. |
| Modo Aventura — Mundos 1 y 2 (8 niveles) | Suficiente contenido para que el usuario gane el hábito antes de pedir conversión. |
| Búsqueda por ingredientes (`cook-ingredients` intent) | El comentario con 4,359 likes del informe. NO se cobra por algo que el mercado pide a gritos. |
| Sabores del Mundo | Adquisición y educación cultural. |
| Filtros sin-horno / 3-ingredientes / económico / para-niños / diabético / keto / vegetariano / sin gluten | **Restricciones de salud y de hogar nunca se cobran**. |
| Country onboarding + localización de recetas | Definitivo del producto. |
| Academia — lecciones básicas y de uso cotidiano (11) | Cocina básica = derecho del usuario. Ver lista en sección Academia abajo. |
| Mealprep manual (escribir tu propio plan) | Capacidad básica. |
| Login / Registro / Perfil | Obvio. |

---

## 🔒 Premium ($9.99/mes)

### Voz en vivo (Gemini Live)

| Tier | Voz incluida | Cap duro |
|---|---|---|
| **Free** | 15 minutos/mes | Sí — al agotarse, botón muestra CTA a Premium |
| **Pro** | 60 minutos/mes | Sí — fair-use; al agotarse igual CTA o reset al mes siguiente |

**Por qué hay cap incluso en Pro**: a $0.03/min en Gemini Live, un usuario
ilimitado puede consumir $30-50/mes. Pagar $9.99 e ingerir $30+ no funciona.
Si el usuario llega al cap de Pro y pide más, lo subimos a Pro+ futura tier
o le ofrecemos $0.05/min pay-as-you-go.

**El reset es mensual**: el contador se reinicia el día 1 de cada mes.

### Modo Aventura — Mundos 3, 4 y 5 (12 niveles)

Contenido avanzado curado. Justificación:
- Mundo 3 — Mar de Sabores: fondos profesionales (blanco, oscuro, fumet) +
  Maestro de Salsas. Skill de chef profesional.
- Mundo 4 — Pico del Maestro: Sous-Vide, Esferificación, Fermentación + Alquimista.
  Técnicas modernas (Adrià, Blumenthal). Equipo especializado.
- Mundo 5 — Castillo del Chef: Menú degustación, Maridaje, Alta Cocina, Gran Chef.
  Contenido para profesionales o entusiastas serios.

### Academia — 15 lecciones avanzadas

Premium:
- Fermentación: Masa Madre
- Cocina Sous-Vide y Pasteurización
- Esferificación Básica e Inversa
- Despiece Completo de Res y Cerdo
- Pastelería Avanzada: Cremas y Rellenos
- Geles, Espumas y Cocina Molecular
- Diseño de Menú Degustación
- Maridaje Avanzado: Vino y Gastronomía
- Alta Cocina Francesa Clásica
- Gastronomía Molecular Avanzada
- Carnicería Artesanal Completa
- Liderazgo y Gestión de Brigada
- (3 más en el catálogo actual)

Justificación: contenido profesional/avanzado que requiere equipo, tiempo y
contexto de cocinero serio. Es justo cobrar por el conocimiento curado.

### (Futuro) Features de productividad

Aún no implementadas pero serán Premium cuando lleguen:

- Generador automático de plan semanal con IA (no la manual)
- Lista de compras auto-generada desde el plan
- Modo "Cocinero de despensa": IA propone semana entera con lo que tengas
- Exportar plan semanal a PDF o calendario

### (Futuro) Cuentas familiares

Si llega tier "Familia" ($14.99): 1 cuenta, hasta 5 perfiles individuales,
XP compartido en la casa, recetas heredadas.

---

## 📚 Academia — Estado actualizado

### Gratis (13 lecciones, incluye las 2 recién liberadas)

1. Higiene y Seguridad en la Cocina
2. Anatomía del Cuchillo de Chef
3. Corte Juliana: Técnica y Práctica
4. Temperaturas Seguras de Cocción
5. Mise en Place: El Arte de la Preparación
6. Manejo y Conservación de Proteínas
7. Fondos Básicos: El Alma de la Cocina
8. Reacción de Maillard: El Secreto del Sabor
9. Cortes Avanzados de Verduras
10. Cocción Húmeda vs. Cocción Seca
11. Paletas de Sabor y Creatividad Culinaria
12. **🆕 Ciencia de las Emulsiones** (mayonesa, vinagretas — uso diario)
13. **🆕 Las 5 Salsas Madre Francesas** (bechamel, velouté — básico)

### Premium (15 lecciones avanzadas)

Ver sección anterior.

---

## ⚠️ Lo que NUNCA hacemos

| Anti-patrón | Por qué evitarlo |
|---|---|
| ❌ Paywall a recetas individuales | Queja #1 del mercado (417 comentarios). Yummly murió por esto. |
| ❌ Pagar para usar la búsqueda | El #1 deseo del mercado (24.37%) es IA que sugiera recetas. Cobrar = suicidio. |
| ❌ Anuncios publicitarios | Falencia #5 del mercado. El usuario hispano detesta apps con ads. |
| ❌ Registro obligatorio con datos médicos para usar la app | Falencia #7. Pedir kilos/altura/condiciones antes de mostrar valor es barrera. |
| ❌ Cobrar por filtros de dieta médica (diabético, sin gluten) | Personalización por salud NO se cobra. Punto. |
| ❌ Voz ilimitada gratis sin cap | Insostenible. Cualquier usuario power te sangra $30-50/mes. |

---

## 📈 Proyección a escala (con caps 15/60 min/mes)

Conversión asumida 5% Free → Pro. Costos IA con Gemini Live actual.

| Usuarios totales | Pro | Costo IA realista | Ingreso Pro | Margen |
|---|---|---|---|---|
| 1,000 | 50 | $200 | $500 | **+$300** ✅ |
| 5,000 | 250 | $1,005 | $2,498 | **+$1,493** ✅ |
| 10,000 | 500 | $2,010 | $4,995 | **+$2,985** ✅ |
| 50,000 | 2,500 | $10,050 | $24,975 | **+$14,925** ✅ |

Con migración futura a Deepgram, márgenes 30-50% mejores.

---

## 🔄 Proceso de cambios a esta política

1. Cualquier ajuste de paywall **requiere referencia explícita al informe
   de mercado** (`Apps_Cocina_Falencias_Virtudes_SousChef.docx`).
2. Antes de bloquear una feature nueva, validar que NO entra en categoría
   "queja del mercado" (`/api/cocinar`, filtros, recetas básicas).
3. Documentar el cambio aquí con fecha + razón.

### Historial de cambios

- **2026-05-17** · v1.0 inicial.
  - Decisión 1 (A): bajar lecciones de Emulsiones y Salsas Madre a gratis.
  - Decisión 2: cap de voz 15 min/mes Free, 60 min/mes Pro.
  - Decisión 3 (B): precio Pro en $9.99/mes.
