#!/usr/bin/env tsx
/**
 * 调试引用块换行问题
 */

import { parseHTML } from 'linkedom';

async function main() {
  const html = `
    <div class="document">
      <div class="section">
        <p style="mso-border-left-alt: #1e6fff 1.5pt;">第一行
第二行
第三行</p>
      </div>
    </div>
  `;

  const doc = parseHTML(html);
  const document = doc.document;

  const quote = document.querySelector('p[style*="mso-border-left-alt"]');
  if (quote) {
    console.log('textContent:', JSON.stringify(quote.textContent));
    console.log('innerHTML:', JSON.stringify(quote.innerHTML));
    console.log('字符编码:', Array.from(quote.textContent || '').map(c =>
      c === '\n' ? '\\n' : c.charCodeAt(0).toString(16)
    ).join(' '));
  }
}

main().catch(console.error);
