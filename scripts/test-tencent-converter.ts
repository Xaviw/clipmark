#!/usr/bin/env tsx
/**
 * 测试腾讯文档转换器
 * 使用 origin.html 文件测试转换功能
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { TencentConverter } from '../packages/shared/src/converters/tencent';

async function main() {
  console.log('='.repeat(60));
  console.log('腾讯文档转换器测试');
  console.log('='.repeat(60));
  console.log();

  // 读取原始 HTML 文件
  const htmlPath = join(__dirname, '../docs/origin.html');
  console.log(`📖 读取文件: ${htmlPath}`);

  let html: string;
  try {
    html = readFileSync(htmlPath, 'utf-8');
    console.log(`✅ 文件读取成功，大小: ${html.length} 字符`);
  } catch (error) {
    console.error(`❌ 读取文件失败:`, error);
    process.exit(1);
  }

  console.log();
  console.log('-'.repeat(60));
  console.log('开始转换...');
  console.log('-'.repeat(60));
  console.log();

  // 创建转换器实例
  const converter = new TencentConverter();

  // 执行转换
  const startTime = Date.now();
  let markdown: string;

  try {
    markdown = await converter.convert(html, 'https://docs.qq.com/test');
    const endTime = Date.now();

    console.log(`✅ 转换成功！`);
    console.log(`⏱️  耗时: ${endTime - startTime}ms`);
    console.log(`📝 Markdown 长度: ${markdown.length} 字符`);
  } catch (error) {
    console.error(`❌ 转换失败:`, error);
    process.exit(1);
  }

  console.log();
  console.log('-'.repeat(60));
  console.log('保存结果...');
  console.log('-'.repeat(60));
  console.log();

  // 保存转换结果
  const outputPath = join(__dirname, '../docs/converted-output.md');
  try {
    writeFileSync(outputPath, markdown, 'utf-8');
    console.log(`✅ 结果已保存到: ${outputPath}`);
  } catch (error) {
    console.error(`❌ 保存文件失败:`, error);
    process.exit(1);
  }

  console.log();
  console.log('='.repeat(60));
  console.log('转换结果预览（前 500 字符）:');
  console.log('='.repeat(60));
  console.log();
  console.log(markdown.substring(0, 500));
  console.log();
  console.log('...');
  console.log();
  console.log('='.repeat(60));
  console.log('✨ 测试完成！');
  console.log('='.repeat(60));
}

// 运行测试
main().catch((error) => {
  console.error('❌ 发生错误:', error);
  process.exit(1);
});
