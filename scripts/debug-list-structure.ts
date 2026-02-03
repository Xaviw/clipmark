#!/usr/bin/env tsx
/**
 * 调试列表结构
 * 查看原始HTML中列表的实际结构
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { parseHTML } from 'linkedom';

async function main() {
  console.log('='.repeat(60));
  console.log('调试列表结构');
  console.log('='.repeat(60));
  console.log();

  // 读取原始 HTML 文件
  const htmlPath = join(__dirname, '../docs/origin.html');
  const html = readFileSync(htmlPath, 'utf-8');

  // 解析 HTML
  const doc = parseHTML(html);
  const document = doc.document;

  // 查找所有包含 mso-list 的段落
  const allP = document.querySelectorAll('p');
  console.log(`找到 ${allP.length} 个 <p> 标签`);
  console.log();

  let listCount = 0;
  for (let i = 0; i < allP.length; i++) {
    const p = allP[i];
    const style = p.getAttribute('style') || '';
    const className = p.className || '';

    if (style.includes('mso-list:') || className.includes('MsoNormal')) {
      listCount++;
      const text = (p.textContent || '').substring(0, 50);

      console.log(`列表项 ${listCount}:`);
      console.log(`  文本: ${text}`);
      console.log(`  style: ${style.substring(0, 100)}...`);
      console.log(`  className: ${className}`);
      console.log();

      if (listCount >= 10) {
        console.log('... (仅显示前10个列表项)');
        break;
      }
    }
  }

  console.log('='.repeat(60));
}

main().catch(console.error);
