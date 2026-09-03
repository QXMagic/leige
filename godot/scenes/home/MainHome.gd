extends Control

const UI = preload("res://autoload/UIHelpers.gd")
const PetViewScript = preload("res://scenes/pet/PetView.gd")

# Layout mirrors design/main_page.html + resource/references/preview_3.jpg:
#   TopBar (64px)  | 3-col MainContent (200 | 1fr | 200) | BottomBar (72px)
# Habitat grid: 1fr 1.4fr 1fr  →  anchors 0.294 / 0.706

# --- Demo data (mirrors preview_3.jpg) ---
const DEMO_GROUPS := [
	{"gname": "第1组", "pname": "乘风鹰", "emoji": "🦅", "pet": "cat", "level": 8, "progress": 0.75, "evolvable": false},
	{"gname": "第2组", "pname": "水灵龟", "emoji": "🐢", "pet": "rabbit", "level": 6, "progress": 0.60, "evolvable": false},
	{"gname": "第3组", "pname": "炎火狐", "emoji": "🦊", "pet": "bear", "level": 10, "progress": 0.90, "evolvable": true},
	{"gname": "第4组", "pname": "光翼蝶", "emoji": "🦋", "pet": "panda", "level": 5, "progress": 0.45, "evolvable": false},
]

const DEMO_BADGES := [
	{"icon": "🏆", "name": "全员达标", "unlocked": true},
	{"icon": "📚", "name": "活跃课堂", "unlocked": true},
	{"icon": "🤝", "name": "团结友爱", "unlocked": true},
	{"icon": "❓", "name": "未解锁", "unlocked": false},
	{"icon": "❓", "name": "未解锁", "unlocked": false},
]

const DEMO_FURNITURE := [
	{"emoji": "💎", "name": "能量水晶"},
	{"emoji": "📚", "name": "智慧书架"},
	{"emoji": "🎠", "name": "活力滑梯"},
]

const DEMO_BONUSES := ["💎 +5能量/日", "📚 智慧+10%", "🎠 精力+15%"]

const DEMO_RANKINGS := [
	{"medal": "🥇", "name": "第3组", "score": "920", "top": true},
	{"medal": "🥈", "name": "第1组", "score": "750", "top": false},
	{"medal": "🥉", "name": "第4组", "score": "520", "top": false},
]

const DEMO_TASKS := [
	{"done": true, "icon": "✅", "text": "全班作业上交率 95%"},
	{"done": false, "icon": "⬜", "text": "通关一次团队副本"},
	{"done": false, "icon": "⬜", "text": "卫生检查达标"},
]

var _badge_col: VBoxContainer = null
var _badges_panel: PanelContainer = null
var _app: Node = null
var _theme: Node = null
var _pet_views: Array = []

func _ready() -> void:
	_app = get_node("/root/AppState")
	_theme = get_node("/root/ThemeConfig")
	_build()
	_app.overview_changed.connect(_on_overview)
	if not _app.overview.is_empty():
		_refresh()
	else:
		_app.load_overview()


static func _dbg(_msg: String) -> void:
	pass

# ------- Build -------

func _build() -> void:
	_dbg("build: bg")
	var bg := ColorRect.new()
	bg.color = ThemeConfig.BG_1
	bg.anchor_right = 1.0
	bg.anchor_bottom = 1.0
	add_child(bg)

	_dbg("build: outer vbox")
	var outer := VBoxContainer.new()
	outer.anchor_right = 1.0
	outer.anchor_bottom = 1.0
	outer.add_theme_constant_override("separation", 0)
	add_child(outer)

	_dbg("build: top_bar")
	outer.add_child(_build_top_bar())
	_dbg("build: top_bar done")

	_dbg("build: main control")
	var main := Control.new()
	main.size_flags_vertical = Control.SIZE_EXPAND_FILL
	main.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	outer.add_child(main)
	_dbg("build: main_into")
	_build_main_into(main)
	_dbg("build: main done")

	_dbg("build: bottom_bar")
	outer.add_child(_build_bottom_bar())
	_dbg("build: bottom_bar done")

func _build_top_bar() -> Control:
	var bar := PanelContainer.new()
	bar.custom_minimum_size = Vector2(0, ThemeConfig.TOPBAR_H)
	bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var sb := StyleBoxFlat.new()
	sb.bg_color = ThemeConfig.SURFACE
	sb.border_color = ThemeConfig.BORDER
	sb.border_width_bottom = 1
	sb.content_margin_left = 28
	sb.content_margin_right = 28
	bar.add_theme_stylebox_override("panel", sb)

	var row := HBoxContainer.new()
	row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_theme_constant_override("separation", 12)
	bar.add_child(row)

	row.add_child(_build_mood_pill())

	var center := UI.label_gradient("🌟 幻兽学园 · 三年级二班", 20)
	center.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	center.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	row.add_child(center)

	row.add_child(_build_energy_pill())
	return bar

func _build_mood_pill() -> Control:
	var bg := PanelContainer.new()
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(16.0/255, 185.0/255, 129.0/255, 0.12)
	sb.border_color = Color(16.0/255, 185.0/255, 129.0/255, 0.3)
	sb.border_width_left = 1
	sb.border_width_right = 1
	sb.border_width_top = 1
	sb.border_width_bottom = 1
	sb.corner_radius_top_left = 999
	sb.corner_radius_top_right = 999
	sb.corner_radius_bottom_left = 999
	sb.corner_radius_bottom_right = 999
	sb.content_margin_left = 16
	sb.content_margin_right = 16
	sb.content_margin_top = 6
	sb.content_margin_bottom = 6
	bg.add_theme_stylebox_override("panel", sb)
	bg.custom_minimum_size = Vector2(320, 0)

	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	bg.add_child(row)

	row.add_child(UI.label("😊", 22, ThemeConfig.GREEN))
	row.add_child(UI.label("班级心情：开心", 14, ThemeConfig.GREEN))

	var bonus_pc := PanelContainer.new()
	var bsb := StyleBoxFlat.new()
	bsb.bg_color = ThemeConfig.GREEN
	bsb.corner_radius_top_left = 999
	bsb.corner_radius_top_right = 999
	bsb.corner_radius_bottom_left = 999
	bsb.corner_radius_bottom_right = 999
	bsb.content_margin_left = 10
	bsb.content_margin_right = 10
	bsb.content_margin_top = 2
	bsb.content_margin_bottom = 2
	bonus_pc.add_theme_stylebox_override("panel", bsb)
	bonus_pc.add_child(UI.label("+20%", 12, Color.WHITE, true))
	row.add_child(bonus_pc)

	return bg

func _build_energy_pill() -> Control:
	var bg := PanelContainer.new()
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(245.0/255, 158.0/255, 11.0/255, 0.12)
	sb.border_color = Color(245.0/255, 158.0/255, 11.0/255, 0.3)
	sb.border_width_left = 1
	sb.border_width_right = 1
	sb.border_width_top = 1
	sb.border_width_bottom = 1
	sb.corner_radius_top_left = 999
	sb.corner_radius_top_right = 999
	sb.corner_radius_bottom_left = 999
	sb.corner_radius_bottom_right = 999
	sb.content_margin_left = 16
	sb.content_margin_right = 16
	sb.content_margin_top = 6
	sb.content_margin_bottom = 6
	bg.add_theme_stylebox_override("panel", sb)
	bg.custom_minimum_size = Vector2(220, 0)

	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	bg.add_child(row)
	row.add_child(UI.label("⚡", 20, ThemeConfig.GOLD))
	row.add_child(UI.label("总能量", 14, ThemeConfig.GOLD))
	row.add_child(UI.label("1,250", 18, ThemeConfig.GOLD, true))
	return bg

func _build_main_into(container: Control) -> void:
	var left := Control.new()
	left.anchor_top = 0.0
	left.anchor_bottom = 1.0
	left.anchor_left = 0.0
	left.anchor_right = 0.0
	left.offset_left = ThemeConfig.GAP
	left.offset_right = ThemeConfig.SIDEBAR_W + ThemeConfig.GAP
	left.offset_top = ThemeConfig.GAP
	left.offset_bottom = -ThemeConfig.GAP

	var center := Control.new()
	center.anchor_top = 0.0
	center.anchor_bottom = 1.0
	center.anchor_left = 0.0
	center.anchor_right = 1.0
	center.offset_left = ThemeConfig.SIDEBAR_W + ThemeConfig.GAP * 2
	center.offset_right = -ThemeConfig.SIDEBAR_W - ThemeConfig.GAP * 2
	center.offset_top = ThemeConfig.GAP
	center.offset_bottom = -ThemeConfig.GAP

	var right := Control.new()
	right.anchor_top = 0.0
	right.anchor_bottom = 1.0
	right.anchor_left = 1.0
	right.anchor_right = 1.0
	right.offset_left = -ThemeConfig.SIDEBAR_W - ThemeConfig.GAP
	right.offset_right = -ThemeConfig.GAP
	right.offset_top = ThemeConfig.GAP
	right.offset_bottom = -ThemeConfig.GAP

	_dbg("main_into: children")
	container.add_child(left)
	container.add_child(center)
	container.add_child(right)

	_dbg("main_into: left sidebar")
	_build_left_sidebar(left)
	_dbg("main_into: center habitat")
	_build_center_habitat(center)
	_dbg("main_into: right sidebar")
	_build_right_sidebar(right)
	_dbg("main_into: done")

func _build_left_sidebar(parent: Control) -> void:
	var v := VBoxContainer.new()
	v.anchor_right = 1.0
	v.anchor_bottom = 1.0
	v.add_theme_constant_override("separation", 14)
	parent.add_child(v)

	v.add_child(_build_badges_panel())
	v.add_child(_build_puzzle_panel())

func _build_badges_panel() -> Control:
	var p := UI.panel()
	_badges_panel = p
	_badge_col = VBoxContainer.new()
	_badge_col.add_theme_constant_override("separation", 8)
	p.add_child(_badge_col)
	_badge_col.add_child(UI.panel_title("🏆 班级徽章墙"))
	for b in DEMO_BADGES:
		_badge_col.add_child(_make_badge_row(b))
	return p

func _refresh_badges(badges: Array) -> void:
	if _badge_col == null:
		return
	for c in _badge_col.get_children():
		c.queue_free()
	_badge_col.add_child(UI.panel_title("🏆 班级徽章墙"))
	for b in badges:
		_badge_col.add_child(_make_badge_row(b))

func _make_badge_row(b: Dictionary) -> Control:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 10)

	var pc := UI.panel_surface2()
	var sb := pc.get_theme_stylebox("panel") as StyleBoxFlat
	sb.corner_radius_top_left = ThemeConfig.RADIUS_S
	sb.corner_radius_top_right = ThemeConfig.RADIUS_S
	sb.corner_radius_bottom_left = ThemeConfig.RADIUS_S
	sb.corner_radius_bottom_right = ThemeConfig.RADIUS_S
	sb.border_width_left = 1
	sb.border_width_right = 1
	sb.border_width_top = 1
	sb.border_width_bottom = 1
	if b.get("unlocked", false):
		sb.border_color = Color(139.0/255, 92.0/255, 246.0/255, 0.3)
		sb.bg_color = Color(139.0/255, 92.0/255, 246.0/255, 0.08)
	else:
		sb.border_color = ThemeConfig.BORDER
		pc.modulate = Color(1, 1, 1, 0.35)
	row.add_child(pc)

	var r := HBoxContainer.new()
	r.add_theme_constant_override("separation", 10)
	pc.add_child(r)

	var icon := UI.label(b.get("icon", "❓"), 18)
	icon.custom_minimum_size = Vector2(32, 32)
	r.add_child(icon)
	r.add_child(UI.label(b.get("name", ""), 13, ThemeConfig.TEXT if b.get("unlocked", false) else ThemeConfig.TEXT_3))
	return row

func _build_puzzle_panel() -> Control:
	var p := UI.panel()
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 8)
	p.add_child(col)
	col.add_child(UI.panel_title("🧩 知识拼图"))

	var track := PanelContainer.new()
	var sb := StyleBoxFlat.new()
	sb.bg_color = ThemeConfig.SURFACE_2
	sb.border_color = ThemeConfig.BORDER
	sb.corner_radius_top_left = 999
	sb.corner_radius_top_right = 999
	sb.corner_radius_bottom_left = 999
	sb.corner_radius_bottom_right = 999
	sb.border_width_left = 1
	sb.border_width_right = 1
	sb.border_width_top = 1
	sb.border_width_bottom = 1
	track.add_theme_stylebox_override("panel", sb)
	track.custom_minimum_size = Vector2(0, 10)
	track.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	col.add_child(track)

	var fill := ColorRect.new()
	fill.color = ThemeConfig.BRAND
	fill.anchor_left = 0.0
	fill.anchor_top = 0.0
	fill.anchor_bottom = 1.0
	fill.anchor_right = 0.6
	track.clip_children = CanvasItem.CLIP_CHILDREN_AND_DRAW
	track.add_child(fill)

	var info := HBoxContainer.new()
	info.add_theme_constant_override("separation", 4)
	info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var info_l := UI.label("古诗拼图", 12, ThemeConfig.TEXT_3)
	info_l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	info.add_child(info_l)
	info.add_child(UI.label("6 / 10", 12, ThemeConfig.BRAND_2, true))
	col.add_child(info)
	return p

func _build_center_habitat(parent: Control) -> void:
	_dbg("habitat: vbox")
	var v := VBoxContainer.new()
	v.anchor_right = 1.0
	v.anchor_bottom = 1.0
	v.add_theme_constant_override("separation", 12)
	parent.add_child(v)

	_dbg("habitat: header")
	var header := HBoxContainer.new()
	header.alignment = BoxContainer.ALIGNMENT_CENTER
	header.add_theme_constant_override("separation", 12)
	header.add_child(UI.label_gradient("🌱 班级共享家园", 20))
	var hlevel := PanelContainer.new()
	var hsb := StyleBoxFlat.new()
	hsb.bg_color = ThemeConfig.SURFACE_2
	hsb.border_color = ThemeConfig.BORDER
	hsb.corner_radius_top_left = 999
	hsb.corner_radius_top_right = 999
	hsb.corner_radius_bottom_left = 999
	hsb.corner_radius_bottom_right = 999
	hsb.content_margin_left = 14
	hsb.content_margin_right = 14
	hsb.content_margin_top = 4
	hsb.content_margin_bottom = 4
	hlevel.add_theme_stylebox_override("panel", hsb)
	hlevel.add_child(UI.label("小型营地 · Lv.8", 13, ThemeConfig.TEXT_3))
	header.add_child(hlevel)
	v.add_child(header)
	_dbg("habitat: header done")

	_dbg("habitat: grid")
	var grid := Control.new()
	grid.size_flags_vertical = Control.SIZE_EXPAND_FILL
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	v.add_child(grid)
	_dbg("habitat: grid_into")
	_build_habitat_grid_into(grid)
	_dbg("habitat: grid done")

func _build_habitat_grid_into(g: Control) -> void:
	# CSS: grid-template-columns: 1fr 1.4fr 1fr  →  0.294 / 0.706
	_dbg("grid: zone0")
	var zone0 := _group_zone(0)
	_dbg("grid: plaza")
	var plaza := _plaza()
	_dbg("grid: zone1")
	var zone1 := _group_zone(1)
	_dbg("grid: zone2")
	var zone2 := _group_zone(2)
	_dbg("grid: zone3")
	var zone3 := _group_zone(3)
	_dbg("grid: zones built")

	zone0.anchor_top = 0.0
	zone0.anchor_bottom = 0.5
	zone0.anchor_left = 0.0
	zone0.anchor_right = 0.294
	zone0.offset_top = 0
	zone0.offset_bottom = -ThemeConfig.GAP / 2
	zone0.offset_left = 0
	zone0.offset_right = -ThemeConfig.GAP / 2

	plaza.anchor_top = 0.0
	plaza.anchor_bottom = 1.0
	plaza.anchor_left = 0.294
	plaza.anchor_right = 0.706
	plaza.offset_top = 0
	plaza.offset_bottom = 0
	plaza.offset_left = ThemeConfig.GAP / 2
	plaza.offset_right = -ThemeConfig.GAP / 2

	zone1.anchor_top = 0.0
	zone1.anchor_bottom = 0.5
	zone1.anchor_left = 0.706
	zone1.anchor_right = 1.0
	zone1.offset_top = 0
	zone1.offset_bottom = -ThemeConfig.GAP / 2
	zone1.offset_left = ThemeConfig.GAP / 2
	zone1.offset_right = 0

	zone2.anchor_top = 0.5
	zone2.anchor_bottom = 1.0
	zone2.anchor_left = 0.0
	zone2.anchor_right = 0.294
	zone2.offset_top = ThemeConfig.GAP / 2
	zone2.offset_bottom = 0
	zone2.offset_left = 0
	zone2.offset_right = -ThemeConfig.GAP / 2

	zone3.anchor_top = 0.5
	zone3.anchor_bottom = 1.0
	zone3.anchor_left = 0.706
	zone3.anchor_right = 1.0
	zone3.offset_top = ThemeConfig.GAP / 2
	zone3.offset_bottom = 0
	zone3.offset_left = ThemeConfig.GAP / 2
	zone3.offset_right = 0

	g.add_child(zone0)
	g.add_child(plaza)
	g.add_child(zone1)
	g.add_child(zone2)
	g.add_child(zone3)

func _group_zone(idx: int) -> Control:
	var data: Dictionary = DEMO_GROUPS[idx]
	var gcolor: Color = _theme.group_color(idx)
	var evolvable: bool = data.get("evolvable", false)

	var outer := Control.new()
	var frame := UI.group_zone_frame(gcolor, evolvable)
	frame.anchor_right = 1.0
	frame.anchor_bottom = 1.0
	outer.add_child(frame)

	var v := VBoxContainer.new()
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	v.add_theme_constant_override("separation", 10)
	frame.add_child(v)

	var header := HBoxContainer.new()
	header.alignment = BoxContainer.ALIGNMENT_CENTER
	header.add_theme_constant_override("separation", 6)
	header.add_child(UI.label(data["gname"], 14, gcolor, true))
	header.add_child(UI.label("·", 14, ThemeConfig.TEXT_3))
	header.add_child(UI.label(data["pname"], 13, ThemeConfig.TEXT_2))
	if evolvable:
		var rank := PanelContainer.new()
		var rsb := StyleBoxFlat.new()
		rsb.bg_color = Color(245.0/255, 158.0/255, 11.0/255, 0.15)
		rsb.border_color = Color(245.0/255, 158.0/255, 11.0/255, 0.3)
		rsb.border_width_left = 1
		rsb.border_width_right = 1
		rsb.border_width_top = 1
		rsb.border_width_bottom = 1
		rsb.corner_radius_top_left = 999
		rsb.corner_radius_top_right = 999
		rsb.corner_radius_bottom_left = 999
		rsb.corner_radius_bottom_right = 999
		rsb.content_margin_left = 8
		rsb.content_margin_right = 8
		rsb.content_margin_top = 2
		rsb.content_margin_bottom = 2
		rank.add_theme_stylebox_override("panel", rsb)
		rank.add_child(UI.label("⭐ Top 1", 11, ThemeConfig.GOLD, true))
		header.add_child(rank)
	v.add_child(header)

	var pet_circle := PanelContainer.new()
	var csb := StyleBoxFlat.new()
	csb.bg_color = Color(1, 1, 1, 0.05)
	csb.border_color = gcolor
	csb.border_width_left = 3
	csb.border_width_right = 3
	csb.border_width_top = 3
	csb.border_width_bottom = 3
	csb.corner_radius_top_left = 999
	csb.corner_radius_top_right = 999
	csb.corner_radius_bottom_left = 999
	csb.corner_radius_bottom_right = 999
	csb.shadow_color = Color(gcolor.r, gcolor.g, gcolor.b, 0.3)
	csb.shadow_size = 12
	csb.shadow_offset = Vector2.ZERO
	pet_circle.add_theme_stylebox_override("panel", csb)
	pet_circle.custom_minimum_size = Vector2(72, 72)
	pet_circle.clip_contents = false
	var pet_view := PetViewScript.new()
	pet_view.size_flags_horizontal = Control.SIZE_FILL
	pet_view.size_flags_vertical = Control.SIZE_FILL
	pet_circle.add_child(pet_view)
	pet_view.set_target_size(60.0)
	pet_view.set_pet(data.get("pet", "cat"))
	_pet_views.append(pet_view)
	v.add_child(pet_circle)

	var pb := UI.energy_bar(data["progress"], gcolor)
	v.add_child(pb)

	var footer := HBoxContainer.new()
	footer.alignment = BoxContainer.ALIGNMENT_CENTER
	footer.add_theme_constant_override("separation", 8)
	footer.add_child(UI.label("Lv.%d" % data["level"], 12, ThemeConfig.TEXT_2, true))
	footer.add_child(UI.label("%d%%" % int(data["progress"] * 100), 12, ThemeConfig.TEXT_3))
	if evolvable:
		footer.add_child(UI.label("可进化!", 11, ThemeConfig.GOLD, true))
	v.add_child(footer)

	return outer


func _on_feed_all() -> void:
	for pv in _pet_views:
		pv.play_eat()


func _on_surprise() -> void:
	var any_sad := false
	for pv in _pet_views:
		if pv.is_sad():
			any_sad = true
			break
	if any_sad:
		for pv in _pet_views:
			pv.play_idle()
	else:
		var idx := _weakest_index()
		if idx >= 0 and idx < _pet_views.size():
			_pet_views[idx].play_sad()


func _weakest_index() -> int:
	var idx := -1
	var low := 2.0
	for i in DEMO_GROUPS.size():
		var p := float(DEMO_GROUPS[i].get("progress", 1.0))
		if p < low:
			low = p
			idx = i
	return idx


func _plaza() -> Control:
	var outer := Control.new()
	var frame := UI.plaza_frame()
	frame.anchor_right = 1.0
	frame.anchor_bottom = 1.0
	outer.add_child(frame)

	var v := VBoxContainer.new()
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	v.add_theme_constant_override("separation", 16)
	frame.add_child(v)

	v.add_child(UI.label("🏛️ 公共广场", 18, ThemeConfig.BRAND_2, true))

	var furn := HBoxContainer.new()
	furn.alignment = BoxContainer.ALIGNMENT_CENTER
	furn.add_theme_constant_override("separation", 20)
	v.add_child(furn)

	for f in DEMO_FURNITURE:
		var ic := VBoxContainer.new()
		ic.alignment = BoxContainer.ALIGNMENT_CENTER
		ic.add_theme_constant_override("separation", 6)
		var card := UI.panel_surface2()
		card.custom_minimum_size = Vector2(80, 80)
		var ei := UI.label(f["emoji"], 36)
		var eh := HBoxContainer.new()
		eh.alignment = BoxContainer.ALIGNMENT_CENTER
		eh.add_child(ei)
		card.add_child(eh)
		ic.add_child(card)
		ic.add_child(UI.label(f["name"], 11, ThemeConfig.TEXT_3))
		furn.add_child(ic)

	var bonus := HBoxContainer.new()
	bonus.alignment = BoxContainer.ALIGNMENT_CENTER
	bonus.add_theme_constant_override("separation", 8)
	for t in DEMO_BONUSES:
		var btag := PanelContainer.new()
		var bsb := StyleBoxFlat.new()
		bsb.bg_color = Color(139.0/255, 92.0/255, 246.0/255, 0.15)
		bsb.border_color = Color(139.0/255, 92.0/255, 246.0/255, 0.3)
		bsb.border_width_left = 1
		bsb.border_width_right = 1
		bsb.border_width_top = 1
		bsb.border_width_bottom = 1
		bsb.corner_radius_top_left = 999
		bsb.corner_radius_top_right = 999
		bsb.corner_radius_bottom_left = 999
		bsb.corner_radius_bottom_right = 999
		bsb.content_margin_left = 12
		bsb.content_margin_right = 12
		bsb.content_margin_top = 4
		bsb.content_margin_bottom = 4
		btag.add_theme_stylebox_override("panel", bsb)
		btag.add_child(UI.label(t, 12, ThemeConfig.BRAND_2))
		bonus.add_child(btag)
	v.add_child(bonus)

	var desc := Label.new()
	desc.text = "功能型家具 · 全班共享加成\n进化仪式与庆祝活动举办地"
	desc.add_theme_font_size_override("font_size", 12)
	desc.add_theme_color_override("font_color", ThemeConfig.TEXT_3)
	desc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(desc)
	return outer

func _build_right_sidebar(parent: Control) -> void:
	var v := VBoxContainer.new()
	v.anchor_right = 1.0
	v.anchor_bottom = 1.0
	v.add_theme_constant_override("separation", 14)
	parent.add_child(v)

	v.add_child(_build_rankings_panel())
	v.add_child(_build_tasks_panel())
	v.add_child(_build_challenge_panel())

func _build_rankings_panel() -> Control:
	var p := UI.panel()
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 8)
	p.add_child(col)
	col.add_child(UI.panel_title("📊 小组排行"))
	for r in DEMO_RANKINGS:
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		var bg := UI.panel_surface2()
		var sb := bg.get_theme_stylebox("panel") as StyleBoxFlat
		sb.corner_radius_top_left = ThemeConfig.RADIUS_S
		sb.corner_radius_top_right = ThemeConfig.RADIUS_S
		sb.corner_radius_bottom_left = ThemeConfig.RADIUS_S
		sb.corner_radius_bottom_right = ThemeConfig.RADIUS_S
		if r.get("top", false):
			sb.border_color = Color(245.0/255, 158.0/255, 11.0/255, 0.3)
			sb.bg_color = Color(245.0/255, 158.0/255, 11.0/255, 0.08)
		row.add_child(bg)
		var inner := HBoxContainer.new()
		inner.add_theme_constant_override("separation", 10)
		bg.add_child(inner)
		inner.add_child(UI.label(r["medal"], 20))
		var name_l := UI.label(r["name"], 13, ThemeConfig.TEXT, true)
		name_l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		inner.add_child(name_l)
		var score_color := ThemeConfig.GOLD if r.get("top", false) else ThemeConfig.TEXT_2
		inner.add_child(UI.label(r["score"], 13, score_color, true))
		col.add_child(row)
	return p

func _build_tasks_panel() -> Control:
	var p := UI.panel()
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 6)
	p.add_child(col)
	col.add_child(UI.panel_title("📋 本周班级任务"))
	for item in DEMO_TASKS:
		var h := HBoxContainer.new()
		h.add_theme_constant_override("separation", 8)
		var color := ThemeConfig.GREEN if item["done"] else ThemeConfig.TEXT_2
		h.add_child(UI.label(item["icon"], 16, color))
		h.add_child(UI.label(item["text"], 13, color))
		col.add_child(h)
	return p

func _build_challenge_panel() -> Control:
	var p := UI.panel()
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 12)
	p.add_child(col)
	col.add_child(UI.panel_title("🔥 周常挑战"))

	var box := UI.panel_surface2()
	var sb := box.get_theme_stylebox("panel") as StyleBoxFlat
	sb.bg_color = Color(245.0/255, 158.0/255, 11.0/255, 0.08)
	sb.border_color = Color(245.0/255, 158.0/255, 11.0/255, 0.2)
	sb.corner_radius_top_left = ThemeConfig.RADIUS_S
	sb.corner_radius_top_right = ThemeConfig.RADIUS_S
	sb.corner_radius_bottom_left = ThemeConfig.RADIUS_S
	sb.corner_radius_bottom_right = ThemeConfig.RADIUS_S

	var vv := VBoxContainer.new()
	vv.add_theme_constant_override("separation", 4)
	box.add_child(vv)
	vv.add_child(UI.label("连续完成 ✓✓", 14, ThemeConfig.GOLD, true))
	vv.add_child(UI.label("下周奖励：能量果 ×5", 12, ThemeConfig.TEXT_3))
	col.add_child(box)
	return p

func _build_bottom_bar() -> Control:
	var bar := PanelContainer.new()
	bar.custom_minimum_size = Vector2(0, ThemeConfig.BOTTOMBAR_H)
	bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var sb := StyleBoxFlat.new()
	sb.bg_color = ThemeConfig.SURFACE
	sb.border_color = ThemeConfig.BORDER
	sb.border_width_top = 1
	sb.content_margin_left = 24
	sb.content_margin_right = 24
	bar.add_theme_stylebox_override("panel", sb)

	var row := HBoxContainer.new()
	row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_theme_constant_override("separation", 12)
	bar.add_child(row)

	var feed := UI.button("🍎 投喂能量果", "primary")
	feed.pressed.connect(_on_feed_all)
	row.add_child(feed)
	var surprise := UI.button("✨ 惊喜按钮", "magic")
	surprise.pressed.connect(_on_surprise)
	row.add_child(surprise)

	var spacer := Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(spacer)

	var tabs := HBoxContainer.new()
	tabs.add_theme_constant_override("separation", 6)
	var tab_defs := [
		{"text": "🏠 主页", "key": "home", "active": true},
		{"text": "🌍 家园", "key": "habitat", "active": false},
		{"text": "🗺️ 探索", "key": "explore", "active": false},
		{"text": "📖 图鉴", "key": "dex", "active": false},
	]
	for td in tab_defs:
		var b := UI.tab(td["text"], td["active"])
		b.pressed.connect(Callable(self, "_on_bottom_tab").bind(td["key"]))
		tabs.add_child(b)
	row.add_child(tabs)

	return bar

func _on_bottom_tab(key: String) -> void:
	match key:
		"home": _app.go_home()
		"habitat": _app.go_habitat()
		"explore": _app.go_explore()
		"dex": _app.go_dex()

# ------- Refresh from AppState -------

func _on_overview(data: Dictionary) -> void:
	_dbg("on_overview received, keys: " + str(data.keys()))
	_refresh()

func _refresh() -> void:
	var ov: Dictionary = _app.overview
	_dbg("refresh: overview empty=" + str(ov.is_empty()))
	if ov.is_empty():
		return
	_dbg("refresh: has badges=" + str(ov.has("badges")) + " has groups=" + str(ov.has("groups")))
	if ov.has("badges"):
		_refresh_badges(ov["badges"])
	_dbg("refresh: done")
