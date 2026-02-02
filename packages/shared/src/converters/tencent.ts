import TurndownService from 'turndown';
import { parseHTML } from 'linkedom';
import { ContentConverter, ConversionContext } from './base';
import { PLACEHOLDER_TEMPLATES } from '../constants';

/**
 * 腾讯文档转换器
 * 专门处理腾讯文档(docs.qq.com, doc.weixin.qq.com)的HTML结构
 * 使用linkedom模拟DOM环境以支持service worker
 */
export class TencentConverter implements ContentConverter {
  readonly name = 'tencent';
  private turndownService: TurndownService;
  private imageCounter = 0;

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
    console.log('[TencentConverter] 开始转换, URL:', url);
    console.log('[TencentConverter] HTML 长度:', html.length);

    // 重置计数器
    this.imageCounter = 0;

    const context: ConversionContext = {
      url,
      imageCounter: 0,
      iframeCounter: 0,
      otherCounter: 0,
      placeholders: [],
    };

    // 清理HTML
    const cleanedHtml = this.cleanHtml(html);

    // 使用 linkedom 创建虚拟 DOM 环境
    const doc = parseHTML(`<!DOCTYPE html><html><body>${cleanedHtml}</body></html>`);

    // 转换为Markdown
    let markdown = this.turndownService.turndown(doc.document.body);

    // 清理多余的空白
    markdown = this.normalizeMarkdown(markdown);

    console.log('[TencentConverter] 转换完成, Markdown 长度:', markdown.length);
    console.log('[TencentConverter] Markdown 预览:', markdown.substring(0, 300));

    return markdown;
  }

  /**
   * 获取节点属性
   */
  private getAttribute(node: any, name: string): string {
    if (!node) return '';
    try {
      return node.getAttribute(name) || '';
    } catch {
      return '';
    }
  }

  /**
   * 解析style属性，转换为对象
   */
  private parseStyle(style: string): Record<string, string> {
    const result: Record<string, string> = {};
    if (!style) return result;

    style.split(';').forEach((rule) => {
      const parts = rule.split(':');
      if (parts.length >= 2) {
        const property = parts[0].trim().toLowerCase();
        const value = parts.slice(1).join(':').trim().toLowerCase();
        if (property && value) {
          result[property] = value;
        }
      }
    });

    return result;
  }

  /**
   * 设置自定义转换规则
   */
  private setupRules(): void {
    // 规则优先级：先处理特定元素，再处理通用元素

    // 移除所有空标签（<o:p></o:p>等） - 最高优先级
    this.turndownService.addRule('removeEmptyTags', {
      filter: (node) => {
        const nodeName = node.nodeName || '';
        const textContent = node.textContent || '';
        const childNodes = node.childNodes || [];
        return (
          (nodeName === 'O:P' || nodeName === 'SPAN' || nodeName === 'FONT') &&
          textContent.trim() === '' &&
          childNodes.length === 0
        );
      },
      replacement: () => '',
    });

    // 处理列表 - 在段落处理之前
    this.turndownService.addRule('tencentLists', {
      filter: (node) => {
        const nodeName = node.nodeName || '';
        if (nodeName !== 'P') return false;

        const style = this.getAttribute(node, 'style');

        // 检查是否有 mso-list 样式
        if (style.includes('mso-list:')) return true;

        // 检查 classList 是否包含 MsoNormal
        const className = node.className || '';
        if (className.includes('MsoNormal')) return true;

        // 检查是否包含列表标记符号
        const text = node.textContent || '';
        if (text.match(/^[\u00B7\u2022\u25CB\u25A0\u25AA●]\s/) || text.match(/^\d+\.\s/)) {
          return true;
        }

        return false;
      },
      replacement: (_content, node) => {
        const styleStr = this.getAttribute(node, 'style');
        const styleObj = this.parseStyle(styleStr);
        const msoList = styleObj['mso-list'] || '';

        // 获取文本内容，移除列表标记符号
        let text = node.textContent || '';

        // 检测列表类型
        // 无序列表：l0, l2, l4... 或检查是否有Wingdings字体的●符号
        const isUnordered =
          msoList.includes('l0 level') ||
          msoList.includes('l2 level') ||
          msoList.includes('l4 level') ||
          msoList.includes('l6 level') ||
          msoList.includes('l8 level') ||
          text.match(/^[\u00B7\u2022\u25CB\u25A0\u25AA●]\s/);

        // 复选框列表：使用 Wingdings 字体的  符号
        const isCheckbox = text.includes('\uf0ae') || text.includes('');

        // 有序列表：l1, l3, l5...
        const isOrdered =
          msoList.includes('l1 level') ||
          msoList.includes('l3 level') ||
          msoList.includes('l5 level') ||
          msoList.includes('l7 level') ||
          msoList.includes('l9 level') ||
          text.match(/^\d+\.\s/);

        // 清理文本：移除开头的列表标记
        text = text.replace(/^[\u00B7\u2022\u25CB\u25A0\u25AA●]\s*/, ''); // 无序列表标记
        text = text.replace(/^\d+\.\s*/, ''); // 有序列表标记
        text = text.replace(/[\uf0ae]\s*/, ''); // 复选框标记
        text = text.replace(/^\s+|\s+$/g, ''); // 去除首尾空格

        if (isCheckbox) {
          return `- [ ] ${text}\n`;
        }

        if (isUnordered) {
          return `- ${text}\n`;
        }

        if (isOrdered) {
          // 需要提取实际的序号，这里简化处理
          // 在实际使用中，turndown会处理嵌套结构
          return `1. ${text}\n`;
        }

        return `${text}\n`;
      },
    });

    // 处理引用块（左边框样式） - 在段落处理之前
    this.turndownService.addRule('blockquote', {
      filter: (node) => {
        const nodeName = node.nodeName || '';
        if (nodeName !== 'P') return false;

        const style = this.getAttribute(node, 'style');
        // 检查是否有左边框且不是表格单元格
        // 格式：border-left: #1e6fff 1.5pt 或 mso-border-left-alt: #1e6fff 1.5pt
        return (
          (style.includes('border-left:') && style.includes('#1e6fff')) ||
          style.includes('mso-border-left-alt:')
        );
      },
      replacement: (_content, node) => {
        const text = (node.textContent || '').trim();
        return `> ${text}\n`;
      },
    });

    // 处理高亮块
    this.turndownService.addRule('highlightBlock', {
      filter: (node) => {
        const nodeName = node.nodeName || '';
        if (nodeName !== 'DIV') return false;

        return (
          this.getAttribute(node, 'data-bg-color') !== '' ||
          this.getAttribute(node, 'data-border-color') !== ''
        );
      },
      replacement: (_content, node) => {
        const text = (node.textContent || '').trim();
        return `> ${text}\n`;
      },
    });

    // 处理标题（腾讯文档使用h1-h6标签）
    this.turndownService.addRule('tencentHeadings', {
      filter: (node) => {
        const nodeName = node.nodeName || '';
        if (!nodeName.startsWith('H')) return false;
        const level = parseInt(nodeName[1]);
        return !isNaN(level) && level >= 1 && level <= 6;
      },
      replacement: (content, node) => {
        const level = parseInt((node.nodeName || '')[1]);
        const prefix = '#'.repeat(level);
        return `\n\n${prefix} ${content}\n\n`;
      },
    });

    // 处理文本格式（内联样式） - 需要在段落处理之前
    this.turndownService.addRule('inlineStyles', {
      filter: (node) => {
        const nodeName = node.nodeName || '';
        // 只处理非标题内的span
        if (nodeName !== 'SPAN') return false;
        if (this.getAttribute(node, 'style') === '') return false;

        // 检查父元素是否是标题，如果是则跳过（让标题规则处理）
        let parent = node.parentNode;
        while (parent) {
          const parentName = parent.nodeName || '';
          if (parentName.startsWith('H') && parentName.length === 2) {
            return false; // 在标题内，跳过
          }
          if (parentName === 'BODY') break;
          parent = parent.parentNode;
        }

        return true;
      },
      replacement: (content, node) => {
        const styleStr = this.getAttribute(node, 'style');
        const styleObj = this.parseStyle(styleStr);

        let formatted = content;

        // 加粗 - 检查 font-weight: bold 或 700
        const fontWeight = styleObj['font-weight'];
        if (fontWeight === 'bold' || fontWeight === '700' || fontWeight === 'bolder') {
          formatted = `**${formatted}**`;
        }

        // 斜体
        if (styleObj['font-style'] === 'italic') {
          formatted = `*${formatted}*`;
        }

        // 删除线 - text-decoration可能包含多个值
        const textDecoration = styleObj['text-decoration'] || '';
        if (textDecoration.includes('line-through')) {
          formatted = `~~${formatted}~~`;
        }

        // 上标和下标 - 使用HTML标签保留
        const verticalAlign = styleObj['vertical-align'];
        if (verticalAlign === 'super') {
          formatted = `<sup>${formatted}</sup>`;
        } else if (verticalAlign === 'sub') {
          formatted = `<sub>${formatted}</sub>`;
        }

        return formatted;
      },
    });

    // 处理代码块
    this.turndownService.addRule('tencentCodeBlock', {
      filter: (node) => {
        const nodeName = node.nodeName || '';
        if (nodeName !== 'PRE') return false;

        const code = node.querySelector ? node.querySelector('code') : null;
        return code !== null;
      },
      replacement: (_content, node) => {
        const code = node.querySelector ? node.querySelector('code') : null;
        if (!code) return `\n\`\`\`\n${_content}\n\`\`\`\n`;

        // 检测语言
        let lang = '';
        const langAttr = this.getAttribute(code, 'data-tco-code-type');
        if (langAttr) {
          lang = langAttr;
        } else if (code.classList) {
          const langClass = Array.from(code.classList).find((cls: string) =>
            cls.startsWith('language-')
          );
          if (langClass) {
            lang = langClass.replace('language-', '');
          }
        }

        const codeContent = code.textContent || '';
        return `\n\`\`\`${lang}\n${codeContent}\n\`\`\`\n`;
      },
    });

    // 处理分隔线
    this.turndownService.addRule('tencentHr', {
      filter: (node) => {
        const nodeName = node.nodeName || '';
        if (nodeName !== 'P' && nodeName !== 'DIV') return false;

        const style = this.getAttribute(node, 'style');
        return (
          style.includes('border-bottom:') &&
          (style.includes('solid') || style.includes('dashed'))
        );
      },
      replacement: () => {
        return '\n\n---\n\n';
      },
    });

    // 处理图片
    this.turndownService.addRule('tencentImages', {
      filter: (node) => {
        return (node.nodeName || '') === 'IMG';
      },
      replacement: (_content, node) => {
        const alt = this.getAttribute(node, 'alt') || '未命名图片';
        const src = this.getAttribute(node, 'src');

        // Base64或Data URL图片
        if (this.isDataUrl(src)) {
          return `图片：${PLACEHOLDER_TEMPLATES.IMAGE(alt, ++this.imageCounter)}`;
        }

        // URL链接图片
        return `![${alt}](${src})`;
      },
    });

    // 处理链接
    this.turndownService.addRule('tencentLinks', {
      filter: (node) => {
        return (node.nodeName || '') === 'A';
      },
      replacement: (content, node) => {
        const href = this.getAttribute(node, 'href');

        // 如果链接文本就是URL，直接返回URL
        if (content.trim() === href || this.isValidUrl(content.trim())) {
          return content;
        }

        return `[${content}](${href})`;
      },
    });

    // 处理表格（简单表格转Markdown，复杂表格保留HTML）
    this.turndownService.addRule('tencentTable', {
      filter: (node) => {
        return (node.nodeName || '') === 'TABLE';
      },
      replacement: (_content, node) => {
        // 检查是否有真正的合并单元格（colspan或rowspan值大于1）
        const hasMergedCells = this.hasMergedCells(node);

        if (hasMergedCells) {
          // 复杂表格：保留精简HTML
          return this.simplifyTable(node);
        }

        // 简单表格：转换为Markdown
        return this.convertSimpleTable(node);
      },
    });

    // 移除腾讯文档特有的元数据块
    this.turndownService.addRule('tencentMetadata', {
      filter: (node) => {
        const nodeName = node.nodeName || '';
        return nodeName === 'DIV' && this.getAttribute(node, 'tdoc-data-src') !== '';
      },
      replacement: () => '',
    });

    // 处理普通段落 - 最后添加，确保优先级最低
    // 但需要在filter中排除已被特定规则处理的元素
    this.turndownService.addRule('paragraph', {
      filter: (node) => {
        const nodeName = node.nodeName || '';
        if (nodeName !== 'P') return false;

        const styleStr = this.getAttribute(node, 'style');
        const styleObj = this.parseStyle(styleStr);
        const className = node.className || '';

        // 排除列表
        if (styleObj['mso-list'] || className.includes('MsoNormal')) {
          return false;
        }

        // 排除引用块
        if (
          styleStr.includes('border-left:') &&
          !styleStr.includes('border-left: none') &&
          styleStr.includes('#1e6fff')
        ) {
          return false;
        }

        // 排除包含列表标记的段落
        const text = node.textContent || '';
        if (text.match(/^[\u00B7\u2022\u25CB\u25A0\u25AA●]\s/) || text.match(/^\d+\.\s/)) {
          return false;
        }

        return true;
      },
      replacement: (content, node) => {
        // 普通段落
        const text = content.trim();
        if (!text) return '';

        return `${text}\n`;
      },
    });
  }

  /**
   * 检查表格是否有真正的合并单元格（colspan或rowspan值大于1）
   */
  private hasMergedCells(table: any): boolean {
    if (!table.querySelectorAll) return false;

    const cells = table.querySelectorAll('td, th');
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const colspan = parseInt(this.getAttribute(cell, 'colspan')) || 1;
      const rowspan = parseInt(this.getAttribute(cell, 'rowspan')) || 1;

      if (colspan > 1 || rowspan > 1) {
        return true;
      }
    }

    return false;
  }

  /**
   * 转换简单表格为Markdown
   */
  private convertSimpleTable(table: any): string {
    if (!table.querySelectorAll) return '';

    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length === 0) return '';

    let markdown = '\n';

    rows.forEach((row: any, rowIndex: number) => {
      if (!row.querySelectorAll) return;

      const cells = Array.from(row.querySelectorAll('td, th'));
      const rowText = '|' + cells.map((cell: any) => ` ${(cell.textContent || '').trim()} |`).join('');

      markdown += rowText + '\n';

      // 添加分隔行（表头后）
      if (rowIndex === 0) {
        const separator = '|' + cells.map(() => ' --- |').join('');
        markdown += separator + '\n';
      }
    });

    markdown += '\n';
    return markdown;
  }

  /**
   * 简化复杂表格（保留HTML）
   */
  private simplifyTable(table: any): string {
    if (!table.cloneNode) return '\n<table></table>\n';

    const clone = table.cloneNode(true);

    // 首先移除 table 标签本身的 style 属性
    if (clone.removeAttribute) {
      clone.removeAttribute('style');
      clone.removeAttribute('class');
    }

    // 移除所有样式相关属性，但保留rowspan和colspan
    if (clone.querySelectorAll) {
      const allElements = clone.querySelectorAll('*');
      allElements.forEach((el: any) => {
        // 移除所有属性
        if (el.attributes) {
          Array.from(el.attributes).forEach((attr: any) => {
            const name = attr.name.toLowerCase();
            // 只保留 colspan 和 rowspan
            if (name !== 'colspan' && name !== 'rowspan' && el.removeAttribute) {
              el.removeAttribute(attr.name);
            }
          });
        }

        // 移除空标签和 <o:p> 标签
        if (el.childNodes) {
          for (let i = el.childNodes.length - 1; i >= 0; i--) {
            const child = el.childNodes[i];
            if (child.nodeName === 'O:P' ||
                (child.nodeName === 'SPAN' && child.textContent?.trim() === '' && child.childNodes.length === 0)) {
              if (el.removeChild) {
                el.removeChild(child);
              }
            }
          }
        }
      });
    }

    // 清理后的HTML
    let html = clone.outerHTML || '<table></table>';

    // 移除多余的空白和换行
    html = html.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();

    return '\n' + html + '\n';
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

    // 移除腾讯文档特有的data-field-code等属性
    cleaned = cleaned.replace(/\sdata-field-code="[^"]*"/g, '');
    cleaned = cleaned.replace(/\sdata-font-family="[^"]*"/g, '');

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
   * 检查是否是有效URL
   */
  private isValidUrl(text: string): boolean {
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  }
}
