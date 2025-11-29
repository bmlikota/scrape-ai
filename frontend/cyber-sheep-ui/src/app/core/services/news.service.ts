import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { News } from '../models/news';
import { map } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';

const API_BASE_URL = 'http://localhost:3000'

function mapArticleToNews(article: Article): News {
  // Map categories, falling back to [] if undefined
  const categories = (article.categories ?? []) as News['categories'];

  // Use backend summary or fallback to description/content
  const summary =
    article.summary ||
    article.description ||
    (article.content ? article.content.slice(0, 300) + '…' : '');

  // Temporary scores: until backend exposes its own, we use simple defaults
  const relevanceScore = 1;     // 1.0 for "plain list" results
  const confidenceScore = 0.8;  // assume reasonably high confidence

  return {
    id: article.id,
    title: article.title,
    source: article.source || 'The Hacker News',
    url: article.link,
    publishedAt: article.pubDate,
    categories,
    summary,
    relevanceScore,
    confidenceScore,
    isRead: false,
    content: article.content ?? undefined,
  };
}

interface Article {
  id: string;
  title: string;
  link: string;
  description?: string | null;
  summary?: string | null;
  content?: string | null;
  pubDate: string;
  author?: string | null;
  source: string;           // "thehackernews"
  categories?: string[];    // e.g. ["Security", "Vulnerability"]
  score?: number | null;
  comments?: number | null;
}

interface ArticlesResponse {
  success: boolean;
  count: number;
  articles: Article[];
}

interface ArticleByIdResponse {
  success: boolean;
  article: Article;
}

const MOCK_NEWS: News[] = [
  {
    id: '1',
    title: 'Massive Phishing Campaign Targets European Banks',
    source: 'The Hacker News',
    url: 'https://thehackernews.com/...',
    publishedAt: '2025-11-29T09:30:00Z',
    categories: ['Phishing', 'Banking'],
    summary:
      'A large-scale phishing operation has been discovered targeting customers of multiple European banks, using lookalike domains and MFA fatigue attacks.',
    relevanceScore: 0.92,
    confidenceScore: 0.88,
    isRead: false,
    content:
      'Security researchers have uncovered a coordinated phishing campaign targeting customers of multiple European banks. The attackers use lookalike domains, cloned login pages, and MFA fatigue attacks to trick users into approving fraudulent sessions. The campaign has been active since early November and appears to be operated by a well-funded group with access to initial access brokers and bulletproof hosting…',
  },
  {
    id: '2',
    title: 'New Malware Variant Bypasses EDR via Living-off-the-Land',
    source: 'The Hacker News',
    url: 'https://thehackernews.com/...',
    publishedAt: '2025-11-29T08:10:00Z',
    categories: ['Malware', 'Endpoint'],
    summary:
      'Researchers identified a malware strain that abuses signed Windows binaries to evade common EDR products, focusing on credential theft.',
    relevanceScore: 0.97,
    confidenceScore: 0.93,
    isRead: false,
    content:
      'The newly observed malware variant, dubbed “LoLTrojan”, relies heavily on living-off-the-land techniques. Instead of dropping obvious binaries, it chains together signed Windows utilities such as regsvr32, rundll32, and wmic to download, execute, and persist. Because the behavior closely mimics legitimate admin activity, many EDR tools fail to flag it unless advanced behavior analytics are enabled…',
  },
  {
    id: '3',
    title: 'Critical Zero-Day in Popular VPN Appliance Under Active Exploitation',
    source: 'The Hacker News',
    url: 'https://thehackernews.com/...',
    publishedAt: '2025-11-29T07:45:00Z',
    categories: ['Vulnerability', 'Malware'],
    summary:
      'Vendors have confirmed a zero‑day vulnerability in a widely used VPN appliance that is being actively exploited in the wild to gain initial access to corporate networks.',
    relevanceScore: 0.89,
    confidenceScore: 0.75,
    isRead: false,
    // content intentionally omitted to trigger fallback link in NewsDetail
  },
];

@Injectable({ providedIn: 'root' })
export class NewsService {
  // Later we’ll use this.http for real API calls
  constructor(private readonly http: HttpClient) {}

  getNews(): Observable<News[]> {
    const params = {
      limit: 30,
      source: 'thehackernews',
      fetchFullContent: false, // set true if you want full article bodies for all
    };

    return this.http
      .get<ArticlesResponse>(`${API_BASE_URL}/api/articles`, { params })
      .pipe(
        map(res => (res.articles ?? []).map(mapArticleToNews)),
        // optional: fallback to mock data on error
        catchError(() => of(MOCK_NEWS)),
      );
  }

  getNewsById(id: string): Observable<News | undefined> {
    const params = {
      fetchFullContent: true, // for detail page show full content
    };

    return this.http
      .get<ArticleByIdResponse>(`${API_BASE_URL}/api/articles/${encodeURIComponent(id)}`, { params })
      .pipe(
        map(res => (res.success && res.article ? mapArticleToNews(res.article) : undefined)),
        // optional fallback:
        catchError(() => of(undefined)),
      );
  }
}
