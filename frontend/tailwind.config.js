/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Naranja de marca. Los fondos con texto blanco usan brand-700
                // (5.18:1); brand-500 con blanco solo llega a 2.80:1 y no pasa AA.
                brand: {
                    50:  '#fff7ed',
                    100: '#ffedd5',
                    200: '#fed7aa',
                    300: '#fdba74',
                    400: '#fb923c',
                    500: '#f97316',
                    600: '#ea580c',
                    700: '#c2410c',
                    800: '#9a3412',
                    900: '#7c2d12',
                },
                // Un color sólido por mundo del Modo Aventura. DEFAULT soporta
                // texto blanco con contraste AA; soft es el fondo de sección y
                // line el borde. El mundo 4 era violeta: pasa a pizarra.
                world: {
                    1: { DEFAULT: '#047857', soft: '#ecfdf5', line: '#a7f3d0' },
                    2: { DEFAULT: '#b91c1c', soft: '#fef2f2', line: '#fecaca' },
                    3: { DEFAULT: '#1d4ed8', soft: '#eff6ff', line: '#bfdbfe' },
                    4: { DEFAULT: '#334155', soft: '#f1f5f9', line: '#cbd5e1' },
                    5: { DEFAULT: '#92400e', soft: '#fffbeb', line: '#fde68a' },
                },
                danger: '#b91c1c',
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
            },
            borderRadius: {
                control: '0.75rem',
                card: '1rem',
                sheet: '1.5rem',
            },
            boxShadow: {
                raised: '0 1px 2px rgb(0 0 0 / 0.06)',
                overlay: '0 12px 32px rgb(0 0 0 / 0.18)',
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'sheet-up': 'sheetUp 0.25s ease-out',
                'pop': 'pop 0.4s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                sheetUp: {
                    '0%': { transform: 'translateY(16px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                pop: {
                    '0%': { transform: 'scale(0.85)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
