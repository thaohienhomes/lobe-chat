declare module '@mozilla/readability' {
  export interface ReadabilityArticle {
    byline: string | null;
    content: string;
    dir: string | null;
    excerpt: string;
    lang: string | null;
    length: number;
    publishedTime: string | null;
    siteName: string | null;
    textContent: string;
    title: string;
  }

  export class Readability {
    constructor(doc: Document, options?: Record<string, any>);
    parse(): ReadabilityArticle | null;
  }
}
