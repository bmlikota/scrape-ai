import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AsyncPipe, DatePipe } from '@angular/common';
import { map, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { NewsService } from '../../core/services/news.service';
import { News } from '../../core/models/news';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-news-detail',
  standalone: true,
  imports: [AsyncPipe, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './news-detail.html',
  styleUrl: './news-detail.scss',
})
export class NewsDetail {
  news$: Observable<News | undefined>;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly newsService: NewsService,
  ) {
    this.news$ = this.route.paramMap.pipe(
      map(params => params.get('id') ?? ''),
      switchMap(id => this.newsService.getNewsById(id)),
    );
  }

  getTrustLevel(conf: number): 'high' | 'medium' | 'low' {
    if (conf >= 0.9) return 'high';
    if (conf >= 0.7) return 'medium';
    return 'low';
  }

  getTrustLabel(conf: number): string {
    const level = this.getTrustLevel(conf);

    switch (level) {
      case 'high':
        return 'Verified by AI with high confidence. Suitable for quick decisions.';
      case 'medium':
        return 'Moderate confidence. Consider cross-checking before acting.';
      default:
        return 'Low confidence. Treat as a lead and validate carefully.';
    }
  }
}
