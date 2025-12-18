-- CreateTable
CREATE TABLE "JiraBoard" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "jiraId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "isPrivate" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JiraBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JiraSprint" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "jiraId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "completeDate" TIMESTAMP(3),
    "goal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JiraSprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JiraAssignee" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "avatarUrl" TEXT,
    "active" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JiraAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JiraIssue" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "boardId" TEXT,
    "sprintId" TEXT,
    "assigneeId" TEXT,
    "jiraId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "statusCategory" TEXT,
    "priority" TEXT,
    "storyPoints" DOUBLE PRECISION,
    "jiraCreatedAt" TIMESTAMP(3),
    "jiraUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JiraIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JiraIssueHistory" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL,
    "authorAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JiraIssueHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JiraSyncJob" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "lastCursor" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JiraSyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JiraBoard_connectionId_idx" ON "JiraBoard"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "JiraBoard_connectionId_jiraId_key" ON "JiraBoard"("connectionId", "jiraId");

-- CreateIndex
CREATE INDEX "JiraSprint_connectionId_idx" ON "JiraSprint"("connectionId");

-- CreateIndex
CREATE INDEX "JiraSprint_boardId_idx" ON "JiraSprint"("boardId");

-- CreateIndex
CREATE UNIQUE INDEX "JiraSprint_connectionId_jiraId_key" ON "JiraSprint"("connectionId", "jiraId");

-- CreateIndex
CREATE INDEX "JiraAssignee_connectionId_idx" ON "JiraAssignee"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "JiraAssignee_connectionId_accountId_key" ON "JiraAssignee"("connectionId", "accountId");

-- CreateIndex
CREATE INDEX "JiraIssue_connectionId_idx" ON "JiraIssue"("connectionId");

-- CreateIndex
CREATE INDEX "JiraIssue_boardId_idx" ON "JiraIssue"("boardId");

-- CreateIndex
CREATE INDEX "JiraIssue_sprintId_idx" ON "JiraIssue"("sprintId");

-- CreateIndex
CREATE INDEX "JiraIssue_assigneeId_idx" ON "JiraIssue"("assigneeId");

-- CreateIndex
CREATE UNIQUE INDEX "JiraIssue_connectionId_jiraId_key" ON "JiraIssue"("connectionId", "jiraId");

-- CreateIndex
CREATE UNIQUE INDEX "JiraIssue_connectionId_key_key" ON "JiraIssue"("connectionId", "key");

-- CreateIndex
CREATE INDEX "JiraIssueHistory_issueId_idx" ON "JiraIssueHistory"("issueId");

-- CreateIndex
CREATE INDEX "JiraIssueHistory_changedAt_idx" ON "JiraIssueHistory"("changedAt");

-- CreateIndex
CREATE INDEX "JiraSyncJob_connectionId_idx" ON "JiraSyncJob"("connectionId");

-- CreateIndex
CREATE INDEX "JiraSyncJob_status_idx" ON "JiraSyncJob"("status");

-- AddForeignKey
ALTER TABLE "JiraBoard" ADD CONSTRAINT "JiraBoard_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "JiraConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraSprint" ADD CONSTRAINT "JiraSprint_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "JiraConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraSprint" ADD CONSTRAINT "JiraSprint_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "JiraBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraAssignee" ADD CONSTRAINT "JiraAssignee_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "JiraConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraIssue" ADD CONSTRAINT "JiraIssue_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "JiraConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraIssue" ADD CONSTRAINT "JiraIssue_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "JiraBoard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraIssue" ADD CONSTRAINT "JiraIssue_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "JiraSprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraIssue" ADD CONSTRAINT "JiraIssue_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "JiraAssignee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraIssueHistory" ADD CONSTRAINT "JiraIssueHistory_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "JiraIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraSyncJob" ADD CONSTRAINT "JiraSyncJob_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "JiraConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
