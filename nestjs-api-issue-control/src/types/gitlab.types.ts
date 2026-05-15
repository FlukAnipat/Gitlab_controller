export type GitlabTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  created_at?: number;
};

export type GitlabUserResponse = {
  id: number;
  username: string;
  name?: string;
  email?: string;
  avatar_url?: string;
};

export type GitlabProjectResponse = {
  id: number;
  name?: string;
  path_with_namespace?: string;
};

export type GitlabProjectMemberResponse = {
  id: number;
  username?: string;
  name?: string;
};

export type GitlabIssueResponse = {
  id: number;
  iid: number;
  title?: string;
  description?: string;
  state?: string;
  labels?: string[];
  start_date?: string | null;
  due_date?: string | null;
  web_url?: string;
  author?: {
    id?: number;
    name?: string;
    username?: string;
  };
  assignee?: {
    id?: number;
    name?: string;
    username?: string;
  } | null;
  assignees?: Array<{
    id?: number;
    name?: string;
    username?: string;
  }>;
  time_stats?: GitlabTimeStatsResponse;
};

export type GitlabTimeStatsResponse = {
  human_time_estimate?: string | null;
  human_total_time_spent?: string | null;
  time_estimate: number;
  total_time_spent: number;
};

export type GitlabIssueLinkResponse = {
  id?: number;
  issue_link_id?: number;
  iid?: number;
};

export type GitlabLabelResponse = {
  id?: number;
  name: string;
  color?: string;
};
