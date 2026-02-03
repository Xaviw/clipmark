#!/usr/bin/env tsx
/**
 * 详细调试分割线处理过程
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { parseHTML } from 'linkedom';

async function main() {
  const htmlPath = join(__dirname, '../docs/origin.html');
  const html = readFileSync(htmlPath, 'utf-8');

  console.log('='.repeat(60));
  console.log('步骤1: 检查原始HTML中的分割线');
  console.log('='.repeat(60));

  const doc1 = parseHTML(html);
  const hrInOriginal = doc1.document.querySelectorAll('.horizontal-splitline');
  console.log(`原始HTML中找到 ${hrInOriginal.length} 个分割线`);

  if (hrInOriginal.length > 0) {
    const hr = hrInOriginal[0];
    console.log('分割线信息:');
    console.log('  nodeName:', hr.nodeName);
    console.log('  className:', hr.className);
    console.log('  textContent:', JSON.stringify(hr.textContent));
  }

  console.log('\n' + '='.repeat(60));
  console.log('步骤2: 提取 div.document > div.section');
  console.log('='.repeat(60));

  const documentDiv = doc1.document.querySelector('div.document');
  if (!documentDiv) {
    console.log('❌ 未找到 div.document');
    return;
  }

  const sectionDiv = documentDiv.querySelector('div.section');
  if (!sectionDiv) {
    console.log('❌ 未找到 div.section');
    return;
  }

  const hrInSection = sectionDiv.querySelectorAll('.horizontal-splitline');
  console.log(`section中找到 ${hrInSection.length} 个分割线`);

  console.log('\n' + '='.repeat(60));
  console.log('步骤3: 模拟清理空白字符');
  console.log('='.repeat(60));

  // 检查分割线的文本内容
  if (hrInSection.length > 0) {
    const hr = hrInSection[0];
    const text = hr.textContent || '';
    console.log('分割线文本内容:', JSON.stringify(text));
    console.log('文本长度:', text.length);
    console.log('trim后:', JSON.stringify(text.trim()));
    console.log('trim后长度:', text.trim().length);

    // 检查是否会被判定为空标签
    const isEmpty = text.trim() === '';
    console.log('是否为空:', isEmpty);

    // 检查子节点
    console.log('子节点数量:', hr.childNodes?.length || 0);
    if (hr.childNodes) {
      for (let i = 0; i < hr.childNodes.length; i++) {
        const child = hr.childNodes[i];
        console.log(`  子节点${i}: nodeType=${child.nodeType}, nodeName=${child.nodeName}`);
      }
    }
  }
}

main().catch(console.error);
