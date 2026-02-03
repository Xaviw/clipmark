#!/usr/bin/env tsx
/**
 * 调试列表识别问题
 */

import { parseHTML } from 'linkedom';

async function main() {
  // 测试HTML
  const html = `
    <div class="document">
      <div class="section">
        <p style="mso-list: l0 level1"><span style="mso-list: Ignore">●</span>普通列表1</p>
        <p style="mso-list: l2 level1"><span style="mso-list: Ignore">\uf0ae</span>复选框1</p>
      </div>
    </div>
  `;

  const doc = parseHTML(html);
  const document = doc.document;

  const lists = document.querySelectorAll('p[style*="mso-list"]');

  console.log('找到', lists.length, '个列表项\n');

  lists.forEach((p: any, index: number) => {
    console.log(`列表项 ${index + 1}:`);
    console.log('  textContent:', JSON.stringify(p.textContent));

    // 检查是否包含复选框字符
    const text = p.textContent || '';
    const hasCheckbox1 = text.includes('\uf0ae');
    const hasCheckbox2 = text.includes('');

    console.log('  包含 \\uf0ae:', hasCheckbox1);
    console.log('  包含 U+F0AE:', hasCheckbox2);
    console.log('  字符编码:', Array.from(text).map(c => c.charCodeAt(0).toString(16)).join(' '));
    console.log();
  });
}

main().catch(console.error);
