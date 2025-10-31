/*
  Warnings:

  - You are about to drop the `Offer` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."Offer";

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value_props" TEXT[],
    "ideal_use_cases" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "linkedin_bio" TEXT,
    "offerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scored_leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "reasoning" TEXT NOT NULL,
    "ruleScore" INTEGER NOT NULL,
    "aiPoints" INTEGER NOT NULL,
    "breakdown" JSONB NOT NULL,
    "leadId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scored_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_offerId_idx" ON "leads"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "scored_leads_leadId_key" ON "scored_leads"("leadId");

-- CreateIndex
CREATE INDEX "scored_leads_offerId_idx" ON "scored_leads"("offerId");

-- CreateIndex
CREATE INDEX "scored_leads_intent_idx" ON "scored_leads"("intent");

-- CreateIndex
CREATE INDEX "scored_leads_score_idx" ON "scored_leads"("score");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scored_leads" ADD CONSTRAINT "scored_leads_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scored_leads" ADD CONSTRAINT "scored_leads_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
