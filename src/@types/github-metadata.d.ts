/* eslint-disable unicorn/filename-case */

/** Options object containing authentication and repository details. */
interface Options {
  /** The user or organization that owns the repository. This is the first path segment after "https://github.com/". */
  owner: string;

  /** The repository name to get metadata for. This is the second path segment after "https://github.com/". */
  repo: string;

  /** Optionally pass a list of top-level properties to exclude from the metadata by not downloading it from GitHub. */
  exclude?: Array<string>;

  /** Optionally supply a GitHub username for authentication. This is only necessary when using `username/password` for authentication. */
  username?: string;

  /** Optionally supply a GitHub password for authentication. This is only necessary when using `username/password` for authentication. */
  password?: string;

  /** Optionally supply a GitHub personal access token for authentication. This is only necessary with using oauth (instead of `username/password`) for authentication. */
  token?: string;
}

interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
}

interface Metadata {
  public_repositories?: Array<unknown>;
  organization_members?: Array<unknown>;
  contributors?: Array<unknown>;
  collaborators?: Array<unknown>;
  branches?: Array<unknown>;
  languages?: { [language: string]: number | undefined };
  teams?: Array<unknown>;
  releases?: Array<unknown>;
  tags?: Array<unknown>;
  repository?: {
    id: number;
    name: string;
    full_name: string;
    owner: GitHubUser;
    private: boolean;
    html_url: string;
    description: string;
    fork: boolean;
    url: string;
    forks_url: string;
    keys_url: string;
    collaborators_url: string;
    teams_url: string;
    hooks_url: string;
    issue_events_url: string;
    events_url: string;
    assignees_url: string;
    branches_url: string;
    tags_url: string;
    blobs_url: string;
    git_tags_url: string;
    git_refs_url: string;
    trees_url: string;
    statuses_url: string;
    languages_url: string;
    stargazers_url: string;
    contributors_url: string;
    subscribers_url: string;
    subscription_url: string;
    commits_url: string;
    git_commits_url: string;
    comments_url: string;
    issue_comment_url: string;
    contents_url: string;
    compare_url: string;
    merges_url: string;
    archive_url: string;
    downloads_url: string;
    issues_url: string;
    pulls_url: string;
    milestones_url: string;
    notifications_url: string;
    labels_url: string;
    releases_url: string;
    deployments_url: string;
    created_at: string;
    updated_at: string;
    pushed_at: string;
    git_url: string;
    ssh_url: string;
    clone_url: string;
    svn_url: string;
    homepage: string;
    size: number;
    stargazers_count: number;
    watchers_count: number;
    language: string;
    has_issues: boolean;
    has_projects: boolean;
    has_downloads: boolean;
    has_wiki: boolean;
    has_pages: boolean;
    forks_count: boolean;
    mirror_url: null;
    open_issues_count: number;
    forks: number;
    open_issues: number;
    watchers: number;
    default_branch: string;
    permissions: {
      admin: boolean;
      push: boolean;
      pull: boolean;
    };
    allow_squash_merge: boolean;
    allow_merge_commit: boolean;
    allow_rebase_merge: boolean;
    organization: GitHubUser;
    network_count: number;
    subscribers_count: number;
  };
  pages_info?: {
    message: string;
    documentation_url: string;
  };
  pages?: {
    env: string;
    test: boolean;
    dotcom: boolean;
    enterprise: boolean;
    development: boolean;
    ssl: boolean;
    schema: string;
    custom_domains_enabled: boolean;
    github_hostname: string;
    pages_hostname: string;
    github_url: string;
    api_url: string;
    help_url: string;
  };
  hostname?: string;
  pages_hostname?: string;
  api_url?: string;
  help_url?: string;
  environment?: string;
  pages_env?: string;
  url?: string;
  project_title?: string;
  repository_name?: string;
  repository_nwo?: string;
  project_tagline?: string;
  owner_name?: string;
  owner_gravatar_url?: string;
  repository_url?: string;
  language?: string;
  show_downloads?: boolean;
  owner_url?: string;
  zip_url?: string;
  tar_url?: string;
  clone_url?: string;
  releases_url?: string;
  issues_url?: string;
  wiki_url?: string;
  is_user_page?: boolean;
  is_project_page?: boolean;
}

type FetchGitHubMetadata = (options: Options) => Promise<Metadata>;
const fetch: FetchGitHubMetadata;

declare module "github-metadata" {
  export type GitHubMetadataOptions = Options;
  export type GitHubMetadata = Metadata;

  export default fetch;
}
