#!/usr/bin/env tsx
/**
 * 调试清理过程
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { parseHTML } from 'linkedom';

async function main() {
  const htmlPath = join(__dirname, '../docs/origin.html');
  const html = readFileSync(htmlPath, 'utf-8');

  console.log('='.repeat(60));
  console.log('检查原始HTML中的特殊元素');
  console.log('='.repeat(60));
  console.log();

  // 解析HTML
  const doc = parseHTML(html);
  const document = doc.document;

  // 1. 检查分割线
  const hrElements = document.querySelectorAll('.horizontal-splitline');
  console.log(`找到 ${hrElements.length} 个分割线元素`);
  if (hrElements.length > 0) {
    const hr = hrElements[0];
    console.log('分割线HTML:', hr.outerHTML?.substring(0, 200));
    console.log('分割线文本内容:', hr.textContent);
    console.log();
  }

  // 2. 检查图片
  const imgElements = document.querySelectorAll('img');
  console.log(`找到 ${imgElements.length} 个图片元素`);
  if (imgElements.length > 0) {
    const img = imgElements[0];
    console.log('图片src:', img.getAttribute('src')?.substring(0, 100));
    console.log('图片父节点:', img.parentNode?.nodeName);
    console.log();
  }

  // 3. 提取 div.document > div.section
  const documentDiv = document.querySelector('div.document');
  if (documentDiv) {
    const sectionDiv = documentDiv.querySelector('div.section');
    if (sectionDiv) {
      console.log('='.repeat(60));
      console.log('检查清理后的内容');
      console.log('='.repeat(60));
      console.log();

      // 检查分割线是否还在
      const hrAfter = sectionDiv.querySelectorAll('.horizontal-splitline');
      console.log(`清理后找到 ${hrAfter.length} 个分割线元素`);

      // 检查图片是否还在
      const imgAfter = sectionDiv.querySelectorAll('img');
      console.log(`清理后找到 ${imgAfter.length} 个图片元素`);
    }
  }
}

main().catch(console.error);
