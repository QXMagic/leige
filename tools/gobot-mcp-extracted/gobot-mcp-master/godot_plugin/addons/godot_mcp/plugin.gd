@tool
extends EditorPlugin

# ─────────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────────
const EDITOR_PORT := 9500
const MAX_CLIENTS := 4
const RUNTIME_AUTOLOAD := "MCPRuntime"
const RUNTIME_SCRIPT := "res://addons/godot_mcp/mcp_runtime.gd"

# ─────────────────────────────────────────────────────────────
# State
# ─────────────────────────────────────────────────────────────
var _server := TCPServer.new()
var _clients: Array[StreamPeerTCP] = []
var _buffers: Dictionary = {}
var _panel: Control
var _handlers: Dictionary = {}

# ─────────────────────────────────────────────────────────────
# Lifecycle
# ─────────────────────────────────────────────────────────────
func _enter_tree() -> void:
	_build_handlers()
	_build_panel()
	_start_server()
	add_autoload_singleton(RUNTIME_AUTOLOAD, RUNTIME_SCRIPT)
	set_process(true)

func _exit_tree() -> void:
	set_process(false)
	_server.stop()
	for c in _clients:
		if c.get_status() == StreamPeerTCP.STATUS_CONNECTED:
			c.disconnect_from_host()
	_clients.clear()
	_buffers.clear()
	remove_autoload_singleton(RUNTIME_AUTOLOAD)
	if _panel:
		remove_control_from_docks(_panel)
		_panel.queue_free()

func _process(_dt: float) -> void:
	_accept_clients()
	_poll_clients()

# ─────────────────────────────────────────────────────────────
# Dispatch table (callable dict — easy to extend)
# ─────────────────────────────────────────────────────────────
func _build_handlers() -> void:
	_handlers = {
		# ── Meta ──────────────────────────────────
		"ping":                         _cmd_ping,
		# ── Project ───────────────────────────────
		"get_project_info":             _cmd_project_info,
		"get_filesystem_tree":          _cmd_filesystem_tree,
		"search_files":                 _cmd_search_files,
		"get_project_setting":          _cmd_get_project_setting,
		"set_project_setting":          _cmd_set_project_setting,
		# ── Scene ─────────────────────────────────
		"get_scene_tree":               _cmd_scene_tree,
		"get_open_scenes":              _cmd_open_scenes,
		"open_scene":                   _cmd_open_scene,
		"save_scene":                   _cmd_save_scene,
		"create_scene":                 _cmd_create_scene,
		"play_scene":                   _cmd_play_scene,
		"stop_scene":                   _cmd_stop_scene,
		"add_scene_instance":           _cmd_add_scene_instance,
		"get_scene_file_content":       _cmd_get_scene_file,
		# ── Node ──────────────────────────────────
		"add_node":                     _cmd_add_node,
		"delete_node":                  _cmd_delete_node,
		"rename_node":                  _cmd_rename_node,
		"get_node_properties":          _cmd_get_node_properties,
		"set_node_property":            _cmd_set_node_property,
		"move_node":                    _cmd_move_node,
		"duplicate_node":               _cmd_duplicate_node,
		"get_node_signals":             _cmd_node_signals,
		"connect_signal":               _cmd_connect_signal,
		"set_node_group":               _cmd_set_node_group,
		"get_nodes_in_group":           _cmd_get_nodes_in_group,
		# ── Script ────────────────────────────────
		"create_script":                _cmd_create_script,
		"read_script":                  _cmd_read_script,
		"edit_script":                  _cmd_edit_script,
		"attach_script":                _cmd_attach_script,
		"list_scripts":                 _cmd_list_scripts,
		"get_editor_errors":            _cmd_get_editor_errors,
		# ── Animation ─────────────────────────────
		"list_animations":              _cmd_list_animations,
		"create_animation":             _cmd_create_animation,
		"get_animation_info":           _cmd_get_animation_info,
		"add_animation_track":          _cmd_add_animation_track,
		"set_animation_keyframe":       _cmd_set_animation_keyframe,
		"remove_animation":             _cmd_remove_animation,
		# ── AnimationTree ─────────────────────────
		"create_animation_tree":        _cmd_create_anim_tree,
		"get_animation_tree_structure": _cmd_get_anim_tree_structure,
		"add_state_machine_state":      _cmd_add_sm_state,
		"remove_state_machine_state":   _cmd_remove_sm_state,
		"add_state_machine_transition": _cmd_add_sm_transition,
		"remove_state_machine_transition": _cmd_remove_sm_transition,
		"set_blend_tree_node":          _cmd_set_blend_node,
		"set_tree_parameter":           _cmd_set_tree_param,
		# ── TileMap ───────────────────────────────
		"tilemap_set_cell":             _cmd_tilemap_set_cell,
		"tilemap_get_cell":             _cmd_tilemap_get_cell,
		"tilemap_fill_rect":            _cmd_tilemap_fill_rect,
		"tilemap_clear":                _cmd_tilemap_clear,
		"tilemap_get_info":             _cmd_tilemap_get_info,
		"tilemap_get_used_cells":       _cmd_tilemap_get_used_cells,
		# ── 3D Scene ──────────────────────────────
		"add_mesh_instance":            _cmd_add_mesh_instance,
		"setup_lighting":               _cmd_setup_lighting,
		"set_material_3d":              _cmd_set_material_3d,
		"setup_environment":            _cmd_setup_environment,
		"setup_camera_3d":              _cmd_setup_camera_3d,
		"add_gridmap":                  _cmd_add_gridmap,
		# ── Physics ───────────────────────────────
		"setup_collision":              _cmd_setup_collision,
		"add_raycast":                  _cmd_add_raycast,
		"setup_physics_body":           _cmd_setup_physics_body,
		"set_physics_layers":           _cmd_set_physics_layers,
		"get_physics_layers":           _cmd_get_physics_layers,
		"get_collision_info":           _cmd_get_collision_info,
		# ── Particles ─────────────────────────────
		"create_particles":             _cmd_create_particles,
		"set_particle_material":        _cmd_set_particle_material,
		"set_particle_color_gradient":  _cmd_set_particle_gradient,
		"apply_particle_preset":        _cmd_apply_particle_preset,
		"get_particle_info":            _cmd_get_particle_info,
		# ── Navigation ────────────────────────────
		"setup_navigation_region":      _cmd_setup_nav_region,
		"bake_navigation_mesh":         _cmd_bake_nav_mesh,
		"setup_navigation_agent":       _cmd_setup_nav_agent,
		"set_navigation_layers":        _cmd_set_nav_layers,
		"get_navigation_info":          _cmd_get_nav_info,
		# ── Audio ─────────────────────────────────
		"add_audio_player":             _cmd_add_audio_player,
		"add_audio_bus":                _cmd_add_audio_bus,
		"set_audio_bus":                _cmd_set_audio_bus,
		"add_audio_bus_effect":         _cmd_add_bus_effect,
		"get_audio_bus_layout":         _cmd_get_bus_layout,
		"get_audio_info":               _cmd_get_audio_info,
		# ── Theme & UI ────────────────────────────
		"create_theme":                 _cmd_create_theme,
		"set_theme_color":              _cmd_set_theme_color,
		"set_theme_constant":           _cmd_set_theme_constant,
		"set_theme_font_size":          _cmd_set_theme_font_size,
		"set_theme_stylebox":           _cmd_set_theme_stylebox,
		"get_theme_info":               _cmd_get_theme_info,
		# ── Shader ────────────────────────────────
		"create_shader":                _cmd_create_shader,
		"read_shader":                  _cmd_read_shader,
		"edit_shader":                  _cmd_edit_shader,
		"assign_shader_material":       _cmd_assign_shader_material,
		"set_shader_param":             _cmd_set_shader_param,
		"get_shader_params":            _cmd_get_shader_params,
		# ── Resource ──────────────────────────────
		"create_resource":              _cmd_create_resource,
		"read_resource":                _cmd_read_resource,
		"edit_resource":                _cmd_edit_resource,
		# ── Batch & Refactoring ───────────────────
		"find_nodes_by_type":           _cmd_find_nodes_by_type,
		"batch_set_property":           _cmd_batch_set_property,
		"find_signal_connections":      _cmd_find_signal_connections,
		"find_node_references":         _cmd_find_node_references,
		"get_scene_dependencies":       _cmd_get_scene_dependencies,
		"cross_scene_set_property":     _cmd_cross_scene_set_property,
		# ── Code Analysis ─────────────────────────
		"get_project_statistics":       _cmd_project_statistics,
		"find_unused_resources":        _cmd_find_unused_resources,
		"analyze_scene_complexity":     _cmd_analyze_scene_complexity,
		"find_script_references":       _cmd_find_script_references,
		"detect_circular_dependencies": _cmd_detect_circular_deps,
		"analyze_signal_flow":          _cmd_analyze_signal_flow,
		# ── Profiling ─────────────────────────────
		"get_performance_monitors":     _cmd_get_performance,
		"get_editor_performance":       _cmd_get_editor_perf,
		# ── Export ────────────────────────────────
		"list_export_presets":          _cmd_list_export_presets,
		"get_export_info":              _cmd_get_export_info,
		"export_project":               _cmd_export_project,
		# ── Editor ────────────────────────────────
		"set_main_scene":               _cmd_set_main_scene,
		"get_editor_screenshot":        _cmd_screenshot,
		"reload_project":               _cmd_reload,
		# ── New: Project ──────────────────────────
		"project_path_to_uid":          _cmd_path_to_uid,
		"uid_to_project_path":          _cmd_uid_to_path,
		# ── New: Node ─────────────────────────────
		"disconnect_signal":            _cmd_disconnect_signal,
		"set_anchor_preset":            _cmd_set_anchor_preset,
		"add_resource_to_node":         _cmd_add_resource_to_node,
		# ── New: Script ───────────────────────────
		"get_open_scripts":             _cmd_get_open_scripts,
		# ── New: Editor ───────────────────────────
		"clear_editor_output":          _cmd_clear_output,
		"reload_plugin":                _cmd_reload_plugin,
		"execute_editor_script":        _cmd_execute_editor_script,
		"compare_screenshots":          _cmd_compare_screenshots,
	}

# ─────────────────────────────────────────────────────────────
# Status Panel
# ─────────────────────────────────────────────────────────────
func _build_panel() -> void:
	_panel = VBoxContainer.new()
	_panel.name = "Godot MCP"
	var title := Label.new()
	title.text = "🤖 Godot MCP"
	title.add_theme_font_size_override("font_size", 13)
	_panel.add_child(title)
	_panel.add_child(HSeparator.new())
	var status := Label.new()
	status.name = "Status"
	status.text = "⏳ Waiting on port %d…" % EDITOR_PORT
	status.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6))
	_panel.add_child(status)
	var info := Label.new()
	info.name = "Info"
	info.add_theme_font_size_override("font_size", 11)
	_panel.add_child(info)
	add_control_to_dock(DOCK_SLOT_LEFT_BL, _panel)

func _set_status(text: String, color := Color.WHITE) -> void:
	if _panel:
		var l := _panel.get_node_or_null("Status") as Label
		if l: l.text = text; l.add_theme_color_override("font_color", color)

func _set_info(text: String) -> void:
	if _panel:
		var l := _panel.get_node_or_null("Info") as Label
		if l: l.text = text

# ─────────────────────────────────────────────────────────────
# TCP Server
# ─────────────────────────────────────────────────────────────
func _start_server() -> void:
	var err := _server.listen(EDITOR_PORT)
	if err != OK:
		_set_status("❌ Port %d busy" % EDITOR_PORT, Color.RED)
		return
	print("[MCP] Editor bridge on port %d" % EDITOR_PORT)
	_set_status("⏳ Waiting on port %d…" % EDITOR_PORT, Color(0.6, 0.6, 0.6))

func _accept_clients() -> void:
	while _server.is_connection_available() and _clients.size() < MAX_CLIENTS:
		var c := _server.take_connection()
		_clients.append(c)
		_buffers[c.get_instance_id()] = ""
		_set_status("✅ Connected (%d)" % _clients.size(), Color.GREEN)

func _poll_clients() -> void:
	for c in _clients.duplicate():
		c.poll()
		if c.get_status() != StreamPeerTCP.STATUS_CONNECTED:
			_buffers.erase(c.get_instance_id()); _clients.erase(c)
			_set_status(("✅ Connected (%d)" % _clients.size()) if not _clients.is_empty()
				else ("⏳ Waiting on port %d…" % EDITOR_PORT), Color.GREEN if not _clients.is_empty() else Color(0.6,0.6,0.6))
			continue
		var avail := c.get_available_bytes()
		if avail <= 0: continue
		var key := c.get_instance_id()
		_buffers[key] = _buffers.get(key, "") + c.get_utf8_string(avail)
		while "\n" in _buffers[key]:
			var idx := _buffers[key].find("\n")
			var line := _buffers[key].substr(0, idx).strip_edges()
			_buffers[key] = _buffers[key].substr(idx + 1)
			if line != "": _handle(c, line)

func _handle(c: StreamPeerTCP, raw: String) -> void:
	var req = JSON.parse_string(raw)
	if req == null: _reply_err(c, "?", "Invalid JSON"); return
	var id: String = str(req.get("id", "?"))
	var cmd: String = req.get("command", "")
	var p: Dictionary = req.get("params", {})
	_set_info("← " + cmd)
	var handler: Callable = _handlers.get(cmd, Callable())
	if not handler.is_valid(): _reply_err(c, id, "Unknown command: " + cmd); return
	var result: Dictionary = handler.call(p)
	if result.has("_error"): _reply_err(c, id, result["_error"])
	else: _reply_ok(c, id, result)

func _reply_ok(c: StreamPeerTCP, id: String, data: Dictionary) -> void:
	_write(c, {"id": id, "success": true, "result": data})
func _reply_err(c: StreamPeerTCP, id: String, msg: String) -> void:
	push_warning("[MCP] " + msg); _write(c, {"id": id, "success": false, "error": msg})
func _write(c: StreamPeerTCP, data: Dictionary) -> void:
	if c.get_status() != StreamPeerTCP.STATUS_CONNECTED: return
	c.put_data((JSON.stringify(data) + "\n").to_utf8_buffer())

# ─────────────────────────────────────────────────────────────
# ═══════════════════  HELPERS  ═══════════════════════════════
# ─────────────────────────────────────────────────────────────
func _root() -> Node: return EditorInterface.get_edited_scene_root()

func _scene_node(path: String) -> Node:
	var root := _root()
	if not root: return null
	if path in ["", ".", root.name]: return root
	return root.get_node_or_null(path)

func _res(path: String) -> String:
	return path if path.begins_with("res://") else "res://" + path

func _node_dict(node: Node, depth := 0) -> Dictionary:
	var scr = node.get_script()
	return {
		"name": str(node.name), "type": node.get_class(),
		"path": str(node.get_path()).trim_prefix("/root/"),
		"script": scr.resource_path if scr else "",
		"children": ([] if depth >= 8 else [_node_dict(c, depth+1) for c in node.get_children()])
	}

func _serialize(v: Variant) -> Variant:
	match typeof(v):
		TYPE_BOOL, TYPE_INT, TYPE_FLOAT, TYPE_STRING: return v
		TYPE_VECTOR2:  return {"_t":"V2","x":v.x,"y":v.y}
		TYPE_VECTOR2I: return {"_t":"V2I","x":v.x,"y":v.y}
		TYPE_VECTOR3:  return {"_t":"V3","x":v.x,"y":v.y,"z":v.z}
		TYPE_VECTOR3I: return {"_t":"V3I","x":v.x,"y":v.y,"z":v.z}
		TYPE_COLOR:    return {"_t":"Color","r":v.r,"g":v.g,"b":v.b,"a":v.a}
		TYPE_RECT2:    return {"_t":"Rect2","x":v.position.x,"y":v.position.y,"w":v.size.x,"h":v.size.y}
		TYPE_NODE_PATH:return {"_t":"NodePath","v":str(v)}
		TYPE_ARRAY:    return [_serialize(i) for i in v]
		TYPE_DICTIONARY:
			var d := {}; for k in v: d[str(k)] = _serialize(v[k]); return d
		TYPE_OBJECT:
			if v == null: return null
			if v is Resource: return {"_t":"Resource","class":v.get_class(),"path":v.resource_path}
			return {"_t":"Object","class":v.get_class()}
		_: return str(v)

func _parse(v: Variant, hint: int = TYPE_NIL) -> Variant:
	if v is Dictionary and v.has("_t"):
		match v["_t"]:
			"V2":    return Vector2(v.x, v.y)
			"V2I":   return Vector2i(v.x, v.y)
			"V3":    return Vector3(v.x, v.y, v.z)
			"V3I":   return Vector3i(v.x, v.y, v.z)
			"Color": return Color(v.r, v.g, v.b, v.get("a",1.0))
			"Rect2": return Rect2(v.x, v.y, v.w, v.h)
			"NodePath": return NodePath(v.v)
	match hint:
		TYPE_VECTOR2:  if v is Array and v.size()==2: return Vector2(v[0],v[1])
		TYPE_VECTOR3:  if v is Array and v.size()==3: return Vector3(v[0],v[1],v[2])
		TYPE_COLOR:    if v is String: return Color(v)
		TYPE_NODE_PATH:if v is String: return NodePath(v)
		TYPE_BOOL:     if v is String: return v.to_lower() in ["true","1","yes"]
	return v

func _scan_dir(path: String, arr: Array, depth: int, max_d: int) -> void:
	if depth >= max_d: return
	var d := DirAccess.open(path)
	if not d: return
	d.list_dir_begin()
	var name := d.get_next()
	while name != "":
		if not name.begins_with(".") and name != ".godot":
			var full := path.path_join(name)
			if d.current_is_dir():
				var sub := {"name":name,"path":full,"type":"dir","children":[]}
				_scan_dir(full, sub["children"], depth+1, max_d)
				arr.append(sub)
			else:
				arr.append({"name":name,"path":full,"type":"file","ext":name.get_extension()})
		name = d.get_next()
	d.list_dir_end()

func _flatten(arr: Array, out: Array) -> void:
	for i in arr:
		if i["type"] == "file": out.append(i)
		elif i.has("children"): _flatten(i["children"], out)

func _collect_ext(path: String, out: Array, ext: String) -> void:
	var d := DirAccess.open(path)
	if not d: return
	d.list_dir_begin()
	var name := d.get_next()
	while name != "":
		if not name.begins_with(".") and name != ".godot":
			var full := path.path_join(name)
			if d.current_is_dir(): _collect_ext(full, out, ext)
			elif name.get_extension() == ext: out.append(full)
		name = d.get_next()
	d.list_dir_end()

func _find_by_type(node: Node, type_name: String, results: Array) -> void:
	if node.get_class() == type_name or node.is_class(type_name):
		results.append(str(node.get_path()).trim_prefix("/root/"))
	for c in node.get_children(): _find_by_type(c, type_name, results)

func _count_nodes(node: Node) -> int:
	var n := 1
	for c in node.get_children(): n += _count_nodes(c)
	return n

func _scene_max_depth(node: Node, d := 0) -> int:
	var m := d
	for c in node.get_children(): m = max(m, _scene_max_depth(c, d+1))
	return m

func _set_child_owners(node: Node, owner: Node) -> void:
	for c in node.get_children(): c.set_owner(owner); _set_child_owners(c, owner)

func _get_anim_player(p: Dictionary) -> AnimationPlayer:
	var node := _scene_node(p.get("node_path", ""))
	if node is AnimationPlayer: return node
	if node:
		for c in node.get_children():
			if c is AnimationPlayer: return c
	return null

# ─────────────────────────────────────────────────────────────
# ═══════════════  META & PROJECT  ════════════════════════════
# ─────────────────────────────────────────────────────────────
func _cmd_ping(_p: Dictionary) -> Dictionary:
	return {"pong": true, "version": "1.0", "tools": _handlers.size()}

func _cmd_project_info(_p: Dictionary) -> Dictionary:
	return {
		"name":    ProjectSettings.get_setting("application/config/name",""),
		"version": ProjectSettings.get_setting("application/config/version",""),
		"main_scene": ProjectSettings.get_setting("application/run/main_scene",""),
		"project_path": ProjectSettings.globalize_path("res://"),
		"godot_version": Engine.get_version_info(),
	}

func _cmd_filesystem_tree(p: Dictionary) -> Dictionary:
	var tree: Array = []
	_scan_dir(p.get("path","res://"), tree, 0, int(p.get("max_depth",3)))
	return {"tree": tree}

func _cmd_search_files(p: Dictionary) -> Dictionary:
	var pattern: String = p.get("pattern",""); var ext: String = p.get("ext","").trim_prefix(".")
	var all: Array = []; _scan_dir("res://", all, 0, 10)
	var flat: Array = []; _flatten(all, flat)
	var out: Array = []
	for f in flat:
		if (pattern=="" or f["name"].to_lower().contains(pattern.to_lower())) and (ext=="" or f["ext"]==ext):
			out.append(f)
	return {"results": out, "count": out.size()}

func _cmd_get_project_setting(p: Dictionary) -> Dictionary:
	var key: String = p.get("key","")
	if key == "": return {"_error":"key required"}
	if not ProjectSettings.has_setting(key): return {"_error":"Setting not found: "+key}
	return {"key": key, "value": _serialize(ProjectSettings.get_setting(key))}

func _cmd_set_project_setting(p: Dictionary) -> Dictionary:
	var key: String = p.get("key",""); var val = p.get("value")
	if key == "": return {"_error":"key required"}
	ProjectSettings.set_setting(key, val); ProjectSettings.save()
	return {"key": key, "saved": true}

# ─────────────────────────────────────────────────────────────
# ═══════════════  SCENE  ═════════════════════════════════════
# ─────────────────────────────────────────────────────────────
func _cmd_scene_tree(_p: Dictionary) -> Dictionary:
	var root := _root()
	return {"_error":"No scene open"} if not root else {"tree": _node_dict(root)}

func _cmd_open_scenes(_p: Dictionary) -> Dictionary:
	return {"scenes": Array(EditorInterface.get_open_scenes())}

func _cmd_open_scene(p: Dictionary) -> Dictionary:
	var path := _res(p.get("path",""))
	if path == "res://": return {"_error":"path required"}
	EditorInterface.open_scene_from_path(path); return {"opened": path}

func _cmd_save_scene(_p: Dictionary) -> Dictionary:
	EditorInterface.save_scene(); return {"saved": true}

func _cmd_create_scene(p: Dictionary) -> Dictionary:
	var path := _res(p.get("path",""))
	if path == "res://": return {"_error":"path required"}
	var rt: String = p.get("root_type","Node2D"); var rn: String = p.get("root_name",rt)
	if not ClassDB.class_exists(rt): return {"_error":"Unknown type: "+rt}
	var root_node: Node = ClassDB.instantiate(rt); root_node.name = rn
	var packed := PackedScene.new(); packed.pack(root_node); root_node.free()
	var err := ResourceSaver.save(packed, path)
	if err != OK: return {"_error":"Save failed: "+error_string(err)}
	EditorInterface.get_resource_filesystem().scan()
	return {"created": path, "root_type": rt}

func _cmd_play_scene(p: Dictionary) -> Dictionary:
	var path: String = p.get("path","")
	if path: EditorInterface.play_custom_scene(_res(path))
	else: EditorInterface.play_current_scene()
	return {"status":"playing"}

func _cmd_stop_scene(_p: Dictionary) -> Dictionary:
	EditorInterface.stop_playing_scene(); return {"status":"stopped"}

func _cmd_add_scene_instance(p: Dictionary) -> Dictionary:
	var root := _root()
	if not root: return {"_error":"No scene open"}
	var scene_path := _res(p.get("scene_path",""))
	if scene_path == "res://": return {"_error":"scene_path required"}
	var packed := load(scene_path) as PackedScene
	if not packed: return {"_error":"Cannot load scene: "+scene_path}
	var instance := packed.instantiate()
	var name: String = p.get("name","")
	if name: instance.name = name
	var parent := _scene_node(p.get("parent_path",""))
	if not parent: parent = root
	parent.add_child(instance); instance.set_owner(root); _set_child_owners(instance, root)
	EditorInterface.save_scene()
	return {"path": str(instance.get_path()).trim_prefix("/root/"), "name": str(instance.name)}

func _cmd_get_scene_file(p: Dictionary) -> Dictionary:
	var path := _res(p.get("path",""))
	var f := FileAccess.open(path, FileAccess.READ)
	if not f: return {"_error":"File not found: "+path}
	var content := f.get_as_text(); f.close()
	return {"path": path, "content": content}

# ─────────────────────────────────────────────────────────────
# ═══════════════  NODE  ══════════════════════════════════════
# ─────────────────────────────────────────────────────────────
func _cmd_add_node(p: Dictionary) -> Dictionary:
	var root := _root()
	if not root: return {"_error":"No scene open"}
	var nt: String = p.get("type","Node")
	if not ClassDB.class_exists(nt): return {"_error":"Unknown type: "+nt}
	var parent := root if p.get("parent_path","") == "" else _scene_node(p.get("parent_path",""))
	if not parent: return {"_error":"Parent not found: "+p.get("parent_path","")}
	var node: Node = ClassDB.instantiate(nt)
	var nm: String = p.get("name",""); if nm: node.name = nm
	parent.add_child(node); node.set_owner(root); EditorInterface.save_scene()
	return {"path":str(node.get_path()).trim_prefix("/root/"),"name":str(node.name),"type":nt}

func _cmd_delete_node(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("path",""))
	if not node: return {"_error":"Node not found: "+p.get("path","")}
	if node == _root(): return {"_error":"Cannot delete root"}
	var nm := str(node.name); node.get_parent().remove_child(node); node.queue_free()
	EditorInterface.save_scene(); return {"deleted": nm}

func _cmd_rename_node(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("path",""))
	if not node: return {"_error":"Node not found"}
	var nm: String = p.get("name",""); if nm == "": return {"_error":"name required"}
	var old := str(node.name); node.name = nm; EditorInterface.save_scene()
	return {"old": old, "new": str(node.name)}

func _cmd_get_node_properties(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("path",""))
	if not node: return {"_error":"Node not found: "+p.get("path","")}
	var excl := PROPERTY_USAGE_GROUP | PROPERTY_USAGE_CATEGORY | PROPERTY_USAGE_SUBGROUP
	var props: Dictionary = {}
	for info in node.get_property_list():
		var u := int(info["usage"])
		if (u & PROPERTY_USAGE_EDITOR) and not (u & excl):
			var val = node.get(info["name"])
			if val != null: props[info["name"]] = _serialize(val)
	return {"path":p.get("path",""),"type":node.get_class(),"name":str(node.name),"properties":props}

func _cmd_set_node_property(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("path",""))
	if not node: return {"_error":"Node not found"}
	var prop: String = p.get("property",""); if prop == "": return {"_error":"property required"}
	var hint := TYPE_NIL
	for info in node.get_property_list():
		if info["name"] == prop: hint = int(info["type"]); break
	node.set(prop, _parse(p.get("value"), hint)); EditorInterface.save_scene()
	return {"property":prop,"value":_serialize(node.get(prop))}

func _cmd_move_node(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("path",""))
	if not node: return {"_error":"Node not found"}
	var new_parent := _scene_node(p.get("new_parent",""))
	if not new_parent: return {"_error":"New parent not found"}
	var root := _root(); node.get_parent().remove_child(node)
	new_parent.add_child(node); node.set_owner(root); EditorInterface.save_scene()
	return {"moved":str(node.name),"new_path":str(node.get_path()).trim_prefix("/root/")}

func _cmd_duplicate_node(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("path",""))
	if not node: return {"_error":"Node not found"}
	var root := _root(); var dupe := node.duplicate()
	dupe.name = p.get("name", str(node.name)+"_copy")
	node.get_parent().add_child(dupe); dupe.set_owner(root); _set_child_owners(dupe, root)
	EditorInterface.save_scene()
	return {"duplicate":str(dupe.name),"path":str(dupe.get_path()).trim_prefix("/root/")}

func _cmd_node_signals(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("path",""))
	if not node: return {"_error":"Node not found"}
	var sigs: Array = []
	for s in node.get_signal_list():
		sigs.append({"name":s["name"],"args":[a["name"] for a in s["args"]]})
	var conns: Array = []
	for c in node.get_incoming_connections():
		conns.append({"signal":c["signal"].get_name(),"from":str(c["signal"].get_object().get_path()),"method":c["callable"].get_method()})
	return {"signals":sigs,"connections":conns}

func _cmd_connect_signal(p: Dictionary) -> Dictionary:
	var src := _scene_node(p.get("source_path",""))
	var tgt := _scene_node(p.get("target_path",""))
	if not src: return {"_error":"Source not found"}; if not tgt: return {"_error":"Target not found"}
	var sig: String = p.get("signal",""); var method: String = p.get("method","")
	if not src.has_signal(sig): return {"_error":"Signal not found: "+sig}
	if not tgt.has_method(method): return {"_error":"Method not found: "+method}
	if not src.is_connected(sig, Callable(tgt, method)):
		src.connect(sig, Callable(tgt, method))
	EditorInterface.save_scene()
	return {"connected": "%s → %s.%s" % [sig, p.get("target_path",""), method]}

func _cmd_set_node_group(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("path",""))
	if not node: return {"_error":"Node not found"}
	var group: String = p.get("group",""); var add: bool = p.get("add", true)
	if group == "": return {"_error":"group required"}
	if add: node.add_to_group(group)
	else: node.remove_from_group(group)
	EditorInterface.save_scene()
	return {"path":p.get("path",""),"group":group,"added":add}

func _cmd_get_nodes_in_group(p: Dictionary) -> Dictionary:
	var root := _root()
	if not root: return {"_error":"No scene open"}
	var group: String = p.get("group","")
	if group == "": return {"_error":"group required"}
	var results: Array = []
	_find_in_group(root, group, results)
	return {"group":group,"nodes":results}

func _find_in_group(node: Node, group: String, out: Array) -> void:
	if node.is_in_group(group): out.append(str(node.get_path()).trim_prefix("/root/"))
	for c in node.get_children(): _find_in_group(c, group, out)

# ─────────────────────────────────────────────────────────────
# ═══════════════  SCRIPT  ════════════════════════════════════
# ─────────────────────────────────────────────────────────────
func _cmd_create_script(p: Dictionary) -> Dictionary:
	var path := _res(p.get("path",""))
	if path == "res://": return {"_error":"path required"}
	var content: String = p.get("content","")
	if content == "": content = "extends %s\n\n\nfunc _ready() -> void:\n\tpass\n" % p.get("extends","Node")
	var f := FileAccess.open(path, FileAccess.WRITE)
	if not f: return {"_error":"Cannot write: "+path}
	f.store_string(content); f.close()
	EditorInterface.get_resource_filesystem().scan()
	return {"created":path,"lines":content.split("\n").size()}

func _cmd_read_script(p: Dictionary) -> Dictionary:
	var path := _res(p.get("path",""))
	var f := FileAccess.open(path, FileAccess.READ)
	if not f: return {"_error":"File not found: "+path}
	var content := f.get_as_text(); f.close()
	return {"path":path,"content":content,"lines":content.split("\n").size()}

func _cmd_edit_script(p: Dictionary) -> Dictionary:
	var path := _res(p.get("path",""))
	if p.has("content"):
		var f := FileAccess.open(path, FileAccess.WRITE)
		if not f: return {"_error":"Cannot write: "+path}
		f.store_string(p["content"]); f.close()
		EditorInterface.get_resource_filesystem().scan()
		return {"edited":path,"mode":"replace"}
	var search: String = p.get("search",""); var rep: String = p.get("replace","")
	if search == "": return {"_error":"Provide 'content' or 'search'+'replace'"}
	var f := FileAccess.open(path, FileAccess.READ)
	if not f: return {"_error":"File not found: "+path}
	var content := f.get_as_text(); f.close()
	if not content.contains(search): return {"_error":"Search string not found"}
	var cnt := content.count(search)
	content = content.replace(search, rep)
	f = FileAccess.open(path, FileAccess.WRITE)
	if not f: return {"_error":"Cannot write: "+path}
	f.store_string(content); f.close()
	EditorInterface.get_resource_filesystem().scan()
	return {"edited":path,"mode":"search_replace","occurrences":cnt}

func _cmd_attach_script(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("node_path",""))
	if not node: return {"_error":"Node not found"}
	var script_path := _res(p.get("script_path",""))
	var script = load(script_path)
	if not script: return {"_error":"Script not found: "+script_path}
	node.set_script(script); EditorInterface.save_scene()
	return {"node":p.get("node_path",""),"script":script_path}

func _cmd_list_scripts(_p: Dictionary) -> Dictionary:
	var scripts: Array = []; _collect_ext("res://", scripts, "gd")
	return {"scripts":scripts,"count":scripts.size()}

func _cmd_get_editor_errors(_p: Dictionary) -> Dictionary:
	# Gather GDScript compile errors by checking all scripts
	var scripts: Array = []; _collect_ext("res://", scripts, "gd")
	var errors: Array = []
	for path in scripts:
		var scr := GDScript.new()
		var f := FileAccess.open(path, FileAccess.READ)
		if not f: continue
		scr.source_code = f.get_as_text(); f.close()
		var err := scr.reload()
		if err != OK: errors.append({"path":path,"error":error_string(err)})
	return {"errors":errors,"count":errors.size()}

# ─────────────────────────────────────────────────────────────
# ═══════════════  ANIMATION  ═════════════════════════════════
# ─────────────────────────────────────────────────────────────
func _cmd_list_animations(p: Dictionary) -> Dictionary:
	var player := _get_anim_player(p)
	if not player: return {"_error":"AnimationPlayer not found at: "+p.get("node_path","")}
	return {"animations": Array(player.get_animation_list()), "node": p.get("node_path","")}

func _ensure_anim_library(player: AnimationPlayer) -> AnimationLibrary:
	if not player.has_animation_library(""):
		player.add_animation_library("", AnimationLibrary.new())
	return player.get_animation_library("")

func _cmd_create_animation(p: Dictionary) -> Dictionary:
	var player := _get_anim_player(p)
	if not player: return {"_error":"AnimationPlayer not found"}
	var name: String = p.get("name",""); if name == "": return {"_error":"name required"}
	var length: float = float(p.get("length", 1.0))
	var anim := Animation.new(); anim.length = length
	var lib := _ensure_anim_library(player)
	if lib.has_animation(name): return {"_error":"Animation already exists: "+name}
	lib.add_animation(name, anim)
	EditorInterface.save_scene()
	return {"created": name, "length": length}

func _cmd_get_animation_info(p: Dictionary) -> Dictionary:
	var player := _get_anim_player(p)
	if not player: return {"_error":"AnimationPlayer not found"}
	var anim_name: String = p.get("animation",""); if anim_name == "": return {"_error":"animation required"}
	if not player.has_animation(anim_name): return {"_error":"Animation not found: "+anim_name}
	var anim := player.get_animation(anim_name)
	var tracks: Array = []
	for i in range(anim.get_track_count()):
		var keys: Array = []
		for k in range(anim.track_get_key_count(i)):
			keys.append({"time":anim.track_get_key_time(i,k),"value":_serialize(anim.track_get_key_value(i,k))})
		tracks.append({"index":i,"type":anim.track_get_type(i),"path":str(anim.track_get_path(i)),"keys":keys})
	return {"name":anim_name,"length":anim.length,"tracks":tracks}

func _cmd_add_animation_track(p: Dictionary) -> Dictionary:
	var player := _get_anim_player(p)
	if not player: return {"_error":"AnimationPlayer not found"}
	var anim_name: String = p.get("animation","")
	if not player.has_animation(anim_name): return {"_error":"Animation not found: "+anim_name}
	var anim := player.get_animation(anim_name)
	var type_map := {"value":Animation.TYPE_VALUE,"position":Animation.TYPE_POSITION_3D,
		"rotation":Animation.TYPE_ROTATION_3D,"scale":Animation.TYPE_SCALE_3D,"method":Animation.TYPE_METHOD}
	var track_type = type_map.get(p.get("track_type","value"), Animation.TYPE_VALUE)
	var track_idx := anim.add_track(track_type)
	anim.track_set_path(track_idx, NodePath(p.get("target_path",".")))
	EditorInterface.save_scene()
	return {"track_index":track_idx,"type":p.get("track_type","value")}

func _cmd_set_animation_keyframe(p: Dictionary) -> Dictionary:
	var player := _get_anim_player(p)
	if not player: return {"_error":"AnimationPlayer not found"}
	var anim_name: String = p.get("animation","")
	if not player.has_animation(anim_name): return {"_error":"Animation not found"}
	var anim := player.get_animation(anim_name)
	var track := int(p.get("track_index",0)); var time := float(p.get("time",0.0))
	var value = _parse(p.get("value"))
	anim.track_insert_key(track, time, value)
	EditorInterface.save_scene()
	return {"track":track,"time":time}

func _cmd_remove_animation(p: Dictionary) -> Dictionary:
	var player := _get_anim_player(p)
	if not player: return {"_error":"AnimationPlayer not found"}
	var anim_name: String = p.get("animation","")
	if not player.has_animation(anim_name): return {"_error":"Animation not found"}
	for lib_name in player.get_animation_library_list():
		var lib := player.get_animation_library(lib_name)
		if lib.has_animation(anim_name):
			lib.remove_animation(anim_name)
			break
	EditorInterface.save_scene()
	return {"removed": anim_name}

# ─────────────────────────────────────────────────────────────
# ═══════════════  ANIMATION TREE  ════════════════════════════
# ─────────────────────────────────────────────────────────────
func _get_anim_tree(p: Dictionary) -> AnimationTree:
	var node := _scene_node(p.get("node_path",""))
	if node is AnimationTree: return node
	if node:
		for c in node.get_children():
			if c is AnimationTree: return c
	return null

func _cmd_create_anim_tree(p: Dictionary) -> Dictionary:
	var root := _root(); if not root: return {"_error":"No scene open"}
	var parent := _scene_node(p.get("parent_path",""))
	if not parent: parent = root
	var tree := AnimationTree.new()
	var name: String = p.get("name","AnimationTree"); tree.name = name
	var sm := AnimationNodeStateMachine.new()
	tree.tree_root = sm
	parent.add_child(tree); tree.set_owner(root); EditorInterface.save_scene()
	return {"created":name,"path":str(tree.get_path()).trim_prefix("/root/")}

func _cmd_get_anim_tree_structure(p: Dictionary) -> Dictionary:
	var tree := _get_anim_tree(p)
	if not tree: return {"_error":"AnimationTree not found"}
	var root_node = tree.tree_root
	if not root_node: return {"_error":"No root node in AnimationTree"}
	var result := {"root_type": root_node.get_class()}
	if root_node is AnimationNodeStateMachine:
		var states: Array = []
		for s in root_node.get_node_list(): states.append(s)
		result["states"] = states
	return result

func _cmd_add_sm_state(p: Dictionary) -> Dictionary:
	var tree := _get_anim_tree(p)
	if not tree: return {"_error":"AnimationTree not found"}
	var sm := tree.tree_root as AnimationNodeStateMachine
	if not sm: return {"_error":"Root is not a StateMachine"}
	var state_name: String = p.get("state_name","")
	if state_name == "": return {"_error":"state_name required"}
	var anim_node := AnimationNodeAnimation.new()
	var anim: String = p.get("animation","")
	if anim: anim_node.animation = anim
	sm.add_node(state_name, anim_node)
	return {"added": state_name}

func _cmd_remove_sm_state(p: Dictionary) -> Dictionary:
	var tree := _get_anim_tree(p)
	if not tree: return {"_error":"AnimationTree not found"}
	var sm := tree.tree_root as AnimationNodeStateMachine
	if not sm: return {"_error":"Root is not a StateMachine"}
	var name: String = p.get("state_name","")
	sm.remove_node(name); return {"removed": name}

func _cmd_add_sm_transition(p: Dictionary) -> Dictionary:
	var tree := _get_anim_tree(p)
	if not tree: return {"_error":"AnimationTree not found"}
	var sm := tree.tree_root as AnimationNodeStateMachine
	if not sm: return {"_error":"Root is not a StateMachine"}
	var from_s: String = p.get("from",""); var to_s: String = p.get("to","")
	if from_s == "" or to_s == "": return {"_error":"from and to required"}
	var trans := AnimationNodeStateMachineTransition.new()
	trans.switch_mode = AnimationNodeStateMachineTransition.SWITCH_MODE_IMMEDIATE
	sm.add_transition(from_s, to_s, trans)
	return {"transition": from_s + " → " + to_s}

func _cmd_remove_sm_transition(p: Dictionary) -> Dictionary:
	var tree := _get_anim_tree(p)
	if not tree: return {"_error":"AnimationTree not found"}
	var sm := tree.tree_root as AnimationNodeStateMachine
	sm.remove_transition(p.get("from",""), p.get("to",""))
	return {"removed": p.get("from","") + " → " + p.get("to","")}

func _cmd_set_blend_node(p: Dictionary) -> Dictionary:
	var tree := _get_anim_tree(p)
	if not tree: return {"_error":"AnimationTree not found"}
	var bt := tree.tree_root as AnimationNodeBlendTree
	if not bt: return {"_error":"Root is not a BlendTree"}
	var node_name: String = p.get("node_name",""); var type: String = p.get("type","blend2")
	var node_map := {"blend2":AnimationNodeBlend2.new(),"add2":AnimationNodeAdd2.new(),"timescale":AnimationNodeTimeScale.new()}
	var blend_node = node_map.get(type)
	if not blend_node: return {"_error":"Unknown blend node type: "+type}
	bt.add_node(node_name, blend_node)
	return {"added": node_name, "type": type}

func _cmd_set_tree_param(p: Dictionary) -> Dictionary:
	var tree := _get_anim_tree(p)
	if not tree: return {"_error":"AnimationTree not found"}
	var param: String = p.get("param",""); if param == "": return {"_error":"param required"}
	tree.set("parameters/"+param, _parse(p.get("value")))
	return {"param": param, "set": true}

# ─────────────────────────────────────────────────────────────
# ═══════════════  TILEMAP  ═══════════════════════════════════
# ─────────────────────────────────────────────────────────────
func _get_tilemap(p: Dictionary) -> TileMap:
	var node := _scene_node(p.get("node_path",""))
	if node is TileMap: return node
	return null

func _cmd_tilemap_set_cell(p: Dictionary) -> Dictionary:
	var tm := _get_tilemap(p); if not tm: return {"_error":"TileMap not found"}
	var layer := int(p.get("layer",0))
	var coords := Vector2i(int(p.get("x",0)), int(p.get("y",0)))
	var source := int(p.get("source_id",0))
	var atlas := Vector2i(int(p.get("atlas_x",0)), int(p.get("atlas_y",0)))
	tm.set_cell(layer, coords, source, atlas); return {"set": true}

func _cmd_tilemap_get_cell(p: Dictionary) -> Dictionary:
	var tm := _get_tilemap(p); if not tm: return {"_error":"TileMap not found"}
	var layer := int(p.get("layer",0)); var coords := Vector2i(int(p.get("x",0)), int(p.get("y",0)))
	return {"source_id":tm.get_cell_source_id(layer,coords),"atlas_coords":_serialize(tm.get_cell_atlas_coords(layer,coords))}

func _cmd_tilemap_fill_rect(p: Dictionary) -> Dictionary:
	var tm := _get_tilemap(p); if not tm: return {"_error":"TileMap not found"}
	var layer := int(p.get("layer",0)); var source := int(p.get("source_id",0))
	var atlas := Vector2i(int(p.get("atlas_x",0)), int(p.get("atlas_y",0)))
	var x1:=int(p.get("x",0)); var y1:=int(p.get("y",0))
	var x2:=int(p.get("x2",x1)); var y2:=int(p.get("y2",y1))
	var count := 0
	for xi in range(x1, x2+1):
		for yi in range(y1, y2+1):
			tm.set_cell(layer, Vector2i(xi,yi), source, atlas); count += 1
	return {"filled": count}

func _cmd_tilemap_clear(p: Dictionary) -> Dictionary:
	var tm := _get_tilemap(p); if not tm: return {"_error":"TileMap not found"}
	if p.has("layer"): tm.clear_layer(int(p.get("layer")))
	else: tm.clear()
	return {"cleared": true}

func _cmd_tilemap_get_info(p: Dictionary) -> Dictionary:
	var tm := _get_tilemap(p); if not tm: return {"_error":"TileMap not found"}
	var info := {"layers":tm.get_layers_count(),"cells_per_layer":[]}
	for i in range(tm.get_layers_count()):
		info["cells_per_layer"].append(tm.get_used_cells(i).size())
	if tm.tile_set: info["tileset_path"] = tm.tile_set.resource_path
	return info

func _cmd_tilemap_get_used_cells(p: Dictionary) -> Dictionary:
	var tm := _get_tilemap(p); if not tm: return {"_error":"TileMap not found"}
	var layer := int(p.get("layer",0))
	var cells: Array = []; for c in tm.get_used_cells(layer): cells.append({"x":c.x,"y":c.y})
	return {"layer":layer,"cells":cells,"count":cells.size()}

# ─────────────────────────────────────────────────────────────
# ═══════════════  3D SCENE  ══════════════════════════════════
# ─────────────────────────────────────────────────────────────
func _cmd_add_mesh_instance(p: Dictionary) -> Dictionary:
	var root := _root(); if not root: return {"_error":"No scene open"}
	var parent := _scene_node(p.get("parent_path","")); if not parent: parent = root
	var mesh_type: String = p.get("mesh_type","BoxMesh")
	var mesh_classes := {"BoxMesh":BoxMesh,"SphereMesh":SphereMesh,"CylinderMesh":CylinderMesh,
		"CapsuleMesh":CapsuleMesh,"PlaneMesh":PlaneMesh,"TorusMesh":TorusMesh}
	var mi := MeshInstance3D.new()
	var mc = mesh_classes.get(mesh_type)
	mi.mesh = mc.new() if mc else BoxMesh.new()
	var nm: String = p.get("name",mesh_type); mi.name = nm
	if p.has("size"):
		var sz = p.get("size")
		if mi.mesh is BoxMesh and sz is Array:
			(mi.mesh as BoxMesh).size = Vector3(sz[0],sz[1],sz[2])
	parent.add_child(mi); mi.set_owner(root); EditorInterface.save_scene()
	return {"path":str(mi.get_path()).trim_prefix("/root/"),"mesh_type":mesh_type}

func _cmd_setup_lighting(p: Dictionary) -> Dictionary:
	var root := _root(); if not root: return {"_error":"No scene open"}
	var parent := _scene_node(p.get("parent_path","")); if not parent: parent = root
	var light_type: String = p.get("light_type","DirectionalLight3D")
	var light: Node3D
	match light_type:
		"DirectionalLight3D": light = DirectionalLight3D.new()
		"OmniLight3D": light = OmniLight3D.new()
		"SpotLight3D": light = SpotLight3D.new()
		_: light = DirectionalLight3D.new()
	var nm: String = p.get("name",light_type); light.name = nm
	var energy := float(p.get("energy",1.0))
	(light as Light3D).light_energy = energy
	if p.has("color"):
		var c = p.get("color"); (light as Light3D).light_color = _parse(c, TYPE_COLOR)
	if light_type == "DirectionalLight3D":
		var preset: String = p.get("preset","")
		if preset == "dramatic": light.rotation_degrees = Vector3(-60,-30,0)
		elif preset == "indoor": light.rotation_degrees = Vector3(-90,0,0)
		else: light.rotation_degrees = Vector3(-45,-45,0)
	elif light is OmniLight3D:
		(light as OmniLight3D).omni_range = float(p.get("range",10.0))
	parent.add_child(light); light.set_owner(root); EditorInterface.save_scene()
	return {"path":str(light.get_path()).trim_prefix("/root/"),"type":light_type}

func _cmd_set_material_3d(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("node_path",""))
	if not (node is MeshInstance3D): return {"_error":"MeshInstance3D not found"}
	var mi := node as MeshInstance3D
	var mat := StandardMaterial3D.new()
	if p.has("albedo_color"): mat.albedo_color = _parse(p.get("albedo_color"), TYPE_COLOR)
	if p.has("metallic"):     mat.metallic     = float(p.get("metallic",0.0))
	if p.has("roughness"):    mat.roughness    = float(p.get("roughness",1.0))
	if p.has("emission"):
		mat.emission_enabled = true; mat.emission = _parse(p.get("emission"), TYPE_COLOR)
	if p.get("transparent",false): mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mi.material_override = mat; EditorInterface.save_scene()
	return {"applied": true, "node": p.get("node_path","")}

func _cmd_setup_environment(p: Dictionary) -> Dictionary:
	var root := _root(); if not root: return {"_error":"No scene open"}
	var parent := _scene_node(p.get("parent_path","")); if not parent: parent = root
	var we := WorldEnvironment.new(); we.name = p.get("name","WorldEnvironment")
	var env := Environment.new()
	var bg: String = p.get("background","sky")
	match bg:
		"color": env.background_mode = Environment.BG_COLOR
		"sky":   env.background_mode = Environment.BG_SKY
		_:       env.background_mode = Environment.BG_SKY
	if p.get("fog", false):
		env.fog_enabled = true
		env.fog_density = float(p.get("fog_density", 0.01))
	if p.get("glow",false): env.glow_enabled = true
	if p.get("ssao",false): env.ssao_enabled = true
	we.environment = env
	parent.add_child(we); we.set_owner(root); EditorInterface.save_scene()
	return {"path":str(we.get_path()).trim_prefix("/root/")}

func _cmd_setup_camera_3d(p: Dictionary) -> Dictionary:
	var root := _root(); if not root: return {"_error":"No scene open"}
	var parent := _scene_node(p.get("parent_path","")); if not parent: parent = root
	var cam := Camera3D.new(); cam.name = p.get("name","Camera3D")
	cam.fov      = float(p.get("fov",75.0))
	cam.near     = float(p.get("near",0.05))
	cam.far      = float(p.get("far",4000.0))
	if p.get("make_current",true): cam.current = true
	parent.add_child(cam); cam.set_owner(root); EditorInterface.save_scene()
	return {"path":str(cam.get_path()).trim_prefix("/root/")}

func _cmd_add_gridmap(p: Dictionary) -> Dictionary:
	var root := _root(); if not root: return {"_error":"No scene open"}
	var parent := _scene_node(p.get("parent_path","")); if not parent: parent = root
	var gm := GridMap.new(); gm.name = p.get("name","GridMap")
	gm.cell_size = Vector3(float(p.get("cell_size",1.0)),float(p.get("cell_size",1.0)),float(p.get("cell_size",1.0)))
	parent.add_child(gm); gm.set_owner(root); EditorInterface.save_scene()
	return {"path":str(gm.get_path()).trim_prefix("/root/")}

# ─────────────────────────────────────────────────────────────
# ═══════════════  PHYSICS  ═══════════════════════════════════
# ─────────────────────────────────────────────────────────────
func _cmd_setup_collision(p: Dictionary) -> Dictionary:
	var root := _root(); if not root: return {"_error":"No scene open"}
	var parent := _scene_node(p.get("parent_path",""))
	if not parent: return {"_error":"parent_path required"}
	var is_3d: bool = p.get("is_3d",false)
	var shape_type: String = p.get("shape","rectangle")
	var col: Node
	if is_3d:
		var cs := CollisionShape3D.new(); cs.name = "CollisionShape3D"
		match shape_type:
			"box":      cs.shape = BoxShape3D.new()
			"sphere":   cs.shape = SphereShape3D.new()
			"capsule":  cs.shape = CapsuleShape3D.new()
			"cylinder": cs.shape = CylinderShape3D.new()
			_:          cs.shape = BoxShape3D.new()
		col = cs
	else:
		var cs := CollisionShape2D.new(); cs.name = "CollisionShape2D"
		match shape_type:
			"circle":    cs.shape = CircleShape2D.new()
			"rectangle": cs.shape = RectangleShape2D.new()
			"capsule":   cs.shape = CapsuleShape2D.new()
			_:           cs.shape = RectangleShape2D.new()
		if p.has("size") and cs.shape is RectangleShape2D:
			var sz = p.get("size")
			if sz is Array: (cs.shape as RectangleShape2D).size = Vector2(sz[0],sz[1])
		col = cs
	parent.add_child(col); col.set_owner(root); EditorInterface.save_scene()
	return {"path":str(col.get_path()).trim_prefix("/root/"),"shape":shape_type}

func _cmd_add_raycast(p: Dictionary) -> Dictionary:
	var root := _root(); if not root: return {"_error":"No scene open"}
	var parent := _scene_node(p.get("parent_path","")); if not parent: parent = root
	var is_3d: bool = p.get("is_3d",false)
	var rc: Node
	if is_3d:
		var r := RayCast3D.new(); r.name = p.get("name","RayCast3D")
		# Positive length = downward (−Y in Godot 3D) to match 2D convention
		r.target_position = Vector3(0, -abs(float(p.get("length",100.0))), 0); rc = r
	else:
		var r := RayCast2D.new(); r.name = p.get("name","RayCast2D")
		# Positive length = downward (+Y in Godot 2D)
		r.target_position = Vector2(0, float(p.get("length",100.0))); rc = r
	parent.add_child(rc); rc.set_owner(root); EditorInterface.save_scene()
	return {"path":str(rc.get_path()).trim_prefix("/root/")}

func _cmd_setup_physics_body(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("node_path",""))
	if not node: return {"_error":"Node not found"}
	if node is CharacterBody2D:
		var b := node as CharacterBody2D
		if p.has("floor_snap_length"): b.floor_snap_length = float(p.get("floor_snap_length"))
		if p.has("floor_max_angle"):   b.floor_max_angle   = deg_to_rad(float(p.get("floor_max_angle",45)))
	elif node is RigidBody2D:
		var b := node as RigidBody2D
		if p.has("gravity_scale"): b.gravity_scale = float(p.get("gravity_scale",1.0))
		if p.has("mass"):          b.mass          = float(p.get("mass",1.0))
	elif node is CharacterBody3D:
		var b := node as CharacterBody3D
		if p.has("floor_snap_length"): b.floor_snap_length = float(p.get("floor_snap_length"))
		if p.has("floor_max_angle"):   b.floor_max_angle   = deg_to_rad(float(p.get("floor_max_angle",45)))
	elif node is RigidBody3D:
		var b := node as RigidBody3D
		if p.has("mass"):          b.mass          = float(p.get("mass",1.0))
		if p.has("gravity_scale"): b.gravity_scale = float(p.get("gravity_scale",1.0))
		if p.has("linear_damp"):   b.linear_damp   = float(p.get("linear_damp"))
		if p.has("angular_damp"):  b.angular_damp  = float(p.get("angular_damp"))
	EditorInterface.save_scene()
	return {"configured": p.get("node_path",""), "type": node.get_class()}

func _cmd_set_physics_layers(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("node_path",""))
	if not node: return {"_error":"Node not found"}
	if p.has("collision_layer"): node.set("collision_layer", int(p.get("collision_layer")))
	if p.has("collision_mask"):  node.set("collision_mask",  int(p.get("collision_mask")))
	EditorInterface.save_scene()
	return {"layer":node.get("collision_layer"),"mask":node.get("collision_mask")}

func _cmd_get_physics_layers(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("node_path",""))
	if not node: return {"_error":"Node not found"}
	return {"layer":node.get("collision_layer"),"mask":node.get("collision_mask")}

func _cmd_get_collision_info(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("node_path",""))
	if not node: return {"_error":"Node not found"}
	var info := {"type":node.get_class(),"layer":node.get("collision_layer"),"mask":node.get("collision_mask"),"shapes":[]}
	for c in node.get_children():
		if c is CollisionShape2D or c is CollisionShape3D:
			var shape_info := {"name":str(c.name),"disabled":c.get("disabled") if c.get("disabled") != null else false}
			if c.get("shape"): shape_info["shape_type"] = c.get("shape").get_class()
			info["shapes"].append(shape_info)
	return info

# ─────────────────────────────────────────────────────────────
# ═══════════════  PARTICLES  ═════════════════════════════════
# ─────────────────────────────────────────────────────────────
func _cmd_create_particles(p: Dictionary) -> Dictionary:
	var root := _root(); if not root: return {"_error":"No scene open"}
	var parent := _scene_node(p.get("parent_path","")); if not parent: parent = root
	var is_3d: bool = p.get("is_3d",false)
	var nm: String = p.get("name","Particles")
	var particles: Node
	if is_3d: particles = GPUParticles3D.new()
	else: particles = GPUParticles2D.new()
	particles.name = nm
	(particles as Node).set("amount", int(p.get("amount",100)))
	(particles as Node).set("lifetime", float(p.get("lifetime",2.0)))
	var mat := ParticleProcessMaterial.new()
	mat.initial_velocity_min = 50.0; mat.initial_velocity_max = 100.0
	(particles as Node).set("process_material", mat)
	var preset: String = p.get("preset","")
	if preset: _apply_preset_to(particles, mat, preset)
	parent.add_child(particles); particles.set_owner(root); EditorInterface.save_scene()
	return {"path":str(particles.get_path()).trim_prefix("/root/"),"is_3d":is_3d}

func _apply_preset_to(particles: Node, mat: ParticleProcessMaterial, preset: String) -> void:
	match preset:
		"fire":
			mat.direction = Vector3(0,-1,0); mat.spread = 20.0
			mat.initial_velocity_min = 80.0; mat.initial_velocity_max = 150.0
			mat.gravity = Vector3(0,-20,0); _set_gradient(mat, [Color.ORANGE, Color.RED, Color(1,0,0,0)])
		"smoke":
			mat.direction = Vector3(0,-1,0); mat.spread = 30.0
			mat.initial_velocity_min = 20.0; mat.initial_velocity_max = 50.0
			_set_gradient(mat, [Color(0.5,0.5,0.5,0.8), Color(0.3,0.3,0.3,0)])
		"rain":
			mat.direction = Vector3(0,1,0); mat.spread = 5.0
			mat.initial_velocity_min = 200.0; mat.initial_velocity_max = 300.0
			_set_gradient(mat, [Color(0.5,0.7,1.0,0.8), Color(0.5,0.7,1.0,0)])
		"snow":
			mat.direction = Vector3(0,1,0); mat.spread = 20.0
			mat.initial_velocity_min = 30.0; mat.initial_velocity_max = 80.0
			_set_gradient(mat, [Color.WHITE, Color(1,1,1,0)])
		"sparks":
			mat.spread = 45.0; mat.initial_velocity_min = 100.0; mat.initial_velocity_max = 200.0
			_set_gradient(mat, [Color.YELLOW, Color.ORANGE, Color(1,0.5,0,0)])

func _set_gradient(mat: ParticleProcessMaterial, colors: Array) -> void:
	var grad := Gradient.new()
	var n := colors.size()
	var offsets := PackedFloat32Array()
	var clrs    := PackedColorArray()
	for i in range(n):
		offsets.append(float(i) / max(n - 1, 1))
		var col = colors[i]
		clrs.append(col if col is Color else Color(col))
	grad.offsets = offsets
	grad.colors  = clrs
	var tex := GradientTexture1D.new(); tex.gradient = grad; mat.color_ramp = tex

func _cmd_set_particle_material(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("node_path",""))
	if not node: return {"_error":"Node not found"}
	var mat: ParticleProcessMaterial = node.get("process_material") as ParticleProcessMaterial
	if not mat: mat = ParticleProcessMaterial.new()
	if p.has("velocity_min"):   mat.initial_velocity_min = float(p.get("velocity_min"))
	if p.has("velocity_max"):   mat.initial_velocity_max = float(p.get("velocity_max"))
	if p.has("spread"):         mat.spread               = float(p.get("spread"))
	if p.has("gravity"):        mat.gravity              = _parse(p.get("gravity"), TYPE_VECTOR3)
	if p.has("direction"):      mat.direction            = _parse(p.get("direction"), TYPE_VECTOR3)
	node.set("process_material", mat); EditorInterface.save_scene()
	return {"configured": true}

func _cmd_set_particle_gradient(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("node_path",""))
	if not node: return {"_error":"Node not found"}
	var mat: ParticleProcessMaterial = node.get("process_material") as ParticleProcessMaterial
	if not mat: return {"_error":"No ParticleProcessMaterial on node"}
	var colors_raw: Array = p.get("colors",[])
	var colors: Array = []
	for c in colors_raw:
		if c is String: colors.append(Color(c))
		elif c is Dictionary: colors.append(_parse(c, TYPE_COLOR))
		else: colors.append(Color.WHITE)
	if colors.size() >= 2: _set_gradient(mat, colors)
	EditorInterface.save_scene(); return {"gradient_set": true}

func _cmd_apply_particle_preset(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("node_path",""))
	if not node: return {"_error":"Node not found"}
	var mat: ParticleProcessMaterial = node.get("process_material") as ParticleProcessMaterial
	if not mat: mat = ParticleProcessMaterial.new()
	_apply_preset_to(node, mat, p.get("preset","fire"))
	node.set("process_material", mat); EditorInterface.save_scene()
	return {"preset_applied": p.get("preset","")}

func _cmd_get_particle_info(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("node_path",""))
	if not node: return {"_error":"Node not found"}
	return {
		"amount":   node.get("amount"), "lifetime": node.get("lifetime"),
		"emitting": node.get("emitting"), "one_shot": node.get("one_shot"),
		"explosiveness": node.get("explosiveness"),
		"has_process_material": node.get("process_material") != null
	}

# ─────────────────────────────────────────────────────────────
# ═══════════════  NAVIGATION  ════════════════════════════════
# ─────────────────────────────────────────────────────────────
func _cmd_setup_nav_region(p: Dictionary) -> Dictionary:
	var root := _root(); if not root: return {"_error":"No scene open"}
	var parent := _scene_node(p.get("parent_path","")); if not parent: parent = root
	var is_3d: bool = p.get("is_3d",false)
	var nm: String = p.get("name","NavigationRegion")
	var region: Node
	if is_3d:
		var r := NavigationRegion3D.new()
		r.navigation_mesh = NavigationMesh.new()   # required for bake_navigation_mesh to work
		region = r
	else:
		var r := NavigationRegion2D.new()
		r.navigation_polygon = NavigationPolygon.new()  # required for bake_navigation_polygon to work
		region = r
	region.name = nm
	parent.add_child(region); region.set_owner(root); EditorInterface.save_scene()
	return {"path":str(region.get_path()).trim_prefix("/root/"),"is_3d":is_3d}

func _cmd_bake_nav_mesh(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("node_path",""))
	if not node: return {"_error":"Node not found"}
	if node is NavigationRegion2D:
		(node as NavigationRegion2D).bake_navigation_polygon()
		return {"baked": "2D navigation polygon"}
	elif node is NavigationRegion3D:
		(node as NavigationRegion3D).bake_navigation_mesh()
		return {"baked": "3D navigation mesh"}
	return {"_error":"Node is not a NavigationRegion"}

func _cmd_setup_nav_agent(p: Dictionary) -> Dictionary:
	var root := _root(); if not root: return {"_error":"No scene open"}
	var parent := _scene_node(p.get("parent_path","")); if not parent: parent = root
	var is_3d: bool = p.get("is_3d",false)
	var agent: Node
	if is_3d:
		agent = NavigationAgent3D.new()
		agent.name = p.get("name", "NavAgent3D")
	else:
		agent = NavigationAgent2D.new()
		agent.name = p.get("name", "NavAgent2D")
	if p.has("avoidance"): agent.set("avoidance_enabled", bool(p.get("avoidance")))
	parent.add_child(agent); agent.set_owner(root); EditorInterface.save_scene()
	return {"path":str(agent.get_path()).trim_prefix("/root/")}

func _cmd_set_nav_layers(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("node_path",""))
	if not node: return {"_error":"Node not found"}
	node.set("navigation_layers", int(p.get("layers",1)))
	EditorInterface.save_scene(); return {"layers": node.get("navigation_layers")}

func _cmd_get_nav_info(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("node_path",""))
	if not node: return {"_error":"Node not found"}
	var info := {"type":node.get_class()}
	if node.get("navigation_layers") != null: info["navigation_layers"] = node.get("navigation_layers")
	if node.get("avoidance_enabled") != null: info["avoidance_enabled"] = node.get("avoidance_enabled")
	return info

# ─────────────────────────────────────────────────────────────
# ═══════════════  AUDIO  ═════════════════════════════════════
# ─────────────────────────────────────────────────────────────
func _cmd_add_audio_player(p: Dictionary) -> Dictionary:
	var root := _root(); if not root: return {"_error":"No scene open"}
	var parent := _scene_node(p.get("parent_path","")); if not parent: parent = root
	var nm: String = p.get("name","AudioPlayer")
	var player: Node
	match p.get("mode","2d"):
		"3d": player = AudioStreamPlayer3D.new()
		"2d": player = AudioStreamPlayer2D.new()
		_:    player = AudioStreamPlayer.new()
	player.name = nm
	if p.has("bus"): player.set("bus", p.get("bus"))
	parent.add_child(player); player.set_owner(root); EditorInterface.save_scene()
	return {"path":str(player.get_path()).trim_prefix("/root/"),"type":player.get_class()}

func _cmd_add_audio_bus(p: Dictionary) -> Dictionary:
	var nm: String = p.get("name",""); if nm == "": return {"_error":"name required"}
	AudioServer.add_bus(); var idx := AudioServer.get_bus_count()-1
	AudioServer.set_bus_name(idx, nm)
	if p.has("volume_db"): AudioServer.set_bus_volume_db(idx, float(p.get("volume_db",0.0)))
	if p.get("send_to_master",true): AudioServer.set_bus_send(idx, "Master")
	return {"bus_index":idx,"name":nm}

func _cmd_set_audio_bus(p: Dictionary) -> Dictionary:
	var idx := int(p.get("bus_index",0))
	if idx >= AudioServer.get_bus_count(): return {"_error":"Bus index out of range"}
	if p.has("name"):      AudioServer.set_bus_name(idx, p.get("name"))
	if p.has("volume_db"): AudioServer.set_bus_volume_db(idx, float(p.get("volume_db",0.0)))
	if p.has("mute"):      AudioServer.set_bus_mute(idx, bool(p.get("mute")))
	if p.has("solo"):      AudioServer.set_bus_solo(idx, bool(p.get("solo")))
	return {"bus_index":idx,"name":AudioServer.get_bus_name(idx),"volume_db":AudioServer.get_bus_volume_db(idx)}

func _cmd_add_bus_effect(p: Dictionary) -> Dictionary:
	var idx := int(p.get("bus_index",0))
	if idx >= AudioServer.get_bus_count(): return {"_error":"Bus index out of range"}
	var effect_type: String = p.get("effect","reverb")
	var effect: AudioEffect
	match effect_type:
		"reverb":     effect = AudioEffectReverb.new()
		"delay":      effect = AudioEffectDelay.new()
		"compressor": effect = AudioEffectCompressor.new()
		"limiter":    effect = AudioEffectLimiter.new()
		"eq":         effect = AudioEffectEQ10.new()
		"chorus":     effect = AudioEffectChorus.new()
		"distortion": effect = AudioEffectDistortion.new()
		_:            effect = AudioEffectReverb.new()
	AudioServer.add_bus_effect(idx, effect)
	return {"bus_index":idx,"effect":effect_type}

func _cmd_get_bus_layout(_p: Dictionary) -> Dictionary:
	var buses: Array = []
	for i in range(AudioServer.get_bus_count()):
		var effects: Array = []
		for j in range(AudioServer.get_bus_effect_count(i)):
			effects.append(AudioServer.get_bus_effect(i,j).get_class())
		buses.append({"index":i,"name":AudioServer.get_bus_name(i),"volume_db":AudioServer.get_bus_volume_db(i),"mute":AudioServer.is_bus_mute(i),"effects":effects})
	return {"buses":buses}

func _cmd_get_audio_info(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("node_path",""))
	if not node: return {"_error":"Node not found"}
	var players: Array = []
	_find_audio_players(node, players)
	return {"players":players}

func _find_audio_players(node: Node, out: Array) -> void:
	if node is AudioStreamPlayer or node is AudioStreamPlayer2D or node is AudioStreamPlayer3D:
		out.append({"name":str(node.name),"type":node.get_class(),"bus":node.get("bus"),"path":str(node.get_path()).trim_prefix("/root/")})
	for c in node.get_children(): _find_audio_players(c, out)

# ─────────────────────────────────────────────────────────────
# ═══════════════  THEME & UI  ════════════════════════════════
# ─────────────────────────────────────────────────────────────
func _cmd_create_theme(p: Dictionary) -> Dictionary:
	var path := _res(p.get("path","res://theme.tres"))
	var theme := Theme.new()
	var err := ResourceSaver.save(theme, path)
	if err != OK: return {"_error":"Save failed: "+error_string(err)}
	EditorInterface.get_resource_filesystem().scan()
	return {"created":path}

func _cmd_set_theme_color(p: Dictionary) -> Dictionary:
	var path := _res(p.get("theme_path",""))
	var theme: Theme
	if FileAccess.file_exists(path): theme = load(path) as Theme
	if not theme: theme = Theme.new()
	var color = _parse(p.get("color","#ffffff"), TYPE_COLOR)
	theme.set_color(p.get("name","font_color"), p.get("control_type","Label"), color)
	if path != "res://": ResourceSaver.save(theme, path)
	return {"set":true,"color":_serialize(color)}

func _cmd_set_theme_constant(p: Dictionary) -> Dictionary:
	var path := _res(p.get("theme_path",""))
	var theme: Theme
	if FileAccess.file_exists(path): theme = load(path) as Theme
	if not theme: theme = Theme.new()
	theme.set_constant(p.get("name",""), p.get("control_type",""), int(p.get("value",0)))
	if path != "res://": ResourceSaver.save(theme, path)
	return {"set":true}

func _cmd_set_theme_font_size(p: Dictionary) -> Dictionary:
	var path := _res(p.get("theme_path",""))
	var theme: Theme
	if FileAccess.file_exists(path): theme = load(path) as Theme
	if not theme: theme = Theme.new()
	theme.set_font_size(p.get("name","font_size"), p.get("control_type","Label"), int(p.get("size",16)))
	if path != "res://": ResourceSaver.save(theme, path)
	return {"set":true,"size":int(p.get("size",16))}

func _cmd_set_theme_stylebox(p: Dictionary) -> Dictionary:
	var path := _res(p.get("theme_path",""))
	var theme: Theme
	if FileAccess.file_exists(path): theme = load(path) as Theme
	if not theme: theme = Theme.new()
	var sb := StyleBoxFlat.new()
	if p.has("bg_color"):      sb.bg_color      = _parse(p.get("bg_color"), TYPE_COLOR)
	if p.has("border_color"):  sb.border_color  = _parse(p.get("border_color"), TYPE_COLOR)
	if p.has("border_width"):  sb.set_border_width_all(int(p.get("border_width",0)))
	if p.has("corner_radius"): sb.set_corner_radius_all(int(p.get("corner_radius",0)))
	if p.has("content_margin"): sb.set_content_margin_all(float(p.get("content_margin",0)))
	theme.set_stylebox(p.get("name","panel"), p.get("control_type","PanelContainer"), sb)
	if path != "res://": ResourceSaver.save(theme, path)
	return {"set":true}

func _cmd_get_theme_info(p: Dictionary) -> Dictionary:
	var path := _res(p.get("theme_path",""))
	if not FileAccess.file_exists(path): return {"_error":"Theme file not found: "+path}
	var theme := load(path) as Theme
	if not theme: return {"_error":"Cannot load theme"}
	return {"path":path,"type_count":theme.get_type_list().size(),"types":Array(theme.get_type_list())}

# ─────────────────────────────────────────────────────────────
# ═══════════════  SHADER  ════════════════════════════════════
# ─────────────────────────────────────────────────────────────
func _cmd_create_shader(p: Dictionary) -> Dictionary:
	var path := _res(p.get("path",""))
	if path == "res://": return {"_error":"path required (e.g. 'res://shaders/my.gdshader')"}
	var shader_type: String = p.get("shader_type","canvas_item")
	var content: String = p.get("content","")
	if content == "": content = "shader_type %s;\n\nvoid fragment() {\n\t// your code here\n}\n" % shader_type
	var f := FileAccess.open(path, FileAccess.WRITE)
	if not f: return {"_error":"Cannot write: "+path}
	f.store_string(content); f.close()
	EditorInterface.get_resource_filesystem().scan()
	return {"created":path}

func _cmd_read_shader(p: Dictionary) -> Dictionary:
	var path := _res(p.get("path",""))
	var f := FileAccess.open(path, FileAccess.READ)
	if not f: return {"_error":"File not found: "+path}
	var content := f.get_as_text(); f.close()
	return {"path":path,"content":content}

func _cmd_edit_shader(p: Dictionary) -> Dictionary:
	var path := _res(p.get("path",""))
	if p.has("content"):
		var f := FileAccess.open(path, FileAccess.WRITE)
		if not f: return {"_error":"Cannot write: "+path}
		f.store_string(p["content"]); f.close()
		EditorInterface.get_resource_filesystem().scan()
		return {"edited":path}
	var search: String = p.get("search",""); var rep: String = p.get("replace","")
	if search == "": return {"_error":"content or search required"}
	var f := FileAccess.open(path, FileAccess.READ)
	if not f: return {"_error":"File not found: "+path}
	var content := f.get_as_text(); f.close()
	content = content.replace(search, rep)
	f = FileAccess.open(path, FileAccess.WRITE); f.store_string(content); f.close()
	EditorInterface.get_resource_filesystem().scan()
	return {"edited":path}

func _cmd_assign_shader_material(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("node_path",""))
	if not node: return {"_error":"Node not found"}
	var shader_path := _res(p.get("shader_path",""))
	var shader := load(shader_path) as Shader
	if not shader: return {"_error":"Shader not found: "+shader_path}
	var mat := ShaderMaterial.new(); mat.shader = shader
	node.set("material", mat); EditorInterface.save_scene()
	return {"assigned":shader_path}

func _cmd_set_shader_param(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("node_path",""))
	if not node: return {"_error":"Node not found"}
	var mat: ShaderMaterial = node.get("material") as ShaderMaterial
	if not mat: return {"_error":"No ShaderMaterial on node"}
	mat.set_shader_parameter(p.get("param",""), _parse(p.get("value")))
	EditorInterface.save_scene(); return {"param":p.get("param",""),"set":true}

func _cmd_get_shader_params(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("node_path",""))
	if not node: return {"_error":"Node not found"}
	var mat: ShaderMaterial = node.get("material") as ShaderMaterial
	if not mat: return {"_error":"No ShaderMaterial on node"}
	if not mat.shader: return {"params":[]}
	var params: Array = []
	for param in mat.shader.get_shader_uniform_list():
		params.append({"name":param["name"],"type":param["type"],"value":_serialize(mat.get_shader_parameter(param["name"]))})
	return {"params":params}

# ─────────────────────────────────────────────────────────────
# ═══════════════  RESOURCE  ══════════════════════════════════
# ─────────────────────────────────────────────────────────────
func _cmd_create_resource(p: Dictionary) -> Dictionary:
	var path := _res(p.get("path",""))
	if path == "res://": return {"_error":"path required"}
	var type: String = p.get("type","Resource")
	var res: Resource
	if ClassDB.class_exists(type) and ClassDB.is_parent_class(type, "Resource"):
		res = ClassDB.instantiate(type)
	else: res = Resource.new()
	var err := ResourceSaver.save(res, path)
	if err != OK: return {"_error":"Save failed: "+error_string(err)}
	EditorInterface.get_resource_filesystem().scan()
	return {"created":path,"type":res.get_class()}

func _cmd_read_resource(p: Dictionary) -> Dictionary:
	var path := _res(p.get("path",""))
	var res := load(path)
	if not res: return {"_error":"Cannot load: "+path}
	var props: Dictionary = {}
	var excl := PROPERTY_USAGE_GROUP | PROPERTY_USAGE_CATEGORY | PROPERTY_USAGE_SUBGROUP
	for info in res.get_property_list():
		var u := int(info["usage"])
		if (u & PROPERTY_USAGE_STORAGE) and not (u & excl):
			var val = res.get(info["name"]); if val != null: props[info["name"]] = _serialize(val)
	return {"path":path,"type":res.get_class(),"properties":props}

func _cmd_edit_resource(p: Dictionary) -> Dictionary:
	var path := _res(p.get("path",""))
	var res := load(path)
	if not res: return {"_error":"Cannot load: "+path}
	var props: Dictionary = p.get("properties",{})
	for key in props: res.set(key, _parse(props[key]))
	var err := ResourceSaver.save(res, path)
	if err != OK: return {"_error":"Save failed: "+error_string(err)}
	return {"saved":path,"properties_set":props.size()}

# ─────────────────────────────────────────────────────────────
# ═══════════════  BATCH & REFACTORING  ═══════════════════════
# ─────────────────────────────────────────────────────────────
func _cmd_find_nodes_by_type(p: Dictionary) -> Dictionary:
	var type_name: String = p.get("type",""); if type_name == "": return {"_error":"type required"}
	var scene_path: String = p.get("scene_path","")
	var results: Array = []
	if scene_path:
		var packed := load(_res(scene_path)) as PackedScene
		if packed:
			var root := packed.instantiate(); _find_by_type(root, type_name, results); root.free()
	else:
		var root := _root()
		if root: _find_by_type(root, type_name, results)
	return {"type":type_name,"nodes":results,"count":results.size()}

func _cmd_batch_set_property(p: Dictionary) -> Dictionary:
	var paths: Array = p.get("node_paths",[])
	var prop: String = p.get("property",""); if prop == "": return {"_error":"property required"}
	var val = p.get("value"); var changed := 0
	for node_path in paths:
		var node := _scene_node(str(node_path))
		if node:
			var hint := TYPE_NIL
			for info in node.get_property_list():
				if info["name"] == prop: hint = int(info["type"]); break
			node.set(prop, _parse(val, hint)); changed += 1
	if changed > 0: EditorInterface.save_scene()
	return {"changed":changed,"property":prop}

func _cmd_find_signal_connections(p: Dictionary) -> Dictionary:
	var signal_name: String = p.get("signal",""); var root := _root()
	if not root: return {"_error":"No scene open"}
	var results: Array = []; _find_signal_conns(root, signal_name, results)
	return {"signal":signal_name,"connections":results}

func _find_signal_conns(node: Node, sig_filter: String, out: Array) -> void:
	for sig in node.get_signal_list():
		var sig_name: String = sig["name"]
		if sig_filter == "" or sig_name == sig_filter:
			for conn in node.get_signal_connection_list(sig_name):
				out.append({"from_node":str(node.get_path()).trim_prefix("/root/"),"signal":sig_name,"to_method":conn["callable"].get_method()})
	for c in node.get_children(): _find_signal_conns(c, sig_filter, out)

func _cmd_find_node_references(p: Dictionary) -> Dictionary:
	var name: String = p.get("name",""); if name == "": return {"_error":"name required"}
	var scripts: Array = []; _collect_ext("res://", scripts, "gd")
	var results: Array = []
	for script_path in scripts:
		var f := FileAccess.open(script_path, FileAccess.READ)
		if not f: continue
		var content := f.get_as_text(); f.close()
		var line_num := 1
		for line in content.split("\n"):
			if line.contains(name): results.append({"file":script_path,"line":line_num,"content":line.strip_edges()})
			line_num += 1
	return {"name":name,"references":results,"count":results.size()}

func _cmd_get_scene_dependencies(p: Dictionary) -> Dictionary:
	var scene_path := _res(p.get("scene_path",""))
	if not FileAccess.file_exists(scene_path): return {"_error":"Scene not found: "+scene_path}
	var f := FileAccess.open(scene_path, FileAccess.READ)
	if not f: return {"_error":"Cannot open: "+scene_path}
	var content := f.get_as_text(); f.close()
	var deps: Array = []
	for line in content.split("\n"):
		if line.begins_with("[ext_resource"):
			var path_start := line.find("path=\"")+6
			var path_end := line.find("\"", path_start)
			if path_start > 5 and path_end > path_start:
				deps.append(line.substr(path_start, path_end-path_start))
	return {"scene":scene_path,"dependencies":deps,"count":deps.size()}

func _cmd_cross_scene_set_property(p: Dictionary) -> Dictionary:
	var type_name: String = p.get("node_type",""); var prop: String = p.get("property","")
	var val = p.get("value")
	if type_name == "" or prop == "": return {"_error":"node_type and property required"}
	var all_scenes: Array = []; _collect_ext("res://", all_scenes, "tscn")
	var total_changed := 0; var scenes_modified := 0
	for scene_path in all_scenes:
		var packed := load(scene_path) as PackedScene
		if not packed: continue
		var root := packed.instantiate(); var matches: Array = []
		_find_by_type(root, type_name, matches)
		if matches.size() > 0:
			for node_path in matches:
				var node := root.get_node_or_null(node_path)
				if node:
					node.set(prop, _parse(val))
					total_changed += 1
			var new_packed := PackedScene.new(); new_packed.pack(root)
			ResourceSaver.save(new_packed, scene_path)
			scenes_modified += 1
		root.free()
	EditorInterface.get_resource_filesystem().scan()
	return {"scenes_modified": scenes_modified, "nodes_changed": total_changed}

# ─────────────────────────────────────────────────────────────
# ═══════════════  CODE ANALYSIS  ═════════════════════════════
# ─────────────────────────────────────────────────────────────
func _cmd_project_statistics(_p: Dictionary) -> Dictionary:
	var all: Array = []; _scan_dir("res://", all, 0, 20)
	var flat: Array = []; _flatten(all, flat)
	var by_ext: Dictionary = {}
	for f in flat:
		var e: String = f["ext"]; by_ext[e] = by_ext.get(e,0)+1
	var stats := {"total_files":flat.size(),"by_extension":by_ext}
	var root := _root()
	if root:
		stats["scene_nodes"] = _count_nodes(root)
		stats["scene_max_depth"] = _scene_max_depth(root)
	return stats

func _cmd_find_unused_resources(_p: Dictionary) -> Dictionary:
	# Find resources not referenced in any scene or script
	var all_res: Array = []; var all_scenes: Array = []; var all_scripts: Array = []
	for ext in ["png","jpg","ogg","wav","mp3","tres","res"]:
		_collect_ext("res://", all_res, ext)
	_collect_ext("res://", all_scenes, "tscn"); _collect_ext("res://", all_scripts, "gd")
	var referenced: Dictionary = {}
	for file_path in (all_scenes + all_scripts):
		var f := FileAccess.open(file_path, FileAccess.READ)
		if not f: continue
		var content := f.get_as_text(); f.close()
		for res_path in all_res:
			# Use full res:// path for accurate matching — avoids false positives from same-name files
			if content.contains(res_path): referenced[res_path] = true
	var unused: Array = []
	for res_path in all_res:
		if not referenced.has(res_path): unused.append(res_path)
	return {"unused":unused,"count":unused.size()}

func _cmd_analyze_scene_complexity(p: Dictionary) -> Dictionary:
	var scene_path: String = p.get("scene_path","")
	var root: Node
	if scene_path:
		var packed := load(_res(scene_path)) as PackedScene
		if not packed: return {"_error":"Scene not found"}
		root = packed.instantiate()
	else:
		root = _root(); if not root: return {"_error":"No scene open"}
	var total := _count_nodes(root); var depth := _scene_max_depth(root)
	var script_count := _count_scripts(root)
	var result := {"total_nodes":total,"max_depth":depth,"nodes_with_scripts":script_count}
	if scene_path: root.free()
	return result

func _count_scripts(node: Node) -> int:
	var n := 1 if node.get_script() else 0
	for c in node.get_children(): n += _count_scripts(c)
	return n

func _cmd_find_script_references(p: Dictionary) -> Dictionary:
	var search_str: String = p.get("symbol",""); if search_str == "": return {"_error":"symbol required"}
	var scripts: Array = []; _collect_ext("res://", scripts, "gd")
	var results: Array = []
	for script_path in scripts:
		var f := FileAccess.open(script_path, FileAccess.READ)
		if not f: continue
		var content := f.get_as_text(); f.close()
		var count := content.count(search_str)
		if count > 0: results.append({"path":script_path,"occurrences":count})
	return {"symbol":search_str,"files":results,"total_files":results.size()}

func _cmd_detect_circular_deps(_p: Dictionary) -> Dictionary:
	# Simple approach: check autoloads and extends chains
	var scripts: Array = []; _collect_ext("res://", scripts, "gd")
	var extends_map: Dictionary = {}
	for script_path in scripts:
		var f := FileAccess.open(script_path, FileAccess.READ)
		if not f: continue
		var first_lines := f.get_as_text().split("\n")[:5]; f.close()
		for line in first_lines:
			if line.begins_with("extends ") and "\"" in line:
				var dep_path := line.split("\"")[1]
				extends_map[script_path] = dep_path
	# Detect cycles
	var cycles: Array = []
	for script_path in extends_map:
		var visited := [script_path]; var current := script_path
		while extends_map.has(current):
			current = extends_map[current]
			if current in visited:
				cycles.append({"cycle":visited+[current]}); break
			visited.append(current)
	return {"circular_dependencies":cycles,"found":cycles.size()}

func _cmd_analyze_signal_flow(p: Dictionary) -> Dictionary:
	var root := _root(); if not root: return {"_error":"No scene open"}
	var flow: Array = []; _find_signal_conns(root, "", flow)
	return {"signal_connections":flow,"total":flow.size()}

# ─────────────────────────────────────────────────────────────
# ═══════════════  PROFILING  ═════════════════════════════════
# ─────────────────────────────────────────────────────────────
func _cmd_get_performance(_p: Dictionary) -> Dictionary:
	return {
		"fps":               Performance.get_monitor(Performance.TIME_FPS),
		"frame_time_ms":     Performance.get_monitor(Performance.TIME_PROCESS)*1000,
		"memory_static_mb":  Performance.get_monitor(Performance.MEMORY_STATIC)/1048576.0,
		"objects":           Performance.get_monitor(Performance.OBJECT_COUNT),
		"nodes":             Performance.get_monitor(Performance.OBJECT_NODE_COUNT),
		"draw_calls":        Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),
		"physics_2d_active": Performance.get_monitor(Performance.PHYSICS_2D_ACTIVE_OBJECTS),
		"physics_3d_active": Performance.get_monitor(Performance.PHYSICS_3D_ACTIVE_OBJECTS),
	}

func _cmd_get_editor_perf(_p: Dictionary) -> Dictionary:
	var root := _root()
	return {
		"fps":             Engine.get_frames_per_second(),
		"scene_open":      root != null,
		"scene_node_count":_count_nodes(root) if root else 0,
		"physics_ticks":   Engine.physics_ticks_per_second,
	}

# ─────────────────────────────────────────────────────────────
# ═══════════════  EXPORT  ════════════════════════════════════
# ─────────────────────────────────────────────────────────────
func _cmd_list_export_presets(_p: Dictionary) -> Dictionary:
	var cfg := ConfigFile.new()
	var err := cfg.load("res://export_presets.cfg")
	if err != OK: return {"presets":[],"note":"No export_presets.cfg found"}
	var presets: Array = []
	for section in cfg.get_sections():
		if section.begins_with("preset."):
			presets.append({"name":cfg.get_value(section,"name",""),"platform":cfg.get_value(section,"platform",""),"export_path":cfg.get_value(section,"export_path","")})
	return {"presets":presets,"count":presets.size()}

func _cmd_get_export_info(_p: Dictionary) -> Dictionary:
	var cfg := ConfigFile.new()
	if cfg.load("res://export_presets.cfg") != OK: return {"_error":"No export presets configured"}
	var info: Array = []
	for section in cfg.get_sections():
		var d := {}; for key in cfg.get_section_keys(section): d[key] = cfg.get_value(section,key)
		info.append({"section":section,"data":d})
	return {"export_info":info}

func _cmd_export_project(p: Dictionary) -> Dictionary:
	var preset_name: String = p.get("preset","")
	var export_path: String = p.get("export_path","")
	if preset_name == "": return {"_error":"preset required (run list_export_presets to see available names)"}
	if export_path == "": return {"_error":"export_path required (e.g. 'build/MyGame.exe' or 'build/MyGame.apk')"}
	# Editor plugins cannot safely run subprocesses — return the equivalent CLI command instead
	var project_path := ProjectSettings.globalize_path("res://")
	var cmd := "godot --headless --export-release \"%s\" \"%s\"" % [preset_name, export_path]
	return {"note":"Run this command from your project directory","command":cmd,"project_path":project_path}

# ─────────────────────────────────────────────────────────────
# ═══════════════  EDITOR  ════════════════════════════════════
# ─────────────────────────────────────────────────────────────
func _cmd_set_main_scene(p: Dictionary) -> Dictionary:
	var path := _res(p.get("path",""))
	if path == "res://": return {"_error":"path required"}
	ProjectSettings.set_setting("application/run/main_scene", path); ProjectSettings.save()
	return {"main_scene":path}

func _cmd_screenshot(_p: Dictionary) -> Dictionary:
	var img := DisplayServer.screen_get_image(0)
	if not img: return {"_error":"Screenshot failed"}
	return {"image_base64":Marshalls.raw_to_base64(img.save_png_to_buffer()),"format":"png","width":img.get_width(),"height":img.get_height()}

func _cmd_reload(_p: Dictionary) -> Dictionary:
	EditorInterface.get_resource_filesystem().scan(); return {"reloaded":true}

# ─────────────────────────────────────────────────────────────
# ═══════════  NEW: PROJECT UID  ══════════════════════════════
# ─────────────────────────────────────────────────────────────
func _cmd_path_to_uid(p: Dictionary) -> Dictionary:
	var path := _res(p.get("path",""))
	if path == "res://": return {"_error":"path required"}
	var uid := ResourceLoader.get_resource_uid(path)
	if uid == ResourceUID.INVALID_ID:
		return {"_error":"UID not found for: "+path+" (file may not exist or hasn't been imported yet)"}
	return {"path":path,"uid_int":uid,"uid_text":ResourceUID.id_to_text(uid)}

func _cmd_uid_to_path(p: Dictionary) -> Dictionary:
	var uid_raw: String = str(p.get("uid",""))
	if uid_raw == "": return {"_error":"uid required (int or 'uid://xxxx' string)"}
	var uid_int: int
	if uid_raw.begins_with("uid://"):
		uid_int = ResourceUID.text_to_id(uid_raw)
	else:
		uid_int = int(uid_raw)
	if not ResourceUID.has_id(uid_int):
		return {"_error":"UID not found: "+uid_raw}
	var path := ResourceUID.get_id_path(uid_int)
	return {"uid":uid_raw,"uid_int":uid_int,"path":path}

# ─────────────────────────────────────────────────────────────
# ═══════════  NEW: NODE  ═════════════════════════════════════
# ─────────────────────────────────────────────────────────────
func _cmd_disconnect_signal(p: Dictionary) -> Dictionary:
	var source := _scene_node(p.get("source_path",""))
	if not source: return {"_error":"Source node not found"}
	var target := _scene_node(p.get("target_path",""))
	if not target: return {"_error":"Target node not found"}
	var sig: String = p.get("signal",""); var method: String = p.get("method","")
	if sig == "" or method == "": return {"_error":"signal and method required"}
	var cb := Callable(target, method)
	if not source.is_connected(sig, cb):
		return {"_error":"Signal '%s' is not connected to '%s'" % [sig, method]}
	source.disconnect(sig, cb)
	EditorInterface.save_scene()
	return {"disconnected":"%s → %s.%s" % [sig, p.get("target_path",""), method]}

func _cmd_set_anchor_preset(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("path",""))
	if not node: return {"_error":"Node not found: "+p.get("path","")}
	if not (node is Control):
		return {"_error":"Node is not a Control (required for anchor presets): "+p.get("path","")}
	var presets := {
		"top_left":Control.PRESET_TOP_LEFT,"top_right":Control.PRESET_TOP_RIGHT,
		"bottom_left":Control.PRESET_BOTTOM_LEFT,"bottom_right":Control.PRESET_BOTTOM_RIGHT,
		"center_left":Control.PRESET_CENTER_LEFT,"center_right":Control.PRESET_CENTER_RIGHT,
		"center_top":Control.PRESET_CENTER_TOP,"center_bottom":Control.PRESET_CENTER_BOTTOM,
		"center":Control.PRESET_CENTER,
		"left_wide":Control.PRESET_LEFT_WIDE,"right_wide":Control.PRESET_RIGHT_WIDE,
		"top_wide":Control.PRESET_TOP_WIDE,"bottom_wide":Control.PRESET_BOTTOM_WIDE,
		"vcenter_wide":Control.PRESET_VCENTER_WIDE,"hcenter_wide":Control.PRESET_HCENTER_WIDE,
		"full_rect":Control.PRESET_FULL_RECT,
	}
	var preset_name: String = p.get("preset","full_rect").to_lower()
	if not presets.has(preset_name):
		return {"_error":"Unknown preset '%s'. Valid: %s" % [preset_name, ", ".join(presets.keys())]}
	(node as Control).set_anchors_and_offsets_preset(presets[preset_name])
	EditorInterface.save_scene()
	return {"path":p.get("path",""),"preset":preset_name}

func _cmd_add_resource_to_node(p: Dictionary) -> Dictionary:
	var node := _scene_node(p.get("path",""))
	if not node: return {"_error":"Node not found: "+p.get("path","")}
	var property: String = p.get("property","")
	var resource_type: String = p.get("resource_type","")
	if property == "" or resource_type == "": return {"_error":"property and resource_type required"}
	if not ClassDB.class_exists(resource_type): return {"_error":"Unknown type: "+resource_type}
	var res = ClassDB.instantiate(resource_type)
	if not (res is Resource): return {"_error":resource_type+" is not a Resource"}
	var init_props: Dictionary = p.get("properties",{})
	for key in init_props: res.set(key, _parse(init_props[key]))
	node.set(property, res)
	EditorInterface.save_scene()
	return {"path":p.get("path",""),"property":property,"resource_type":resource_type}

# ─────────────────────────────────────────────────────────────
# ═══════════  NEW: SCRIPT  ═══════════════════════════════════
# ─────────────────────────────────────────────────────────────
func _cmd_get_open_scripts(_p: Dictionary) -> Dictionary:
	var scripts: Array = []
	for scr in EditorInterface.get_script_editor().get_open_scripts():
		scripts.append({"path":scr.resource_path,"type":scr.get_class()})
	return {"scripts":scripts,"count":scripts.size()}

# ─────────────────────────────────────────────────────────────
# ═══════════  NEW: EDITOR  ═══════════════════════════════════
# ─────────────────────────────────────────────────────────────
func _cmd_clear_output(_p: Dictionary) -> Dictionary:
	# No direct public API — print a visual divider instead
	print_rich("\n\n[color=gray]" + "─".repeat(60) + "[/color]")
	print_rich("[color=cyan][MCP] ── Output cleared ──[/color]")
	print_rich("[color=gray]" + "─".repeat(60) + "[/color]\n\n")
	return {"cleared":true}

func _cmd_reload_plugin(p: Dictionary) -> Dictionary:
	var name: String = p.get("name","")
	if name == "":
		# Rescan filesystem as a lightweight reload signal
		EditorInterface.get_resource_filesystem().scan()
		return {"reloaded":"filesystem","note":"Provide 'name' to reload a specific plugin"}
	if not EditorInterface.is_plugin_enabled(name):
		return {"_error":"Plugin not found or not enabled: "+name}
	EditorInterface.set_plugin_enabled(name, false)
	EditorInterface.set_plugin_enabled(name, true)
	return {"reloaded":name}

func _cmd_execute_editor_script(p: Dictionary) -> Dictionary:
	var code: String = p.get("code","")
	if code == "": return {"_error":"code required"}
	var script := GDScript.new()
	script.source_code = (
		"@tool\nextends RefCounted\n\nvar result = null\n\n"
		+ "func run() -> void:\n\t"
		+ code.replace("\n", "\n\t") + "\n"
	)
	var err := script.reload()
	if err != OK: return {"_error":"Script compile error: "+error_string(err)}
	var obj = script.new()
	obj.run()
	var res = obj.get("result")
	return {"executed":true,"result":_serialize(res) if res != null else null}

# Reference screenshot storage for compare_screenshots
var _ref_screenshot: Image = null

func _cmd_compare_screenshots(p: Dictionary) -> Dictionary:
	var mode: String = p.get("mode","compare")
	if mode == "save_reference":
		_ref_screenshot = DisplayServer.screen_get_image(0)
		if not _ref_screenshot: return {"_error":"Screenshot failed"}
		return {"saved":true,"width":_ref_screenshot.get_width(),"height":_ref_screenshot.get_height()}
	# Compare mode
	if mode != "compare":
		return {"_error":"Unknown mode '%s'. Valid values: 'save_reference', 'compare'" % mode}
	if not _ref_screenshot:
		return {"_error":"No reference saved. Call with mode='save_reference' first, then call with mode='compare'"}
	var img := DisplayServer.screen_get_image(0)
	if not img: return {"_error":"Screenshot failed"}
	var threshold := float(p.get("threshold",10)) / 255.0
	var max_diff_pct := float(p.get("max_diff_percent",5.0))
	var sample_n := 2000
	var w := min(img.get_width(), _ref_screenshot.get_width())
	var h := min(img.get_height(), _ref_screenshot.get_height())
	var diff_count := 0
	for _i in range(sample_n):
		var x := randi() % w; var y := randi() % h
		var c1 := img.get_pixel(x, y); var c2 := _ref_screenshot.get_pixel(x, y)
		if (abs(c1.r-c2.r)+abs(c1.g-c2.g)+abs(c1.b-c2.b)) > threshold*3:
			diff_count += 1
	var diff_pct := float(diff_count)/sample_n*100.0
	return {
		"diff_percent": snappedf(diff_pct, 0.01),
		"similar": diff_pct < max_diff_pct,
		"samples": sample_n,
		"threshold": p.get("threshold",10),
	}
