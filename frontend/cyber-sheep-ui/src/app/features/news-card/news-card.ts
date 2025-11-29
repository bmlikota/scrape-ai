import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { News } from '../../core/models/news';

@Component({
  selector: 'app-news-card',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './news-card.html',
  styleUrl: './news-card.scss',
})
export class NewsCard {
  @Input({ required: true }) news!: News;

  get relevanceLabel(): string {
    return `${Math.round(this.news.relevanceScore * 100)}%`;
  }

  get confidenceLabel(): string {
    return `${Math.round(this.news.confidenceScore * 100)}%`;
  }

  get riskLevel(): 'high' | 'medium' | 'low' {
    const rel = this.news.relevanceScore;
    const conf = this.news.confidenceScore;

    if (rel >= 0.9 && conf >= 0.85) return 'high';
    if (rel >= 0.7 && conf >= 0.6) return 'medium';
    return 'low';
  }

  get riskLabel(): string {
    switch (this.riskLevel) {
      case 'high':
        return 'High priority';
      case 'medium':
        return 'Medium priority';
      default:
        return 'Low priority';
    }
  }
}
