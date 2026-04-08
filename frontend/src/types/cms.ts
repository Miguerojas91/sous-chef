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
    type: string;
    content: string; // Text for paragraphs, URL for images, etc.
    title?: string; // Used for accordions or image captions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    styles?: any;
    children?: CMSBlock[]; // For nested structures if needed later
}

export interface CMSPage {
    id: number;
    slug: string;
    title: string | null;
    content_json: string; // The raw JSON string attached from DB
}
