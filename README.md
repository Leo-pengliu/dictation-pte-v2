# PTE Dictation 听写练习系统

一个 **全栈听写练习 Web 应用**，帮助用户提升英语听力和拼写能力。  
支持 **上传句子 + 音频**、**自动播放**、**实时评分**、**句子解析**，录音/上传音频均可。

> **后端 + 前端 共存于一个仓库（Monorepo）**，便于管理与部署。

![Demo](https://via.placeholder.com/800x400.png?text=PTE+Dictation+Demo)  


---

## 技术栈

| 角色 | 技术 |
|------|------|
| **前端** | React, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons |
| **后端** | Node.js, Express, SQLite (Turso), Multer |
| **部署** | Vercel (前端), Render (后端) |
| **其他** | Git, npm, Monorepo |

---

## 目录结构

```bash
.
├── backend/              # Express API
│   ├── routes/           # 路由
│   ├── uploads/          # 上传的音频文件
│   ├── server.js         # 入口
│   └── package.json
├── frontend/             # React 前端
│   ├── src/
│   │   ├── components/   # 组件
│   │   ├── pages/        # 页面
│   │   └── lib/api.ts    # API 封装
│   └── package.json
├── .gitignore
└── README.md