import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ThemeSettings {
  darkMode: boolean;
  primaryColor: string;
  secondaryColor: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSubject = new BehaviorSubject<ThemeSettings>({
    darkMode: false,
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981'
  });

  public theme$: Observable<ThemeSettings> = this.themeSubject.asObservable();

  constructor() {
    this.loadTheme();
  }

  toggleDarkMode(): void {
    const current = this.themeSubject.value;
    const updated = { ...current, darkMode: !current.darkMode };
    this.setTheme(updated);
  }

  setTheme(theme: ThemeSettings): void {
    localStorage.setItem('theme', JSON.stringify(theme));
    this.themeSubject.next(theme);

    if (theme.darkMode) {
      document.documentElement.classList.add('app-dark');
    } else {
      document.documentElement.classList.remove('app-dark');
    }
  }

  private loadTheme(): void {
    const saved = localStorage.getItem('theme');
    if (saved) {
      const theme = JSON.parse(saved);
      this.setTheme(theme);
    }
  }
}
