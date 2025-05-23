删除进程
pm2 delete <name>
查看进程列表
pm2 list
查看日志
pm2 logs <name>
保存当前进程列表（用于开机自启）：
pm2 save
停止指定名称的进程
pm2 stop <name>
pm2 stop all
启动进程
pm2 start "bun run --bun start:prod" --name bilinl-nest