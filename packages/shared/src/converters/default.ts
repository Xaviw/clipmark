import TurndownService from 'turndown';
import { parseHTML } from 'linkedom';
import { ContentConverter } from './base';

/**
 * 默认内容转换器
 * 直接使用 turndown 将 HTML 转换为 Markdown，无特殊处理
 */
export class DefaultConverter implements ContentConverter {
  readonly name = 'default';
  private turndownService: TurndownService;

  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
      emDelimiter: '*',
    });
  }

  supports(_url: string): boolean {
    return true;
  }

  async convert(html: string, _url: string): Promise<string> {
    const doc = parseHTML(`<!DOCTYPE html><html><body>${html}</body></html>`);
    return this.turndownService.turndown(doc.document.body);
  }
}
