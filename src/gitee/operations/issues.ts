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

// Issue 相关类型定义
export const UserBasicSchema = z.object({
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

export const LabelSchema = z.object({
  id: z.number(),
  color: z.string(),
  name: z.string(),
  repository_id: z.number(),
  url: z.string(),
  created_at: z.string(),
  updated_at: z.string()
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

export const NamespaceMiniSchema = z.object({
  id: z.number(),
  type: z.string().nullable(),
  name: z.string(),
  path: z.string(),
  html_url: z.string()
});

export const ProjectBasicSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  human_name: z.string().optional(),
  url: z.string(),
  namespace: NamespaceMiniSchema.optional(),
  path: z.string(),
  name: z.string(),
  owner: UserBasicSchema.optional(),
  assigner: UserBasicSchema.optional(),
  description: z.string().nullable(),
  private: z.boolean().optional(),
  public: z.boolean().optional(),
  internal: z.boolean().optional(),
  fork: z.boolean().optional(),
  html_url: z.string(),
  ssh_url: z.string().optional()
});

export const IssueTypeSchema = z.object({
  id: z.number(),
  title: z.string(),
  template: z.string().nullable(),
  ident: z.string(),
  color: z.string(),
  is_system: z.boolean(),
  created_at: z.string(),
  updated_at: z.string()
});

export const ProgramBasicSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  assignee: UserBasicSchema.optional(),
  author: UserBasicSchema.optional()
});

export const IssueStateSchema = z.object({
  id: z.number(),
  title: z.string(),
  color: z.string(),
  icon: z.string().nullable(),
  command: z.string().nullable(),
  serial: z.number(),
  created_at: z.string(),
  updated_at: z.string()
});

export const IssueSchema = z.object({
  id: z.number(),
  url: z.string(),
  repository_url: z.string(),
  labels_url: z.string(),
  comments_url: z.string(),
  html_url: z.string(),
  parent_url: z.string().nullable(),
  number: z.string(),
  parent_id: z.number().optional(),
  depth: z.number().optional(),
  state: z.string(),
  title: z.string(),
  body: z.string().nullable(),
  body_html: z.string().optional(),
  user: UserBasicSchema,
  labels: z.array(LabelSchema).optional(),
  assignee: UserBasicSchema.nullable(),
  collaborators: z.array(UserBasicSchema).optional(),
  repository: ProjectBasicSchema.optional(),
  milestone: MilestoneSchema.nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  plan_started_at: z.string().nullable(),
  deadline: z.string().nullable(),
  finished_at: z.string().nullable(),
  scheduled_time: z.number().optional(),
  comments: z.number(),
  priority: z.number().optional(),
  issue_type_detail: IssueTypeSchema.optional(),
  program: ProgramBasicSchema.nullable(),
  security_hole: z.boolean().optional(),
  issue_state_detail: IssueStateSchema.optional(),
  branch: z.string().nullable()
});

// Issue 列表查询参数 Schema
export const ListIssuesSchema = z.object({
  filter: z.enum(['assigned', 'created', 'all']).optional()
    .describe("筛选参数: 授权用户负责的(assigned)，授权用户创建的(created)，包含前两者的(all)。默认: assigned"),
  state: z.enum(['open', 'progressing', 'closed', 'rejected', 'all']).optional()
    .describe("Issue的状态: open（开启的）, progressing(进行中), closed（关闭的）, rejected（拒绝的）。默认: open"),
  labels: z.string().optional()
    .describe("用逗号分开的标签。如: bug,performance"),
  sort: z.enum(['created', 'updated']).optional()
    .describe("排序依据: 创建时间(created)，更新时间(updated_at)。默认: created_at"),
  direction: z.enum(['asc', 'desc']).optional()
    .describe("排序方式: 升序(asc)，降序(desc)。默认: desc"),
  since: z.string().optional()
    .describe("起始的更新时间，要求时间格式为 ISO 8601"),
  page: z.number().min(1).optional()
    .describe("当前的页码"),
  per_page: z.number().min(1).max(100).optional()
    .describe("每页的数量，最大为 100"),
  schedule: z.string().optional()
    .describe("计划开始日期，格式：20181006T173008+80-20181007T173008+80（区间），或者 -20181007T173008+80（小于20181007T173008+80），或者 20181006T173008+80-（大于20181006T173008+80），要求时间格式为20181006T173008+80"),
  deadline: z.string().optional()
    .describe("计划截止日期，格式同上"),
  created_at: z.string().optional()
    .describe("任务创建时间，格式同上"),
  finished_at: z.string().optional()
    .describe("任务完成时间，即任务最后一次转为已完成状态的时间点。格式同上"),
  milestone_number: z.number().optional()
    .describe("可选。里程碑序号(id)"),
  author: z.string().optional()
    .describe("可选。PR 创建者用户名"),
  assignee: z.string().optional()
    .describe("可选。评审者用户名"),
  tester: z.string().optional()
    .describe("可选。测试者用户名")
});

const GITEE_API_BASE = 'https://gitee.com/api/v5';

export async function listIssues(
  options: z.infer<typeof ListIssuesSchema> = {}
): Promise<z.infer<typeof IssueSchema>[]> {
  const accessToken = process.env.GITEE_ACCESS_TOKEN;
  if (!accessToken) {
    throw new GiteeAuthenticationError('GITEE_ACCESS_TOKEN environment variable is required');
  }

  try {
    const response = await axios.get(
      `${GITEE_API_BASE}/user/issues`,
      {
        params: {
          access_token: accessToken,
          ...options
        }
      }
    );

    // 验证返回数据格式
    const issues = z.array(IssueSchema).parse(response.data);
    return issues;
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
          throw new GiteeResourceNotFoundError(`Resource not found`);
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
