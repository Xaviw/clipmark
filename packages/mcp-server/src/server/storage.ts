/**
 * 文件存储管理
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import type { ClipItem } from '@clipmark/shared';
import type { SaveItemRequest } from '@clipmark/shared';
import { generateId, now } from '@clipmark/shared';
import { getConfig } from '../config/index.js';

/**
 * 存储数据结构
 */
interface StorageData {
  items: ClipItem[];
  version: number;
}

const STORAGE_FILENAME = 'data.json';
const BACKUP_FILENAME_TEMPLATE = 'data.json';

/**
 * 文件存储管理器
 */
export class FileStorage {
  private dataDir: string;
  private dataFile: string;
  private memoryCache: Map<string, ClipItem>;
  private initialized: boolean = false;

  constructor() {
    const config = getConfig();
    this.dataDir = config.dataDir;
    this.dataFile = path.join(this.dataDir, STORAGE_FILENAME);
    this.memoryCache = new Map();
  }

  /**
   * 初始化存储
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // 确保数据目录存在
      await fs.mkdir(this.dataDir, { recursive: true });

      // 加载现有数据
      await this.loadFromFile();

      this.initialized = true;
    } catch (error) {
      // 如果加载失败，可能是文件损坏，尝试恢复
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // 文件不存在，创建新的
        await this.saveToFile();
        this.initialized = true;
      } else {
        // 其他错误，可能是文件损坏
        await this.handleCorruptedData(error);
        this.initialized = true;
      }
    }
  }

  /**
   * 保存项目
   */
  async saveItem(request: SaveItemRequest): Promise<ClipItem> {
    this.ensureInitialized();

    const id = generateId();
    const createdAt = now();
    const item: ClipItem = {
      id,
      content: request.content,
      originalPlain: request.originalPlain,
      originalHtml: request.originalHtml,
      metadata: request.metadata,
      createdAt,
      size: request.content.length,
    };

    // 添加到内存缓存
    this.memoryCache.set(id, item);

    // 持久化到文件
    await this.saveToFile();

    return item;
  }

  /**
   * 获取单个项目
   */
  async getItem(id: string): Promise<ClipItem | null> {
    this.ensureInitialized();
    return this.memoryCache.get(id) || null;
  }

  /**
   * 获取所有项目
   */
  async getAllItems(): Promise<ClipItem[]> {
    this.ensureInitialized();
    return Array.from(this.memoryCache.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * 获取项目列表（分页）
   */
  async getItems(limit: number = 10, offset: number = 0): Promise<{ items: ClipItem[]; total: number }> {
    this.ensureInitialized();

    const allItems = Array.from(this.memoryCache.values()).sort((a, b) => b.createdAt - a.createdAt);
    const total = allItems.length;
    const items = allItems.slice(offset, offset + limit);

    return { items, total };
  }

  /**
   * 删除单个项目
   */
  async deleteItem(id: string): Promise<boolean> {
    this.ensureInitialized();

    const deleted = this.memoryCache.delete(id);
    if (deleted) {
      await this.saveToFile();
    }

    return deleted;
  }

  /**
   * 批量删除项目
   */
  async deleteItems(ids: string[]): Promise<number> {
    this.ensureInitialized();

    let count = 0;
    for (const id of ids) {
      if (this.memoryCache.delete(id)) {
        count++;
      }
    }

    if (count > 0) {
      await this.saveToFile();
    }

    return count;
  }

  /**
   * 获取最新项目
   */
  async getLatestItem(): Promise<ClipItem | null> {
    this.ensureInitialized();

    const items = Array.from(this.memoryCache.values());
    if (items.length === 0) {
      return null;
    }

    return items.sort((a, b) => b.createdAt - a.createdAt)[0];
  }

  /**
   * 清空所有数据
   */
  async clearAll(): Promise<void> {
    this.ensureInitialized();

    this.memoryCache.clear();
    await this.saveToFile();
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<{ total: number; totalSize: number }> {
    this.ensureInitialized();

    const items = Array.from(this.memoryCache.values());
    const total = items.length;
    const totalSize = items.reduce((sum, item) => sum + item.size, 0);

    return { total, totalSize };
  }

  /**
   * 从文件加载数据
   */
  private async loadFromFile(): Promise<void> {
    try {
      const content = await fs.readFile(this.dataFile, 'utf-8');
      const data: StorageData = JSON.parse(content);

      // 验证数据版本
      if (data.version !== 1) {
        throw new Error(`Unsupported data version: ${data.version}`);
      }

      // 加载到内存缓存
      this.memoryCache.clear();
      for (const item of data.items) {
        this.memoryCache.set(item.id, item);
      }
    } catch (error) {
      throw new Error(`Failed to load data file: ${(error as Error).message}`);
    }
  }

  /**
   * 保存数据到文件
   */
  private async saveToFile(): Promise<void> {
    const data: StorageData = {
      items: Array.from(this.memoryCache.values()),
      version: 1,
    };

    try {
      await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save data file: ${(error as Error).message}`);
    }
  }

  /**
   * 处理损坏的数据文件
   */
  private async handleCorruptedData(error: unknown): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(
      this.dataDir,
      `${BACKUP_FILENAME_TEMPLATE}.${timestamp}.backup`
    );

    try {
      // 尝试备份损坏的文件
      await fs.rename(this.dataFile, backupFile);
      console.error(`Data file corrupted, backed up to: ${backupFile}`);
    } catch {
      // 忽略备份错误
    }

    // 创建新的空数据文件
    await this.saveToFile();
  }

  /**
   * 确保已初始化
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Storage not initialized. Call initialize() first.');
    }
  }
}

/**
 * 单例存储实例
 */
let storageInstance: FileStorage | null = null;

/**
 * 获取存储实例
 */
export function getStorage(): FileStorage {
  if (!storageInstance) {
    storageInstance = new FileStorage();
  }
  return storageInstance;
}

/**
 * 初始化存储
 */
export async function initializeStorage(): Promise<void> {
  const storage = getStorage();
  await storage.initialize();
}
