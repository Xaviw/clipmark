#!/usr/bin/env tsx
/**
 * 检查复选框中的特殊字符
 */

import { readFileSync } from 'fs';
import { join } from 'path';

async function main() {
  const mdPath = join(__dirname, '../docs/converted-output.md');
  const content = readFileSync(mdPath, 'utf-8');

  const lines = content.split('\n');
  const line39 = lines[38]; // 第39行，索引38

  console.log('第39行内容:', line39);
  console.log('长度:', line39.length);
  console.log('\n字符分析:');

  for (let i = 0; i < line39.length; i++) {
    const char = line39[i];
    const code = char.charCodeAt(0);
    const hex = code.toString(16).padStart(4, '0');
    console.log(`位置${i}: "${char}" (U+${hex.toUpperCase()}, ${code})`);
  }
}

main().catch(console.error);
