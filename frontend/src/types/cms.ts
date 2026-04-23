/**
 * cms.ts
 *
 * Tipos del sistema CMS (Constructor Visual) de Sous Chef.
 * Define la estructura de páginas dinámicas y bloques de contenido
 * que el administrador puede crear y editar en tiempo real.
 *
 * Flujo de datos:
 * - Las páginas se almacenan en la base de datos como JSON (`content_json`).
 * - El `DynamicPageRenderer` deserializa ese JSON y renderiza los bloques.
 * - El `CMSDashboard` permite al admin crear/editar páginas y bloques.
 */

/** Tipos de bloque soportados por el CMS. */
export type BlockType = 'paragraph' | 'header' | 'image' | 'accordion' | 'checklist' | 'quote';

/** Estilos visuales opcionales aplicables a un bloque de contenido. */
export interface BlockStyle {
    /** Color de texto en formato CSS (ej. `#333333`). */
    color?: string;
    /** Alineación horizontal del contenido del bloque. */
    alignment?: 'left' | 'center' | 'right';
    /** Si el texto debe mostrarse en negrita. */
    bold?: boolean;
    /** Si el texto debe mostrarse en cursiva. */
    italic?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

/** Unidad de contenido del CMS. Puede ser párrafo, encabezado, imagen, etc. */
export interface CMSBlock {
    /** Identificador único del bloque (UUID). */
    id: string;
    /** Tipo de bloque (ver `BlockType`). Se guarda como string para extensibilidad. */
    type: string;
    /** Contenido principal: texto para párrafos/encabezados, URL para imágenes. */
    content: string;
    /** Título opcional: usado en acordeones o como pie de foto en imágenes. */
    title?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    /** Estilos opcionales del bloque (color, alineación, etc.). */
    styles?: any;
    /** Bloques hijos para estructuras anidadas (uso futuro). */
    children?: CMSBlock[];
}

/** Página dinámica del CMS almacenada en la base de datos. */
export interface CMSPage {
    /** ID autoincremental de la base de datos. */
    id: number;
    /** Identificador de URL amigable, ej. `receta-paella`. */
    slug: string;
    /** Título de la página (puede ser null si aún no se ha definido). */
    title: string | null;
    /** JSON serializado del array de `CMSBlock[]` de la página. */
    content_json: string;
}
