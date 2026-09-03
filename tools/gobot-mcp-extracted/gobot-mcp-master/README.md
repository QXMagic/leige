# Godot MCP — AI 控制 Godot 编辑器

让 Cursor / Claude 直接操控 Godot 4 编辑器和运行中的游戏：建场景、写脚本、连信号、配粒子、调物理、测游戏……

> **151 个 MCP 工具**，覆盖编辑器操作（port 9500）和游戏运行时（port 9501）。

---

## 架构

```
Cursor / Claude
      │  MCP stdio
      ▼
Python MCP Server  (server.py)
      │                    │
      │ TCP JSON           │ TCP JSON
      │ port 9500          │ port 9501
      ▼                    ▼
Godot Editor Plugin    MCPRuntime Autoload
(plugin.gd)            (mcp_runtime.gd)
      │                    │
      ▼                    ▼
EditorInterface API    Running Game Scene
```

- **port 9500**：编辑器常驻，只要 Godot 开着就可以连
- **port 9501**：游戏运行时才可用，按 F5 启动游戏后连接

---

## 环境要求

- Godot **4.2+**（依赖静态 EditorInterface API）
- Python **3.10+**
- pip

---

## 安装步骤

### 第一步：安装 Godot 插件

将 `godot_plugin/addons/godot_mcp/` 整个文件夹复制到你的 Godot 项目根目录：

```
your_godot_project/
└── addons/
    └── godot_mcp/
        ├── plugin.cfg
        ├── plugin.gd
        └── mcp_runtime.gd
```

然后在 Godot 中启用插件：
> 项目 → 项目设置 → 插件 → Godot MCP → 勾选「启用」

启用后左侧 Dock 出现 `🤖 Godot MCP` 状态面板，显示 `⏳ Waiting on port 9500…`

### 第二步：安装 Python 依赖

```bash
cd godot-mcp
pip install -r requirements.txt
```

### 第三步：配置 Cursor

在项目根目录创建或编辑 `.cursor/mcp.json`：

```json
{
  "mcpServers": {
    "godot-mcp": {
      "command": "python",
      "args": ["D:/path/to/godot-mcp/mcp_server/server.py"]
    }
  }
}
```

> 路径改成你本机的实际路径，Windows 用正斜杠或双反斜杠均可。

重启 Cursor，打开 Godot 项目，状态面板变为 `✅ Connected` 即可。

---

## 工具一览（151 个）

### 连接 & 元信息
| 工具 | 说明 |
|------|------|
| `ping` | 测试编辑器连接，返回版本和工具总数 |
| `ping_runtime` | 测试游戏运行时连接 |

### 项目管理
| 工具 | 说明 |
|------|------|
| `get_project_info` | 项目名、版本、主场景、Godot 版本 |
| `get_filesystem_tree` | 文件树，可指定路径和深度 |
| `search_files` | 按名称或扩展名搜索文件 |
| `get_project_setting` | 读取 ProjectSettings 键值 |
| `set_project_setting` | 修改 ProjectSettings 键值 |
| `project_path_to_uid` | `res://` 路径 → Godot UID |
| `uid_to_project_path` | Godot UID → `res://` 路径 |

### 场景管理
| 工具 | 说明 |
|------|------|
| `get_scene_tree` | 当前场景完整节点树 |
| `get_open_scenes` | 所有已打开的场景 |
| `open_scene` | 打开指定场景 |
| `save_scene` | 保存当前场景 |
| `create_scene` | 新建场景文件 |
| `play_scene` | 运行场景（当前或指定） |
| `stop_scene` | 停止游戏 |
| `add_scene_instance` | 实例化子场景到当前场景 |
| `get_scene_file_content` | 读取 .tscn 文件原文 |

### 节点操作
| 工具 | 说明 |
|------|------|
| `add_node` | 新建节点 |
| `delete_node` | 删除节点（含子节点） |
| `rename_node` | 重命名节点 |
| `get_node_properties` | 获取节点所有属性 |
| `set_node_property` | 设置节点属性（支持 Vector/Color 等类型） |
| `move_node` | 移动节点到新父节点 |
| `duplicate_node` | 深拷贝节点 |
| `get_node_signals` | 查看节点信号和现有连接 |
| `connect_signal` | 连接信号到方法 |
| `disconnect_signal` | 断开信号连接 |
| `set_node_group` | 添加/移除节点分组 |
| `get_nodes_in_group` | 获取指定分组所有节点 |
| `set_anchor_preset` | 设置 Control 锚点预设（`full_rect`、`center` 等） |
| `add_resource_to_node` | 创建 Resource 并赋给节点属性 |

### 脚本操作
| 工具 | 说明 |
|------|------|
| `create_script` | 新建 GDScript 文件 |
| `read_script` | 读取脚本内容 |
| `edit_script` | 编辑脚本（全量替换或搜索替换） |
| `attach_script` | 将脚本挂到节点 |
| `list_scripts` | 列出项目所有 .gd 文件 |
| `get_editor_errors` | 检测脚本语法错误 |
| `get_open_scripts` | 列出脚本编辑器中已打开的脚本 |

### 动画
| 工具 | 说明 |
|------|------|
| `list_animations` | 列出 AnimationPlayer 中所有动画 |
| `create_animation` | 新建动画剪辑 |
| `get_animation_info` | 获取动画轨道和关键帧详情 |
| `add_animation_track` | 添加动画轨道 |
| `set_animation_keyframe` | 插入关键帧 |
| `remove_animation` | 删除动画 |

### AnimationTree
| 工具 | 说明 |
|------|------|
| `create_animation_tree` | 创建 AnimationTree 节点（含 StateMachine） |
| `get_animation_tree_structure` | 查看状态机结构 |
| `add_state_machine_state` | 添加状态 |
| `remove_state_machine_state` | 删除状态 |
| `add_state_machine_transition` | 添加状态转换 |
| `remove_state_machine_transition` | 删除状态转换 |
| `set_blend_tree_node` | 配置 BlendTree 中的节点 |
| `set_tree_parameter` | 设置 AnimationTree 参数值 |

### TileMap
| 工具 | 说明 |
|------|------|
| `tilemap_set_cell` | 设置单个格子的 tile |
| `tilemap_get_cell` | 读取单个格子的 tile 数据 |
| `tilemap_fill_rect` | 用同一 tile 填充矩形区域 |
| `tilemap_clear` | 清除整个 TileMap 或指定层 |
| `tilemap_get_info` | 获取 TileMap 层和 TileSet 信息 |
| `tilemap_get_used_cells` | 获取所有非空格子坐标 |

### 3D 场景
| 工具 | 说明 |
|------|------|
| `add_mesh_instance` | 添加 MeshInstance3D（含基础网格和材质） |
| `setup_lighting` | 添加 DirectionalLight3D / OmniLight3D / SpotLight3D |
| `set_material_3d` | 设置 3D 节点材质颜色和属性 |
| `setup_environment` | 创建 WorldEnvironment（天空、雾、辉光、SSAO） |
| `setup_camera_3d` | 添加 Camera3D（FOV、近/远裁剪面） |
| `add_gridmap` | 添加 GridMap 节点 |

### 物理
| 工具 | 说明 |
|------|------|
| `setup_collision` | 为节点添加 CollisionShape2D/3D（box/circle/capsule） |
| `add_raycast` | 添加 RayCast2D/3D（正值 length = 向下） |
| `setup_physics_body` | 配置 CharacterBody/RigidBody 参数 |
| `set_physics_layers` | 设置碰撞层和遮罩位掩码 |
| `get_physics_layers` | 读取碰撞层和遮罩 |
| `get_collision_info` | 查看节点的所有碰撞形状 |

### 粒子系统
| 工具 | 说明 |
|------|------|
| `create_particles` | 创建 GPUParticles2D/3D |
| `set_particle_material` | 配置 ParticleProcessMaterial 参数 |
| `set_particle_color_gradient` | 设置颜色渐变 |
| `apply_particle_preset` | 应用预设效果（fire/smoke/rain/snow/sparks） |
| `get_particle_info` | 读取粒子系统当前配置 |

### 导航
| 工具 | 说明 |
|------|------|
| `setup_navigation_region` | 创建 NavigationRegion2D/3D（自动初始化 NavigationPolygon/Mesh） |
| `bake_navigation_mesh` | 烘焙导航网格 |
| `setup_navigation_agent` | 添加 NavigationAgent2D/3D |
| `set_navigation_layers` | 设置导航层位掩码 |
| `get_navigation_info` | 读取导航节点配置 |

### 音频
| 工具 | 说明 |
|------|------|
| `add_audio_player` | 添加 AudioStreamPlayer/2D/3D |
| `add_audio_bus` | 新建音频总线 |
| `set_audio_bus` | 将音频播放器分配到指定总线 |
| `add_audio_bus_effect` | 添加音效（reverb/delay/compressor/limiter/eq/chorus/distortion） |
| `get_audio_bus_layout` | 获取所有总线和音效布局 |
| `get_audio_info` | 读取音频播放器配置 |

### 主题 & UI
| 工具 | 说明 |
|------|------|
| `create_theme` | 新建 .theme 资源文件 |
| `set_theme_color` | 设置颜色条目 |
| `set_theme_constant` | 设置整数常量（边距、间距等） |
| `set_theme_font_size` | 设置字体大小 |
| `set_theme_stylebox` | 设置 StyleBoxFlat（圆角、边框、颜色） |
| `get_theme_info` | 读取 Theme 全部条目 |

### Shader
| 工具 | 说明 |
|------|------|
| `create_shader` | 新建 .gdshader 文件 |
| `read_shader` | 读取 shader 源码 |
| `edit_shader` | 修改 shader 源码 |
| `assign_shader_material` | 给节点创建并挂载 ShaderMaterial |
| `set_shader_param` | 设置 shader uniform 参数值 |
| `get_shader_params` | 读取 shader 所有参数 |

### 资源管理
| 工具 | 说明 |
|------|------|
| `create_resource` | 新建 .tres 资源文件 |
| `read_resource` | 读取资源属性 |
| `edit_resource` | 修改资源属性并保存 |

### 批量操作 & 重构
| 工具 | 说明 |
|------|------|
| `find_nodes_by_type` | 在当前场景中查找指定类型的所有节点 |
| `batch_set_property` | 批量设置同类节点的属性 |
| `find_signal_connections` | 查找指定信号的所有连接 |
| `find_node_references` | 查找节点在脚本中的引用 |
| `get_scene_dependencies` | 列出场景依赖的所有资源 |
| `cross_scene_set_property` | 跨场景批量修改节点属性 |

### 代码分析
| 工具 | 说明 |
|------|------|
| `get_project_statistics` | 项目文件数、节点数、脚本数统计 |
| `find_unused_resources` | 查找项目中未被引用的资源文件 |
| `analyze_scene_complexity` | 分析场景节点数和脚本密度 |
| `find_script_references` | 在脚本中搜索符号引用 |
| `detect_circular_dependencies` | 检测脚本 extends 循环依赖 |
| `analyze_signal_flow` | 分析场景中的信号流图 |

### 性能监控
| 工具 | 说明 |
|------|------|
| `get_performance_monitors` | 读取 FPS、内存、Draw Call、物理对象数等 |
| `get_editor_performance` | 读取编辑器帧率和场景节点数 |

### 导出
| 工具 | 说明 |
|------|------|
| `list_export_presets` | 列出所有导出预设 |
| `get_export_info` | 获取导出预设详细配置 |
| `export_project` | 生成导出 CLI 命令（需手动执行） |

### 编辑器工具
| 工具 | 说明 |
|------|------|
| `set_main_scene` | 设置项目主场景 |
| `get_editor_screenshot` | 截图编辑器屏幕（base64 PNG） |
| `reload_project` | 重新扫描项目文件系统 |
| `clear_editor_output` | 清除 Output 面板（打印分隔线） |
| `reload_plugin` | 热重载指定插件 |
| `execute_editor_script` | 在编辑器上下文中执行 GDScript 代码 |
| `compare_screenshots` | 截图对比（save_reference → compare） |

---

## 游戏运行时工具（需先按 F5 启动游戏）

### 输入模拟
| 工具 | 说明 |
|------|------|
| `simulate_key` | 模拟键盘按键 |
| `simulate_mouse_click` | 模拟鼠标点击 |
| `simulate_mouse_move` | 模拟鼠标移动 |
| `simulate_action` | 模拟 InputMap 动作 |
| `simulate_sequence` | 按时间顺序执行一组输入事件 |

### 输入录制与回放
| 工具 | 说明 |
|------|------|
| `start_recording` | 开始录制玩家输入 |
| `stop_recording` | 停止录制，返回事件列表 |
| `replay_recording` | 回放录制内容（支持变速） |

### 运行时场景检查
| 工具 | 说明 |
|------|------|
| `get_game_scene_tree` | 获取运行中的场景树 |
| `get_game_node_properties` | 读取运行中节点属性 |
| `set_game_node_properties` | 修改运行中节点属性 |
| `execute_game_script` | 在游戏上下文中执行 GDScript |
| `get_game_screenshot` | 截取游戏画面（base64 PNG） |
| `capture_frames` | 按间隔捕获多帧截图 |
| `monitor_properties` | 采样监控节点属性变化曲线 |
| `find_ui_elements` | 按文字查找 UI 元素（Label/Button） |
| `click_button_by_text` | 点击指定文字的按钮 |
| `wait_for_node` | 等待节点出现（超时返回失败） |
| `batch_get_properties_runtime` | 批量读取多个节点的属性 |
| `find_nodes_by_script_runtime` | 找出挂了指定脚本的所有节点 |
| `get_autoload` | 查看 Autoload 单例信息 |

### 测试 & QA
| 工具 | 说明 |
|------|------|
| `run_test_scenario` | 按步骤执行测试（支持异步命令） |
| `assert_node_state` | 断言节点属性值（记入测试报告） |
| `assert_screen_text` | 断言屏幕上存在某段文字 |
| `run_stress_test` | 随机输入压力测试 |
| `get_test_report` | 获取本次会话的全部断言结果 |

---

## 使用示例

在 Cursor 对话框中直接描述需求：

```
帮我创建一个 2D 平台跳跃游戏：
1. 创建主场景 res://game.tscn，根节点为 Node2D
2. 添加 CharacterBody2D 命名 Player
3. 给 Player 添加 Sprite2D 和 CollisionShape2D（圆形，半径24）
4. 创建 res://player.gd 实现 WASD 移动和跳跃
5. 将脚本挂到 Player，设为主场景并运行
```

```
运行游戏，录制一段操作，然后用回放功能做回归测试：
1. start_recording 开始录制
2. （手动操作几秒）
3. stop_recording 保存操作序列
4. replay_recording 验证行为一致
```

---

## 扩展开发

### 添加新的编辑器命令

**plugin.gd** — 在 `_build_handlers()` 字典里注册：
```gdscript
"my_command": _cmd_my_command,
```
然后实现函数：
```gdscript
func _cmd_my_command(p: Dictionary) -> Dictionary:
    var param = p.get("param", "default")
    # ... 逻辑 ...
    EditorInterface.save_scene()   # 如果修改了场景节点
    return {"result": "value"}
```

**server.py** — 添加 MCP 工具：
```python
@mcp.tool()
def my_tool(param: str) -> str:
    """工具描述（AI 会读这段来决定何时调用）"""
    return _e("my_command", {"param": param})
```

### 添加游戏运行时命令

在 `mcp_runtime.gd` 的 `_build_handlers()` 中注册，如果函数内含 `await`，还需要将命令名加入 `_handle()` 里的 `_ASYNC_CMDS` 列表。

---

## 常见问题

**Q: 连接失败，显示 ConnectionRefusedError**
> 确保 Godot 已打开且插件已启用，状态面板显示 `⏳ Waiting on port 9500…`

**Q: 运行时工具提示 "Game is not running"**
> 在 Godot 中按 F5 启动游戏，然后重试

**Q: 修改了节点但场景没变**
> 执行 `save_scene` 手动保存，或检查对应工具是否返回了 `_error`

**Q: `export_project` 没有真正导出文件**
> 该工具返回等效 CLI 命令，在项目目录下手动执行即可（编辑器插件无法安全运行子进程）

**Q: 插件报 port 9500 already in use**
> 已有另一个 MCP server 占用端口，关掉旧进程，或修改 `plugin.gd` 的 `EDITOR_PORT` 常量

**Q: 在 Godot 4.0/4.1 上报错**
> 需要 Godot **4.2+**，`EditorInterface` 静态类 API 在 4.2 才完整稳定
