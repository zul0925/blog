# 博客项目上线部署全流程复盘

本文档记录本次 Nuxt 博客项目从登录鉴权改造到阿里云宝塔服务器自动化部署的完整过程，包括需求分析、方案选型、开发调整、部署流程、自动化发布，以及中途遇到的问题和解决方案。

## 一、背景与目标

当前项目是一个 Nuxt 4 博客系统，包含：

- 前台博客展示
- 后台文章管理
- PostgreSQL 数据库存储
- Drizzle ORM 数据库迁移
- 管理员登录鉴权

本次主要目标：

1. 提升后台登录鉴权安全性。
2. 支持生产环境部署到阿里云 Ubuntu 24.04 服务器。
3. 使用宝塔面板管理 Nginx、SSL、反向代理。
4. 实现 `git push` 后自动部署。
5. 避免低配服务器在构建阶段卡死，把构建转移到 GitHub Actions。
6. 将部署过程和排障经验沉淀为文档。

## 二、需求分析

### 1. 登录鉴权需求

原始登录逻辑较简单：

- 登录成功后写入固定 Cookie：`admin_session=local-admin`
- 后端只检查 Cookie 是否存在
- 没有签名、过期校验和防篡改机制

风险：

- Cookie 值固定，容易伪造。
- 服务端没有校验 Cookie 内容真实性。
- 不适合作为线上后台登录方案。

目标：

- 不把 token 存在 `localStorage`。
- 使用 `HttpOnly Cookie` 降低 XSS 窃取风险。
- Cookie 必须带服务端签名，防止伪造和篡改。
- 必须有过期时间。
- 生产环境必须显式配置密钥。

### 2. 部署需求

服务器环境：

- 阿里云 ECS
- Ubuntu 24.04
- 宝塔面板
- Nginx
- PostgreSQL
- Node.js

部署目标：

- 域名可访问前台和后台。
- 后台登录 Cookie 在 HTTPS 下正常工作。
- 数据库迁移可自动执行。
- 推送代码后自动发布。
- 服务器不承担 Nuxt 构建压力。

## 三、方案选型

### 1. 登录鉴权方案选型

对比过的方案：

| 方案 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- |
| 固定 Cookie | 简单 | 可伪造，不安全 | 放弃 |
| JWT + localStorage | 常见，前后端分离方便 | XSS 风险较高 | 不适合当前后台 |
| JWT + HttpOnly Cookie | 标准化，适合多端 | 对当前单管理员后台偏复杂 | 暂不采用 |
| 签名 HttpOnly Cookie Session | 简单、安全边界清晰、适合当前项目 | 无状态会话不支持单独撤销 | 采用 |

最终采用：

```text
服务端签名 HttpOnly Cookie 会话
```

核心机制：

1. 登录成功后生成 session payload。
2. payload 中包含 `username`、`iat`、`exp`、`nonce`。
3. 使用 `NUXT_ADMIN_SESSION_SECRET` 做 HMAC-SHA256 签名。
4. 写入 `admin_session=payload.signature`。
5. 后端每次请求重新验签和检查过期时间。

### 2. 部署方案选型

对比过的方案：

| 方案 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- |
| 服务器手动构建部署 | 简单直接 | 低配服务器容易卡住 | 仅用于首次验证 |
| GitHub Actions SSH 到服务器构建 | 自动化程度高 | 服务器构建压力仍然大 | 放弃 |
| GitHub Actions 构建后上传 `.output` | 服务器压力小，发布稳定 | workflow 稍复杂 | 采用 |

最终部署架构：

```text
GitHub Actions 构建 Nuxt
-> 上传 .output 到服务器
-> 服务器拉最新代码
-> 服务器执行数据库迁移
-> PM2 重启 Nuxt 服务
-> 宝塔 Nginx 反向代理到 127.0.0.1:3000
```

## 四、开发改造记录

### 1. 登录鉴权改造

新增和调整的核心文件：

- `server/utils/auth.ts`
- `server/api/auth/login.post.ts`
- `server/api/auth/logout.post.ts`
- `server/api/auth/me.get.ts`
- `nuxt.config.ts`
- `.env.example`

改造后的关键逻辑：

```text
POST /api/auth/login
-> 校验账号密码
-> 生成 session payload
-> 使用 HMAC-SHA256 签名
-> Set-Cookie: admin_session=payload.signature
```

后端保护接口：

```text
requireAdminSession(event)
-> 读取 admin_session
-> 拆分 payload/signature
-> 重新计算签名
-> 校验签名、版本、用户、随机 nonce、过期时间
-> 通过后继续业务逻辑
```

Cookie 设置：

```ts
httpOnly: true
sameSite: 'lax'
secure: process.env.NODE_ENV === 'production'
maxAge: 60 * 60 * 8
path: '/'
```

生产环境要求：

```env
NUXT_ADMIN_SESSION_SECRET="至少32位随机字符串"
```

后来去掉了开发兜底密钥，确保本地也模拟真实生产环境：

```text
缺少 NUXT_ADMIN_SESSION_SECRET 时直接失败
```

### 2. 文档补充

更新和新增的文档：

- `README.md`：项目部署说明、环境变量、构建、数据库迁移、PM2、Nginx、检查清单。
- `DEPLOY.md`：详细部署手册，覆盖宝塔、PostgreSQL、GitHub Actions、常见问题。
- `DEPLOYMENT_REVIEW.md`：本复盘文档。

## 五、服务器部署流程

### 1. 服务器基础环境

服务器系统：

```text
Ubuntu 24.04
```

宝塔面板负责：

- Nginx
- SSL
- 反向代理
- PostgreSQL 管理
- 可选 Node 项目管理

项目目录：

```text
/www/wwwroot/blog
```

### 2. 环境变量

服务器项目目录下需要 `.env`：

```env
NUXT_DATABASE_URL="postgresql://数据库用户:数据库密码@localhost:5432/blog"
NUXT_ADMIN_USERNAME="admin"
NUXT_ADMIN_PASSWORD="后台登录密码"
NUXT_ADMIN_SESSION_SECRET="随机会话签名密钥"
```

注意：

- `.env` 不提交 Git。
- `.env` 必须保留在服务器。
- GitHub Actions 部署时会 `source .env`。

### 3. PostgreSQL

项目使用 PostgreSQL。

部署前需要：

1. PostgreSQL 服务正常启动。
2. 创建数据库。
3. 创建数据库用户。
4. `.env` 中的 `NUXT_DATABASE_URL` 可连接。
5. 执行 `yarn db:migrate`。

测试连接：

```bash
set -a
source .env
set +a
psql "$NUXT_DATABASE_URL" -c "select current_database(), current_user;"
```

### 4. PM2 运行 Nuxt

生产服务运行命令：

```bash
NODE_ENV=production PORT=3000 pm2 start .output/server/index.mjs --name blog
pm2 save
```

重启命令：

```bash
NODE_ENV=production PORT=3000 pm2 restart blog --update-env
pm2 save
```

### 5. 宝塔 Nginx 反向代理

宝塔添加网站站点：

```text
网站 -> 添加站点
```

站点作用：

```text
域名入口 / Nginx 配置
```

不是 Node 项目，也不是数据库。

反向代理配置：

```text
目标 URL：http://127.0.0.1:3000
发送域名：$host
```

访问链路：

```text
https://你的域名
-> 宝塔 Nginx
-> http://127.0.0.1:3000
-> Nuxt 服务
```

### 6. HTTPS

宝塔中申请 Let's Encrypt 证书，并开启 HTTPS。

原因：

```text
NODE_ENV=production 时 admin_session Cookie 会设置 Secure
Secure Cookie 只会在 HTTPS 请求中携带
```

## 六、GitHub Actions 自动部署

最终采用的自动部署流程：

```text
push master
-> GitHub Actions checkout
-> setup Node 24.11.0
-> yarn install --frozen-lockfile
-> yarn build
-> SSH 到服务器
-> 修复 Git safe.directory
-> 拉取最新代码
-> source .env
-> yarn install --frozen-lockfile
-> 修复 esbuild 执行权限
-> yarn db:migrate
-> 删除服务器旧 .output
-> 上传 GitHub 构建好的 .output
-> pm2 restart blog
```

workflow 文件：

```text
.github/workflows/deploy.yml
```

关键点：

- Actions 使用 Node `24.11.0`。
- Nuxt 构建在 GitHub Actions 机器上执行。
- 服务器不再执行 `yarn build`。
- 服务器只负责安装依赖、迁移数据库、接收 `.output`、重启服务。
- 部署分支是 `master`。

## 七、中途问题与解决方案

### 1. GitHub Actions 没有触发

现象：

```text
push 后 Actions 没有开始执行
```

原因：

```text
workflow 监听 main 分支，但当前仓库分支是 master
```

解决：

```yaml
on:
  push:
    branches:
      - master
```

服务器拉取代码也改为：

```bash
git fetch origin master
git reset --hard origin/master
```

### 2. Git dubious ownership

现象：

```text
fatal: detected dubious ownership in repository at '/www/wwwroot/blog'
```

原因：

```text
Git 发现当前执行用户和仓库目录所有者不一致，拒绝操作
```

解决：

```bash
git config --global --add safe.directory /www/wwwroot/blog
```

并且需要在进入仓库和执行 Git 操作前配置。

### 3. yarn 命令不存在

现象：

```text
Command 'yarn' not found, but can be installed with:
apt install cmdtest
```

原因：

```text
服务器没有安装 Yarn。Ubuntu 提示的 cmdtest 不是 Yarn。
```

解决：

```bash
npm install -g yarn
```

不要执行：

```bash
apt install cmdtest
```

### 4. 宝塔 Node 和系统 Node 混淆

问题：

```text
如果宝塔已经安装 Node，再用 apt 安装 Node，可能出现两套 Node 环境。
```

处理原则：

- 如果宝塔 Node 可用，优先使用宝塔 Node。
- 如果命令行找不到 `node/npm`，检查宝塔 Node 是否加入 `PATH`。
- 不要重复安装多套 Node，避免部署脚本和运行环境不一致。

### 5. PostgreSQL 启动失败

现象：

```text
FATAL: "/www/server/pgsql/data" is not a valid data directory
DETAIL: File "/www/server/pgsql/data/PG_VERSION" is missing.
```

原因：

```text
宝塔 PostgreSQL 数据目录未初始化或损坏。
```

解决：

新服务器没有重要数据时，优先在宝塔卸载 PostgreSQL 后重新安装。

修复前不要继续执行：

```bash
yarn db:migrate
```

### 6. 服务器构建卡在 Nitro

现象：

```text
Building Nuxt Nitro server (preset: node-server)
```

长时间无响应。

原因：

```text
服务器 CPU/内存较低，Nuxt 服务端构建压力较大。
```

曾尝试：

- 添加 swap
- 设置 `NODE_OPTIONS="--max-old-space-size=2048"`
- 清理 `.nuxt/.output/node_modules/.cache`

最终方案：

```text
不在服务器构建，改为 GitHub Actions 构建后上传 .output
```

### 7. esbuild EACCES

现象：

```text
spawn node_modules/.../@esbuild/linux-x64/bin/esbuild EACCES
```

出现位置：

- `drizzle-kit migrate`
- `nitropack` 构建

原因：

```text
服务器 node_modules 中 esbuild 二进制文件没有执行权限。
```

解决：

```bash
find node_modules -path '*/@esbuild/linux-x64/bin/esbuild' -type f -exec chmod +x {} \;
```

### 8. GitHub Actions Node 版本不兼容

现象：

```text
nuxt@4.4.6: The engine "node" is incompatible
Expected ^20.19.0 || ^22.12.0 || ^24.11.0 || >=26.0.0
```

解决：

workflow 使用：

```yaml
node-version: 24.11.0
```

### 9. scp-action 误删目标目录风险

现象：

```text
Remove target folder: /www/wwwroot/blog
```

原因：

```yaml
target: "/www/wwwroot/blog"
rm: true
```

会尝试删除整个项目目录。

解决：

改为只在 SSH 阶段删除 `.output`：

```bash
rm -rf .output
```

上传阶段：

```yaml
source: ".output"
target: "/www/wwwroot/blog"
overwrite: true
```

### 10. 服务器 `.git` 丢失

现象：

```text
fatal: not a git repository
```

原因：

```text
前面 scp-action 删除目标目录的配置可能破坏了服务器项目目录。
```

解决：

部署脚本加入自修复：

```bash
mkdir -p /www/wwwroot/blog
git config --global --add safe.directory /www/wwwroot/blog

cd /www/wwwroot/blog

if [ ! -d .git ]; then
  git init
  git remote add origin https://github.com/zul0925/blog.git
else
  git remote set-url origin https://github.com/zul0925/blog.git
fi

git fetch origin master
git reset --hard origin/master
```

### 11. 服务器 `.env` 丢失

现象：

```text
bash: line 19: .env: No such file or directory
```

原因：

```text
服务器项目目录被破坏后，私有配置 .env 不存在。
```

解决：

在服务器重新创建：

```bash
cd /www/wwwroot/blog
vim .env
```

并在 workflow 中加入检查：

```bash
if [ ! -f .env ]; then
  echo "Missing /www/wwwroot/blog/.env. Create it on the server before deploying."
  exit 1
fi
```

### 12. 后台登录账号或密码错误

现象：

```text
线上后台提示账号或密码错误
```

原因：

```text
生产运行进程没有读取服务器 .env，实际使用了 nuxt.config.ts 中的默认配置。
```

解决：

启动或重启 PM2 前加载 `.env`：

```bash
set -a
source .env
set +a

NODE_ENV=production PORT=3000 pm2 restart blog --update-env
```

## 八、最终发布流程

以后正常开发发布：

```bash
git add .
git commit -m "更新内容"
git push origin master
```

GitHub Actions 自动完成：

```text
构建
部署
数据库迁移
上传产物
重启服务
```

服务器只负责：

```text
运行 Node 服务
连接 PostgreSQL
执行数据库迁移
接收 .output
PM2 重启
```

## 九、当前最终部署状态

当前部署链路已经跑通：

- 域名可访问项目。
- HTTPS 已配置。
- 后台登录使用签名 `HttpOnly Cookie`。
- GitHub Actions 可自动部署。
- 构建已从服务器迁移到 GitHub Actions。
- 服务器低配导致的 Nitro 构建卡顿问题已规避。
- 部署文档已沉淀。

## 十、后续优化建议

后续可以继续优化：

1. 将数据库迁移放到独立 step，失败时不上传新产物。
2. 增加部署前备份 `.env` 和 `.output`。
3. 使用 GitHub Environments 做生产环境审批。
4. 给后台登录增加失败次数限制。
5. 给后台写接口增加 CSRF 防护。
6. 使用 PostgreSQL 远程托管服务，降低服务器维护成本。
7. 增加健康检查接口，例如 `/api/health`。
8. PM2 配置 ecosystem 文件，统一管理环境变量和启动命令。
