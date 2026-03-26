/**
 * get_example 工具实现
 * 获取框架示例代码
 */

import { Database } from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface ExampleArgs {
  framework: string;
  pattern: string;
}

export interface ExampleResult {
  id: string;
  title: string;
  framework: string;
  pattern: string;
  description: string;
  code: string;
  dependencies?: string[];
  tags?: string[];
  difficulty: string;
  references?: string[];
}

export function getExampleCode(db: Database, args: ExampleArgs): ExampleResult | null {
  const { framework, pattern } = args;

  try {
    // 尝试从数据库查询
    const stmt = db.prepare(`
      SELECT e.*, f.name as framework_name
      FROM examples e
      JOIN frameworks f ON e.framework_id = f.id
      WHERE LOWER(f.name) = LOWER(?) AND (
        LOWER(e.pattern) LIKE LOWER(?) OR
        LOWER(e.title) LIKE LOWER(?)
      )
      LIMIT 1
    `);

    const searchPattern = `%${pattern}%`;
    const result = stmt.get(framework, searchPattern, searchPattern) as any;

    if (result) {
      return {
        id: `example_${result.id}`,
        title: result.title,
        framework: result.framework_name,
        pattern: result.pattern,
        description: result.description,
        code: result.code,
        dependencies: result.dependencies ? JSON.parse(result.dependencies) : [],
        tags: result.tags ? JSON.parse(result.tags) : [],
        difficulty: result.difficulty,
        references: result.references ? JSON.parse(result.references) : []
      };
    }

    // 如果数据库没有，从 Markdown 文件加载
    return loadExampleFromFile(framework, pattern);
  } catch (error) {
    // 数据库出错时从文件加载
    return loadExampleFromFile(framework, pattern);
  }
}

function loadExampleFromFile(framework: string, pattern: string): ExampleResult | null {
  const examplePatterns: Record<string, Record<string, string>> = {
    fastapi: {
      'auth': 'data/examples/fastapi_examples.md',
      'jwt': 'data/examples/fastapi_examples.md',
      'crud': 'data/examples/fastapi_examples.md',
      'middleware': 'data/examples/fastapi_examples.md',
    },
    react: {
      'form': 'data/examples/react_examples.md',
      'validation': 'data/examples/react_examples.md',
      'state': 'data/examples/react_examples.md',
      'hook': 'data/examples/react_examples.md',
      'fetch': 'data/examples/react_examples.md',
      'query': 'data/examples/react_examples.md',
      'performance': 'data/examples/react_examples.md',
      'memo': 'data/examples/react_examples.md',
    }
  };

  const frameworkLower = framework.toLowerCase();
  const patternLower = pattern.toLowerCase();

  // 查找匹配的文件
  const frameworkPatterns = examplePatterns[frameworkLower];
  if (!frameworkPatterns) {
    return createDefaultExample(framework, pattern);
  }

  // 查找匹配的模式
  for (const [key, filePath] of Object.entries(frameworkPatterns)) {
    if (patternLower.includes(key) || key.includes(patternLower)) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        return {
          id: `${frameworkLower}_${patternLower}`,
          title: `${framework} ${pattern} Example`,
          framework: framework,
          pattern: pattern,
          description: `Complete example for ${framework} ${pattern}`,
          code: extractExampleFromMarkdown(content, patternLower),
          dependencies: [],
          tags: [frameworkLower, patternLower],
          difficulty: 'intermediate',
          references: []
        };
      } catch (error) {
        return createDefaultExample(framework, pattern);
      }
    }
  }

  return createDefaultExample(framework, pattern);
}

function extractExampleFromMarkdown(content: string, pattern: string): string {
  // 简单实现：返回文件内容
  // TODO: 实现更智能的示例提取
  return content;
}

function createDefaultExample(framework: string, pattern: string): ExampleResult {
  return {
    id: `${framework}_${pattern}_default`,
    title: `${framework} ${pattern} Example`,
    framework: framework,
    pattern: pattern,
    description: `Example code for ${framework} ${pattern} (placeholder)`,
    code: `// ${framework} ${pattern} example
// TODO: Add complete implementation

// This is a placeholder example
// Please contribute to add real code examples!

console.log("${framework} ${pattern}");`,
    dependencies: [],
    tags: [framework.toLowerCase(), pattern.toLowerCase()],
    difficulty: 'intermediate',
    references: []
  };
}

export function getAllExamples(db: Database, framework?: string): ExampleResult[] {
  try {
    const stmt = db.prepare(`
      SELECT e.*, f.name as framework_name
      FROM examples e
      JOIN frameworks f ON e.framework_id = f.id
      ${framework ? 'WHERE LOWER(f.name) = LOWER(?)' : ''}
      ORDER BY e.created_at DESC
    `);

    const results = (framework ? stmt.all(framework) : stmt.all()) as any[];

    return results.map(result => ({
      id: `example_${result.id}`,
      title: result.title,
      framework: result.framework_name,
      pattern: result.pattern,
      description: result.description,
      code: result.code.substring(0, 200) + '...', // 只返回预览
      dependencies: result.dependencies ? JSON.parse(result.dependencies) : [],
      tags: result.tags ? JSON.parse(result.tags) : [],
      difficulty: result.difficulty,
      references: []
    }));
  } catch (error) {
    return [];
  }
}
