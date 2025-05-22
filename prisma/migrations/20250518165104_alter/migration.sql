/*
  Warnings:

  - The primary key for the `customer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `rowid` on the `customer` table. All the data in the column will be lost.
  - Made the column `企微编号` on table `customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `客户编号` on table `customer` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_customer" (
    "客户名称" TEXT,
    "所属企微号" TEXT,
    "所属企业" TEXT,
    "添加时间" TEXT,
    "标签" TEXT,
    "客户系统备注" TEXT,
    "客户备注名" TEXT,
    "描述信息" TEXT,
    "企微手机号" TEXT,
    "系统手机" TEXT,
    "客户编号" TEXT NOT NULL,
    "企微编号" TEXT NOT NULL,
    "覆盖次数" INTEGER DEFAULT 0,
    "开口状态" BOOLEAN DEFAULT false,

    PRIMARY KEY ("企微编号", "客户编号")
);
INSERT INTO "new_customer" ("企微手机号", "企微编号", "客户名称", "客户备注名", "客户系统备注", "客户编号", "开口状态", "所属企业", "所属企微号", "描述信息", "标签", "添加时间", "系统手机", "覆盖次数") SELECT "企微手机号", "企微编号", "客户名称", "客户备注名", "客户系统备注", "客户编号", "开口状态", "所属企业", "所属企微号", "描述信息", "标签", "添加时间", "系统手机", "覆盖次数" FROM "customer";
DROP TABLE "customer";
ALTER TABLE "new_customer" RENAME TO "customer";
CREATE INDEX "customer_企微编号_客户编号_index" ON "customer"("企微编号", "客户编号");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
