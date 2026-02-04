/**
 * MCP 服务通信
 */

import type { ClipItem } from '@clipmark/shared';
import { API_CONFIG } from '@clipmark/shared';

const MCP_URL = API_CONFIG.DEFAULT_HTTP_URL;

/**
 * 检查 MCP 服务连接状态
 */
export async function checkMCPConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${MCP_URL}${API_CONFIG.ENDPOINTS.HEALTH}`, {
      method: 'GET',
      signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 同步所有数据到 MCP 服务（全量替换）
 * 静默失败：如果 MCP 服务不可用，不抛出错误
 */
export async function syncToMCP(items: ClipItem[]): Promise<boolean> {
  try {
    const response = await fetch(`${MCP_URL}${API_CONFIG.ENDPOINTS.SYNC_ITEMS}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
      signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.success === true;
  } catch {
    // 静默失败
    return false;
  }
}
