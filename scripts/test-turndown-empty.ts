#!/usr/bin/env tsx
/**
 * 测试 TurndownService 对空元素的处理
 */

import TurndownService from 'turndown';

async function main() {
  const turndownService = new TurndownService();

  // 添加分割线规则
  turndownService.addRule('testHr', {
    filter: (node) => {
      const isP = node.nodeName === 'P';
      const className = node.className || '';
      const hasClass = className.includes('horizontal-splitline');

      console.log(`过滤器被调用: nodeName=${node.nodeName}, className="${className}"`);

      return isP && hasClass;
    },
    replacement: () => {
      console.log('✅ 替换函数被调用！');
      return '\n---\n';
    },
  });

  console.log('测试1: 空的分割线元素');
  const html1 = '<p class="horizontal-splitline"><span> </span></p>';
  const result1 = turndownService.turndown(html1);
  console.log('结果:', JSON.stringify(result1));
  console.log();

  console.log('测试2: 包含文本的分割线元素');
  const html2 = '<p class="horizontal-splitline">test</p>';
  const result2 = turndownService.turndown(html2);
  console.log('结果:', JSON.stringify(result2));
  console.log();

  console.log('测试3: 完全空的分割线元素');
  const html3 = '<p class="horizontal-splitline"></p>';
  const result3 = turndownService.turndown(html3);
  console.log('结果:', JSON.stringify(result3));
}

main().catch(console.error);
