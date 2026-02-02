/**
 * MCP 服务通信
 */

import type { ClipItem } from '@clipmark/shared';
import type { SaveItemRequest } from '@clipmark/shared';
import { API_CONFIG } from '@clipmark/shared';

const MCP_URL = API_CONFIG.DEFAULT_MCP_URL;

/**
 * 检查 MCP 服务连接状态
 */
export async function checkMCPConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${MCP_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 保存项目到 MCP 服务
 * 静默失败：如果 MCP 服务不可用，不抛出错误
 */
export async function saveToMCP(item: ClipItem): Promise<boolean> {
  try {
    const request: SaveItemRequest = {
      content: item.content,
      originalPlain: item.originalPlain,
      originalHtml: item.originalHtml,
      metadata: item.metadata,
    };

    const response = await fetch(`${MCP_URL}${API_CONFIG.ENDPOINTS.SAVE_ITEM}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
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

/**
 * 从 MCP 服务删除项目
 * 静默失败：如果 MCP 服务不可用或项目不存在，不抛出错误
 */
export async function deleteFromMCP(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${MCP_URL}${API_CONFIG.ENDPOINTS.DELETE_ITEM}/${id}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
    });

    return response.ok;
  } catch {
    // 静默失败
    return false;
  }
}

/**
 * 批量从 MCP 服务删除项目
 * 静默失败：如果 MCP 服务不可用，不抛出错误
 */
export async function deleteManyFromMCP(ids: string[]): Promise<boolean> {
  if (!ids || ids.length === 0) {
    return true;
  }

  try {
    const response = await fetch(`${MCP_URL}${API_CONFIG.ENDPOINTS.DELETE_ITEM}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
      signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
    });

    return response.ok;
  } catch {
    // 静默失败
    return false;
  }
}
