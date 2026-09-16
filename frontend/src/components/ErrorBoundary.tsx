/** Evita que un error de render deje la app entera en blanco. */
import { Component, type ReactNode } from 'react';
import { ChefHat, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }): void {
    // Sin servicio de reporte de errores: solo queda en consola.
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleHome = (): void => {
    window.location.href = '/home';
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <main
        role="alert"
        aria-live="assertive"
        className="min-h-dvh flex items-center justify-center bg-neutral-50 px-4 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="max-w-sm w-full text-center">
          <ChefHat className="w-12 h-12 text-brand-700 mx-auto mb-4" aria-hidden />

          <h1 className="text-xl md:text-2xl font-extrabold text-neutral-900 mb-2">
            Algo falló en la app
          </h1>
          <p className="text-sm text-neutral-600 mb-6">
            Hubo un error inesperado. Recarga para seguir donde ibas.
          </p>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={this.handleReload}
              className="min-h-11 flex items-center justify-center gap-2 px-4 rounded-control bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
            >
              <RefreshCw size={16} aria-hidden /> Recargar
            </button>
            <button
              type="button"
              onClick={this.handleHome}
              className="min-h-11 px-4 rounded-control bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-800 font-bold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
            >
              Volver al inicio
            </button>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <details className="mt-6 text-left text-xs text-neutral-600 bg-white p-3 rounded-card border border-neutral-200">
              <summary className="cursor-pointer font-semibold min-h-11 flex items-center">Detalles (dev)</summary>
              <pre className="mt-2 whitespace-pre-wrap [overflow-wrap:anywhere]">{this.state.error.message}</pre>
            </details>
          )}
        </div>
      </main>
    );
  }
}
