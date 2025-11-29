import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormArray,
} from '@angular/forms';
import { PreferencesService } from '../../core/services/preferences.service';
import { NewsCategory } from '../../core/models/news';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.scss',
})
export class Onboarding implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly prefs = inject(PreferencesService);
  private readonly router = inject(Router);

  categories = this.prefs.categories;
  form!: FormGroup;

  get categoryControls(): FormArray {
    return this.form.get('categories') as FormArray;
  }

  ngOnInit(): void {
    const current = this.prefs.preferences();

    this.form = this.fb.group({
      categories: this.fb.array(
        this.categories().map(cat =>
          this.fb.control(
            current.selectedCategories.includes(cat as NewsCategory),
          ),
        ),
      ),
      minRelevancePercent: this.fb.control(Math.round(current.minRelevance * 100)),
      minConfidencePercent: this.fb.control(
        Math.round(current.minConfidence * 100),
      ),
    });
  }

  onSubmit(): void {
    const raw = this.form.value;

    const selected: NewsCategory[] = this.categories().filter(
      (cat, index) => raw.categories[index],
    ) as NewsCategory[];

    const minRel = (raw.minRelevancePercent ?? 60) / 100;
    const minConf = (raw.minConfidencePercent ?? 70) / 100;

    this.prefs.updateCategories(selected);
    this.prefs.updateThresholds(minRel, minConf);

    this.router.navigate(['/dashboard']);
  }
}