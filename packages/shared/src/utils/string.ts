/**
 * 生成唯一ID
 * 使用4位数字格式 (0000-9999)
 */
export function generateId(): string {
  return Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
}
