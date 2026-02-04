/**
 * 内容转换器
 */

import { getConverter } from '@clipmark/shared';

/**
 * 转换 HTML 为 Markdown
 */
export async function convertContent(html: string, url: string): Promise<string> {
  const converter = getConverter(url);
  return await converter.convert(html, url);
}
