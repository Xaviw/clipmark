#!/usr/bin/env tsx
/**
 * 调试添加标记后的分割线
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { parseHTML } from 'linkedom';

// 复制 cleanWhitespace 方法
function cleanWhitespace(node: any): void {
  if (!node || !node.childNodes) return;

  const className = node.className || '';
  const isHorizontalLine = className.includes('horizontal-splitline');

  for (let i = node.childNodes.length - 1; i >= 0; i--) {
    const child = node.childNodes[i];

    if (child.nodeType === 3) {
      let text = child.textContent || '';
      text = text.replace(/\u00A0/g, ' ');
      text = text.replace(/\u200B/g, '');

      if (isHorizontalLine && text.trim() === '') {
        console.log('为分割线添加标记');
        text = '---HR---';
      }

      child.textContent = text;
    } else if (child.nodeType === 1) {
      cleanWhitespace(child);
    }
  }
}

async function main() {
  const htmlPath = join(__dirname, '../docs/origin.html');
  const html = readFileSync(htmlPath, 'utf-8');

  const doc = parseHTML(html);
  const documentDiv = doc.document.querySelector('div.document');
  if (!documentDiv) return;

  const sectionDiv = documentDiv.querySelector('div.section');
  if (!sectionDiv) return;

  const hrBefore = sectionDiv.querySelectorAll('.horizontal-splitline');
  console.log(`清理前找到 ${hrBefore.length} 个分割线`);
  if (hrBefore.length > 0) {
    console.log('清理前文本内容:', JSON.stringify(hrBefore[0].textContent));
  }

  console.log('\n开始清理...\n');
  cleanWhitespace(sectionDiv);

  const hrAfter = sectionDiv.querySelectorAll('.horizontal-splitline');
  console.log(`\n清理后找到 ${hrAfter.length} 个分割线`);
  if (hrAfter.length > 0) {
    console.log('清理后文本内容:', JSON.stringify(hrAfter[0].textContent));
  }
}

main().catch(console.error);
