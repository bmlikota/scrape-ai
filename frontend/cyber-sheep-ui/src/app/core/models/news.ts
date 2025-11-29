export type NewsCategory =
  | 'Malware'
  | 'Phishing'
  | 'Social Networks'
  | 'AI Agents'
  | 'Cloud'
  | 'Other'
  | 'Banking'
  | 'Endpoint'
  | 'Vulnerability'
  | 'Other';

export interface News {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;       // ISO string
  categories: NewsCategory[];      // ['Malware', 'AI Agents']
  summary: string;
  relevanceScore: number;    // 0–1 or 0–100
  confidenceScore: number;   // 0–1 or 0–100
  isRead?: boolean;
  content?: string;          // FULL article text or long excerpt
}