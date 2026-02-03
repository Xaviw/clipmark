#!/usr/bin/env tsx
/**
 * 调试转换过程
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { parseHTML } from 'linkedom';

async function main() {
  const htmlPath = join(__dirname, '../docs/origin.html');
  const html = readFileSync(htmlPath, 'utf-8');

  const doc = parseHTML(html);
  const document = doc.document;

  // 提取内容
  const documentDiv = document.querySelector('div.document');
  if (!documentDiv) {
    console.log('未找到 div.document');
    return;
  }

  const sectionDiv = documentDiv.querySelector('div.section');
  if (!sectionDiv) {
    console.log('未找到 div.section');
    return;
  }

  console.log('='.repeat(60));
  console.log('检查分割线元素');
  console.log('='.repeat(60));
  console.log();

  const hrElements = sectionDiv.querySelectorAll('.horizontal-splitline');
  if (hrElements.length > 0) {
    const hr = hrElements[0];
    console.log('nodeName:', hr.nodeName);
    console.log('className:', hr.className);
    console.log('textContent:', hr.textContent);
    console.log('innerHTML:', hr.innerHTML);
  } else {
    console.log('未找到分割线元素');
  }
}

main().catch(console.error);