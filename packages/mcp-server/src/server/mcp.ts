/**
 * MCP 协议实现
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { getStorage } from './storage.js';
import { startHttpServer } from './http.js';

/**
 * MCP 工具定义
 */
const MCP_TOOLS: Tool[] = [
  {
    name: 'get_latest_capture',
    description: '获取最新转换的剪贴板内容。返回最近一次从浏览器复制并转换为Markdown的内容。',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_capture_by_id',
    description: '根据ID获取特定的剪贴板内容。通过项目ID查询历史记录。',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'string' as const,
          description: '项目ID',
        },
      },
      required: ['id'] as const,
    },
  },
];

/**
 * 创建并启动 MCP 服务器
 */
export async function createMCPServer(): Promise<Server> {
  const server = new Server(
    {
      name: 'clipmark-mcp-server',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // 注册工具列表处理器
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: MCP_TOOLS,
    };
  });

  // 注册工具调用处理器
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const storage = getStorage();

    switch (request.params.name) {
      case 'get_latest_capture': {
        const item = await storage.getLatestItem();

        if (!item) {
          return {
            content: [
              {
                type: 'text' as const,
                text: '暂无剪贴板历史记录。请先在浏览器中使用ClipMark扩展复制一些内容。',
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  id: item.id,
                  content: item.content,
                  metadata: item.metadata,
                  createdAt: item.createdAt,
                  sourceUrl: item.metadata.sourceUrl,
                  title: item.metadata.title,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_capture_by_id': {
        const id = request.params.arguments?.id as string;

        if (!id) {
          throw new Error('Missing required parameter: id');
        }

        const item = await storage.getItem(id);

        if (!item) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `未找到ID为 "${id}" 的项目。请检查ID是否正确。`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  id: item.id,
                  content: item.content,
                  metadata: item.metadata,
                  createdAt: item.createdAt,
                  sourceUrl: item.metadata.sourceUrl,
                  title: item.metadata.title,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  });

  return server;
}

/**
 * 启动 MCP 服务器（stdio 模式）
 * 同时启动 HTTP 服务器用于浏览器扩展通信
 */
export async function startMCPServer(): Promise<void> {
  // 先启动 HTTP 服务器（单例模式，确保不会重复启动）
  // 如果返回 null，说明已有 HTTP 服务器在运行
  const httpServer = await startHttpServer();

  // 创建并启动 MCP 服务器
  const server = await createMCPServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error('ClipMark MCP Server running on stdio');
  if (httpServer) {
    console.error('HTTP Server started for browser extension communication');
  } else {
    console.error('HTTP Server is already running for browser extension communication');
  }
}
