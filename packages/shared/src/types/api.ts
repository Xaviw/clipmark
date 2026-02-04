import { ClipItem } from './item';

/**
 * 同步所有数据请求
 */
export interface SyncItemsRequest {
  /** 所有项目数据 */
  items: ClipItem[];
}

/**
 * 同步所有数据响应
 */
export interface SyncItemsResponse {
  /** 是否成功 */
  success: boolean;
  /** 消息（可选） */
  message?: string;
}
