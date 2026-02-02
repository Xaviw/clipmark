/**
 * 内容转换器
 */

import { getConverter } from '@clipmark/shared';

/**
 * 转换 HTML 为 Markdown
 */
export async function convertContent(html: string, url: string): Promise<string> {
  // 调试日志：记录转换输入
  console.log('[ClipMark Converter] 开始转换');
  console.log('[ClipMark Converter] URL:', url);
  console.log('[ClipMark Converter] HTML 输入长度:', html.length);
  console.log('[ClipMark Converter] HTML 输入预览:', html.substring(0, 500));

  const converter = getConverter(url);
  const result = await converter.convert(html, url);

  // 调试日志：记录转换输出
  console.log('[ClipMark Converter] 转换输出长度:', result.length);
  console.log('[ClipMark Converter] 转换输出预览:', result.substring(0, 500));

  return result;
}
