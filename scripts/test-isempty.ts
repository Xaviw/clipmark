#!/usr/bin/env tsx
/**
 * 测试 isEmptyTag 方法
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { parseHTML } from 'linkedom';

// 复制 isEmptyTag 方法进行测试
function isEmptyTag(node: any): boolean {
  if (!node) return true;

  // 保留的标签（即使为空也不删除）
  const preservedTags = ['IMG', 'BR', 'HR', 'INPUT'];
  if (preservedTags.includes(node.nodeName)) {
    return false;
  }

  // 保留分割线元素
  const className = node.className || '';
  console.log(`  检查className: "${className}"`);
  console.log(`  包含horizontal-splitline: ${className.includes('horizontal-splitline')}`);
  if (className.includes('horizontal-splitline')) {
    return false;
  }

  // 检查文本内容
  const text = (node.textContent || '').trim();
  if (text !== '') {
    return false;
  }

  return true;
}

async function main() {
  const htmlPath = join(__dirname, '../docs/origin.html');
  const html = readFileSync(htmlPath, 'utf-8');

  const doc = parseHTML(html);
  const hrElements = doc.document.querySelectorAll('.horizontal-splitline');

  if (hrElements.length > 0) {
    const hr = hrElements[0];
    console.log('测试分割线元素:');
    console.log('nodeName:', hr.nodeName);
    console.log('className:', hr.className);
    console.log('\n调用 isEmptyTag:');
    const result = isEmptyTag(hr);
    console.log('\n结果:', result);
    console.log(result ? '❌ 会被删除' : '✅ 会被保留');
  }
}

main().catch(console.error);
