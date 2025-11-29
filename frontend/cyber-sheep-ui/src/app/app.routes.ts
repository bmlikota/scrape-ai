import { Routes } from '@angular/router';
import { Onboarding } from './features/onboarding/onboarding';
import { Dashboard } from './features/dashboard/dashboard';
import { NewsDetail } from './features/news-detail/news-detail';
import { Settings } from './features/settings/settings';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'onboarding' },
  { path: 'onboarding', component: Onboarding },
  { path: 'dashboard', component: Dashboard },
  { path: 'news/:id', component: NewsDetail },
  { path: 'settings', component: Settings },
  { path: '**', redirectTo: 'dashboard' },
];