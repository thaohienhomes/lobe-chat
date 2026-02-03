import { PHO_CHANGELOGS, PHO_CHANGELOG_CONTENT } from '@/const/changelog';
import { Locales } from '@/locales/resources';
import { ChangelogIndexItem } from '@/types/changelog';

/**
 * Local changelog service for Phở.chat
 * Uses local data instead of fetching from GitHub
 */
export class PhoChangelogService {
  async getLatestChangelogId(): Promise<string | undefined> {
    return PHO_CHANGELOGS[0]?.id;
  }

  async getChangelogIndex(): Promise<ChangelogIndexItem[]> {
    return PHO_CHANGELOGS;
  }

  async getIndexItemById(id: string): Promise<ChangelogIndexItem | undefined> {
    return PHO_CHANGELOGS.find((item) => item.id === id);
  }

  async getPostById(id: string, options?: { locale?: Locales }) {
    const post = await this.getIndexItemById(id);
    const content = PHO_CHANGELOG_CONTENT[id];

    if (!post || !content) {
      return null;
    }

    const isVietnamese = options?.locale?.startsWith('vi');
    const title = isVietnamese && content.titleVi ? content.titleVi : content.title;
    const body = isVietnamese && content.contentVi ? content.contentVi : content.content;

    return {
      content: body,
      date: new Date(post.date),
      description: body.slice(0, 160).replaceAll('\n', ' ').trim(),
      image: post.image,
      rawTitle: title,
      tags: ['changelog'],
      title,
    };
  }
}
