import { create } from 'zustand';
import i18next from '../i18n/config';

interface User {
  id: number;
  name: string;
  email: string;
  language: string;
  theme: string;
  location_permission: boolean;
}

interface AppState {
  token: string | null;
  user: User | null;
  theme: 'dark' | 'light';
  language: string;
  locationPermission: boolean;
  userCoords: { lat: number; lng: number } | null;
  
  setAuth: (token: string | null, user: User | null) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setLanguage: (lang: string) => void;
  setLocationPermission: (allowed: boolean) => void;
  setUserCoords: (coords: { lat: number; lng: number } | null) => void;
  logout: () => void;
}

const getInitialTheme = (): 'dark' | 'light' => {
  const saved = localStorage.getItem('theme');
  const initial = (saved === 'light' || saved === 'dark') ? saved : 'dark';
  if (initial === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  return initial;
};

const getInitialLang = (): string => {
  return localStorage.getItem('language') || 'en';
};

export const useAppStore = create<AppState>((set) => ({
  token: localStorage.getItem('token'),
  user: null,
  theme: getInitialTheme(),
  language: getInitialLang(),
  locationPermission: localStorage.getItem('location_permission') === 'true',
  userCoords: null,

  setAuth: (token, user) => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    
    if (user?.language) {
      i18next.changeLanguage(user.language);
    }
    set({ token, user });
  },

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ theme });
  },

  setLanguage: (language) => {
    localStorage.setItem('language', language);
    i18next.changeLanguage(language);
    set({ language });
  },

  setLocationPermission: (allowed) => {
    localStorage.setItem('location_permission', String(allowed));
    set({ locationPermission: allowed });
  },

  setUserCoords: (coords) => set({ userCoords: coords }),

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  }
}));
