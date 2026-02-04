/**
 * 文件存储管理
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { ClipItem } from '@clipmark/shared';
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
  private initialized: boolean = false;

  constructor() {
    const config = getConfig();
    this.dataDir = config.dataDir;
    this.dataFile = path.join(this.dataDir, STORAGE_FILENAME);
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

      // 检查文件是否存在，不存在则创建
      try {
        await fs.access(this.dataFile);
      } catch {
        // 文件不存在，创建新的空数据文件
        await this.saveItemsToFile([]);
      }

      this.initialized = true;
    } catch (error) {
      // 其他错误，可能是文件损坏
      await this.handleCorruptedData(error);
      this.initialized = true;
    }
  }

  /**
   * 替换所有数据（全量同步）
   */
  async replaceAllItems(items: ClipItem[]): Promise<void> {
    this.ensureInitialized();
    await this.saveItemsToFile(items);
  }

  /**
   * 获取所有项目（从文件读取）
   */
  async getAllItems(): Promise<ClipItem[]> {
    this.ensureInitialized();
    return this.loadItemsFromFile();
  }

  /**
   * 获取单个项目（从文件读取）
   */
  async getItem(id: string): Promise<ClipItem | null> {
    this.ensureInitialized();
    const items = await this.loadItemsFromFile();
    return items.find((item) => item.id === id) || null;
  }

  /**
   * 获取最新项目
   */
  async getLatestItem(): Promise<ClipItem | null> {
    this.ensureInitialized();
    const items = await this.loadItemsFromFile();

    if (items.length === 0) {
      return null;
    }

    // 按创建时间降序排序，返回最新的项目
    return items.sort((a, b) => b.createdAt - a.createdAt)[0];
  }

  /**
   * 从文件加载所有项目
   */
  private async loadItemsFromFile(): Promise<ClipItem[]> {
    try {
      const content = await fs.readFile(this.dataFile, 'utf-8');
      const data: StorageData = JSON.parse(content);

      // 验证数据版本
      if (data.version !== 1) {
        throw new Error(`Unsupported data version: ${data.version}`);
      }

      return data.items || [];
    } catch (error) {
      throw new Error(`Failed to load data file: ${(error as Error).message}`);
    }
  }

  /**
   * 保存项目到文件
   */
  private async saveItemsToFile(items: ClipItem[]): Promise<void> {
    const data: StorageData = {
      items,
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
  private async handleCorruptedData(_error: unknown): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.dataDir, `${BACKUP_FILENAME_TEMPLATE}.${timestamp}.backup`);

    try {
      // 尝试备份损坏的文件
      await fs.rename(this.dataFile, backupFile);
      console.error(`Data file corrupted, backed up to: ${backupFile}`);
    } catch {
      // 忽略备份错误
    }

    // 创建新的空数据文件
    await this.saveItemsToFile([]);
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
