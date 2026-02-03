#!/usr/bin/env tsx
/**
 * 调试 Markdown 输出结构
 */

import { readFileSync } from 'fs';
import { join } from 'path';

async function main() {
  const mdPath = join(__dirname, '../docs/converted-output.md');
  const content = readFileSync(mdPath, 'utf-8');

  const lines = content.split('\n');

  console.log('='.repeat(60));
  console.log('Markdown 行结构分析');
  console.log('='.repeat(60));
  console.log();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1] || '';

    // 检测列表项
    const isUnordered = /^- (?!\[ \])/.test(line);
    const isOrdered = /^\d+\./.test(line);
    const isCheckbox = /^- \[ \]/.test(line);
    const isIndentedUnordered = /^  - (?!\[ \])/.test(line);
    const isIndentedOrdered = /^  \d+\./.test(line);
    const isIndentedCheckbox = /^  - \[ \]/.test(line);
    const isBlockquote = /^>/.test(line);

    if (isUnordered || isOrdered || isCheckbox || isIndentedUnordered || isIndentedOrdered || isIndentedCheckbox || isBlockquote) {
      console.log(`行 ${i + 1}: "${line}"`);
      console.log(`  类型: ${isUnordered ? '无序' : isOrdered ? '有序' : isCheckbox ? '复选框' : isIndentedUnordered ? '缩进无序' : isIndentedOrdered ? '缩进有序' : isIndentedCheckbox ? '缩进复选框' : '引用'}`);
      console.log(`  下一行: "${next}"`);
      console.log(`  下一行为空: ${next === ''}`);
      console.log();
    }
  }
}

main().catch(console.error);
