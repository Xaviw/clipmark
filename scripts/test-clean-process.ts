#!/usr/bin/env tsx
/**
 * 测试完整的清理过程
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { parseHTML } from 'linkedom';

// 复制清理方法
function cleanWhitespace(node: any): void {
  if (!node || !node.childNodes) return;

  for (let i = node.childNodes.length - 1; i >= 0; i--) {
    const child = node.childNodes[i];

    if (child.nodeType === 3) {
      // 文本节点
      let text = child.textContent || '';
      text = text.replace(/\u00A0/g, ' '); // &nbsp;
      text = text.replace(/\u200B/g, ''); // 零宽空格
      child.textContent = text;
    } else if (child.nodeType === 1) {
      // 元素节点，递归处理
      cleanWhitespace(child);
    }
  }
}

function isEmptyTag(node: any): boolean {
  if (!node) return true;

  const preservedTags = ['IMG', 'BR', 'HR', 'INPUT'];
  if (preservedTags.includes(node.nodeName)) {
    return false;
  }

  const className = node.className || '';
  if (className.includes('horizontal-splitline')) {
    return false;
  }

  const text = (node.textContent || '').trim();
  if (text !== '') {
    return false;
  }

  if (node.childNodes && node.childNodes.length > 0) {
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child.nodeType === 1) {
        if (preservedTags.includes(child.nodeName)) {
          return false;
        }
        if (!isEmptyTag(child)) {
          return false;
        }
      }
    }
  }

  return true;
}

function removeEmptyTags(node: any): void {
  if (!node || !node.childNodes) return;

  for (let i = node.childNodes.length - 1; i >= 0; i--) {
    const child = node.childNodes[i];

    if (child.nodeType === 1) {
      removeEmptyTags(child);

      const isEmpty = isEmptyTag(child);
      if (isEmpty && node.removeChild) {
        console.log(`删除空标签: ${child.nodeName}, className: ${child.className || ''}`);
        node.removeChild(child);
      }
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

  console.log('清理前:');
  const hrBefore = sectionDiv.querySelectorAll('.horizontal-splitline');
  console.log(`找到 ${hrBefore.length} 个分割线\n`);

  console.log('开始清理空白字符...');
  cleanWhitespace(sectionDiv);

  console.log('\n开始删除空标签...');
  removeEmptyTags(sectionDiv);

  console.log('\n清理后:');
  const hrAfter = sectionDiv.querySelectorAll('.horizontal-splitline');
  console.log(`找到 ${hrAfter.length} 个分割线`);
}

main().catch(console.error);
