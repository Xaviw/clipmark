#!/usr/bin/env tsx
/**
 * 调试 TurndownService 转换分割线
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { parseHTML } from 'linkedom';
import TurndownService from 'turndown';

async function main() {
  const htmlPath = join(__dirname, '../docs/origin.html');
  const html = readFileSync(htmlPath, 'utf-8');

  const doc = parseHTML(html);
  const document = doc.document;

  // 提取内容
  const documentDiv = document.querySelector('div.document');
  if (!documentDiv) return;

  const sectionDiv = documentDiv.querySelector('div.section');
  if (!sectionDiv) return;

  // 查找分割线
  const hrElements = sectionDiv.querySelectorAll('.horizontal-splitline');
  console.log(`找到 ${hrElements.length} 个分割线元素\n`);

  if (hrElements.length === 0) return;

  const hr = hrElements[0];
  console.log('分割线元素信息:');
  console.log('nodeName:', hr.nodeName);
  console.log('className:', hr.className);
  console.log('outerHTML:', hr.outerHTML?.substring(0, 300));
  console.log();

  // 创建 TurndownService 并添加规则
  const turndownService = new TurndownService();

  // 添加分割线规则（优先级最高）
  turndownService.addRule('testHr', {
    filter: (node) => {
      const isP = node.nodeName === 'P';
      const className = node.className || '';
      const hasClass = className.includes('horizontal-splitline');

      console.log(`过滤器检查: nodeName=${node.nodeName}, className="${className}", hasClass=${hasClass}`);

      return isP && hasClass;
    },
    replacement: () => {
      console.log('✅ 分割线规则被触发！');
      return '\\n---\\n';
    },
  });

  console.log('开始转换...\n');
  const markdown = turndownService.turndown(hr.outerHTML || '');

  console.log('\n转换结果:', JSON.stringify(markdown));
  console.log('包含分割线:', markdown.includes('---'));
}

main().catch(console.error);
