-- CreateTable
CREATE TABLE "Users" (
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

-- CreateIndex
CREATE INDEX "customer_企微编号_客户编号_index" ON "Users"("企微编号", "客户编号");
