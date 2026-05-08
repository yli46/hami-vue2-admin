# hami-vue2-admin

哈密煤运廊道一体管控平台 · 汽运详设新页面（Vue2 + Element-UI + Vite）。

## 部署架构

- 主域名：`https://hami.vercel.app/`（老 React 仓库 hami-vue-admin 占用）
- 本仓库部署到子路径：`https://hami.vercel.app/freight/`
- 实现方式：老仓库 vercel.json rewrite 把 `/freight/*` 转发到本仓库 `hami-vue2-admin.vercel.app`

## 本地开发

```bash
npm install
npm run dev
# 浏览器自动打开 http://localhost:3001/freight/
```

## 构建

```bash
npm run build
# 产物输出到 dist/freight/，部署后访问 /freight/ 路径
```

## 模块路由

| 路由 | 模块 | 状态 |
|---|---|---|
| `/home` | 首页 | ✅ |
| `/budget/overview` | 132 概算管理 | ✅ 演示版 |
| `/budget/edit` | 133 预算编制 | 占位 |
| `/cost-accounting` | 134 核算处理 | 等业主回填财务信息 |
| `/decision-analysis` | 135 决算分析 | 等业主回填决算规则 |
| `/budget/coordination` | 136 预算目标协同 | 等业主回填预算分解 |
| `/stats/fleet` | 140 车辆运营统计 | 占位 |
| `/stats/ops` | 141 运营统计 | 占位 |
| `/stats/driver` | 142 司机绩效统计 | 占位 |

## 设计规范来源

`src/styles/prototype-standard.css` 复制自《哈密煤化工标准流程 v2 · prototype-standard.css》，与互联网事业部团队栈对齐。颜色体系：

- 主色 `#409EFF`
- 标题蓝 `#24558A`
- 选中浅蓝 `#E7F3FF`
- 背景灰 `#F0F2F5`

## 与老仓库的关系

- 老仓库 `hami-vue-admin`（React + antd）保留所有历史汇报页面（VendorIntegration / PartnerHuoda / Presentation 等）
- 5 个密码门保护页面（hami2026 / SHA-256）继续在老仓库
- 本仓库只承载 132-142 这批新做的页面
- 5/16 详设交付后再决定老页面是否批量迁移
