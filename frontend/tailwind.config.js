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
                // Paleta del rediseño 2026-09: se sobrescriben las escalas de Tailwind
                // para que toda la app tome los colores nuevos sin tocar cada clase.
                // orange/brand = tomate, amber/yellow = oro, emerald/green = albahaca,
                // blue = azul, violet/purple = violeta, neutral/gray/stone = cacao cálido.
                orange: { 50: '#FFF3EF', 100: '#FCE4DC', 200: '#F8C6B7', 300: '#F2A08A', 400: '#E9765A', 500: '#DD5236', 600: '#CC3B21', 700: '#AE3019', 800: '#962812', 900: '#6E1F10', 950: '#4A140A' },
                rose: { 50: '#FFF1EE', 100: '#FCE2DC', 200: '#F6C1B4', 300: '#EE9884', 400: '#E26B55', 500: '#CC3B21', 600: '#B5321C', 700: '#962812', 800: '#7A2112', 900: '#5E1A0E', 950: '#3F1108' },
                amber: { 50: '#FFFAE8', 100: '#FFF3C4', 200: '#FFE58A', 300: '#FFD54F', 400: '#FFC61F', 500: '#F5B800', 600: '#C98F00', 700: '#9C6C00', 800: '#7A5600', 900: '#5C4100', 950: '#3D2B00' },
                yellow: { 50: '#FFFAE8', 100: '#FFF3C4', 200: '#FFE58A', 300: '#FFD54F', 400: '#FFC61F', 500: '#F5B800', 600: '#C98F00', 700: '#9C6C00', 800: '#7A5600', 900: '#5C4100', 950: '#3D2B00' },
                emerald: { 50: '#EEF8F1', 100: '#DDF1E3', 200: '#B7DFC4', 300: '#86C79C', 400: '#4FAA70', 500: '#2E9557', 600: '#237F47', 700: '#1D6A3B', 800: '#185C33', 900: '#123F24', 950: '#0B2A18' },
                green: { 50: '#EEF8F1', 100: '#DDF1E3', 200: '#B7DFC4', 300: '#86C79C', 400: '#4FAA70', 500: '#2E9557', 600: '#237F47', 700: '#1D6A3B', 800: '#185C33', 900: '#123F24', 950: '#0B2A18' },
                blue: { 50: '#EEF4FC', 100: '#E0ECFA', 200: '#C4D8F2', 300: '#98BBE8', 400: '#5F93D8', 500: '#2A6FC4', 600: '#235FAA', 700: '#1C4F8E', 800: '#173F71', 900: '#12305A', 950: '#0C203D' },
                violet: { 50: '#F5F2FD', 100: '#ECE6FB', 200: '#D5CAF5', 300: '#B7A5EE', 400: '#9277E1', 500: '#6E4BD1', 600: '#5E3DBE', 700: '#4E31A0', 800: '#3F2880', 900: '#2F1E60', 950: '#1F1340' },
                purple: { 50: '#F5F2FD', 100: '#ECE6FB', 200: '#D5CAF5', 300: '#B7A5EE', 400: '#9277E1', 500: '#6E4BD1', 600: '#5E3DBE', 700: '#4E31A0', 800: '#3F2880', 900: '#2F1E60', 950: '#1F1340' },
                neutral: { 50: '#FBF5EC', 100: '#F4EBDF', 200: '#EBDFCF', 300: '#D6C8B6', 400: '#A38F7C', 500: '#6E5F53', 600: '#574A40', 700: '#3E322A', 800: '#2E231C', 900: '#251B15', 950: '#1A120D' },
                gray: { 50: '#FBF5EC', 100: '#F4EBDF', 200: '#EBDFCF', 300: '#D6C8B6', 400: '#A38F7C', 500: '#6E5F53', 600: '#574A40', 700: '#3E322A', 800: '#2E231C', 900: '#251B15', 950: '#1A120D' },
                stone: { 50: '#FBF5EC', 100: '#F4EBDF', 200: '#EBDFCF', 300: '#D6C8B6', 400: '#A38F7C', 500: '#6E5F53', 600: '#574A40', 700: '#3E322A', 800: '#2E231C', 900: '#251B15', 950: '#1A120D' },
                teal: { 50: '#EEF8F1', 100: '#DDF1E3', 200: '#B7DFC4', 300: '#86C79C', 400: '#4FAA70', 500: '#2E9557', 600: '#237F47', 700: '#1D6A3B', 800: '#185C33', 900: '#123F24', 950: '#0B2A18' },
                lime: { 50: '#EEF8F1', 100: '#DDF1E3', 200: '#B7DFC4', 300: '#86C79C', 400: '#4FAA70', 500: '#2E9557', 600: '#237F47', 700: '#1D6A3B', 800: '#185C33', 900: '#123F24', 950: '#0B2A18' },
                cyan: { 50: '#EEF4FC', 100: '#E0ECFA', 200: '#C4D8F2', 300: '#98BBE8', 400: '#5F93D8', 500: '#2A6FC4', 600: '#235FAA', 700: '#1C4F8E', 800: '#173F71', 900: '#12305A', 950: '#0C203D' },
                sky: { 50: '#EEF4FC', 100: '#E0ECFA', 200: '#C4D8F2', 300: '#98BBE8', 400: '#5F93D8', 500: '#2A6FC4', 600: '#235FAA', 700: '#1C4F8E', 800: '#173F71', 900: '#12305A', 950: '#0C203D' },
                indigo: { 50: '#F5F2FD', 100: '#ECE6FB', 200: '#D5CAF5', 300: '#B7A5EE', 400: '#9277E1', 500: '#6E4BD1', 600: '#5E3DBE', 700: '#4E31A0', 800: '#3F2880', 900: '#2F1E60', 950: '#1F1340' },
                fuchsia: { 50: '#F5F2FD', 100: '#ECE6FB', 200: '#D5CAF5', 300: '#B7A5EE', 400: '#9277E1', 500: '#6E4BD1', 600: '#5E3DBE', 700: '#4E31A0', 800: '#3F2880', 900: '#2F1E60', 950: '#1F1340' },
                pink: { 50: '#FFF1EE', 100: '#FCE2DC', 200: '#F6C1B4', 300: '#EE9884', 400: '#E26B55', 500: '#CC3B21', 600: '#B5321C', 700: '#962812', 800: '#7A2112', 900: '#5E1A0E', 950: '#3F1108' },
                ink: '#251B15',
                cream: '#FBF5EC',
                flame: { DEFAULT: '#F2701B', soft: '#FFE9D6' },
                // Naranja de marca. Los fondos con texto blanco usan brand-700
                // (5.18:1); brand-500 con blanco solo llega a 2.80:1 y no pasa AA.
                brand: { 50: '#FFF3EF', 100: '#FCE4DC', 200: '#F8C6B7', 300: '#F2A08A', 400: '#E9765A', 500: '#DD5236', 600: '#CC3B21', 700: '#AE3019', 800: '#962812', 900: '#6E1F10', 950: '#4A140A' },
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
                sans: ['Nunito', 'ui-rounded', 'system-ui', 'sans-serif'],
                display: ['"Bricolage Grotesque"', 'Nunito', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                control: '0.75rem',
                card: '1rem',
                sheet: '1.5rem',
            },
            boxShadow: {
                raised: '0 3px 0 #EBDFCF',
                tactile: '0 3px 0 #EBDFCF',
                'tactile-lg': '0 5px 0 #EBDFCF',
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
