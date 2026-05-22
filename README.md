# Blog

基于 Nuxt 4、Nuxt UI、Drizzle ORM 和 PostgreSQL 的个人博客与后台管理系统。

## 技术栈

- Nuxt 4
- Vue 3
- Nuxt UI
- Drizzle ORM
- PostgreSQL
- Yarn 1.x

## 环境要求

- Node.js 20 或更高版本
- Yarn 1.x
- PostgreSQL

## 环境变量

先复制环境变量模板：

```bash
cp .env.example .env
```

然后修改 `.env`：

```env
NUXT_DATABASE_URL="postgresql://user:password@host:5432/blog"
NUXT_ADMIN_USERNAME="admin"
NUXT_ADMIN_PASSWORD="change-me"
NUXT_ADMIN_SESSION_SECRET="replace-with-at-least-32-random-characters"
```

变量说明：

- `NUXT_DATABASE_URL`：PostgreSQL 连接地址。
- `NUXT_ADMIN_USERNAME`：后台管理员账号。
- `NUXT_ADMIN_PASSWORD`：后台管理员密码。
- `NUXT_ADMIN_SESSION_SECRET`：后台登录会话签名密钥，生产环境必须配置。

生成 `NUXT_ADMIN_SESSION_SECRET`：

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

不要把 `.env` 提交到代码仓库。

## 本地开发

安装依赖：

```bash
yarn install
```

执行数据库迁移：

```bash
yarn db:migrate
```

启动开发服务：

```bash
yarn dev
```

默认访问地址：

- 前台：http://localhost:3000
- 后台：http://localhost:3000/admin
- 登录页：http://localhost:3000/admin/login

## 数据库

生成迁移文件：

```bash
yarn db:generate
```

执行迁移：

```bash
yarn db:migrate
```

打开 Drizzle Studio：

```bash
yarn db:studio
```

迁移命令会读取 `NUXT_DATABASE_URL`。如果没有配置该变量，迁移会失败。

## 登录鉴权

后台使用服务端签名的 `HttpOnly Cookie` 会话，不使用 `localStorage` 存 token。

登录流程：

1. 用户在 `/admin/login` 提交账号密码。
2. 服务端使用 `NUXT_ADMIN_USERNAME` 和 `NUXT_ADMIN_PASSWORD` 校验。
3. 校验成功后，服务端生成包含 `username`、签发时间、过期时间和随机 nonce 的会话 payload。
4. 服务端使用 `NUXT_ADMIN_SESSION_SECRET` 对 payload 做 HMAC-SHA256 签名。
5. 服务端通过 `Set-Cookie` 写入 `admin_session`。
6. 后续后台请求由浏览器自动携带 `admin_session` Cookie。
7. 服务端每次校验 Cookie 签名和过期时间，校验失败返回 `401 Unauthorized`。

生产环境必须配置 `NUXT_ADMIN_SESSION_SECRET`。缺少该变量时，登录和后台接口鉴权会失败。

## 生产构建

安装依赖：

```bash
yarn install --frozen-lockfile
```

执行数据库迁移：

```bash
yarn db:migrate
```

构建应用：

```bash
yarn build
```

构建产物位于：

```text
.output/
```

启动生产服务：

```bash
node .output/server/index.mjs
```

可通过环境变量指定监听端口：

```bash
PORT=3000 node .output/server/index.mjs
```

Windows PowerShell：

```powershell
$env:PORT=3000
node .output/server/index.mjs
```

## 线上部署步骤

推荐流程：

1. 在服务器安装 Node.js、Yarn 和 PostgreSQL。
2. 创建生产数据库。
3. 配置 `.env` 或平台环境变量。
4. 执行 `yarn install --frozen-lockfile`。
5. 执行 `yarn db:migrate`。
6. 执行 `yarn build`。
7. 使用进程管理器启动 `node .output/server/index.mjs`。
8. 使用 Nginx 或平台网关反向代理到 Node 服务端口。
9. 使用 HTTPS 访问站点。

## PM2 示例

安装 PM2：

```bash
npm install -g pm2
```

启动：

```bash
pm2 start .output/server/index.mjs --name blog
```

保存进程列表：

```bash
pm2 save
```

查看日志：

```bash
pm2 logs blog
```

重启：

```bash
pm2 restart blog
```

## Nginx 反向代理示例

```nginx
server {
  listen 80;
  server_name example.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

生产环境建议配置 HTTPS。生产模式下后台会话 Cookie 会设置 `Secure`，需要 HTTPS 才能正常发送。

## 常用命令

```bash
yarn dev          # 启动开发环境
yarn build        # 生产构建
yarn preview      # 本地预览生产构建
yarn db:generate  # 生成数据库迁移
yarn db:migrate   # 执行数据库迁移
yarn db:studio    # 打开 Drizzle Studio
```

## 部署检查清单

- 已配置 `NUXT_DATABASE_URL`
- 已配置强密码 `NUXT_ADMIN_PASSWORD`
- 已配置随机 `NUXT_ADMIN_SESSION_SECRET`
- 已执行 `yarn db:migrate`
- 已执行 `yarn build`
- Node 服务已通过进程管理器守护
- 反向代理已正确转发到 Node 服务端口
- 生产环境已启用 HTTPS
- `.env` 未提交到代码仓库
