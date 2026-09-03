extends Control

const UI = preload("res://autoload/UIHelpers.gd")

var _pages := {}
var _current_node: Node = null
var _current_name: String = ""

func _ready() -> void:
	anchor_right = 1.0
	anchor_bottom = 1.0

	_pages = {
		"home": load("res://scenes/home/MainHome.tscn"),
		"habitat": load("res://scenes/habitat/Habitat.tscn"),
		"explore": func(): return _make_placeholder("🗺️ 探索模式（开发中）", "团队副本 · 知识寻宝 · 迷宫探险"),
		"dex": func(): return _make_placeholder("📖 宠物图鉴（开发中）", "收集、解锁、查看宠物详情"),
	}

	var app: Node = get_node("/root/AppState")
	app.page_changed.connect(_show_page)
	_show_page("home")
	app.load_all()

func _show_page(name: String) -> void:
	if _current_name == name and _current_node:
		return
	if _current_node:
		remove_child(_current_node)
		_current_node.queue_free()

	var src = _pages.get(name)
	if src == null:
		push_error("Unknown page: " + name)
		return

	var node: Node
	if src is PackedScene:
		node = src.instantiate()
	elif src is Callable:
		node = src.call()
	else:
		push_error("Invalid page source for " + name)
		return

	if node is Control:
		node.anchor_right = 1.0
		node.anchor_bottom = 1.0

	add_child(node)
	_current_node = node
	_current_name = name

func _make_placeholder(title: String, subtitle: String) -> Control:
	var root := Control.new()

	var bg := ColorRect.new()
	bg.color = ThemeConfig.BG_1
	bg.anchor_right = 1.0
	bg.anchor_bottom = 1.0
	root.add_child(bg)

	var v := VBoxContainer.new()
	v.anchor_right = 1.0
	v.anchor_bottom = 1.0
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	v.add_theme_constant_override("separation", 16)
	root.add_child(v)

	v.add_child(UI.label_gradient(title, 28))
	v.add_child(UI.label(subtitle, 16, ThemeConfig.TEXT_3))
	v.add_child(UI.label("🏠 点击底栏切换到主页", 14, ThemeConfig.TEXT_3))

	return root
