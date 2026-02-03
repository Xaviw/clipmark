#!/usr/bin/env tsx
/**
 * 调试分割线转换
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { TencentConverter } from '../packages/shared/src/converters/tencent';

async function main() {
  const htmlPath = join(__dirname, '../docs/origin.html');
  const html = readFileSync(htmlPath, 'utf-8');

  console.log('='.repeat(60));
  console.log('测试完整转换流程');
  console.log('='.repeat(60));

  const converter = new TencentConverter();
  const markdown = await converter.convert(html, 'https://docs.qq.com/test');

  console.log('\n转换结果:');
  console.log(markdown);

  // 检查是否包含分割线
  if (markdown.includes('---')) {
    console.log('\n✅ 找到分割线！');
  } else {
    console.log('\n❌ 未找到分割线！');
  }

  // 检查是否包含图片占位符
  if (markdown.includes('图片占位符')) {
    console.log('✅ 找到图片占位符！');
  } else {
    console.log('❌ 未找到图片占位符！');
  }
}

main().catch(console.error);
