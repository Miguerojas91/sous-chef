/**
 * @file main.tsx
 * @description Punto de entrada principal de la aplicación Sous Chef.
 * Monta el componente raíz `App` dentro de `StrictMode` para activar
 * advertencias adicionales de React en desarrollo.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
