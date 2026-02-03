import TurndownService from 'turndown';
import { parseHTML } from 'linkedom';
import { ContentConverter, ConversionContext } from './base';

/**
 * 腾讯文档转换器
 * 专门处理腾讯文档的HTML结构
 */
export class TencentConverter implements ContentConverter {
  readonly name = 'tencent';
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
   */
  supports(url: string): boolean {
    return url.includes('docs.qq.com') || url.includes('doc.weixin.qq.com');
  }

  /**
   * 将HTML转换为Markdown
   */
  async convert(html: string, url: string): Promise<string> {
    const context: ConversionContext = {
      url,
      imageCounter: 0,
      iframeCounter: 0,
      otherCounter: 0,
      placeholders: [],
    };

    // 清理HTML - 仅保留 div.document > div.section
    const cleanedHtml = this.cleanHtml(html);

    // 使用 linkedom 创建虚拟 DOM 环境
    const doc = parseHTML(`<!DOCTYPE html><html><body>${cleanedHtml}</body></html>`);

    // 清除空标签
    this.removeEmptyTags(doc.document.body);

    // 将 context 注入到 turndownService 的 options 中
    (this.turndownService as any).options.__conversionContext__ = context;

    // 转换为Markdown
    let markdown = this.turndownService.turndown(doc.document.body);

    // 清理多余的空白
    markdown = this.normalizeMarkdown(markdown);

    // 添加占位符说明
    const footer = this.generateFooter(context);
    if (footer) {
      markdown += footer;
    }

    return markdown;
  }

  /**
   * 设置自定义转换规则
   */
  private setupRules(): void {
    // 标题处理
    this.setupHeadingRules();
    // 文本格式处理
    this.setupTextFormatRules();
    // 列表处理
    this.setupListRules();
    // 引用块和高亮块处理
    this.setupQuoteRules();
    // 表格处理
    this.setupTableRules();
    // 代码块处理
    this.setupCodeBlockRules();
    // 图片处理
    this.setupImageRules();
    // 链接处理
    this.setupLinkRules();
    // 分隔线处理
    this.setupHorizontalRuleRules();
  }

  /**
   * 标题处理规则
   */
  private setupHeadingRules(): void {
    // 处理标题 h1-h6
    this.turndownService.addRule('tencentHeadings', {
      filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      replacement: (content, node) => {
        const hLevel = parseInt(node.nodeName.charAt(1));
        const hPrefix = '#'.repeat(hLevel);

        // 克隆节点以处理内容
        const clone = node.cloneNode(true) as Element;

        // 移除 style 含有 mso-list: Ignore 的列表元素
        const ignoreElements = clone.querySelectorAll('[style*="mso-list"][style*="Ignore"]');
        ignoreElements.forEach((el) => el.remove());

        // 获取清理后的文本内容
        const cleanContent = clone.textContent?.trim() || '';

        return cleanContent ? `\n\n${hPrefix} ${cleanContent}\n\n` : '';
      },
    });
  }

  /**
   * 文本格式处理规则
   */
  private setupTextFormatRules(): void {
    // 处理加粗
    this.turndownService.addRule('tencentBold', {
      filter: (node) => {
        if (node.nodeName !== 'SPAN') return false;
        const style = (node as HTMLElement).getAttribute('style') || '';
        return style.includes('font-weight') && style.includes('bold');
      },
      replacement: (content) => {
        return content ? `**${content}**` : '';
      },
    });

    // 处理斜体
    this.turndownService.addRule('tencentItalic', {
      filter: (node) => {
        if (node.nodeName !== 'SPAN') return false;
        const style = (node as HTMLElement).getAttribute('style') || '';
        return style.includes('font-style') && style.includes('italic');
      },
      replacement: (content) => {
        return content ? `*${content}*` : '';
      },
    });

    // 处理删除线
    this.turndownService.addRule('tencentStrikethrough', {
      filter: (node) => {
        if (node.nodeName !== 'SPAN') return false;
        const style = (node as HTMLElement).getAttribute('style') || '';
        return style.includes('text-decoration') && style.includes('line-through');
      },
      replacement: (content) => {
        return content ? `~~${content}~~` : '';
      },
    });

    // 处理上标
    this.turndownService.addRule('tencentSuperscript', {
      filter: (node) => {
        if (node.nodeName !== 'SPAN') return false;
        const style = (node as HTMLElement).getAttribute('style') || '';
        return style.includes('vertical-align') && style.includes('super');
      },
      replacement: (content) => {
        return content ? `<sup>${content}</sup>` : '';
      },
    });

    // 处理下标
    this.turndownService.addRule('tencentSubscript', {
      filter: (node) => {
        if (node.nodeName !== 'SPAN') return false;
        const style = (node as HTMLElement).getAttribute('style') || '';
        return style.includes('vertical-align') && style.includes('sub');
      },
      replacement: (content) => {
        return content ? `<sub>${content}</sub>` : '';
      },
    });
  }

  /**
   * 引用块和高亮块处理规则
   */
  private setupQuoteRules(): void {
    // 处理引用块（mso-border-left-alt）
    this.turndownService.addRule('tencentQuote', {
      filter: (node) => {
        if (node.nodeName !== 'P') return false;
        const style = (node as HTMLElement).getAttribute('style') || '';
        return style.includes('mso-border-left-alt');
      },
      replacement: (content) => {
        if (!content) return '';
        // 将内容按行分割，每行前面加上 >，空行用 > 表示
        const lines = content.trim().split('\n');
        const quotedLines = lines.map(line => {
          const trimmed = line.trim();
          return trimmed ? `> ${trimmed}` : '>';
        });
        return '\n' + quotedLines.join('\n') + '\n\n';
      },
    });

    // 处理高亮块（data-bg-color）
    this.turndownService.addRule('tencentHighlight', {
      filter: (node) => {
        if (node.nodeName !== 'DIV') return false;
        const hasBgColor = (node as HTMLElement).hasAttribute('data-bg-color');
        const hasBorderColor = (node as HTMLElement).hasAttribute('data-border-color');
        return hasBgColor || hasBorderColor;
      },
      replacement: (content) => {
        if (!content) return '';
        // 将内容按行分割，每行前面加上 >，空行用 > 表示
        const lines = content.trim().split('\n');
        const quotedLines = lines.map(line => {
          const trimmed = line.trim();
          return trimmed ? `> ${trimmed}` : '>';
        });
        return '\n' + quotedLines.join('\n') + '\n\n';
      },
    });
  }

  /**
   * 列表处理规则
   */
  private setupListRules(): void {
    // 处理腾讯文档的列表
    this.turndownService.addRule('tencentList', {
      filter: (node) => {
        if (node.nodeName !== 'P') return false;
        const style = (node as HTMLElement).getAttribute('style') || '';
        return style.includes('mso-list:') && style.includes('level');
      },
      replacement: (content, node) => {
        const style = (node as HTMLElement).getAttribute('style') || '';

        // 提取 level 信息
        const levelMatch = style.match(/level(\d+)/);
        const level = levelMatch ? parseInt(levelMatch[1]) : 1;

        // 计算缩进（level从1开始，每级2个空格）
        const indent = '  '.repeat(level - 1);

        // 克隆节点以处理内容
        const clone = node.cloneNode(true) as Element;

        // 移除 style 含有 mso-list: Ignore 的标识符
        const ignoreElements = clone.querySelectorAll('[style*="mso-list"][style*="Ignore"]');
        ignoreElements.forEach((el) => el.remove());

        // 获取清理后的文本内容
        const cleanContent = clone.textContent?.trim() || '';

        if (!cleanContent) return '';

        // 检查是否是复选框（包含 \uf0ae 字符）
        const isCheckbox = cleanContent.includes('\uf0ae');

        if (isCheckbox) {
          // 移除复选框字符
          const text = cleanContent.replace(/\uf0ae/g, '').trim();
          return `${indent}- [ ] ${text}\n`;
        }

        // 无序列表（腾讯文档中所有列表都转为无序列表）
        return `${indent}- ${cleanContent}\n`;
      },
    });
  }

  /**
   * 表格处理规则
   */
  private setupTableRules(): void {
    // 处理所有表格
    this.turndownService.addRule('tencentTable', {
      filter: ['table'],
      replacement: (_content, node) => {
        const table = node as HTMLTableElement;

        // 检查是否有真正的合并单元格(colspan > 1 或 rowspan > 1)
        const hasComplexCells = this.hasComplexCells(table);

        if (hasComplexCells) {
          // 复杂表格：保留精简HTML
          return this.simplifyTable(table);
        } else {
          // 简单表格：转换为Markdown
          return this.convertSimpleTable(table);
        }
      },
    });
  }

  /**
   * 代码块处理规则
   */
  private setupCodeBlockRules(): void {
    this.turndownService.addRule('tencentCodeBlock', {
      filter: (node) => {
        return node.nodeName === 'PRE' && node.querySelector('code') !== null;
      },
      replacement: (_content, node) => {
        const codeElement = node.querySelector('code');
        if (!codeElement) return '';

        const language = codeElement.getAttribute('data-tco-code-type') || '';

        // 处理代码内容，保留换行
        let code = '';
        const processNode = (n: Node) => {
          if (n.nodeType === 3) {
            // 文本节点
            code += n.textContent || '';
          } else if (n.nodeName === 'BR') {
            // BR 标签转换为换行
            code += '\n';
          } else if (n.childNodes) {
            // 递归处理子节点
            n.childNodes.forEach(processNode);
          }
        };

        codeElement.childNodes.forEach(processNode);

        return `\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
      },
    });
  }

  /**
   * 图片处理规则
   */
  private setupImageRules(): void {
    this.turndownService.addRule('tencentImages', {
      filter: (node) => {
        return node.nodeName === 'IMG';
      },
      replacement: (_content, node, options) => {
        const img = node as HTMLImageElement;
        const src = img.getAttribute('src') || '';

        // 获取上下文
        const context = (options as any).__conversionContext__ as ConversionContext;
        if (!context) return '';

        context.imageCounter++;

        // Base64/DataURL/SVG 图片使用占位符
        if (this.isDataUrl(src) || src.startsWith('<svg')) {
          return `[图片占位符: ${context.imageCounter}]`;
        }

        // URL 链接图片
        return `![图片${context.imageCounter}](${src})`;
      },
    });
  }

  /**
   * 链接处理规则
   */
  private setupLinkRules(): void {
    this.turndownService.addRule('tencentLinks', {
      filter: (node) => {
        return node.nodeName === 'A' && !!(node as HTMLAnchorElement).getAttribute('href');
      },
      replacement: (content, node, options) => {
        const anchor = node as HTMLAnchorElement;
        const href = anchor.getAttribute('href') || '';
        const dataFieldCode = anchor.getAttribute('data-field-code') || '';

        // 获取上下文
        const context = (options as any).__conversionContext__ as ConversionContext;

        // 带 data-field-code="HYPERLINK 的链接
        if (dataFieldCode.includes('HYPERLINK')) {
          if (context) context.otherCounter++;
          const index = context ? context.otherCounter : 1;
          return `[腾讯文档内容块占位符：${index}](${href})`;
        }

        // 标准链接
        return `[${content}](${href})`;
      },
    });
  }

  /**
   * 分隔线处理规则
   */
  private setupHorizontalRuleRules(): void {
    this.turndownService.addRule('tencentHorizontalRule', {
      filter: (node) => {
        if (node.nodeName !== 'P') return false;
        const className = (node as HTMLElement).getAttribute('class') || '';
        return className.includes('horizontal-splitline');
      },
      replacement: () => {
        return '\n\n---\n\n';
      },
    });
  }

  /**
   * 清理HTML - 仅保留 div.document > div.section 节点
   */
  private cleanHtml(html: string): string {
    // 移除script和style标签
    let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

    // 解析HTML以提取 div.document > div.section
    const doc = parseHTML(`<!DOCTYPE html><html><body>${cleaned}</body></html>`);
    const documentDiv = doc.document.querySelector('div.document');

    if (documentDiv) {
      const sections = documentDiv.querySelectorAll(':scope > div.section');
      if (sections.length > 0) {
        const sectionsHtml = Array.from(sections)
          .map((section) => section.outerHTML)
          .join('');
        return sectionsHtml;
      }
    }

    // 如果没有找到特定结构,返回清理后的HTML
    return cleaned;
  }

  /**
   * 清除空标签
   * 递归清理没有实际内容的标签
   */
  private removeEmptyTags(element: Element): void {
    // 需要避开的标签(分割线和图片)
    const skipTags = ['IMG', 'HR', 'BR'];

    const children = Array.from(element.children);

    // 先递归处理子元素
    for (const child of children) {
      this.removeEmptyTags(child);
    }

    // 再次检查子元素,移除空标签
    const updatedChildren = Array.from(element.children);
    for (const child of updatedChildren) {
      if (skipTags.includes(child.nodeName)) {
        continue;
      }

      // 检查是否为空标签
      if (this.isEmptyElement(child)) {
        child.remove();
      }
    }
  }

  /**
   * 判断元素是否为空
   */
  private isEmptyElement(element: Element): boolean {
    // 特殊标签不视为空
    const nonEmptyTags = ['IMG', 'HR', 'BR'];
    if (nonEmptyTags.includes(element.nodeName)) {
      return false;
    }

    // 检查文本内容
    const text = element.textContent || '';
    // 移除空白字符、换行符、零宽字符等
    const cleanText = text.replace(/[\s\n\r\t\u200B-\u200D\uFEFF]/g, '');

    // 如果没有文本内容且没有非空子元素,则为空
    if (cleanText.length === 0) {
      const hasNonEmptyChildren = Array.from(element.children).some(
        (child) => !this.isEmptyElement(child)
      );
      return !hasNonEmptyChildren;
    }

    return false;
  }

  /**
   * 规范化Markdown内容
   */
  private normalizeMarkdown(markdown: string): string {
    // 压缩多余的空行
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
   * 检查表格是否有真正的合并单元格
   */
  private hasComplexCells(table: HTMLTableElement): boolean {
    const cells = table.querySelectorAll('td, th');
    for (const cell of Array.from(cells)) {
      const colspan = cell.getAttribute('colspan');
      const rowspan = cell.getAttribute('rowspan');

      // 检查 colspan 或 rowspan 是否大于 1
      if ((colspan && parseInt(colspan) > 1) || (rowspan && parseInt(rowspan) > 1)) {
        return true;
      }
    }
    return false;
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

    return '\n\n' + clone.outerHTML + '\n\n';
  }

  /**
   * 转换简单表格为Markdown格式
   */
  private convertSimpleTable(table: HTMLTableElement): string {
    const rows: string[][] = [];

    // 提取所有行
    const allRows = table.querySelectorAll('tr');

    allRows.forEach((tr) => {
      const cells: string[] = [];
      const tdElements = tr.querySelectorAll('td, th');

      tdElements.forEach((cell) => {
        const text = (cell.textContent || '').trim();
        cells.push(text);
      });

      if (cells.length > 0) {
        rows.push(cells);
      }
    });

    if (rows.length === 0) {
      return '';
    }

    // 构建Markdown表格
    let markdown = '\n\n';

    // 第一行作为表头
    const headerRow = rows[0];
    markdown += '| ' + headerRow.join(' | ') + ' |\n';

    // 分隔线
    markdown += '| ' + headerRow.map(() => '---').join(' | ') + ' |\n';

    // 数据行
    for (let i = 1; i < rows.length; i++) {
      markdown += '| ' + rows[i].join(' | ') + ' |\n';
    }

    markdown += '\n';

    return markdown;
  }

  /**
   * 生成占位符说明
   */
  private generateFooter(context: ConversionContext): string {
    const hasPlaceholders =
      context.imageCounter > 0 || context.iframeCounter > 0 || context.otherCounter > 0;

    if (!hasPlaceholders) {
      return '';
    }

    return `\n\n---\n\n**占位符说明：**\n\n- 优先从现有内容中进行理解\n- 如果确实需要补充占位符对应内容来补充理解，请提示用户提供 \`xxx占位符：序号\` 的内容`;
  }
}
