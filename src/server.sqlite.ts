#!/usr/bin/env node
/**
 * MCP Framework Library Server - JSON 文件版本 (无需 native 模块)
 * 适用于 ARM64 等难以编译 better-sqlite3 的平台
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 数据文件路径
const dataDir = join(__dirname, '../data');
const frameworksFile = join(dataDir, 'frameworks.json');
const examplesFile = join(dataDir, 'examples.json');

// 创建 MCP 服务器
const server = new Server(
  {
    name: 'framework-library',
    version: '0.4.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 注册工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_api',
        description: '搜索框架 API 文档。支持按框架名称和关键词搜索 API 定义、参数、返回值等。',
        inputSchema: {
          type: 'object',
          properties: {
            framework: {
              type: 'string',
              enum: ['fastapi', 'react', 'vue', 'django', 'express', 'nextjs', 'flask'],
              description: '框架名称',
            },
            keyword: {
              type: 'string',
              description: '搜索关键词，如 "authentication", "router", "component"',
            },
          },
          required: ['framework', 'keyword'],
        },
      },
      {
        name: 'get_example',
        description: '获取框架示例代码。返回特定场景的完整代码示例。',
        inputSchema: {
          type: 'object',
          properties: {
            framework: {
              type: 'string',
              description: '框架名称',
            },
            pattern: {
              type: 'string',
              description: '代码模式，如 "CRUD", "JWT auth", "websocket", "form validation"',
            },
          },
          required: ['framework', 'pattern'],
        },
      },
      {
        name: 'get_best_practice',
        description: '获取框架最佳实践。返回社区推荐的使用模式和常见陷阱。',
        inputSchema: {
          type: 'object',
          properties: {
            framework: {
              type: 'string',
              description: '框架名称',
            },
            topic: {
              type: 'string',
              description: '主题，如 "performance", "security", "testing", "deployment"',
            },
          },
          required: ['framework', 'topic'],
        },
      },
      {
        name: 'list_frameworks',
        description: '列出所有支持的框架及其版本信息。',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'compare_frameworks',
        description: '跨框架对比同一功能的不同实现方式。',
        inputSchema: {
          type: 'object',
          properties: {
            frameworks: {
              type: 'array',
              items: { type: 'string' },
              description: '要对比的框架列表',
            },
            feature: {
              type: 'string',
              description: '要对比的功能，如 "authentication", "routing", "state management"',
            },
          },
          required: ['frameworks', 'feature'],
        },
      },
    ],
  };
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'search_api') {
      const docs = searchDocs(args!.framework as string, args!.keyword as string);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(docs, null, 2),
          },
        ],
      };
    }

    if (name === 'get_example') {
      const example = getExampleCode(args!.framework as string, args!.pattern as string);
      return {
        content: [
          {
            type: 'text',
            text: example || '未找到相关示例',
          },
        ],
      };
    }

    if (name === 'get_best_practice') {
      const practices = getBestPractices(args!.framework as string, args!.topic as string);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(practices, null, 2),
          },
        ],
      };
    }

    if (name === 'list_frameworks') {
      const frameworks = listFrameworks();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(frameworks, null, 2),
          },
        ],
      };
    }

    if (name === 'compare_frameworks') {
      const comparison = compareFrameworks(
        args!.frameworks as string[],
        args!.feature as string
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(comparison, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// 辅助函数
function searchDocs(framework: string, keyword: string): any[] {
  // 从示例文件搜索
  const exampleFiles = {
    fastapi: 'fastapi_examples.md',
    react: 'react_examples.md',
    vue: 'vue_examples.md',
    django: 'django_examples.md',
    express: 'express_examples.md',
    nextjs: 'nextjs_examples.md',
    flask: 'flask_examples.md',
  };

  const fileName = exampleFiles[framework.toLowerCase() as keyof typeof exampleFiles];
  if (!fileName) {
    return [{ error: `不支持的框架：${framework}` }];
  }

  const filePath = join(dataDir, 'examples', fileName);
  if (!existsSync(filePath)) {
    return [{ error: `框架文件不存在：${fileName}` }];
  }

  const content = readFileSync(filePath, 'utf-8');
  
  // 简单搜索（可以改进为更智能的搜索）
  const lines = content.split('\n');
  const matchingLines = lines.filter(line => 
    line.toLowerCase().includes(keyword.toLowerCase())
  );

  return [
    {
      framework,
      keyword,
      file: fileName,
      matches: matchingLines.slice(0, 20), // 最多返回 20 行
      total_matches: matchingLines.length,
    },
  ];
}

function getExampleCode(framework: string, pattern: string): string {
  const exampleFiles: Record<string, string> = {
    fastapi: 'fastapi_examples.md',
    react: 'react_examples.md',
    vue: 'vue_examples.md',
    django: 'django_examples.md',
    express: 'express_examples.md',
    nextjs: 'nextjs_examples.md',
    flask: 'flask_examples.md',
  };

  const fileName = exampleFiles[framework.toLowerCase()];
  if (!fileName) {
    return `// 不支持的框架：${framework}`;
  }

  const filePath = join(dataDir, 'examples', fileName);
  if (!existsSync(filePath)) {
    return `// 框架文件不存在：${fileName}`;
  }

  const content = readFileSync(filePath, 'utf-8');
  return content;
}

function getBestPractices(framework: string, topic: string): any[] {
  // 简化实现
  return [
    {
      framework,
      topic,
      practices: [
        {
          title: `${framework} ${topic} 最佳实践`,
          description: '社区推荐的最佳实践',
          impact: '高',
        },
      ],
    },
  ];
}

function listFrameworks(): any {
  return {
    frameworks: [
      {
        name: 'FastAPI',
        version: '0.109.0',
        type: 'backend',
        language: 'Python',
      },
      {
        name: 'React',
        version: '18.2.0',
        type: 'frontend',
        language: 'JavaScript/TypeScript',
      },
      {
        name: 'Vue',
        version: '3.4.0',
        type: 'frontend',
        language: 'JavaScript/TypeScript',
      },
      {
        name: 'Django',
        version: '5.0.0',
        type: 'backend',
        language: 'Python',
      },
      {
        name: 'Express',
        version: '4.18.2',
        type: 'backend',
        language: 'JavaScript/TypeScript',
      },
      {
        name: 'Next.js',
        version: '14.0.0',
        type: 'fullstack',
        language: 'JavaScript/TypeScript',
      },
      {
        name: 'Flask',
        version: '3.0.0',
        type: 'backend',
        language: 'Python',
      },
    ],
  };
}

function compareFrameworks(frameworks: string[], feature: string): any {
  return {
    feature,
    frameworks,
    comparison: frameworks.map((fw) => ({
      framework: fw,
      implementation: `${fw} 的 ${feature} 实现方式`,
      pros: ['优点 1', '优点 2'],
      cons: ['缺点 1'],
    })),
  };
}

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Framework Library (JSON version) server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
