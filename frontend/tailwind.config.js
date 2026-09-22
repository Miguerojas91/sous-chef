import { WORLD_TOKENS } from './src/data/worldTokens.ts';

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
                // Un color sólido por mundo del Modo Aventura (`world-N`,
                // `world-N-soft`, `world-N-line`). Los hex viven en worldTokens.ts.
                world: Object.fromEntries(
                    Object.entries(WORLD_TOKENS).map(([id, t]) => [id, { DEFAULT: t.main, soft: t.soft, line: t.line }]),
                ),
                danger: '#b91c1c',
                primary: "#10B981",
                secondary: "#3B82F6",
                accent: "#F59E0B",
                dark: "#1F2937",
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
                'fade-in': 'fadeIn 0.35s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'float': 'float 3s ease-in-out infinite',
                'sheet-up': 'sheetUp 0.25s ease-out',
                'pop': 'pop 0.4s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-6px)' },
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
