/**
 * Content Script - 监听页面复制事件
 */

console.log('ClipMark content script loaded');

// 防抖：避免短时间内重复处理
let isProcessing = false;

/**
 * 从剪贴板读取内容
 */
async function readClipboardContent(): Promise<{ html: string; plain: string } | null> {
  try {
    const clipboardItems = await navigator.clipboard.read();

    for (const item of clipboardItems) {
      const htmlType = item.types.find((t) => t === 'text/html');
      const plainType = item.types.find((t) => t === 'text/plain');

      if (!htmlType && !plainType) {
        continue;
      }

      const htmlBlob = htmlType ? await item.getType(htmlType) : null;
      const plainBlob = plainType ? await item.getType(plainType) : null;

      const html = htmlBlob ? await htmlBlob.text() : '';
      const plain = plainBlob ? await plainBlob.text() : '';

      return { html, plain };
    }

    return null;
  } catch (error) {
    console.error('[ClipMark Content Script] Failed to read clipboard:', error);
    return null;
  }
}

/**
 * 监听页面的 copy 事件
 */
document.addEventListener('copy', async () => {
  // 防抖：如果正在处理，跳过
  if (isProcessing) {
    console.log('[ClipMark Content Script] 正在处理，跳过');
    return;
  }

  isProcessing = true;

  // 调试日志
  console.log('[ClipMark Content Script] 检测到 copy 事件');

  // 延迟一小段时间，确保剪贴板数据已写入
  // 然后使用 Clipboard API 读取
  setTimeout(async () => {
    const content = await readClipboardContent();

    if (!content || (!content.html && !content.plain)) {
      console.log('[ClipMark Content Script] 未能从剪贴板读取内容');
      isProcessing = false;
      return;
    }

    // 调试日志：记录读取的内容
    console.log('[ClipMark Content Script] 成功读取剪贴板内容');
    console.log('[ClipMark Content Script] HTML 长度:', content.html.length);
    console.log('[ClipMark Content Script] HTML 预览:', content.html.substring(0, 200));
    console.log('[ClipMark Content Script] Plain 长度:', content.plain.length);
    console.log('[ClipMark Content Script] Plain 预览:', content.plain.substring(0, 200));

    // 发送消息给 background script
    chrome.runtime.sendMessage({
      type: 'COPY_EVENT',
      html: content.html,
      plain: content.plain,
    }).catch((error) => {
      console.error('Failed to send copy event message:', error);
    });

    // 重置处理状态
    isProcessing = false;
  }, 50);
}, true);
