/** Ícono de cada mundo del Modo Aventura, en lugar de emoji. */

import { UtensilsCrossed, Flame, Waves, Mountain, Crown } from 'lucide-react';
import type { LucideIcon, LucideProps } from 'lucide-react';
import type { WorldId } from '../../data/worlds';

const ICONS: Record<WorldId, LucideIcon> = { 1: UtensilsCrossed, 2: Flame, 3: Waves, 4: Mountain, 5: Crown };

export function WorldIcon({ world, ...props }: { world: WorldId } & LucideProps) {
  const Icon = ICONS[world];
  return <Icon aria-hidden {...props} />;
}
