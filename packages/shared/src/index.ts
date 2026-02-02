/**
 * @clipmark/shared
 * ClipMark 共享代码包
 * 包含类型定义、工具函数、常量和转换策略
 */

// ========== Types ==========
export type {
  ClipItem,
  StorageData,
  PlaceholderInfo,
} from './types/item';

export type {
  SaveItemRequest,
  SaveItemResponse,
  GetItemsResponse,
  DeleteItemResponse,
  ApiErrorResponse,
} from './types/api';

export type {
  AppSettings,
} from './types/config';

// ========== Constants & Config ==========
export {
  CONTENT_LIMITS,
  DEFAULT_SETTINGS,
  ERROR_MESSAGES,
  NOTIFICATION_MESSAGES,
  CONVERTER_TYPES,
  PLACEHOLDER_TEMPLATES,
  CONTENT_FOOTER_TEMPLATE,
  NOTIFICATION_CONFIG,
  API_CONFIG,
} from './constants';

// ========== Utils ==========
export {
  formatDate,
  now,
} from './utils/date';

export {
  truncateString,
  formatSize,
  formatCharCount,
  generateId,
  normalizeWhitespace,
  isBlank,
  safeSlice,
} from './utils/string';

export {
  patternToRegex,
  matchPattern,
  matchAnyPattern,
  getDomain,
  isValidUrl,
  DOMAIN_PATTERNS,
  getConverterType,
} from './utils/url';

export type { ConverterType } from './utils/url';

// ========== Converters ==========
export {
  ContentConverter,
  ConversionContext,
} from './converters/base';

export {
  DefaultConverter,
} from './converters/default';

export {
  TencentConverter,
} from './converters/tencent';

export {
  ConverterFactory,
  converterFactory,
  getConverter,
} from './converters/factory';
