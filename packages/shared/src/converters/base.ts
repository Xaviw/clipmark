/**
 * 内容转换器基类接口
 * 所有转换器必须实现此接口
 */
export interface ContentConverter {
  /**
   * 将HTML转换为Markdown
   * @param html - 原始HTML内容
   * @param url - 来源URL（用于特定网站处理）
   * @returns Markdown字符串
   */
  convert(html: string, url: string): Promise<string>;

  /**
   * 检查是否支持该URL
   * @param url - 要检查的URL
   * @returns 是否支持
   */
  supports(url: string): boolean;

  /**
   * 转换器名称
   */
  readonly name: string;
}

/**
 * 占位符信息
 */
export interface PlaceholderInfo {
  type: 'image' | 'iframe' | 'video' | 'audio' | 'canvas' | 'svg' | 'unknown';
  description: string;
  index: number;
}

/**
 * 转换上下文
 */
export interface ConversionContext {
  /** 来源URL */
  url: string;
  /** 图片计数器 */
  imageCounter: number;
  /** iframe计数器 */
  iframeCounter: number;
  /** 其他占位符计数器 */
  otherCounter: number;
  /** 占位符列表 */
  placeholders: PlaceholderInfo[];
}
