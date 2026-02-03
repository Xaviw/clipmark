import TurndownService from 'turndown';
import { parseHTML } from 'linkedom';
import { ContentConverter, ConversionContext } from './base';
import { PLACEHOLDER_TEMPLATES, CONTENT_FOOTER_TEMPLATE } from '../constants';

/**
 * 默认内容转换器
 * 将HTML转换为Markdown，使用turndown库
 * 使用linkedom模拟DOM环境以支持service worker
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

    this.setupRules();
  }

  /**
   * 检查是否支持该URL
   * 默认转换器支持所有URL（作为降级方案）
   */
  supports(_url: string): boolean {
    return true;
  }

  /**
   * 将HTML转换为Markdown
   */
  async convert(html: string, url: string): Promise<string> {
    console.log('[DefaultConverter] 开始，原始 HTML 长度:', html.length);

    const context: ConversionContext = {
      url,
      imageCounter: 0,
      iframeCounter: 0,
      otherCounter: 0,
      placeholders: [],
    };

    // 清理HTML
    const cleanedHtml = this.cleanHtml(html);
    console.log('[DefaultConverter] 清理后 HTML 长度:', cleanedHtml.length);

    try {
      // 使用 linkedom 创建虚拟 DOM 环境
      const doc = parseHTML(`<!DOCTYPE html><html><body>${cleanedHtml}</body></html>`);
      console.log('[DefaultConverter] linkedom 解析成功');
      console.log('[DefaultConverter] doc.document.body 存在:', !!doc.document.body);
      console.log(
        '[DefaultConverter] body.innerHTML 长度:',
        doc.document.body?.innerHTML?.length || 0
      );

      // 转换为Markdown
      console.log('[DefaultConverter] 开始 turndown 转换...');
      let markdown = this.turndownService.turndown(doc.document.body);
      console.log('[DefaultConverter] turndown 转换完成');
      console.log('[DefaultConverter] Markdown 结果长度:', markdown.length);
      console.log('[DefaultConverter] Markdown 结果预览:', markdown.substring(0, 500));

      // 清理多余的空白
      markdown = this.normalizeMarkdown(markdown);

      // 添加内容说明
      const footer = this.generateFooter(context);
      if (footer) {
        markdown += footer;
      }

      console.log('[DefaultConverter] 最终 Markdown 长度:', markdown.length);
      return markdown;
    } catch (error) {
      console.error('[DefaultConverter] 转换过程出错:', error);
      console.error(
        '[DefaultConverter] 错误堆栈:',
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }
  }

  /**
   * 设置自定义转换规则
   */
  private setupRules(): void {
    // 处理图片
    this.turndownService.addRule('images', {
      filter: (node) => {
        return node.nodeName === 'IMG';
      },
      replacement: (_content, node, context) => {
        const img = node as HTMLImageElement;
        const alt = img.alt || '未命名图片';
        const src = img.getAttribute('src') || '';

        // 获取计数器
        const ctx = (context as any).__conversionContext__ as ConversionContext;
        if (!ctx) return `![${alt}](${src})`;

        ctx.imageCounter++;

        // Base64或Data URL图片
        if (this.isDataUrl(src)) {
          return PLACEHOLDER_TEMPLATES.IMAGE(alt, ctx.imageCounter);
        }

        // URL链接图片
        return `![${alt}](${src})`;
      },
    });

    // 处理iframe
    this.turndownService.addRule('iframe', {
      filter: ['iframe'],
      replacement: (_content, node, context) => {
        const iframe = node as HTMLIFrameElement;
        const src = iframe.getAttribute('src') || '未知来源';

        const ctx = (context as any).__conversionContext__ as ConversionContext;
        if (ctx) ctx.iframeCounter++;

        return PLACEHOLDER_TEMPLATES.IFRAME(src);
      },
    });

    // 处理video
    this.turndownService.addRule('video', {
      filter: ['video'],
      replacement: (_content, node, context) => {
        const video = node as HTMLVideoElement;
        const title = video.getAttribute('title') || '未命名视频';

        const ctx = (context as any).__conversionContext__ as ConversionContext;
        if (ctx) ctx.otherCounter++;

        return PLACEHOLDER_TEMPLATES.VIDEO(title);
      },
    });

    // 处理audio
    this.turndownService.addRule('audio', {
      filter: ['audio'],
      replacement: (_content, node, context) => {
        const audio = node as HTMLAudioElement;
        const title = audio.getAttribute('title') || '未命名音频';

        const ctx = (context as any).__conversionContext__ as ConversionContext;
        if (ctx) ctx.otherCounter++;

        return PLACEHOLDER_TEMPLATES.AUDIO(title);
      },
    });

    // 处理canvas
    this.turndownService.addRule('canvas', {
      filter: ['canvas'],
      replacement: (_content, node, context) => {
        const canvas = node as HTMLCanvasElement;
        const desc = canvas.getAttribute('aria-label') || '未命名画布';

        const ctx = (context as any).__conversionContext__ as ConversionContext;
        if (ctx) ctx.otherCounter++;

        return PLACEHOLDER_TEMPLATES.CANVAS(desc);
      },
    });

    // 处理SVG
    this.turndownService.addRule('svg', {
      filter: (node) => {
        return node.nodeName === 'SVG';
      },
      replacement: (_content, node, context) => {
        const svg = node as unknown as SVGSVGElement;
        const desc = svg.getAttribute('aria-label') || '未命名SVG';

        const ctx = (context as any).__conversionContext__ as ConversionContext;
        if (ctx) ctx.imageCounter++;

        return PLACEHOLDER_TEMPLATES.SVG(desc, ctx ? ctx.imageCounter : 1);
      },
    });

    // 处理复杂表格（带合并单元格的）
    this.turndownService.addRule('complexTable', {
      filter: (node) => {
        if (node.nodeName !== 'TABLE') return false;
        return node.querySelectorAll('[colspan], [rowspan]').length > 0;
      },
      replacement: (_content, node) => {
        const table = node as HTMLTableElement;
        return this.simplifyTable(table);
      },
    });
  }

  /**
   * 清理HTML内容
   */
  private cleanHtml(html: string): string {
    // 移除script和style标签及其内容
    let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // 移除HTML注释
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

    return cleaned;
  }

  /**
   * 规范化Markdown内容
   */
  private normalizeMarkdown(markdown: string): string {
    // 压缩多余的空行（最多保留2个连续空行）
    let normalized = markdown.replace(/\n{3,}/g, '\n\n');

    // 去除首尾空白
    normalized = normalized.trim();

    return normalized;
  }

  /**
   * 检查是否是Data URL
   */
  private isDataUrl(url: string): boolean {
    return url.startsWith('data:');
  }

  /**
   * 简化复杂表格（保留HTML，但移除样式属性）
   */
  private simplifyTable(table: HTMLTableElement): string {
    const clone = table.cloneNode(true) as HTMLTableElement;

    // 移除所有样式相关属性，但保留rowspan和colspan
    const allElements = clone.querySelectorAll('*');
    allElements.forEach((el) => {
      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (name !== 'rowspan' && name !== 'colspan') {
          el.removeAttribute(name);
        }
      });
    });

    return clone.outerHTML;
  }

  /**
   * 生成内容说明
   */
  private generateFooter(context: ConversionContext): string {
    if (context.imageCounter === 0 && context.iframeCounter === 0 && context.otherCounter === 0) {
      return '';
    }

    return CONTENT_FOOTER_TEMPLATE({
      images: context.imageCounter,
      iframes: context.iframeCounter,
      others: context.otherCounter,
    });
  }
}
