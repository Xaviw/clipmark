/**
 * @clipmark/shared
 * ClipMark 共享代码包
 * 包含类型定义、工具函数、常量和转换策略
 */

// ========== Types ==========
export type { ClipItem, StorageData } from './types/item';

export type { SyncItemsRequest, SyncItemsResponse } from './types/api';

export type { AppSettings } from './types/config';

// ========== Constants & Config ==========
export { CONTENT_LIMITS, DEFAULT_SETTINGS, API_CONFIG } from './constants';

// ========== Utils ==========
export { now } from './utils/date';

export { getNextId } from './utils/string';

export { matchAnyPattern } from './utils/url';

// ========== Converters ==========
export type { ContentConverter } from './converters/base';

export { DefaultConverter } from './converters/default';

export { TencentConverter } from './converters/tencent';

export { ConverterFactory, converterFactory, getConverter } from './converters/factory';
