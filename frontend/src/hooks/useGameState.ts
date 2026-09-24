/** Rango, racha y semana del usuario; se refresca con `userStateChange`. */

import { useEffect, useState } from 'react';
import { getUser } from '../utils/auth';
import { onUserStateChange } from '../utils/events';
import { getRankInfo, type RankInfo } from '../utils/rank';
import { getStreak, getWeek, isActiveToday, type WeekDay } from '../utils/streak';

export interface GameState { username: string; rank: RankInfo; streak: number; week: WeekDay[]; today: boolean }

function read(): GameState {
  const user = getUser() as { username?: string; xp?: number } | null;
  return {
    username: user?.username ?? '',
    rank: getRankInfo(user?.xp ?? 0),
    streak: getStreak(),
    week: getWeek(),
    today: isActiveToday(),
  };
}

export function useGameState(): GameState {
  const [state, setState] = useState(read);
  useEffect(() => onUserStateChange(() => setState(read())), []);
  return state;
}

