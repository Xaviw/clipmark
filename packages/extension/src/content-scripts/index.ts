/**
 * Content Script - 监听页面复制事件
 */

// 防抖锁计数器
let lockCount = 0;

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
  } catch {
    return null;
  }
}

/**
 * 处理复制事件
 */
async function handleCopyEvent(): Promise<void> {
  if (lockCount > 0) {
    return;
  }

  lockCount++;

  try {
    // 延迟一小段时间，确保剪贴板数据已写入
    await new Promise((resolve) => setTimeout(resolve, 50));

    const content = await readClipboardContent();

    if (!content || (!content.html && !content.plain)) {
      return;
    }

    // 发送消息给 background script
    await chrome.runtime.sendMessage({
      type: 'COPY_EVENT',
      html: content.html,
      plain: content.plain,
    });
  } catch {
    // 静默处理错误
  } finally {
    lockCount--;
  }
}

/**
 * 监听页面的 copy 事件
 */
document.addEventListener(
  'copy',
  () => {
    handleCopyEvent().catch(() => {
      // 静默处理错误
    });
  },
  true
);
