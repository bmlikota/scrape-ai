import { Injectable, signal, computed } from '@angular/core';
import { NewsCategory } from '../models/news';

export interface UserPreferences {
  selectedCategories: NewsCategory[];
  minRelevance: number;   // 0–1
  minConfidence: number;  // 0–1
}

const ALL_CATEGORIES: NewsCategory[] = [
  'Malware',
  'Phishing',
  'Social Networks',
  'AI Agents',
  'Cloud',
  'Other',
  'Banking',
  'Endpoint',
  'Vulnerability',
];

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  // default prefs
  private readonly _preferences = signal<UserPreferences>({
    selectedCategories: ['Malware', 'Phishing', 'AI Agents'],
    minRelevance: 0.6,
    minConfidence: 0.7,
  });

  readonly preferences = this._preferences.asReadonly();
  readonly categories = signal<NewsCategory[]>(ALL_CATEGORIES);

  readonly selectedCategories = computed(
    () => this._preferences().selectedCategories,
  );
  readonly minRelevance = computed(() => this._preferences().minRelevance);
  readonly minConfidence = computed(() => this._preferences().minConfidence);

  updatePreferences(patch: Partial<UserPreferences>): void {
    this._preferences.update(current => ({
      ...current,
      ...patch,
    }));
  }

  updateCategories(categories: NewsCategory[]): void {
    this.updatePreferences({ selectedCategories: categories });
  }

  updateThresholds(minRelevance: number, minConfidence: number): void {
    this.updatePreferences({ minRelevance, minConfidence });
  }
}
