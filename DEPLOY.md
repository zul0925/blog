# 线上部署指南

本文档适用于当前 Nuxt 博客项目部署到阿里云 Ubuntu 24.04 服务器，并使用宝塔面板管理 Nginx、SSL 和反向代理，通过 GitHub Actions 在推送代码后自动部署。

## 部署架构

```text
用户访问域名
-> 宝塔 Nginx
-> 反向代理 http://127.0.0.1:3000
-> Node/PM2 或宝塔 Node 项目运行 .output/server/index.mjs
-> Nuxt API 连接 PostgreSQL
```

自动部署流程：

```text
本地 git push
-> GitHub Actions 触发
-> SSH 登录阿里云服务器
-> cd /www/wwwroot/blog
-> 拉取最新代码
-> 安装依赖
-> 执行数据库迁移
-> 上传 GitHub Actions 构建好的 .output
-> 重启服务
```

## 一、服务器准备

SSH 登录服务器：

```bash
ssh root@你的服务器IP
```

更新系统并安装基础工具：

```bash
apt update
apt upgrade -y
apt install -y git curl vim
```

## 二、宝塔面板安装环境

在宝塔软件商店安装：

```text
Nginx
Node.js 版本管理器
PostgreSQL
PM2 管理器（可选）
```

Node.js 建议使用 24.11.0 或兼容版本。Nuxt 4.4.6 要求 Node `^20.19.0 || ^22.12.0 || ^24.11.0 || >=26.0.0`，GitHub Actions 构建环境需要满足这个版本要求。

如果已经通过宝塔安装了 Node，不要再用 `apt install nodejs` 安装另一套 Node，避免环境混乱。

在宝塔终端或 SSH 中确认：

```bash
node -v
npm -v
```

如果 `node` 或 `npm` 找不到，说明宝塔 Node 没有进入当前 shell 的 `PATH`。可以在宝塔 Node 管理器中确认启用版本，或查找 Node 路径：

```bash
find /www/server -name node -type f
```

找到类似路径后，临时加入 `PATH`：

```bash
export PATH=/www/server/nodejs/你的版本/bin:$PATH
```

确认 `npm` 可用后安装 Yarn 和 PM2：

```bash
npm install -g yarn pm2
yarn -v
pm2 -v
```

不要执行 Ubuntu 提示的：

```bash
apt install cmdtest
```

它不是本项目需要的 Yarn。

## 三、创建 PostgreSQL 数据库

可以使用宝塔 PostgreSQL 面板创建数据库，也可以使用命令行。

示例信息：

```text
数据库名：blog
用户名：blog_user
密码：使用强密码
端口：5432
```

`.env` 中连接字符串类似：

```env
NUXT_DATABASE_URL="postgresql://blog_user:数据库密码@localhost:5432/blog"
```

如果使用阿里云 RDS PostgreSQL，将 `localhost` 替换为 RDS 地址。

### PostgreSQL 启动失败排查

如果宝塔 PostgreSQL 报错：

```text
FATAL: "/www/server/pgsql/data" is not a valid data directory
DETAIL: File "/www/server/pgsql/data/PG_VERSION" is missing.
```

说明 PostgreSQL 数据目录未初始化或损坏。新服务器且没有重要数据时，建议在宝塔里卸载 PostgreSQL 后重新安装。

不要继续执行 `yarn db:migrate`，需要先保证 PostgreSQL 服务能正常启动。

检查数据库连接：

```bash
cd /www/wwwroot/blog
set -a
source .env
set +a
psql "$NUXT_DATABASE_URL" -c "select current_database(), current_user;"
```

## 四、拉取项目代码

推荐项目目录：

```bash
cd /www/wwwroot
```

公开仓库：

```bash
git clone https://github.com/你的用户名/你的仓库.git blog
```

私有仓库推荐用 SSH：

```bash
git clone git@github.com:你的用户名/你的仓库.git blog
```

进入项目：

```bash
cd /www/wwwroot/blog
```

## 五、配置服务器 `.env`

在服务器项目目录创建 `.env`：

```bash
vim .env
```

示例：

```env
NUXT_DATABASE_URL="postgresql://blog_user:数据库密码@localhost:5432/blog"
NUXT_ADMIN_USERNAME="admin"
NUXT_ADMIN_PASSWORD="你的后台登录密码"
NUXT_ADMIN_SESSION_SECRET="你的随机密钥"
```

生成随机密钥：

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

注意：

```text
.env 只保存在服务器
不要提交到 Git
NUXT_ADMIN_SESSION_SECRET 必须配置
```

## 六、首次手动部署

第一次建议手动跑一遍，确认服务器环境正常。

```bash
cd /www/wwwroot/blog
yarn install --frozen-lockfile
yarn db:migrate
yarn build
```

如果构建卡在：

```text
Building Nuxt Nitro server
```

先查看内存：

```bash
free -h
top
```

低内存服务器建议添加 2G swap：

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

然后重新构建：

```bash
NODE_OPTIONS="--max-old-space-size=2048" yarn build
```

## 七、运行项目

### 方式 A：PM2 运行，推荐

```bash
NODE_ENV=production PORT=3000 pm2 start .output/server/index.mjs --name blog
pm2 save
pm2 startup
```

`pm2 startup` 会输出一行命令，复制执行一遍。

检查状态：

```bash
pm2 status
pm2 logs blog
```

重启：

```bash
NODE_ENV=production PORT=3000 pm2 restart blog --update-env
```

### 方式 B：宝塔 Node 项目管理器运行

宝塔中添加 Node 项目：

```text
项目目录：/www/wwwroot/blog
启动文件：.output/server/index.mjs
项目端口：3000
Node 版本：24.11.0 或兼容版本
运行环境：production
```

环境变量：

```env
NODE_ENV=production
PORT=3000
```

注意：宝塔 Node 项目管理器负责启动服务，但首次 `yarn install`、`yarn db:migrate`、`yarn build` 通常仍建议在终端执行。

## 八、宝塔配置网站和反向代理

宝塔面板：

```text
网站 -> 添加站点
```

域名填写你的域名，例如：

```text
example.com
```

根目录可选择：

```text
/www/wwwroot/blog
```

然后进入站点设置：

```text
反向代理 -> 添加反向代理
```

配置：

```text
代理名称：blog
目标 URL：http://127.0.0.1:3000
发送域名：$host
```

Nginx 核心配置等价于：

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 九、配置 HTTPS

宝塔面板：

```text
网站 -> 你的站点 -> SSL -> Let's Encrypt
```

申请证书并开启强制 HTTPS。

生产环境必须使用 HTTPS。当前后台登录 Cookie 在 `NODE_ENV=production` 下会设置 `Secure`，只有 HTTPS 请求才会携带该 Cookie。

## 十、配置 GitHub Actions 自动部署

### 1. 生成部署 SSH Key

在本地电脑生成专用 SSH key：

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f aliyun_deploy_key
```

生成：

```text
aliyun_deploy_key      私钥
aliyun_deploy_key.pub  公钥
```

把公钥加入服务器：

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
vim ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

把 `aliyun_deploy_key.pub` 的内容粘贴到 `authorized_keys`。

本地测试：

```bash
ssh -i aliyun_deploy_key root@你的服务器IP
```

### 2. GitHub 配置 Secrets

GitHub 仓库：

```text
Settings
-> Secrets and variables
-> Actions
-> New repository secret
```

添加：

```text
ALIYUN_HOST       服务器公网 IP
ALIYUN_PORT       22
ALIYUN_USER       root
ALIYUN_SSH_KEY    aliyun_deploy_key 私钥内容
```

`ALIYUN_SSH_KEY` 填私钥完整内容，不是 `.pub` 公钥。

### 3. 添加 GitHub Actions 文件

项目中创建：

```text
.github/workflows/deploy.yml
```

如果使用 PM2，内容如下。这个版本是在 GitHub Actions 机器上构建 Nuxt，服务器只负责拉代码、迁移数据库、接收 `.output` 和重启服务：

```yaml
name: Deploy

on:
  push:
    branches:
      - master

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 24.11.0
          cache: yarn

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Build Nuxt app
        run: yarn build

      - name: Prepare server
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.ALIYUN_HOST }}
          username: ${{ secrets.ALIYUN_USER }}
          key: ${{ secrets.ALIYUN_SSH_KEY }}
          port: ${{ secrets.ALIYUN_PORT }}
          script: |
            set -e

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

            if [ ! -f .env ]; then
              echo "Missing /www/wwwroot/blog/.env. Create it on the server before deploying."
              exit 1
            fi

            set -a
            source .env
            set +a

            yarn install --frozen-lockfile
            find node_modules -path '*/@esbuild/linux-x64/bin/esbuild' -type f -exec chmod +x {} \;
            yarn db:migrate
            rm -rf .output

      - name: Upload build output
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.ALIYUN_HOST }}
          username: ${{ secrets.ALIYUN_USER }}
          key: ${{ secrets.ALIYUN_SSH_KEY }}
          port: ${{ secrets.ALIYUN_PORT }}
          source: ".output"
          target: "/www/wwwroot/blog"
          overwrite: true

      - name: Restart server
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.ALIYUN_HOST }}
          username: ${{ secrets.ALIYUN_USER }}
          key: ${{ secrets.ALIYUN_SSH_KEY }}
          port: ${{ secrets.ALIYUN_PORT }}
          script: |
            set -e

            cd /www/wwwroot/blog

            if [ ! -f .env ]; then
              echo "Missing /www/wwwroot/blog/.env. Create it on the server before deploying."
              exit 1
            fi

            set -a
            source .env
            set +a

            NODE_ENV=production PORT=3000 pm2 restart blog --update-env
            pm2 save
```

提交：

```bash
git add .github/workflows/deploy.yml
git commit -m "add auto deploy workflow"
git push origin master
```

## 十一、以后如何发布

以后正常提交代码：

```bash
git add .
git commit -m "更新内容"
git push origin master
```

推送后 GitHub Actions 会自动：

```text
在 GitHub Actions 机器上构建 Nuxt
登录服务器
拉取最新代码并安装依赖
执行数据库迁移
上传 .output 到服务器
重启 PM2 服务
```

## 十二、常见问题

### yarn: command not found

不要执行：

```bash
apt install cmdtest
```

应先确认 `npm` 可用，然后执行：

```bash
npm install -g yarn
```

### yarn db:migrate 失败

通常是 PostgreSQL 未启动、数据库不存在、账号密码错误或 `.env` 中 `NUXT_DATABASE_URL` 错误。

先测试：

```bash
cd /www/wwwroot/blog
set -a
source .env
set +a
psql "$NUXT_DATABASE_URL" -c "select current_database(), current_user;"
```

### 页面打不开

先确认 Node 服务正常：

```bash
curl http://127.0.0.1:3000
pm2 status
pm2 logs blog
```

如果本机 curl 正常但域名打不开，检查：

```text
宝塔 Nginx 反向代理
域名 DNS
阿里云安全组 80/443
SSL 配置
```

一般不需要开放 3000 端口，因为 3000 只给本机 Nginx 反向代理使用。

## 部署检查清单

- 服务器已安装 Git
- Node.js 24.11.0 或兼容版本可用
- Yarn 可用
- PostgreSQL 已启动
- 数据库和用户已创建
- `/www/wwwroot/blog/.env` 已配置
- `NUXT_DATABASE_URL` 可连接
- `NUXT_ADMIN_SESSION_SECRET` 已配置
- `yarn db:migrate` 成功
- `yarn build` 成功
- PM2 或宝塔 Node 项目已启动
- 宝塔 Nginx 已反向代理到 `127.0.0.1:3000`
- HTTPS 已开启
- GitHub Actions Secrets 已配置
- `.github/workflows/deploy.yml` 已提交
