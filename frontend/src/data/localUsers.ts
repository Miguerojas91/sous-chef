// Usuarios locales para acceso sin backend
export interface LocalUser {
  username: string;
  password: string;
  xp: number;
  rank: string;
  is_admin: boolean;
}

export const LOCAL_USERS: LocalUser[] = [
  {
    username: 'admin',
    password: 'SousChef@Admin1',
    xp: 9999,
    rank: 'Maestría Culinaria',
    is_admin: true,
  },
  {
    username: 'Tatis',
    password: 'Homerojay07*',
    xp: 0,
    rank: 'Iniciado',
    is_admin: false,
  },
  {
    username: 'Papa',
    password: 'Maroma2011.',
    xp: 0,
    rank: 'Iniciado',
    is_admin: false,
  },
  {
    username: 'miguerojas91',
    password: 'Miguel40.',
    xp: 0,
    rank: 'Iniciado',
    is_admin: false,
  },
  {
    username: 'Olga',
    password: 'Valeria',
    xp: 0,
    rank: 'Iniciado',
    is_admin: false,
  },
];
