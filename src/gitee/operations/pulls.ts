import { z } from 'zod';
import axios, { AxiosError } from 'axios';
import { 
  GiteeError, 
  GiteeAuthenticationError, 
  GiteeResourceNotFoundError,
  GiteePermissionError,
  GiteeRateLimitError,
  GiteeValidationError 
} from '../common/errors.js';

// PR 相关类型定义
export const UserSchema = z.object({
  id: z.number(),
  login: z.string(),
  name: z.string(),
  avatar_url: z.string(),
  url: z.string(),
  html_url: z.string(),
  remark: z.string().optional(),
  followers_url: z.string(),
  following_url: z.string(),
  gists_url: z.string(),
  starred_url: z.string(),
  subscriptions_url: z.string(),
  organizations_url: z.string(),
  repos_url: z.string(),
  events_url: z.string(),
  received_events_url: z.string(),
  type: z.string(),
  member_role: z.string().optional()
});

export const MilestoneSchema = z.object({
  url: z.string(),
  html_url: z.string(),
  number: z.number(),
  repository_id: z.number(),
  state: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  updated_at: z.string(),
  created_at: z.string(),
  open_issues: z.number(),
  closed_issues: z.number(),
  due_on: z.string().nullable()
});

export const LabelSchema = z.object({
  id: z.number(),
  color: z.string(),
  name: z.string(),
  repository_id: z.number(),
  url: z.string(),
  created_at: z.string(),
  updated_at: z.string()
});

// 定义 PR 的 head 和 base 对象结构
export const RepoSchema = z.object({
  id: z.number(),
  name: z.string(),
  path: z.string(),
  full_name: z.string(),
  owner: UserSchema
}).optional();

export const RefSchema = z.object({
  label: z.string(),
  ref: z.string(),
  sha: z.string(),
  repo: RepoSchema,
  user: UserSchema.optional()
});

export const PullRequestSchema = z.object({
  id: z.number(),
  url: z.string(),
  html_url: z.string(),
  diff_url: z.string(),
  patch_url: z.string(),
  issue_url: z.string(),
  commits_url: z.string(),
  review_comments_url: z.string(),
  review_comment_url: z.string(),
  comments_url: z.string(),
  number: z.number(),
  state: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  closed_at: z.string().nullable(),
  merged_at: z.string().nullable(),
  mergeable: z.boolean().nullable(),
  can_merge_check: z.boolean().nullable(),
  user: UserSchema,
  labels: z.array(LabelSchema).optional(),
  milestone: MilestoneSchema.nullable(),
  head: RefSchema,
  base: RefSchema,
  draft: z.boolean().optional(),
  merged: z.boolean().optional(),
  mergeable_state: z.string().optional()
});

// PR 列表查询参数 Schema
export const ListPullRequestsSchema = z.object({
  owner: z.string().describe('仓库所属空间地址(企业、组织或个人的地址path)'),
  repo: z.string().describe('仓库路径(path)'),
  state: z.enum(['open', 'closed', 'merged', 'all']).optional()
    .describe('可选。Pull Request 状态'),
  head: z.string().optional()
    .describe('可选。Pull Request 提交的源分支。格式：branch 或者：username:branch'),
  base: z.string().optional()
    .describe('可选。Pull Request 提交目标分支的名称'),
  sort: z.enum(['created', 'updated', 'popularity', 'long-running']).optional()
    .describe('可选。排序字段，默认按创建时间'),
  direction: z.enum(['asc', 'desc']).optional()
    .describe('可选。升序/降序'),
  labels: z.string().optional()
    .describe('用逗号分开的标签。如: bug,performance'),
  page: z.number().min(1).optional()
    .describe('当前的页码'),
  per_page: z.number().min(1).max(100).optional()
    .describe('每页的数量，最大为 100'),
  milestone_number: z.number().optional()
    .describe('可选。里程碑序号(id)'),
  author: z.string().optional()
    .describe('可选。PR 创建者用户名'),
  assignee: z.string().optional()
    .describe('可选。评审者用户名'),
  tester: z.string().optional()
    .describe('可选。测试者用户名')
});

const GITEE_API_BASE = 'https://gitee.com/api/v5';

export async function listPullRequests(
  owner: string,
  repo: string,
  options: Omit<z.infer<typeof ListPullRequestsSchema>, 'owner' | 'repo'> = {}
): Promise<z.infer<typeof PullRequestSchema>[]> {
  const accessToken = process.env.GITEE_ACCESS_TOKEN;
  if (!accessToken) {
    throw new GiteeAuthenticationError('GITEE_ACCESS_TOKEN environment variable is required');
  }

  try {
    const response = await axios.get(
      `${GITEE_API_BASE}/repos/${owner}/${repo}/pulls`,
      {
        params: {
          access_token: accessToken,
          ...options
        }
      }
    );

    // 验证返回数据格式
    const pullRequests = z.array(PullRequestSchema).parse(response.data);
    return pullRequests;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message || axiosError.message;

      switch (status) {
        case 401:
          throw new GiteeAuthenticationError('Authentication failed. Please check your access token.');
        case 403:
          throw new GiteePermissionError('Permission denied. Please check your access rights.');
        case 404:
          throw new GiteeResourceNotFoundError(`Repository not found: ${owner}/${repo}`);
        case 422:
          throw new GiteeValidationError('Invalid request parameters.', axiosError.response?.data);
        case 429:
          throw new GiteeRateLimitError('Rate limit exceeded.', new Date());
        default:
          throw new GiteeError(`Gitee API Error: ${message}`);
      }
    }
    throw error;
  }
}
