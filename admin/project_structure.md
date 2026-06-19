# Admin 后台管理前端项目结构 (Vue3 + ElementPlus)

## 技术栈
- Vue 3.5 + TypeScript + Vite
- Element Plus 2.9 (UI组件库)
- Tailwind CSS + SCSS (样式)
- Pinia (状态管理)
- Vue Router (路由)
- Axios (HTTP请求)
- ECharts (图表)

## 目录结构
```
admin/src/
├── api/                             # API接口定义
│   ├── app.ts                       # 应用配置API
│   ├── article.ts                   # 文章API
│   ├── consumer.ts                  # 消费者API
│   ├── decoration.ts                # 装修API
│   ├── file.ts                      # 文件API
│   ├── finance.ts                   # 财务API
│   ├── import.ts                    # 数据导入API
│   ├── message.ts                   # 消息API
│   ├── user.ts                      # 用户API
│   ├── org/                         # 组织架构
│   │   ├── department.ts            # 部门API
│   │   └── post.ts                  # 岗位API
│   ├── perms/                       # 权限管理
│   │   ├── admin.ts                 # 管理员API
│   │   ├── role.ts                  # 角色API
│   │   └── menu.ts                  # 菜单API
│   ├── channel/                     # 渠道管理
│   │   ├── weapp.ts                 # 小程序API
│   │   ├── h5.ts                    # H5设置API
│   │   ├── wx_oa.ts                 # 公众号API
│   │   └── open_setting.ts          # 开放设置API
│   ├── setting/                     # 系统设置
│   │   ├── hecom.ts                 # 红圈连接器API
│   │   ├── hecom-sync.ts            # 红圈同步API
│   │   ├── hecom-policy.ts          # 红圈政策数据API
│   │   ├── hecom-policy-detail.ts   # 红圈政策明细API
│   │   ├── hecom-subcontractor.ts   # 红圈分供方API
│   │   ├── hecom-agreement.ts       # 红圈协议API
│   │   ├── option.ts                # 选项配置API
│   │   ├── system.ts                # 系统设置API
│   │   ├── storage.ts               # 存储设置API
│   │   ├── pay.ts                   # 支付设置API
│   │   ├── dict.ts                  # 字典API
│   │   ├── search.ts                # 搜索设置API
│   │   ├── website.ts               # 网站设置API
│   │   └── user.ts                  # 用户设置API
│   ├── app/recharge.ts              # 充值API
│   └── tools/code.ts                # 代码生成器API
│
├── views/                           # 页面组件
│   ├── account/                     # 账户
│   │   └── login.vue                # 登录页
│   ├── import/                      # 数据导入
│   │   ├── index.vue                # 导入主页面(5步向导)
│   │   └── history.vue              # 导入历史记录
│   ├── setting/                     # 系统设置
│   │   ├── hecom/                   # 红圈CRM设置
│   │   │   ├── index.vue            # 连接器管理列表
│   │   │   ├── edit.vue             # 连接器编辑
│   │   │   ├── sync.vue             # 数据同步
│   │   │   ├── policy/              # 政策数据
│   │   │   ├── policy_detail/       # 政策明细
│   │   │   └── agreement/           # 协议管理
│   │   ├── option/                  # 选项配置
│   │   │   ├── index.vue, type-edit.vue, value-edit.vue
│   │   ├── system/                  # 系统管理
│   │   │   ├── environment.vue      # 环境变量
│   │   │   ├── cache.vue            # 缓存管理
│   │   │   ├── journal.vue          # 系统日志
│   │   │   └── scheduled_task/      # 定时任务
│   │   ├── pay/                     # 支付设置
│   │   ├── dict/                    # 字典管理
│   │   ├── search/                  # 搜索设置
│   │   ├── storage/                 # 存储设置
│   │   ├── user/                    # 用户设置
│   │   └── website/                 # 网站设置
│   ├── permission/                  # 权限管理
│   │   ├── admin/                   # 管理员管理
│   │   ├── role/                    # 角色管理
│   │   └── menu/                    # 菜单管理
│   ├── organization/                # 组织架构
│   │   ├── department/              # 部门管理
│   │   └── post/                    # 岗位管理
│   ├── article/                     # 文章管理
│   │   ├── lists/                   # 文章列表
│   │   └── column/                  # 文章栏目
│   ├── finance/                     # 财务管理
│   ├── message/                     # 消息管理
│   │   ├── notice/                  # 通知管理
│   │   └── short_letter/            # 短信管理
│   ├── app/recharge/                # 充值管理
│   ├── dev_tools/                   # 开发工具(代码生成器)
│   ├── material/                    # 素材管理
│   ├── user/                        # 用户设置
│   ├── template/                    # 模板(组件示例)
│   └── error/                       # 错误页面(403, 404)
│
├── components/                      # 公共组件
│   ├── upload/index.vue             # 文件上传 (基于el-upload)
│   ├── material/                    # 素材选择器 (index, picker, preview, file, hook)
│   ├── pagination/index.vue         # 分页组件
│   ├── popup/index.vue              # 弹窗组件
│   ├── editor/index.vue             # 富文本编辑器
│   ├── export-data/index.vue        # 数据导出组件
│   ├── icon/                        # 图标组件 (index, picker, svg-icon)
│   ├── link/                        # 链接选择器 (index, picker, shop-pages, custom-link, article-list, mini-program)
│   ├── daterange-picker/            # 日期范围选择器
│   ├── color-picker/                # 颜色选择器
│   ├── dict-value/                  # 字典值展示组件
│   ├── del-wrap/                    # 删除包装组件
│   ├── footer-btns/                 # 底部按钮
│   ├── overflow-tooltip/            # 溢出提示
│   ├── popover-input/               # 弹窗输入
│   ├── image-contain/               # 图片容器
│   └── app-link/                    # 应用链接
│
├── layout/                          # 布局组件
│   └── default/                     # 默认布局
│       ├── index.vue                # 布局主入口
│       └── components/
│           ├── header/              # 头部 (breadcrumb, fold, refresh, full-screen, multiple-tabs, user-drop-down)
│           ├── sidebar/             # 侧边栏 (logo, menu, menu-item, side)
│           ├── setting/             # 设置抽屉 (drawer)
│           └── main.vue             # 主内容区
│
├── router/                          # 路由配置
│   ├── index.ts                     # 路由核心 (动态路由加载, filterAsyncRoutes)
│   ├── routes.ts                    # 静态路由定义 (登录页, 404等)
│   └── guard/                       # 路由守卫 (index, init)
│
├── stores/                          # Pinia状态管理
│   ├── index.ts
│   └── modules/
│       ├── user.ts                  # 用户状态 (token, userInfo)
│       ├── app.ts                   # 应用状态 (config, 菜单)
│       ├── setting.ts               # 设置状态 (主题等)
│       └── multipleTabs.ts          # 多标签状态
│
├── hooks/                           # 组合式函数
│   ├── usePaging.ts                 # 分页Hook
│   ├── useDictOptions.ts            # 字典选项Hook
│   ├── useLockFn.ts                 # 防重复提交
│   ├── useWatchRoute.ts             # 路由监听
│   └── useMultipleTabs.ts           # 多标签
│
├── utils/                           # 工具函数
│   ├── request/                     # Axios请求封装
│   │   ├── index.ts                 # 请求实例
│   │   ├── axios.ts                 # Axios封装 (拦截器, token, 错误处理)
│   │   ├── cancel.ts                # 请求取消
│   │   └── type.d.ts                # 类型定义
│   ├── auth.ts                      # 认证工具 (getToken, setToken)
│   ├── cache.ts                     # 缓存工具
│   ├── feedback.ts                  # 反馈工具 (消息提示)
│   ├── perm.ts                      # 权限工具
│   ├── validate.ts                  # 验证工具
│   ├── util.ts                      # 通用工具
│   ├── theme.ts                     # 主题工具
│   ├── env.ts                       # 环境工具
│   └── getExposeType.ts             # 类型暴露
│
├── config/                          # 配置
│   ├── index.ts                     # 基础配置 (baseUrl, urlPrefix: 'adminapi')
│   └── setting.ts                   # 设置配置
│
├── enums/                           # 枚举定义
│   ├── requestEnums.ts              # 请求枚举
│   ├── cacheEnums.ts                # 缓存枚举
│   ├── pageEnum.ts                  # 页面枚举
│   └── appEnums.ts                  # 应用枚举
│
├── install/                         # 插件安装
│   ├── index.ts
│   ├── plugins/                     # router, pinia, element, hljs, echart
│   └── directives/                  # perms, copy
│
├── styles/                          # 样式文件
├── assets/                          # 静态资源 (images, icons)
├── permission.ts                    # 权限控制
├── main.ts                          # 入口文件
└── App.vue                          # 根组件
```

## 路由机制
1. 静态路由在 `routes.ts` 中定义 (登录页、404等)
2. 业务路由通过后端菜单接口动态获取，在 `router/index.ts` 中通过 `filterAsyncRoutes` 动态注册
3. 组件通过 `import.meta.glob('/src/views/**/*.vue')` 自动扫描匹配
4. 菜单类型: CATALOGUE(目录)使用Layout, MENU(菜单)动态加载组件

## API调用方式
- 基于Axios封装，自动添加token、处理响应码
- URL格式: `/模块.控制器.方法` (如 `/setting.hecom.hecom_connector/lists`)
- 自动拼接 urlPrefix: `adminapi`，最终请求路径为 `/adminapi/setting.hecom.hecom_connector/lists`
- 响应码: 1=成功, 0=失败, -1=登录失效

## 组件开发规范
- 使用 Composition API: `<script setup lang="ts">`
- 组件命名: PascalCase
- 文件命名: kebab-case
- API调用定义在 `src/api/` 目录，在组件中import使用

## 全局组件
- `<material-picker>`: 素材选择器
- `<editor>`: 富文本编辑器
- `<dict-value>`: 字典值展示
- `<daterange-picker>`: 日期范围选择
- `<upload>`: 文件上传
- `<pagination>`: 分页
- `<popup>`: 弹窗
