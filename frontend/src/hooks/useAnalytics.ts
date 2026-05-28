/**
 * useAnalytics.ts
 *
 * Hooks de integración entre react-router y nuestro wrapper de PostHog.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageview } from '../utils/analytics';

/** Dispara pageview en cada cambio de ruta. Montar una vez en el root. */
export function useRoutePageviews(): void {
  const location = useLocation();
  useEffect(() => {
    trackPageview(location.pathname);
  }, [location.pathname]);
}
