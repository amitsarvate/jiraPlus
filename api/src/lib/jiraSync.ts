import { prisma } from "./prisma";
import { decryptString } from "./crypto";
import { JiraClient, JiraClientError } from "./jiraClient";

type Logger = {
  info: (data: Record<string, unknown>, message: string) => void;
  warn: (data: Record<string, unknown>, message: string) => void;
  error: (data: Record<string, unknown>, message: string) => void;
};

type JiraBoardResponse = {
  values: JiraBoardSummary[];
  isLast: boolean;
  startAt: number;
  maxResults: number;
  total?: number;
};

type JiraBoardSummary = {
  id: number | string;
  name: string;
  type?: string;
  isPrivate?: boolean;
};

type JiraSprintResponse = {
  values: JiraSprintSummary[];
  isLast: boolean;
  startAt: number;
  maxResults: number;
  total?: number;
};

type JiraSprintSummary = {
  id: number | string;
  name: string;
  state: string;
  startDate?: string;
  endDate?: string;
  completeDate?: string;
  goal?: string;
};

type JiraIssueResponse = {
  issues: JiraIssueSummary[];
  startAt: number;
  maxResults: number;
  total: number;
};

type JiraIssueSummary = {
  id: string;
  key: string;
  fields: {
    summary: string;
    issuetype?: { name?: string };
    status?: { name?: string; statusCategory?: { name?: string } };
    priority?: { name?: string };
    assignee?: {
      accountId: string;
      displayName?: string;
      emailAddress?: string;
      avatarUrls?: Record<string, string>;
      active?: boolean;
    };
    created?: string;
    updated?: string;
  };
};

type JiraSyncSchedulerOptions = {
  intervalMinutes?: number;
  enabled?: boolean;
};

const DEFAULT_INTERVAL_MINUTES = 10;
const ISSUE_PAGE_SIZE = 50;
const BOARD_PAGE_SIZE = 50;
const SPRINT_PAGE_SIZE = 50;

export function startJiraSyncScheduler(
  logger: Logger,
  options: JiraSyncSchedulerOptions = {}
): { stop: () => void } {
  const enabled =
    options.enabled ?? process.env.JIRA_SYNC_ENABLED !== "false";
  if (!enabled) {
    logger.info({}, "Jira sync scheduler disabled");
    return { stop: () => undefined };
  }

  const envInterval = Number(process.env.JIRA_SYNC_INTERVAL_MINUTES);
  const intervalMinutes =
    options.intervalMinutes ??
    (Number.isFinite(envInterval) && envInterval > 0
      ? envInterval
      : DEFAULT_INTERVAL_MINUTES);
  const intervalMs = intervalMinutes * 60 * 1000;
  let inProgress = false;

  const runOnce = async () => {
    if (inProgress) {
      logger.warn({}, "Jira sync already running; skipping overlapping run");
      return;
    }
    inProgress = true;
    try {
      await runJiraSyncCycle(logger);
    } finally {
      inProgress = false;
    }
  };

  void runOnce();
  const timer = setInterval(() => {
    void runOnce();
  }, intervalMs);

  logger.info({ intervalMinutes }, "Jira sync scheduler started");

  return {
    stop: () => clearInterval(timer)
  };
}

async function runJiraSyncCycle(logger: Logger): Promise<void> {
  const connections = await prisma.jiraConnection.findMany();
  if (connections.length === 0) {
    logger.info({}, "No Jira connections found; skipping sync");
    return;
  }

  for (const connection of connections) {
    const job = await prisma.jiraSyncJob.create({
      data: {
        connectionId: connection.id,
        jobType: "full",
        status: "running",
        startedAt: new Date()
      }
    });

    try {
      const accessToken = decryptToken(connection.accessTokenEnc);
      const agileClient = new JiraClient({
        accessToken,
        cloudId: connection.cloudId,
        baseUrl: `https://api.atlassian.com/ex/jira/${connection.cloudId}/rest/agile/1.0`,
        logger
      });

      await syncBoardsAndIssues({
        connectionId: connection.id,
        agileClient,
        logger
      });

      await prisma.jiraSyncJob.update({
        where: { id: job.id },
        data: {
          status: "success",
          finishedAt: new Date()
        }
      });
    } catch (err) {
      const errorMessage = formatError(err);
      logger.error(
        { err: serializeError(err), connectionId: connection.id },
        "Jira sync failed"
      );
      await prisma.jiraSyncJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          finishedAt: new Date(),
          errorMessage
        }
      });
    }
  }
}

async function syncBoardsAndIssues(params: {
  connectionId: string;
  agileClient: JiraClient;
  logger: Logger;
}): Promise<void> {
  const boards = await fetchAllBoards(params.agileClient, params.logger);
  const boardIdMap = new Map<string, string>();

  for (const board of boards) {
    const boardRecord = await prisma.jiraBoard.upsert({
      where: {
        connectionId_jiraId: {
          connectionId: params.connectionId,
          jiraId: toJiraId(board.id)
        }
      },
      update: {
        name: board.name,
        type: board.type,
        isPrivate: board.isPrivate
      },
      create: {
        connectionId: params.connectionId,
        jiraId: toJiraId(board.id),
        name: board.name,
        type: board.type,
        isPrivate: board.isPrivate
      }
    });

    boardIdMap.set(toJiraId(board.id), boardRecord.id);
    await syncSprintsForBoard({
      connectionId: params.connectionId,
      boardId: boardRecord.id,
      boardJiraId: toJiraId(board.id),
      agileClient: params.agileClient,
      logger: params.logger
    });

    await syncIssuesForBoard({
      connectionId: params.connectionId,
      boardId: boardRecord.id,
      boardJiraId: toJiraId(board.id),
      agileClient: params.agileClient,
      logger: params.logger
    });
  }
}

async function syncSprintsForBoard(params: {
  connectionId: string;
  boardId: string;
  boardJiraId: string;
  agileClient: JiraClient;
  logger: Logger;
}): Promise<void> {
  let startAt = 0;
  let isLast = false;

  while (!isLast) {
    const response = await params.agileClient.request<JiraSprintResponse>(
      `/board/${params.boardJiraId}/sprint?state=active,future,closed&startAt=${startAt}&maxResults=${SPRINT_PAGE_SIZE}`
    );

    if (!response) {
      return;
    }

    for (const sprint of response.values) {
      await prisma.jiraSprint.upsert({
        where: {
          connectionId_jiraId: {
            connectionId: params.connectionId,
            jiraId: toJiraId(sprint.id)
          }
        },
        update: {
          boardId: params.boardId,
          name: sprint.name,
          state: sprint.state,
          startDate: parseDate(sprint.startDate),
          endDate: parseDate(sprint.endDate),
          completeDate: parseDate(sprint.completeDate),
          goal: sprint.goal
        },
        create: {
          connectionId: params.connectionId,
          boardId: params.boardId,
          jiraId: toJiraId(sprint.id),
          name: sprint.name,
          state: sprint.state,
          startDate: parseDate(sprint.startDate),
          endDate: parseDate(sprint.endDate),
          completeDate: parseDate(sprint.completeDate),
          goal: sprint.goal
        }
      });
    }

    isLast = response.isLast;
    startAt += response.maxResults;
  }
}

async function syncIssuesForBoard(params: {
  connectionId: string;
  boardId: string;
  boardJiraId: string;
  agileClient: JiraClient;
  logger: Logger;
}): Promise<void> {
  let startAt = 0;

  while (true) {
    const response = await params.agileClient.request<JiraIssueResponse>(
      `/board/${params.boardJiraId}/issue?startAt=${startAt}&maxResults=${ISSUE_PAGE_SIZE}&fields=summary,issuetype,status,priority,assignee,created,updated`
    );

    if (!response) {
      return;
    }

    for (const issue of response.issues) {
      const assigneeId = await upsertAssignee(
        params.connectionId,
        issue.fields.assignee
      );

      await prisma.jiraIssue.upsert({
        where: {
          connectionId_jiraId: {
            connectionId: params.connectionId,
            jiraId: toJiraId(issue.id)
          }
        },
        update: {
          boardId: params.boardId,
          assigneeId,
          key: issue.key,
          summary: issue.fields.summary,
          issueType: issue.fields.issuetype?.name ?? "Unknown",
          status: issue.fields.status?.name ?? "Unknown",
          statusCategory: issue.fields.status?.statusCategory?.name,
          priority: issue.fields.priority?.name,
          jiraCreatedAt: parseDate(issue.fields.created),
          jiraUpdatedAt: parseDate(issue.fields.updated)
        },
        create: {
          connectionId: params.connectionId,
          boardId: params.boardId,
          assigneeId,
          jiraId: toJiraId(issue.id),
          key: issue.key,
          summary: issue.fields.summary,
          issueType: issue.fields.issuetype?.name ?? "Unknown",
          status: issue.fields.status?.name ?? "Unknown",
          statusCategory: issue.fields.status?.statusCategory?.name,
          priority: issue.fields.priority?.name,
          jiraCreatedAt: parseDate(issue.fields.created),
          jiraUpdatedAt: parseDate(issue.fields.updated)
        }
      });
    }

    startAt += response.maxResults;
    if (startAt >= response.total) {
      break;
    }
  }
}

async function upsertAssignee(
  connectionId: string,
  assignee?: JiraIssueSummary["fields"]["assignee"]
): Promise<string | null> {
  if (!assignee?.accountId) {
    return null;
  }

  const record = await prisma.jiraAssignee.upsert({
    where: {
      connectionId_accountId: {
        connectionId,
        accountId: assignee.accountId
      }
    },
    update: {
      displayName: assignee.displayName ?? "Unknown",
      email: assignee.emailAddress,
      avatarUrl: assignee.avatarUrls?.["48x48"],
      active: assignee.active ?? undefined
    },
    create: {
      connectionId,
      accountId: assignee.accountId,
      displayName: assignee.displayName ?? "Unknown",
      email: assignee.emailAddress,
      avatarUrl: assignee.avatarUrls?.["48x48"],
      active: assignee.active
    }
  });

  return record.id;
}

function decryptToken(payload: string): string {
  const parsed = JSON.parse(payload) as {
    iv: string;
    authTag: string;
    cipherText: string;
  };
  return decryptString(parsed);
}

function toJiraId(value: number | string): string {
  return String(value);
}

function parseDate(value?: string): Date | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

function formatError(err: unknown): string {
  if (err instanceof JiraClientError) {
    return `Jira request failed (${err.status})`;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Unknown error";
}

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { name: err.name, message: err.message };
  }
  return { value: err };
}
