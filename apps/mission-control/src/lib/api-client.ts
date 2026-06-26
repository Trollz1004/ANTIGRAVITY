/**
 * Typed API Client with Zod Validation
 *
 * All API requests are validated against Zod schemas before sending.
 *
 * @module api-client
 */

import {
  validate,
  PaginationSchema,
  IssueSortSchema,
  CreateIssueSchema,
  UpdateIssueSchema,
} from './validation-schemas';
import type {
  Pagination,
  IssueFilter,
  IssueSort,
  IssueResponse,
} from './validation-schemas';

const BASE_URL = '/api/v1';

export class ApiError extends Error {
  public readonly status: number;
  public readonly body?: unknown;

  constructor(
    message: string,
    status: number,
    body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    throw new ApiError(
      `API error ${response.status}: ${response.statusText}`,
      response.status,
      body,
    );
  }

  return response.json();
}

// ── Issue API ──

export const IssueApi = {
  list: (params?: {
    pagination?: Partial<Pagination>;
    filter?: Partial<IssueFilter>;
    sort?: Partial<IssueSort>;
  }) => {
    const pagination = validate(PaginationSchema, params?.pagination ?? {});
    const searchParams = new URLSearchParams();
    searchParams.set('page', String(pagination.page));
    searchParams.set('limit', String(pagination.limit));
    if (pagination.offset !== undefined) searchParams.set('offset', String(pagination.offset));

    if (params?.filter) {
      if (params.filter.status) searchParams.set('status', params.filter.status);
      if (params.filter.priority) searchParams.set('priority', params.filter.priority);
      if (params.filter.assigneeAgentId) searchParams.set('assigneeAgentId', params.filter.assigneeAgentId);
      if (params.filter.projectId) searchParams.set('projectId', params.filter.projectId);
      if (params.filter.search) searchParams.set('search', params.filter.search);
    }

    if (params?.sort) {
      const sort = validate(IssueSortSchema, params.sort);
      searchParams.set('sort', sort.field);
      searchParams.set('direction', sort.direction);
    }

    return request<IssueResponse[]>(`/issues?${searchParams}`);
  },

  create: (data: unknown) => {
    const validated = validate(CreateIssueSchema, data);
    return request<IssueResponse>('/issues', {
      method: 'POST',
      body: JSON.stringify(validated),
    });
  },

  update: (id: string, data: unknown) => {
    const validated = validate(UpdateIssueSchema, data);
    return request<IssueResponse>(`/issues/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(validated),
    });
  },
};
