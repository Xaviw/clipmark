import { ClipItem } from './item';

/**
 * 保存项目请求
 */
export interface SaveItemRequest {
  /** 转换后的Markdown内容 */
  content: string;
  /** 原始纯文本 */
  originalPlain: string;
  /** 原始HTML */
  originalHtml: string;
  /** 元数据 */
  metadata: {
    /** 来源URL */
    sourceUrl: string;
    /** 页面标题 */
    title: string;
    /** 复制时间戳 */
    timestamp: number;
  };
}

/**
 * 保存项目响应
 */
export interface SaveItemResponse {
  /** 生成的唯一ID */
  id: string;
  /** 是否成功 */
  success: boolean;
  /** 消息（可选） */
  message?: string;
}

/**
 * 获取项目列表响应
 */
export interface GetItemsResponse {
  /** 项目列表 */
  items: ClipItem[];
  /** 总数 */
  total: number;
}

/**
 * 删除项目响应
 */
export interface DeleteItemResponse {
  /** 是否成功 */
  success: boolean;
  /** 消息（可选） */
  message?: string;
}

/**
 * API错误响应
 */
export interface ApiErrorResponse {
  /** 错误消息 */
  error: string;
  /** 错误代码 */
  code?: string;
}
