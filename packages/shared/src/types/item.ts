import type { AppSettings } from './config';

/**
 * 剪贴板项目数据结构
 */
export interface ClipItem {
  /** 唯一ID (UUID) */
  id: string;
  /** 转换后的Markdown内容 */
  content: string;
  /** 原始纯文本（备份） */
  originalPlain: string;
  /** 原始HTML（备份） */
  originalHtml: string;
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

/**
 * 内容占位符信息
 */
export interface PlaceholderInfo {
  /** 占位符类型 */
  type: 'image' | 'iframe' | 'video' | 'audio' | 'canvas' | 'svg' | 'unknown';
  /** 描述 */
  description: string;
  /** 序号 */
  index: number;
}
