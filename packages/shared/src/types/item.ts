import type { AppSettings } from './config';

/**
 * 剪贴板项目数据结构
 */
export interface ClipItem {
  /** 唯一ID (4位数字) */
  id: string;
  /** 转换后的Markdown内容 */
  content: string;
  /** 元数据 */
  metadata: {
    /** 来源URL */
    sourceUrl: string;
    /** 页面标题 */
    title: string;
    /** 复制时间戳 (Unix timestamp in ms) */
    timestamp: number;
  };
  /** 创建时间 (Unix timestamp in ms) */
  createdAt: number;
  /** 内容大小（字符数） */
  size: number;
}

/**
 * 本地存储的数据结构
 */
export interface StorageData {
  /** 历史记录列表 */
  items: ClipItem[];
  /** 用户设置 */
  settings: AppSettings;
}
