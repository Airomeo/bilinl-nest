/*
  Warnings:

  - Added the required column `rowid` to the `customer` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_customer" (
    "rowid" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "客户编号" TEXT,
    "企微编号" TEXT
);
INSERT INTO "new_customer" ("企微手机号", "企微编号", "客户名称", "客户备注名", "客户系统备注", "客户编号", "所属企业", "所属企微号", "描述信息", "标签", "添加时间", "系统手机") SELECT "企微手机号", "企微编号", "客户名称", "客户备注名", "客户系统备注", "客户编号", "所属企业", "所属企微号", "描述信息", "标签", "添加时间", "系统手机" FROM "customer";
DROP TABLE "customer";
ALTER TABLE "new_customer" RENAME TO "customer";
CREATE INDEX "customer_企微编号_客户编号_index" ON "customer"("企微编号", "客户编号");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
