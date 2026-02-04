/**
 * 生成下一个自增ID
 * 基于当前ID递增
 * @param currentId - 当前最大的ID
 * @returns 下一个ID（数字格式）
 */
export function getNextId(currentId?: string): string {
  const nextNum = currentId ? parseInt(currentId, 10) + 1 : 1;
  return nextNum.toString();
}
