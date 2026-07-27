export type ProjectTeamUser = {
  id: number;
  name: string;
  email?: string;
  phone_number?: string;
};

export type ProjectTeamProject = {
  id: number;
  name: string;
};

export type ProjectTeamMember = {
  id: number;
  /** Role / title inside the project (e.g. "مهندس موقع أول") */
  name: string;
  user: ProjectTeamUser;
  project: ProjectTeamProject;
  created_at?: string;
};

export type CreateProjectTeamPayload = {
  name: string;
  user_id: number;
  project_id: number;
};

export type UpdateProjectTeamPayload = {
  name: string;
  user_id: number;
  project_id: number;
};

export type ProjectTeamPaginatedResponse = {
  data: ProjectTeamMember[];
  meta?: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};
