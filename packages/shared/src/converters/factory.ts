import { ContentConverter } from './base';
import { DefaultConverter } from './default';
import { TencentConverter } from './tencent';

/**
 * 转换器工厂
 * 根据URL获取合适的转换器
 */
export class ConverterFactory {
  private converters: ContentConverter[] = [];
  private defaultConverter: ContentConverter;

  constructor() {
    // 注册默认转换器
    this.defaultConverter = new DefaultConverter();
    this.converters.push(this.defaultConverter);

    // 注册腾讯文档转换器
    this.converters.push(new TencentConverter());
  }

  /**
   * 注册新的转换器
   * @param converter - 转换器实例
   */
  register(converter: ContentConverter): void {
    this.converters.push(converter);
  }

  /**
   * 根据URL获取合适的转换器
   * @param url - 来源URL
   * @returns 转换器实例
   */
  getConverter(url: string): ContentConverter {
    // 先检查非默认转换器
    for (const converter of this.converters) {
      if (converter !== this.defaultConverter && converter.supports(url)) {
        console.log('[ConverterFactory] 使用特定转换器:', converter.name, 'for URL:', url);
        return converter;
      }
    }

    // 如果没有找到特定的转换器，返回默认转换器
    console.log('[ConverterFactory] 使用默认转换器 for URL:', url);
    return this.defaultConverter;
  }

  /**
   * 获取默认转换器
   */
  getDefaultConverter(): ContentConverter {
    return this.defaultConverter;
  }

  /**
   * 获取所有已注册的转换器
   */
  getAllConverters(): ContentConverter[] {
    return [...this.converters];
  }
}

/**
 * 单例转换器工厂实例
 */
export const converterFactory = new ConverterFactory();

/**
 * 便捷函数：获取转换器
 * @param url - 来源URL
 * @returns 转换器实例
 */
export function getConverter(url: string): ContentConverter {
  return converterFactory.getConverter(url);
}
