#!/usr/bin/env tsx
/**
 * 检查原始HTML中复选框的字符
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { parseHTML } from 'linkedom';

async function main() {
  const htmlPath = join(__dirname, '../docs/origin.html');
  const html = readFileSync(htmlPath, 'utf-8');

  const doc = parseHTML(html);
  const document = doc.document;

  // 查找所有段落
  const allP = document.querySelectorAll('p');

  console.log('查找复选框列表项...\n');

  let checkboxCount = 0;
  for (let i = 0; i < allP.length; i++) {
    const p = allP[i];
    const style = p.getAttribute('style') || '';
    const text = p.textContent || '';

    // 检查是否是复选框
    if (style.includes('mso-list:') && style.includes('l2 ')) {
      checkboxCount++;
      console.log(`复选框 ${checkboxCount}:`);
      console.log(`  文本: "${text.substring(0, 50)}"`);
      console.log(`  长度: ${text.length}`);
      console.log('  字符分析:');

      for (let j = 0; j < Math.min(text.length, 10); j++) {
        const char = text[j];
        const code = char.charCodeAt(0);
        const hex = code.toString(16).padStart(4, '0');
        console.log(`    位置${j}: "${char}" (U+${hex.toUpperCase()}, ${code})`);
      }
      console.log();

      if (checkboxCount >= 2) break;
    }
  }
}

main().catch(console.error);
