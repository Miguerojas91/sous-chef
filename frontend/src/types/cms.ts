/** Tipos del CMS. Una página guarda sus bloques como JSON en `content_json`. */

export type BlockType = 'paragraph' | 'header' | 'image' | 'accordion' | 'checklist' | 'quote';

export interface BlockStyle {
    color?: string;
    alignment?: 'left' | 'center' | 'right';
    bold?: boolean;
    italic?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export interface CMSBlock {
    id: string;
    /** `BlockType`, tipado como string para poder añadir tipos sin migrar datos. */
    type: string;
    /** Texto, o la URL en bloques de imagen. */
    content: string;
    /** Título del acordeón o pie de foto de la imagen. */
    title?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    styles?: any;
    /** Aún no se renderiza. */
    children?: CMSBlock[];
}

export interface CMSPage {
    id: number;
    /** p. ej. `receta-paella` */
    slug: string;
    title: string | null;
    /** `CMSBlock[]` serializado. */
    content_json: string;
}
