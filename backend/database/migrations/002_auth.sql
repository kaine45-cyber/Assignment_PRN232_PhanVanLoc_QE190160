-- ============================================================
-- PRN232 Assignment 2 — Authentication & audit migration (PostgreSQL)
-- Run AFTER TaskManagementDB_Postgres.sql (Assignment 1).
-- Idempotent: safe to run more than once.
--   * SystemAccount  : user accounts (Role 0 = Staff, 1 = Admin)
--   * RefreshToken   : rotating refresh tokens (bonus) — only SHA-256 hashes are stored
--   * Audit columns  : CreatedByID / UpdatedByID on "Task" and "Project" (bonus)
--   * Seed           : one Admin account (password stored as a BCrypt hash only)
-- ============================================================

-- ------------------------------------------------------------
-- TABLE: SystemAccount
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "SystemAccount" (
    "AccountID"     SERIAL          PRIMARY KEY,
    "FullName"      VARCHAR(100)    NOT NULL,
    "Email"         VARCHAR(150)    NOT NULL,
    "PasswordHash"  VARCHAR(200)    NOT NULL,
    "Role"          SMALLINT        NOT NULL DEFAULT 0,
    -- Role: 0 = Staff, 1 = Admin
    "CreatedDate"   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UQ_SystemAccount_Email" UNIQUE ("Email"),
    CONSTRAINT "CK_SystemAccount_Role"  CHECK ("Role" IN (0, 1))
);

-- ------------------------------------------------------------
-- Audit columns
--   Task.CreatedByID  : NO ACTION — an account that created tasks cannot be deleted
--                       (the API checks this first and returns 409)
--   other audit FKs   : SET NULL — deleting an account just clears the reference
-- ------------------------------------------------------------
ALTER TABLE "Task"    ADD COLUMN IF NOT EXISTS "CreatedByID" INT NULL;
ALTER TABLE "Task"    ADD COLUMN IF NOT EXISTS "UpdatedByID" INT NULL;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "CreatedByID" INT NULL;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "UpdatedByID" INT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_Task_CreatedBy') THEN
        ALTER TABLE "Task" ADD CONSTRAINT "FK_Task_CreatedBy"
            FOREIGN KEY ("CreatedByID") REFERENCES "SystemAccount" ("AccountID");
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_Task_UpdatedBy') THEN
        ALTER TABLE "Task" ADD CONSTRAINT "FK_Task_UpdatedBy"
            FOREIGN KEY ("UpdatedByID") REFERENCES "SystemAccount" ("AccountID") ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_Project_CreatedBy') THEN
        ALTER TABLE "Project" ADD CONSTRAINT "FK_Project_CreatedBy"
            FOREIGN KEY ("CreatedByID") REFERENCES "SystemAccount" ("AccountID") ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_Project_UpdatedBy') THEN
        ALTER TABLE "Project" ADD CONSTRAINT "FK_Project_UpdatedBy"
            FOREIGN KEY ("UpdatedByID") REFERENCES "SystemAccount" ("AccountID") ON DELETE SET NULL;
    END IF;
END $$;

-- ------------------------------------------------------------
-- TABLE: RefreshToken (bonus — refresh token rotation)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "RefreshToken" (
    "RefreshTokenID"  SERIAL          PRIMARY KEY,
    "AccountID"       INT             NOT NULL,
    "TokenHash"       VARCHAR(128)    NOT NULL,
    "ExpiresAt"       TIMESTAMP       NOT NULL,
    "CreatedAt"       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "RevokedAt"       TIMESTAMP       NULL,
    "ReplacedByHash"  VARCHAR(128)    NULL,
    CONSTRAINT "UQ_RefreshToken_TokenHash" UNIQUE ("TokenHash"),
    CONSTRAINT "FK_RefreshToken_Account" FOREIGN KEY ("AccountID")
        REFERENCES "SystemAccount" ("AccountID") ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- SEED: Admin account (Admin role can NOT be created through /api/auth/register)
-- The password is stored only as a BCrypt hash (work factor 11).
-- The plain-text credentials are listed in the submission document, not in this repo.
-- ------------------------------------------------------------
INSERT INTO "SystemAccount" ("FullName", "Email", "PasswordHash", "Role")
VALUES ('System Administrator', 'admin@tasktrack.dev',
        '$2a$11$2.ZF2hhTKS/1tmabeOLvy.FwW3HFG8TRCzl.rUUb8eoxga6IfRsyK', 1)
ON CONFLICT ("Email") DO NOTHING;

-- ============================================================
-- Verify
-- ============================================================
SELECT "AccountID", "FullName", "Email", "Role", "CreatedDate" FROM "SystemAccount" ORDER BY "AccountID";
