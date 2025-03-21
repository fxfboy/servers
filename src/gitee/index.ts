#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { ListPullRequestsSchema, listPullRequests } from './operations/pulls.js';
import { isGiteeError } from './common/errors.js';

const server = new Server(
  {
    name: "gitee-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 列出所有可用的工具
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_pull_requests",
        description: "获取 Pull Request 列表",
        inputSchema: zodToJsonSchema(ListPullRequestsSchema),
      },
    ],
  };
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!request.params.arguments) {
      throw new Error("Arguments are required");
    }

    switch (request.params.name) {
      case "list_pull_requests": {
        const args = ListPullRequestsSchema.parse(request.params.arguments);
        const { owner, repo, ...options } = args;
        const result = await listPullRequests(owner, repo, options);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${JSON.stringify(error.errors)}`);
    }
    if (isGiteeError(error)) {
      throw error;
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred');
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gitee MCP Server running on stdio");
}

server.onerror = (error) => {
  console.error('[MCP Error]', error);
};

process.on('SIGINT', async () => {
  await server.close();
  process.exit(0);
});

runServer().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
