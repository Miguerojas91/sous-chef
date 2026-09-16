/**
 * ErrorBoundary.tsx
 *
 * Captura errores de renderizado para que un fallo en cualquier subárbol
 * no deje la app entera en blanco. Muestra una UI amigable con opción de
 * recargar o ir al inicio.
 */
import { Component, type ReactNode } from 'react';
import { ChefHat, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** UI alternativa opcional (override del default). */
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
    // En producción esto se enviaría a Sentry/equivalente.
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
        className="min-h-screen flex items-center justify-center bg-neutral-50 px-6"
      >
        <div className="max-w-sm w-full text-center">
          <div className="inline-flex p-4 rounded-3xl bg-gradient-to-br from-orange-400 to-rose-500 shadow-lg mb-6">
            <ChefHat className="w-10 h-10 text-white" aria-hidden />
          </div>

          <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight mb-2">
            Algo se quemó en la cocina
          </h1>
          <p className="text-sm text-neutral-500 mb-6">
            Hubo un error inesperado. Recarga la app para volver a la cocina.
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={this.handleReload}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-colors"
            >
              <RefreshCw size={16} aria-hidden /> Recargar
            </button>
            <button
              onClick={this.handleHome}
              className="py-3 px-4 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-bold text-sm transition-colors"
            >
              Volver al inicio
            </button>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <details className="mt-6 text-left text-xs text-neutral-400 bg-white p-3 rounded-lg border border-neutral-100">
              <summary className="cursor-pointer font-semibold">Detalles (dev)</summary>
              <pre className="mt-2 whitespace-pre-wrap break-all">{this.state.error.message}</pre>
            </details>
          )}
        </div>
      </main>
    );
  }
}
