#!/usr/bin/env tsx
/**
 * 详细调试列表文本内容
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { parseHTML } from 'linkedom';

async function main() {
  const htmlPath = join(__dirname, '../docs/origin.html');
  const html = readFileSync(htmlPath, 'utf-8');
  const doc = parseHTML(html);
  const document = doc.document;

  const allP = document.querySelectorAll('p');

  let listCount = 0;
  for (let i = 0; i < allP.length; i++) {
    const p = allP[i];
    const className = p.className || '';
    const text = p.textContent || '';

    if (className.includes('MsoNormal') && text.trim().length > 0) {
      listCount++;

      console.log(`\n列表项 ${listCount}:`);
      console.log(`  原始文本: "${text}"`);
      console.log(`  文本长度: ${text.length}`);
      console.log(`  前20个字符码: ${text.substring(0, 20).split('').map(c => c.charCodeAt(0)).join(',')}`);

      // 检测各种标记
      console.log(`  包含 ●: ${text.includes('●')}`);
      console.log(`  包含 ○: ${text.includes('○')}`);
      console.log(`  包含 \\uf0ae: ${text.includes('\uf0ae')}`);
      console.log(`  包含 : ${text.includes('')}`);
      console.log(`  匹配数字: ${text.match(/\d+\./) !== null}`);

      if (listCount >= 6) break;
    }
  }
}

main().catch(console.error);
