## MCPRuntime — auto-loaded into the running game (port 9501)
## Provides: input simulation, runtime scene inspection, screenshots, testing
extends Node

const PORT := 9501
const MAX_CLIENTS := 2

var _server := TCPServer.new()
var _clients: Array[StreamPeerTCP] = []
var _buffers: Dictionary = {}
var _handlers: Dictionary = {}

# Recording state
var _recording := false
var _recorded_events: Array = []
var _recording_start_ms := 0

# ─────────────────────────────────────────────────────────────
# Lifecycle
# ─────────────────────────────────────────────────────────────
func _ready() -> void:
	_build_handlers()
	var err := _server.listen(PORT)
	if err != OK:
		push_warning("[MCPRuntime] Cannot listen on port %d: %s" % [PORT, error_string(err)])
		return
	print("[MCPRuntime] Listening on port %d" % PORT)

func _exit_tree() -> void:
	_server.stop()
	for c in _clients:
		if c.get_status() == StreamPeerTCP.STATUS_CONNECTED:
			c.disconnect_from_host()

func _process(_dt: float) -> void:
	while _server.is_connection_available() and _clients.size() < MAX_CLIENTS:
		var c := _server.take_connection()
		_clients.append(c)
		_buffers[c.get_instance_id()] = ""
		print("[MCPRuntime] Client connected")
	for c in _clients.duplicate():
		c.poll()
		if c.get_status() != StreamPeerTCP.STATUS_CONNECTED:
			_buffers.erase(c.get_instance_id()); _clients.erase(c); continue
		var avail := c.get_available_bytes()
		if avail <= 0: continue
		var key := c.get_instance_id()
		_buffers[key] = _buffers.get(key,"") + c.get_utf8_string(avail)
		while "\n" in _buffers[key]:
			var idx := _buffers[key].find("\n")
			var line := _buffers[key].substr(0,idx).strip_edges()
			_buffers[key] = _buffers[key].substr(idx+1)
			if line != "": _handle(c, line)

# ─────────────────────────────────────────────────────────────
# Dispatch
# ─────────────────────────────────────────────────────────────
func _build_handlers() -> void:
	_handlers = {
		"ping":                  _cmd_ping,
		# ── Input Simulation ──────────────────────
		"simulate_key":          _cmd_sim_key,
		"simulate_mouse_click":  _cmd_sim_mouse_click,
		"simulate_mouse_move":   _cmd_sim_mouse_move,
		"simulate_action":       _cmd_sim_action,
		"simulate_sequence":     _cmd_sim_sequence,
		# ── Runtime Scene ─────────────────────────
		"get_game_scene_tree":          _cmd_game_scene_tree,
		"get_game_node_properties":     _cmd_game_node_props,
		"set_game_node_properties":     _cmd_set_game_node_props,
		"execute_game_script":          _cmd_execute_game_script,
		"get_game_screenshot":          _cmd_game_screenshot,
		"capture_frames":               _cmd_capture_frames,
		"monitor_properties":           _cmd_monitor_props,
		"find_ui_elements":             _cmd_find_ui_elements,
		"click_button_by_text":         _cmd_click_button_by_text,
		"wait_for_node":                _cmd_wait_for_node,
		"batch_get_properties":         _cmd_batch_get_props,
		"find_nodes_by_script":         _cmd_find_by_script,
		"get_autoload":                 _cmd_get_autoload,
		# ── Testing & QA ──────────────────────────
		"run_test_scenario":     _cmd_run_test_scenario,
		"assert_node_state":     _cmd_assert_node_state,
		"assert_screen_text":    _cmd_assert_screen_text,
		"run_stress_test":       _cmd_run_stress_test,
		"get_test_report":       _cmd_get_test_report,
		# ── Input Recording ───────────────────────
		"start_recording":       _cmd_start_recording,
		"stop_recording":        _cmd_stop_recording,
		"replay_recording":      _cmd_replay_recording,
	}

func _handle(c: StreamPeerTCP, raw: String) -> void:
	var req = JSON.parse_string(raw)
	if req == null: _reply_err(c,"?","Invalid JSON"); return
	var id: String = str(req.get("id","?")); var cmd: String = req.get("command","")
	var p: Dictionary = req.get("params",{})
	var handler: Callable = _handlers.get(cmd, Callable())
	if not handler.is_valid(): _reply_err(c,id,"Unknown command: "+cmd); return
	# Async commands (contain await internally) must be dispatched differently
	var _ASYNC_CMDS := [
		"simulate_sequence", "replay_recording",
		"capture_frames", "monitor_properties", "wait_for_node",
		"run_stress_test", "run_test_scenario",
	]
	if cmd in _ASYNC_CMDS:
		_handle_async(c, id, handler, p)
		return
	var result: Dictionary = handler.call(p)
	if result.has("_error"): _reply_err(c,id,result["_error"])
	else: _reply_ok(c,id,result)

func _handle_async(c: StreamPeerTCP, id: String, handler: Callable, p: Dictionary) -> void:
	var result: Dictionary = await handler.call(p)
	if result.has("_error"): _reply_err(c,id,result["_error"])
	else: _reply_ok(c,id,result)

func _reply_ok(c: StreamPeerTCP, id: String, data: Dictionary) -> void:
	_write(c, {"id":id,"success":true,"result":data})
func _reply_err(c: StreamPeerTCP, id: String, msg: String) -> void:
	_write(c, {"id":id,"success":false,"error":msg})
func _write(c: StreamPeerTCP, data: Dictionary) -> void:
	if c.get_status() != StreamPeerTCP.STATUS_CONNECTED: return
	c.put_data((JSON.stringify(data)+"\n").to_utf8_buffer())

# ─────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────
func _game_root() -> Node:
	# First non-root child in the running game
	for c in get_tree().root.get_children():
		if c != self and c.name != "MCPRuntime": return c
	return get_tree().root

func _find_node(path: String) -> Node:
	var root := _game_root()
	if path in ["",".","root"]: return root
	return root.get_node_or_null(path)

func _node_dict(node: Node, depth := 0) -> Dictionary:
	var scr = node.get_script()
	return {
		"name":str(node.name),"type":node.get_class(),
		"path":str(node.get_path()).trim_prefix("/root/"),
		"script":scr.resource_path if scr else "",
		"children":([] if depth>=6 else [_node_dict(c,depth+1) for c in node.get_children()])
	}

func _serialize(v: Variant) -> Variant:
	match typeof(v):
		TYPE_BOOL,TYPE_INT,TYPE_FLOAT,TYPE_STRING: return v
		TYPE_VECTOR2:  return {"_t":"V2","x":v.x,"y":v.y}
		TYPE_VECTOR3:  return {"_t":"V3","x":v.x,"y":v.y,"z":v.z}
		TYPE_COLOR:    return {"_t":"Color","r":v.r,"g":v.g,"b":v.b,"a":v.a}
		TYPE_ARRAY:    return [_serialize(i) for i in v]
		TYPE_OBJECT:
			if v == null: return null
			return {"_t":"Object","class":v.get_class()}
		_: return str(v)

func _find_all_labels(node: Node, text_filter: String, out: Array) -> void:
	if (node is Label or node is RichTextLabel or node is Button):
		var node_text: String = ""
		if node is Label: node_text = (node as Label).text
		elif node is RichTextLabel: node_text = (node as RichTextLabel).text
		elif node is Button: node_text = (node as Button).text
		if text_filter == "" or node_text.to_lower().contains(text_filter.to_lower()):
			out.append({"name":str(node.name),"type":node.get_class(),"text":node_text,"path":str(node.get_path()).trim_prefix("/root/")})
	for c in node.get_children(): _find_all_labels(c, text_filter, out)

func _find_all_by_script(node: Node, script_path: String, out: Array) -> void:
	var scr = node.get_script()
	if scr and scr.resource_path == script_path:
		out.append(str(node.get_path()).trim_prefix("/root/"))
	for c in node.get_children(): _find_all_by_script(c, script_path, out)

# ─────────────────────────────────────────────────────────────
# Meta
# ─────────────────────────────────────────────────────────────
func _cmd_ping(_p: Dictionary) -> Dictionary:
	return {"pong":true,"runtime":true,"version":"1.0","handlers":_handlers.size()}

# ─────────────────────────────────────────────────────────────
# Input Simulation
# ─────────────────────────────────────────────────────────────
func _cmd_sim_key(p: Dictionary) -> Dictionary:
	var ev := InputEventKey.new()
	var key_str: String = p.get("key","").to_upper()
	ev.keycode = OS.find_keycode_from_string(key_str)
	if ev.keycode == KEY_NONE: return {"_error":"Unknown key: "+key_str}
	ev.pressed    = bool(p.get("pressed",true))
	ev.shift_pressed = bool(p.get("shift",false))
	ev.ctrl_pressed  = bool(p.get("ctrl",false))
	ev.alt_pressed   = bool(p.get("alt",false))
	Input.parse_input_event(ev)
	return {"key":key_str,"pressed":ev.pressed}

func _cmd_sim_mouse_click(p: Dictionary) -> Dictionary:
	var x := float(p.get("x",0)); var y := float(p.get("y",0))
	var btn_str: String = p.get("button","left")
	var button_map := {"left":MOUSE_BUTTON_LEFT,"right":MOUSE_BUTTON_RIGHT,"middle":MOUSE_BUTTON_MIDDLE}
	var btn: MouseButton = button_map.get(btn_str, MOUSE_BUTTON_LEFT)
	var pressed: bool = bool(p.get("pressed",true))
	var ev := InputEventMouseButton.new()
	ev.position = Vector2(x,y); ev.global_position = Vector2(x,y)
	ev.button_index = btn; ev.pressed = pressed
	Input.parse_input_event(ev)
	if pressed and bool(p.get("auto_release",true)):
		var ev2 := InputEventMouseButton.new()
		ev2.position = Vector2(x,y); ev2.global_position = Vector2(x,y)
		ev2.button_index = btn; ev2.pressed = false
		Input.parse_input_event(ev2)
	return {"clicked":btn_str,"x":x,"y":y}

func _cmd_sim_mouse_move(p: Dictionary) -> Dictionary:
	var ev := InputEventMouseMotion.new()
	ev.position = Vector2(float(p.get("x",0)), float(p.get("y",0)))
	ev.relative  = Vector2(float(p.get("dx",0)),float(p.get("dy",0)))
	Input.parse_input_event(ev)
	return {"moved":true,"x":ev.position.x,"y":ev.position.y}

func _cmd_sim_action(p: Dictionary) -> Dictionary:
	var action: String = p.get("action",""); if action == "": return {"_error":"action required"}
	if not InputMap.has_action(action): return {"_error":"Action not in InputMap: "+action}
	var pressed: bool = bool(p.get("pressed",true))
	if pressed: Input.action_press(action, float(p.get("strength",1.0)))
	else: Input.action_release(action)
	return {"action":action,"pressed":pressed}

func _cmd_sim_sequence(p: Dictionary) -> Dictionary:
	var events: Array = p.get("events",[])
	var results: Array = []
	for event in events:
		var type: String = event.get("type","key")
		var result: Dictionary
		match type:
			"key":          result = _cmd_sim_key(event)
			"mouse_click":  result = _cmd_sim_mouse_click(event)
			"mouse_move":   result = _cmd_sim_mouse_move(event)
			"action":       result = _cmd_sim_action(event)
			"wait":
				await get_tree().create_timer(float(event.get("seconds",0.1))).timeout
				result = {"waited":event.get("seconds",0.1)}
			_: result = {"error":"Unknown event type: "+type}
		results.append(result)
	return {"sequence_results":results,"events_count":events.size()}

# ─────────────────────────────────────────────────────────────
# Runtime Scene Inspection
# ─────────────────────────────────────────────────────────────
func _cmd_game_scene_tree(_p: Dictionary) -> Dictionary:
	return {"tree":_node_dict(_game_root())}

func _cmd_game_node_props(p: Dictionary) -> Dictionary:
	var node := _find_node(p.get("path",""))
	if not node: return {"_error":"Node not found: "+p.get("path","")}
	var excl := PROPERTY_USAGE_GROUP|PROPERTY_USAGE_CATEGORY|PROPERTY_USAGE_SUBGROUP
	var props: Dictionary = {}
	for info in node.get_property_list():
		var u := int(info["usage"])
		if (u&PROPERTY_USAGE_EDITOR) and not (u&excl):
			var val = node.get(info["name"]); if val != null: props[info["name"]] = _serialize(val)
	return {"path":p.get("path",""),"type":node.get_class(),"properties":props}

func _cmd_set_game_node_props(p: Dictionary) -> Dictionary:
	var node := _find_node(p.get("path",""))
	if not node: return {"_error":"Node not found"}
	var props: Dictionary = p.get("properties",{})
	for key in props: node.set(key, props[key])
	return {"path":p.get("path",""),"set":props.keys()}

func _cmd_execute_game_script(p: Dictionary) -> Dictionary:
	var code: String = p.get("code","")
	if code == "": return {"_error":"code required"}
	# Wrap in a simple EditorScript-like structure
	var script := GDScript.new()
	script.source_code = """extends Node

var result = null

func run():
	%s
""" % code.replace("\n","\n\t")
	var err := script.reload()
	if err != OK: return {"_error":"Script compile error"}
	var obj := Node.new(); obj.set_script(script)
	add_child(obj); obj.run()
	var res = obj.get("result")
	remove_child(obj); obj.queue_free()
	return {"result":_serialize(res)}

func _cmd_game_screenshot(_p: Dictionary) -> Dictionary:
	var img := get_viewport().get_texture().get_image()
	if not img: return {"_error":"Screenshot failed"}
	return {"image_base64":Marshalls.raw_to_base64(img.save_png_to_buffer()),"format":"png","width":img.get_width(),"height":img.get_height()}

func _cmd_capture_frames(p: Dictionary) -> Dictionary:
	var count := int(p.get("count",3))
	var interval := float(p.get("interval",0.5))
	var frames: Array = []
	for i in range(count):
		if i > 0: await get_tree().create_timer(interval).timeout
		var img := get_viewport().get_texture().get_image()
		if img: frames.append({"frame":i,"image_base64":Marshalls.raw_to_base64(img.save_png_to_buffer())})
	return {"frames":frames,"count":frames.size()}

func _cmd_monitor_props(p: Dictionary) -> Dictionary:
	var node := _find_node(p.get("path",""))
	if not node: return {"_error":"Node not found"}
	var props: Array = p.get("properties",[])
	var duration := float(p.get("duration",1.0))
	var samples := int(p.get("samples",10))
	var timeline: Array = []
	for i in range(samples):
		await get_tree().create_timer(duration/samples).timeout
		var snapshot := {"time":i*(duration/samples),"values":{}}
		for prop in props:
			var val = node.get(prop); if val != null: snapshot["values"][prop] = _serialize(val)
		timeline.append(snapshot)
	return {"path":p.get("path",""),"timeline":timeline}

func _cmd_find_ui_elements(p: Dictionary) -> Dictionary:
	var text: String = p.get("text","")
	var results: Array = []
	_find_all_labels(_game_root(), text, results)
	return {"elements":results,"count":results.size()}

func _cmd_click_button_by_text(p: Dictionary) -> Dictionary:
	var text: String = p.get("text",""); if text == "": return {"_error":"text required"}
	var found: Array = []; _find_all_labels(_game_root(), text, found)
	var buttons := found.filter(func(el): return el["type"] == "Button")
	if buttons.is_empty(): return {"_error":"Button with text '%s' not found" % text}
	var btn_path: String = buttons[0]["path"]
	var btn := _find_node(btn_path) as Button
	if btn: btn.emit_signal("pressed")
	return {"clicked":btn_path,"text":text}

func _cmd_wait_for_node(p: Dictionary) -> Dictionary:
	var path: String = p.get("path",""); var timeout := float(p.get("timeout",5.0))
	var elapsed := 0.0; var interval := 0.1
	while elapsed < timeout:
		var node := _find_node(path)
		if node: return {"found":true,"path":path,"elapsed":elapsed}
		await get_tree().create_timer(interval).timeout; elapsed += interval
	return {"found":false,"path":path,"timeout":timeout}

func _cmd_batch_get_props(p: Dictionary) -> Dictionary:
	var requests: Array = p.get("requests",[])
	var results: Array = []
	for req in requests:
		var node := _find_node(req.get("path",""))
		if not node: results.append({"path":req.get("path",""),"error":"not found"}); continue
		var props := {}
		for prop in req.get("properties",[]):
			var val = node.get(prop); if val != null: props[prop] = _serialize(val)
		results.append({"path":req.get("path",""),"properties":props})
	return {"results":results}

func _cmd_find_by_script(p: Dictionary) -> Dictionary:
	var script_path: String = p.get("script_path",""); if script_path == "": return {"_error":"script_path required"}
	var results: Array = []; _find_all_by_script(_game_root(), script_path, results)
	return {"script":script_path,"nodes":results,"count":results.size()}

func _cmd_get_autoload(p: Dictionary) -> Dictionary:
	var name: String = p.get("name","")
	if name == "":
		var autoloads: Array = []
		for c in get_tree().root.get_children():
			autoloads.append({"name":str(c.name),"type":c.get_class()})
		return {"autoloads":autoloads}
	var node := get_tree().root.get_node_or_null(name)
	if not node: return {"_error":"Autoload not found: "+name}
	return {"name":name,"type":node.get_class(),"path":str(node.get_path())}

# ─────────────────────────────────────────────────────────────
# Testing & QA
# ─────────────────────────────────────────────────────────────
var _test_results: Array = []

func _cmd_assert_node_state(p: Dictionary) -> Dictionary:
	var node := _find_node(p.get("path",""))
	if not node: return {"_error":"Node not found: "+p.get("path","")}
	var expected: Dictionary = p.get("properties",{})
	var passed := true; var failures: Array = []
	for prop in expected:
		var actual = node.get(prop)
		if str(actual) != str(expected[prop]):
			passed = false
			failures.append({"property":prop,"expected":expected[prop],"actual":_serialize(actual)})
	var result := {"path":p.get("path",""),"passed":passed,"failures":failures}
	_test_results.append(result); return result

func _cmd_assert_screen_text(p: Dictionary) -> Dictionary:
	var text: String = p.get("text",""); if text == "": return {"_error":"text required"}
	var elements: Array = []; _find_all_labels(_game_root(), text, elements)
	var passed := elements.size() > 0
	var result := {"text":text,"found":passed,"elements":elements}
	_test_results.append(result); return result

func _cmd_run_test_scenario(p: Dictionary) -> Dictionary:
	var steps: Array = p.get("steps",[]); var results: Array = []; var passed := 0; var failed := 0
	for step in steps:
		var cmd: String = step.get("command",""); var params: Dictionary = step.get("params",{})
		var handler: Callable = _handlers.get(cmd, Callable())
		if not handler.is_valid():
			results.append({"step":cmd,"error":"Unknown command"}); failed += 1; continue
		# await is safe on both sync and async callables:
		# — sync functions: returns the value immediately
		# — async functions (e.g. wait_for_node): properly suspends until done
		var result = await handler.call(params)
		if not (result is Dictionary): result = {"_error":"Handler returned non-dictionary"}
		var step_passed := not result.has("_error") and result.get("passed",true)
		results.append({"step":cmd,"passed":step_passed,"result":result})
		if step_passed: passed += 1 else: failed += 1
		if not step_passed and bool(p.get("stop_on_failure",false)): break
	return {"total":steps.size(),"passed":passed,"failed":failed,"steps":results}

func _cmd_run_stress_test(p: Dictionary) -> Dictionary:
	var duration := float(p.get("duration",3.0))
	var events_sent := 0; var start := Time.get_ticks_msec()
	var keys := ["W","A","S","D","Space","Escape","Return","Tab"]
	var width := float(DisplayServer.screen_get_size().x); var height := float(DisplayServer.screen_get_size().y)
	while (Time.get_ticks_msec()-start)/1000.0 < duration:
		# Random key
		var ev := InputEventKey.new()
		ev.keycode = OS.find_keycode_from_string(keys[randi()%keys.size()])
		ev.pressed = randi()%2==0; Input.parse_input_event(ev); events_sent += 1
		# Random mouse click
		var ev2 := InputEventMouseButton.new()
		ev2.position = Vector2(randf()*width, randf()*height)
		ev2.button_index = MOUSE_BUTTON_LEFT; ev2.pressed = true
		Input.parse_input_event(ev2); events_sent += 1
		await get_tree().process_frame
	return {"duration":duration,"events_sent":events_sent,"crashed":false}

func _cmd_get_test_report(_p: Dictionary) -> Dictionary:
	var total := _test_results.size()
	var passed := _test_results.filter(func(r): return r.get("passed",false)).size()
	var failed := total - passed
	return {"total":total,"passed":passed,"failed":failed,"pass_rate":("%.1f%%" % (100.0*passed/total if total>0 else 0)),"results":_test_results}

# ─────────────────────────────────────────────────────────────
# Input Recording & Replay
# ─────────────────────────────────────────────────────────────
func _input(event: InputEvent) -> void:
	if not _recording:
		return
	var elapsed := float(Time.get_ticks_msec() - _recording_start_ms) / 1000.0
	var ev: Dictionary = {"time": elapsed, "type": event.get_class()}
	if event is InputEventKey:
		ev["key"]     = OS.get_keycode_string(event.keycode)
		ev["pressed"] = event.pressed
		ev["shift"]   = event.shift_pressed
		ev["ctrl"]    = event.ctrl_pressed
		ev["alt"]     = event.alt_pressed
	elif event is InputEventMouseButton:
		ev["button"]  = event.button_index
		ev["pressed"] = event.pressed
		ev["x"]       = event.position.x
		ev["y"]       = event.position.y
	elif event is InputEventMouseMotion:
		ev["x"]       = event.position.x
		ev["y"]       = event.position.y
		ev["dx"]      = event.relative.x
		ev["dy"]      = event.relative.y
	else:
		return  # Skip other event types
	_recorded_events.append(ev)

func _cmd_start_recording(_p: Dictionary) -> Dictionary:
	_recording = true
	_recorded_events = []
	_recording_start_ms = Time.get_ticks_msec()
	set_process_input(true)
	return {"recording": true, "started_at_ms": _recording_start_ms}

func _cmd_stop_recording(_p: Dictionary) -> Dictionary:
	_recording = false
	set_process_input(false)
	var duration := float(Time.get_ticks_msec() - _recording_start_ms) / 1000.0
	return {
		"recording": false,
		"duration_sec": snappedf(duration, 0.01),
		"event_count": _recorded_events.size(),
		"events": _recorded_events,
	}

func _cmd_replay_recording(p: Dictionary) -> Dictionary:
	var events: Array = p.get("events", _recorded_events)
	if events.is_empty():
		return {"_error": "No events to replay. Pass 'events' array or call stop_recording first."}
	var speed: float = float(p.get("speed", 1.0))
	var replayed := 0
	# Build sequence compatible with simulate_sequence
	var sequence: Array = []
	var prev_time := 0.0
	for ev in events:
		var t := float(ev.get("time", 0.0)) / speed
		var wait_sec := t - prev_time
		if wait_sec > 0.01:
			sequence.append({"type": "wait", "seconds": wait_sec})
		prev_time = t
		var matched := true
		match ev.get("type", ""):
			"InputEventKey":
				sequence.append({"type": "key", "key": ev.get("key",""), "pressed": ev.get("pressed",true),
					"shift": ev.get("shift",false), "ctrl": ev.get("ctrl",false), "alt": ev.get("alt",false)})
			"InputEventMouseButton":
				sequence.append({"type": "mouse_click", "x": ev.get("x",0), "y": ev.get("y",0),
					"pressed": ev.get("pressed",true), "auto_release": false})
			"InputEventMouseMotion":
				sequence.append({"type": "mouse_move", "x": ev.get("x",0), "y": ev.get("y",0),
					"dx": ev.get("dx",0), "dy": ev.get("dy",0)})
			_: matched = false
		if matched: replayed += 1
	# Execute the sequence
	var result = await _cmd_sim_sequence({"events": sequence})
	return {"replayed": replayed, "speed": speed, "sequence_result": result}
