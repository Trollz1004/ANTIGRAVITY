/**
 * Zod Validation Schemas for API Requests
 *
 * Shared validation schemas for common patterns (pagination, filtering, sorting)
 * and domain-specific payloads (issues, agents, users).
 *
 * @module validation-schemas
 */

import { z } from 'zod';

// ── Pagination ──

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).optional(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

// ── Filtering ──

export const IssueStatusSchema = z.enum(['backlog', 'in_progress', 'done', 'blocked']).optional();
export const IssuePrioritySchema = z.enum(['critical', 'high', 'medium', 'low']).optional();

export const IssueFilterSchema = z.object({
  status: IssueStatusSchema,
  priority: IssuePrioritySchema,
  assigneeAgentId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
});

export type IssueFilter = z.infer<typeof IssueFilterSchema>;

// ── Sorting ──

export const SortDirectionSchema = z.enum(['asc', 'desc']);

export const IssueSortSchema = z.object({
  field: z.enum(['createdAt', 'updatedAt', 'priority', 'status', 'issueNumber']).default('createdAt'),
  direction: SortDirectionSchema.default('desc'),
});

export type IssueSort = z.infer<typeof IssueSortSchema>;

// ── Issue Payloads ──

export const CreateIssueSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  projectId: z.string().uuid(),
  assigneeAgentId: z.string().uuid().optional(),
});

export type CreateIssue = z.infer<typeof CreateIssueSchema>;

export const UpdateIssueSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(10000).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  status: z.enum(['backlog', 'in_progress', 'done', 'blocked']).optional(),
  assigneeAgentId: z.string().uuid().nullable().optional(),
});

export type UpdateIssue = z.infer<typeof UpdateIssueSchema>;

// ── Agent Assignment ──

export const AssignAgentSchema = z.object({
  issueId: z.string().uuid(),
  agentId: z.string().uuid().nullable(),
});

export type AssignAgent = z.infer<typeof AssignAgentSchema>;

// ── User Profile ──

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
});

export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;

// ── API Response Validation ──

export const IssueResponseSchema = z.object({
  id: z.string().uuid(),
  issueNumber: z.number().int(),
  identifier: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  status: z.string(),
  priority: z.string(),
  assigneeAgentId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type IssueResponse = z.infer<typeof IssueResponseSchema>;

export const IssueListResponseSchema = z.array(IssueResponseSchema);

// ── Validation Helper ──

/**
 * Validate data against a Zod schema and return a typed result.
 * Throws a ValidationError with details if validation fails.
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new ValidationError(issues, result.error.issues);
  }
  return result.data;
}

export class ValidationError extends Error {
  public readonly issues: z.ZodIssue[];

  constructor(
    message: string,
    issues: z.ZodIssue[],
  ) {
    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
  }
}
