#!/usr/bin/env tsx
/**
 * 测试特定问题的转换
 */

import { TencentConverter } from '../packages/shared/src/converters/tencent';

async function main() {
  const converter = new TencentConverter();

  // 测试1: 代码块（应该保留换行，不添加语言标识）
  console.log('='.repeat(60));
  console.log('测试1: 代码块处理');
  console.log('='.repeat(60));

  const codeHtml = `
    <div class="document">
      <div class="section">
        <pre><code>line 1
line 2
line 3</code></pre>
      </div>
    </div>
  `;

  const codeResult = await converter.convert(codeHtml, 'https://docs.qq.com/test');
  console.log('输出:');
  console.log(codeResult);
  console.log();

  // 测试2: 引用块（应该保留换行）
  console.log('='.repeat(60));
  console.log('测试2: 引用块处理');
  console.log('='.repeat(60));

  const quoteHtml = `
    <div class="document">
      <div class="section">
        <p style="mso-border-left-alt: #1e6fff 1.5pt;">第一行
第二行
第三行</p>
      </div>
    </div>
  `;

  const quoteResult = await converter.convert(quoteHtml, 'https://docs.qq.com/test');
  console.log('输出:');
  console.log(quoteResult);
  console.log();

  // 测试3: 普通列表（不应该是复选框）
  console.log('='.repeat(60));
  console.log('测试3: 普通列表处理');
  console.log('='.repeat(60));

  const listHtml = `
    <div class="document">
      <div class="section">
        <p style="mso-list: l0 level1"><span style="mso-list: Ignore">●</span>普通列表1</p>
        <p style="mso-list: l0 level1"><span style="mso-list: Ignore">●</span>普通列表2</p>
      </div>
    </div>
  `;

  const listResult = await converter.convert(listHtml, 'https://docs.qq.com/test');
  console.log('输出:');
  console.log(listResult);
  console.log();
}

main().catch(console.error);
