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
    const [item] = await navigator.clipboard.read();
    if (!item) return null;

    const getText = (type: string) =>
      item.types.includes(type) ? item.getType(type).then((b) => b.text()) : Promise.resolve('');

    return {
      html: await getText('text/html'),
      plain: await getText('text/plain'),
    };
  } catch (error) {
    console.error('[ClipMark Content Script] Failed to read clipboard:', error);
    return null;
  }
}

/**
 * 监听页面的 copy 事件
 */
document.addEventListener(
  'copy',
  async () => {
    // 防抖：如果正在处理，跳过
    if (isProcessing) {
      console.log('[ClipMark Content Script] 正在处理，跳过');
      return;
    }

    isProcessing = true;

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
      console.log(
        '[ClipMark Content Script] 成功读取剪贴板内容，HTML 长度:',
        content.html.length,
        'Plain 长度:',
        content.plain.length
      );

      // 发送消息给 background script
      chrome.runtime
        .sendMessage({
          type: 'COPY_EVENT',
          html: content.html,
          plain: content.plain,
        })
        .catch((error: Error) => {
          // 如果扩展上下文失效（例如扩展被重新加载），静默处理
          // 这是一个已知的限制，当扩展更新或重新加载时会发生
          if (error.message.includes('Extension context invalidated')) {
            console.warn(
              '[ClipMark] Extension context invalidated. Please refresh the page to use ClipMark again.'
            );
          } else {
            console.error('[ClipMark] Failed to send copy event message:', error);
          }
        });

      // 重置处理状态
      isProcessing = false;
    }, 50);
  },
  true
);
