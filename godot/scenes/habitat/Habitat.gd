extends Control

const UI = preload("res://autoload/UIHelpers.gd")

var _selected_furniture: Dictionary = {}
var _selected_slot: int = -1
var _refresh_inv: Callable = Callable()
var _refresh_detail: Callable = Callable()
var _detail_col: VBoxContainer = null
var _detail_header_name: Label = null
var _detail_header_sub: Label = null
var _detail_desc: Label = null
var _detail_effect_pc: PanelContainer = null
var _app: Node = null
var _theme: Node = null

func _ready() -> void:
	_app = get_node("/root/AppState")
	_theme = get_node("/root/ThemeConfig")
	_build()
	_app.furniture_changed.connect(_on_furniture)
	_app.overview_changed.connect(_on_overview)
	if not _app.furniture.is_empty():
		_on_furniture(_app.furniture)
	else:
		_app.load_furniture()

func _panel_title(text: String) -> HBoxContainer:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 6)
	var t := UI.label(text, 12, ThemeConfig.TEXT_3, true)
	h.add_child(t)
	var sep := PanelContainer.new()
	var sbs := StyleBoxFlat.new()
	sbs.bg_color = ThemeConfig.BORDER
	sep.add_theme_stylebox_override("panel", sbs)
	sep.custom_minimum_size = Vector2(0, 1)
	sep.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	h.add_child(sep)
	return h

func _build() -> void:
	var bg := ColorRect.new()
	bg.color = ThemeConfig.BG_1
	bg.anchor_right = 1.0
	bg.anchor_bottom = 1.0
	add_child(bg)

	var outer := VBoxContainer.new()
	outer.anchor_right = 1.0
	outer.anchor_bottom = 1.0
	outer.add_theme_constant_override("separation", 0)
	add_child(outer)

	outer.add_child(_build_top_bar())

	var main := Control.new()
	main.size_flags_vertical = Control.SIZE_EXPAND_FILL
	main.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	outer.add_child(main)
	_build_main_into(main)

	outer.add_child(_build_bottom_bar())

func _build_top_bar() -> Control:
	var bar := PanelContainer.new()
	bar.custom_minimum_size = Vector2(0, ThemeConfig.TOPBAR_H)
	bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var sb := StyleBoxFlat.new()
	sb.bg_color = ThemeConfig.SURFACE
	sb.border_color = ThemeConfig.BORDER
	sb.border_width_bottom = 1
	bar.add_theme_stylebox_override("panel", sb)

	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 12)
	bar.add_child(row)

	row.add_child(_info_pill("家园等级", "Lv.15", Color(139.0/255,92.0/255,246.0/255,0.12), Color(139.0/255,92.0/255,246.0/255,0.3), ThemeConfig.BRAND_2))
	row.add_child(_info_pill("阶段", "中型村落", Color(16.0/255,185.0/255,129.0/255,0.12), Color(16.0/255,185.0/255,129.0/255,0.3), ThemeConfig.GREEN))
	row.add_child(_info_pill("装饰总数", "18", ThemeConfig.SURFACE_2, ThemeConfig.BORDER, ThemeConfig.TEXT))

	var center := UI.label_gradient("🌍 班级共享家园", 20)
	center.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	center.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(center)

	var theme_badge := PanelContainer.new()
	var tsb := StyleBoxFlat.new()
	tsb.bg_color = Color(16.0/255,185.0/255,129.0/255,0.12)
	tsb.border_color = Color(16.0/255,185.0/255,129.0/255,0.3)
	tsb.border_width_left = 1; tsb.border_width_right = 1; tsb.border_width_top = 1; tsb.border_width_bottom = 1
	tsb.corner_radius_top_left = 999; tsb.corner_radius_top_right = 999
	tsb.corner_radius_bottom_left = 999; tsb.corner_radius_bottom_right = 999
	tsb.content_margin_left = 14; tsb.content_margin_right = 14; tsb.content_margin_top = 6; tsb.content_margin_bottom = 6
	theme_badge.add_theme_stylebox_override("panel", tsb)
	theme_badge.add_child(UI.label("🌿 森林主题  ▾", 13, ThemeConfig.GREEN))
	row.add_child(theme_badge)

	row.add_child(_info_pill("家园评分", "850", Color(245.0/255,158.0/255,11.0/255,0.12), Color(245.0/255,158.0/255,11.0/255,0.3), ThemeConfig.GOLD, true))
	return bar

func _info_pill(label: String, value: String, bg: Color, border: Color, vcolor: Color, big_value: bool = false) -> Control:
	var pc := PanelContainer.new()
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.border_color = border
	sb.border_width_left = 1; sb.border_width_right = 1; sb.border_width_top = 1; sb.border_width_bottom = 1
	sb.corner_radius_top_left = 999; sb.corner_radius_top_right = 999
	sb.corner_radius_bottom_left = 999; sb.corner_radius_bottom_right = 999
	sb.content_margin_left = 16; sb.content_margin_right = 16; sb.content_margin_top = 6; sb.content_margin_bottom = 6
	pc.add_theme_stylebox_override("panel", sb)

	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", 8)
	pc.add_child(h)
	h.add_child(UI.label(label, 13, ThemeConfig.TEXT_3))
	var sz := 18 if big_value else 16
	h.add_child(UI.label(value, sz, vcolor, true))
	return pc

func _build_main_into(c: Control) -> void:
	var left := Control.new()
	left.anchor_top = 0.0; left.anchor_bottom = 1.0
	left.anchor_left = 0.0; left.anchor_right = 0.0
	left.offset_left = ThemeConfig.GAP
	left.offset_right = ThemeConfig.SIDEBAR_W_WIDE + ThemeConfig.GAP
	left.offset_top = ThemeConfig.GAP
	left.offset_bottom = -ThemeConfig.GAP

	var center := Control.new()
	center.anchor_top = 0.0; center.anchor_bottom = 1.0
	center.anchor_left = 0.0; center.anchor_right = 1.0
	center.offset_left = ThemeConfig.SIDEBAR_W_WIDE + ThemeConfig.GAP * 2
	center.offset_right = -ThemeConfig.SIDEBAR_W - ThemeConfig.GAP * 2
	center.offset_top = ThemeConfig.GAP
	center.offset_bottom = -ThemeConfig.GAP

	var right := Control.new()
	right.anchor_top = 0.0; right.anchor_bottom = 1.0
	right.anchor_left = 1.0; right.anchor_right = 1.0
	right.offset_left = -ThemeConfig.SIDEBAR_W - ThemeConfig.GAP
	right.offset_right = -ThemeConfig.GAP
	right.offset_top = ThemeConfig.GAP
	right.offset_bottom = -ThemeConfig.GAP

	c.add_child(left); c.add_child(center); c.add_child(right)
	_build_inventory_into(left)
	_build_scene_into(center)
	_build_detail_into(right)

func _build_inventory_into(parent: Control) -> void:
	var p := UI.panel()
	p.anchor_right = 1.0; p.anchor_bottom = 1.0
	parent.add_child(p)

	var col := VBoxContainer.new()
	col.anchor_right = 1.0; col.anchor_bottom = 1.0
	col.add_theme_constant_override("separation", 14)
	p.add_child(col)

	col.add_child(_panel_title("📦 家具仓库"))

	var cats := HBoxContainer.new()
	cats.add_theme_constant_override("separation", 6)
	var tabs := [["全部", true], ["功能型", false], ["装饰型", false]]
	for tab in tabs:
		var label = tab[0]
		var active = tab[1]
		var b := Button.new()
		b.text = label
		b.add_theme_font_size_override("font_size", 12)
		b.custom_minimum_size = Vector2(0, 32)
		if active:
			UI._apply_btn_style(b, ThemeConfig.BRAND, ThemeConfig.BRAND, ThemeConfig.RADIUS_S)
			b.add_theme_color_override("font_color", Color.WHITE)
		else:
			UI._apply_btn_style(b, ThemeConfig.SURFACE_2, ThemeConfig.BORDER, ThemeConfig.RADIUS_S)
			b.add_theme_color_override("font_color", ThemeConfig.TEXT_3)
		cats.add_child(b)
	col.add_child(cats)

	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 10)
	grid.add_theme_constant_override("v_separation", 10)
	col.add_child(grid)
	_refresh_inv = func(inventory: Array):
		for c in grid.get_children():
			c.queue_free()
		for item in inventory:
			grid.add_child(_build_inv_card(item))

func _build_inv_card(item: Dictionary) -> Control:
	var card := UI.panel_surface2()
	var sb := card.get_theme_stylebox("panel") as StyleBoxFlat
	sb.corner_radius_top_left = ThemeConfig.RADIUS_S
	sb.corner_radius_top_right = ThemeConfig.RADIUS_S
	sb.corner_radius_bottom_left = ThemeConfig.RADIUS_S
	sb.corner_radius_bottom_right = ThemeConfig.RADIUS_S
	sb.border_width_left = 1; sb.border_width_right = 1; sb.border_width_top = 1; sb.border_width_bottom = 1
	var is_func: bool = item.get("type", "decorative") == "functional"
	if is_func:
		sb.border_color = Color(139.0/255,92.0/255,246.0/255,0.2)
		sb.bg_color = Color(139.0/255,92.0/255,246.0/255,0.06)
	card.custom_minimum_size = Vector2(0, 96)
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	card.gui_input.connect(func(event):
		if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
			_selected_furniture = item
			_refresh_selected_detail(item)
	)
	if item.get("placed", false):
		card.modulate = Color(1, 1, 1, 0.4)

	var v := VBoxContainer.new()
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	v.add_theme_constant_override("separation", 6)
	card.add_child(v)

	v.add_child(UI.label(item.get("emoji", "❓"), 32))
	v.add_child(UI.label(item.get("name", ""), 11, ThemeConfig.TEXT_2))
	var tag_bg := Color(139.0/255,92.0/255,246.0/255,0.15) if is_func else Color(56.0/255,189.0/248,0.15)
	var tag_color: Color = ThemeConfig.BRAND_2 if is_func else _theme.group_color(0)
	var tag_pc := PanelContainer.new()
	var tsb := StyleBoxFlat.new()
	tsb.bg_color = tag_bg
	tsb.corner_radius_top_left = 999; tsb.corner_radius_top_right = 999
	tsb.corner_radius_bottom_left = 999; tsb.corner_radius_bottom_right = 999
	tsb.content_margin_left = 8; tsb.content_margin_right = 8; tsb.content_margin_top = 1; tsb.content_margin_bottom = 1
	tag_pc.add_theme_stylebox_override("panel", tsb)
	tag_pc.add_child(UI.label("功能" if is_func else "装饰", 10, tag_color, true))
	v.add_child(tag_pc)

	if item.get("placed", false):
		var mark := UI.label("✓", 14, ThemeConfig.GREEN, true)
		v.add_child(mark)
	return card

func _build_scene_into(parent: Control) -> void:
	var frame := UI.panel()
	frame.anchor_right = 1.0; frame.anchor_bottom = 1.0
	parent.add_child(frame)

	var col := VBoxContainer.new()
	col.anchor_right = 1.0; col.anchor_bottom = 1.0
	col.add_theme_constant_override("separation", 12)
	frame.add_child(col)

	var header := HBoxContainer.new()
	header.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(UI.label("🗺️ 家园全景", 18, ThemeConfig.TEXT, true))
	var spacer := Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	header.add_child(spacer)
	var grid_ind := PanelContainer.new()
	var gsb := StyleBoxFlat.new()
	gsb.bg_color = Color(139.0/255,92.0/255,246.0/255,0.12)
	gsb.border_color = Color(139.0/255,92.0/255,246.0/255,0.3)
	gsb.border_width_left = 1; gsb.border_width_right = 1; gsb.border_width_top = 1; gsb.border_width_bottom = 1
	gsb.corner_radius_top_left = 999; gsb.corner_radius_top_right = 999
	gsb.corner_radius_bottom_left = 999; gsb.corner_radius_bottom_right = 999
	gsb.content_margin_left = 12; gsb.content_margin_right = 12; gsb.content_margin_top = 4; gsb.content_margin_bottom = 4
	grid_ind.add_theme_stylebox_override("panel", gsb)
	grid_ind.add_child(UI.label("📐 网格模式已开启", 12, ThemeConfig.BRAND_2))
	header.add_child(grid_ind)
	col.add_child(header)

	var grid := Control.new()
	grid.size_flags_vertical = Control.SIZE_EXPAND_FILL
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	col.add_child(grid)
	_build_habitat_grid_into(grid)

var _h_zones: Array = []
var _h_plaza: Control = null

func _build_habitat_grid_into(g: Control) -> void:
	var z0 := _build_h_zone(0)
	var plaza := _build_h_plaza()
	var z1 := _build_h_zone(1)
	var z2 := _build_h_zone(2)
	var z3 := _build_h_zone(3)

	z0.anchor_top = 0.0; z0.anchor_bottom = 0.5; z0.anchor_left = 0.0; z0.anchor_right = 0.38
	z0.offset_top = 0; z0.offset_bottom = -ThemeConfig.GAP / 2; z0.offset_left = 0; z0.offset_right = -ThemeConfig.GAP / 2

	plaza.anchor_top = 0.0; plaza.anchor_bottom = 1.0; plaza.anchor_left = 0.38; plaza.anchor_right = 0.62
	plaza.offset_top = 0; plaza.offset_bottom = 0; plaza.offset_left = ThemeConfig.GAP / 2; plaza.offset_right = -ThemeConfig.GAP / 2

	z1.anchor_top = 0.0; z1.anchor_bottom = 0.5; z1.anchor_left = 0.62; z1.anchor_right = 1.0
	z1.offset_top = 0; z1.offset_bottom = -ThemeConfig.GAP / 2; z1.offset_left = ThemeConfig.GAP / 2; z1.offset_right = 0

	z2.anchor_top = 0.5; z2.anchor_bottom = 1.0; z2.anchor_left = 0.0; z2.anchor_right = 0.38
	z2.offset_top = ThemeConfig.GAP / 2; z2.offset_bottom = 0; z2.offset_left = 0; z2.offset_right = -ThemeConfig.GAP / 2

	z3.anchor_top = 0.5; z3.anchor_bottom = 1.0; z3.anchor_left = 0.62; z3.anchor_right = 1.0
	z3.offset_top = ThemeConfig.GAP / 2; z3.offset_bottom = 0; z3.offset_left = ThemeConfig.GAP / 2; z3.offset_right = 0

	g.add_child(z0); g.add_child(plaza); g.add_child(z1); g.add_child(z2); g.add_child(z3)
	_h_zones = [z0, z1, z2, z3]
	_h_plaza = plaza

func _build_h_zone(idx: int) -> Control:
	var outer := Control.new()
	var gcolor: Color = _theme.group_color(idx)
	var frame := PanelContainer.new()
	var sb := StyleBoxFlat.new()
	sb.bg_color = ThemeConfig.SURFACE_2
	sb.border_color = gcolor
	sb.border_width_left = 2; sb.border_width_right = 2; sb.border_width_top = 2; sb.border_width_bottom = 2
	sb.corner_radius_top_left = ThemeConfig.RADIUS_L
	sb.corner_radius_top_right = ThemeConfig.RADIUS_L
	sb.corner_radius_bottom_left = ThemeConfig.RADIUS_L
	sb.corner_radius_bottom_right = ThemeConfig.RADIUS_L
	frame.add_theme_stylebox_override("panel", sb)
	frame.anchor_right = 1.0; frame.anchor_bottom = 1.0
	outer.add_child(frame)

	var col := VBoxContainer.new()
	col.anchor_right = 1.0; col.anchor_bottom = 1.0
	col.add_theme_constant_override("separation", 10)
	frame.add_child(col)

	var hdr := HBoxContainer.new()
	hdr.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hdr.add_child(UI.label("第%d组区域" % (idx + 1), 14, gcolor, true))
	var sp := Control.new(); sp.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hdr.add_child(sp)
	hdr.add_child(UI.label("★★☆", 12, ThemeConfig.GOLD))
	col.add_child(hdr)

	var body := HBoxContainer.new()
	body.add_theme_constant_override("separation", 12)
	body.size_flags_horizontal = Control.SIZE_EXPAND_FILL

	var pc := PanelContainer.new()
	var csb := StyleBoxFlat.new()
	csb.bg_color = Color(1,1,1,0.05)
	csb.border_color = gcolor
	csb.border_width_left = 2; csb.border_width_right = 2; csb.border_width_top = 2; csb.border_width_bottom = 2
	csb.corner_radius_top_left = 999; csb.corner_radius_top_right = 999
	csb.corner_radius_bottom_left = 999; csb.corner_radius_bottom_right = 999
	pc.add_theme_stylebox_override("panel", csb)
	pc.custom_minimum_size = Vector2(56, 56)
	var ph := HBoxContainer.new(); ph.alignment = BoxContainer.ALIGNMENT_CENTER
	ph.add_child(UI.label("🦅", 36))
	pc.add_child(ph)
	body.add_child(pc)

	var decors := HBoxContainer.new()
	decors.add_theme_constant_override("separation", 6)
	for i in 3:
		var deco_pc := PanelContainer.new()
		var dsb := StyleBoxFlat.new()
		if i == 0:
			dsb.bg_color = ThemeConfig.SURFACE
			dsb.border_color = ThemeConfig.BORDER
		else:
			dsb.bg_color = ThemeConfig.SURFACE_2
			dsb.border_color = ThemeConfig.BORDER
		dsb.border_width_left = 1; dsb.border_width_right = 1; dsb.border_width_top = 1; dsb.border_width_bottom = 1
		deco_pc.add_theme_stylebox_override("panel", dsb)
		deco_pc.custom_minimum_size = Vector2(36, 36)
		var deh := HBoxContainer.new(); deh.alignment = BoxContainer.ALIGNMENT_CENTER
		deh.add_child(UI.label("🌸" if i == 0 else "+", 22 if i == 0 else 16, ThemeConfig.TEXT if i == 0 else ThemeConfig.TEXT_3))
		deco_pc.add_child(deh)
		decors.add_child(deco_pc)
	body.add_child(decors)

	col.add_child(body)
	return outer

func _build_h_plaza() -> Control:
	var outer := Control.new()
	var frame := UI.plaza_frame()
	frame.anchor_right = 1.0; frame.anchor_bottom = 1.0
	outer.add_child(frame)

	var col := VBoxContainer.new()
	col.alignment = BoxContainer.ALIGNMENT_CENTER
	col.anchor_right = 1.0; col.anchor_bottom = 1.0
	col.add_theme_constant_override("separation", 14)
	frame.add_child(col)

	var hdr := HBoxContainer.new()
	hdr.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hdr.add_child(UI.label("🏛️ 公共广场", 18, ThemeConfig.BRAND_2, true))
	var sp := Control.new(); sp.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hdr.add_child(sp)
	var evt_pc := PanelContainer.new()
	var esb := StyleBoxFlat.new()
	esb.bg_color = Color(245.0/255,158.0/255,11.0/255,0.12)
	esb.border_color = Color(245.0/255,158.0/255,11.0/255,0.25)
	esb.border_width_left = 1; esb.border_width_right = 1; esb.border_width_top = 1; esb.border_width_bottom = 1
	esb.corner_radius_top_left = 999; esb.corner_radius_top_right = 999
	esb.corner_radius_bottom_left = 999; esb.corner_radius_bottom_right = 999
	esb.content_margin_left = 12; esb.content_margin_right = 12; esb.content_margin_top = 4; esb.content_margin_bottom = 4
	evt_pc.add_theme_stylebox_override("panel", esb)
	evt_pc.add_child(UI.label("🎉 进化仪式举办地", 12, ThemeConfig.GOLD))
	hdr.add_child(evt_pc)
	col.add_child(hdr)

	var slots_grid := GridContainer.new()
	slots_grid.columns = 3
	slots_grid.add_theme_constant_override("h_separation", 12)
	slots_grid.add_theme_constant_override("v_separation", 12)
	slots_grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	col.add_child(slots_grid)

	var prefill := [
		{"emoji": "💎", "name": "能量水晶", "bonus": "+5/日", "functional": true},
		{"emoji": "📚", "name": "智慧书架", "bonus": "智慧+10%", "functional": true},
		{"emoji": "🎠", "name": "活力滑梯", "bonus": "精力+15%", "functional": true},
		{"emoji": "⛲", "name": "祝福喷泉", "bonus": "心情+5%", "functional": true},
		null, null,
	]
	for i in range(prefill.size()):
		var item = prefill[i]
		slots_grid.add_child(_build_plaza_slot(i, item))

	var footer := HBoxContainer.new()
	footer.alignment = BoxContainer.ALIGNMENT_CENTER
	footer.add_theme_constant_override("separation", 16)
	var stats := [["已放置", "4"], ["空位", "2"], ["综合加成", "+30%"]]
	for stat in stats:
		footer.add_child(UI.label("%s %s" % [stat[0], stat[1]], 13, ThemeConfig.TEXT_3))
	col.add_child(footer)
	return outer

func _build_plaza_slot(idx: int, data: Variant) -> Control:
	var slot := PanelContainer.new()
	var sb := StyleBoxFlat.new()
	sb.corner_radius_top_left = ThemeConfig.RADIUS_S
	sb.corner_radius_top_right = ThemeConfig.RADIUS_S
	sb.corner_radius_bottom_left = ThemeConfig.RADIUS_S
	sb.corner_radius_bottom_right = ThemeConfig.RADIUS_S
	sb.border_width_left = 1; sb.border_width_right = 1; sb.border_width_top = 1; sb.border_width_bottom = 1
	slot.custom_minimum_size = Vector2(0, 90)
	slot.size_flags_horizontal = Control.SIZE_EXPAND_FILL

	if data == null:
		sb.bg_color = ThemeConfig.SURFACE_2
		sb.border_color = ThemeConfig.BORDER
		slot.add_theme_stylebox_override("panel", sb)
		var v := VBoxContainer.new()
		v.alignment = BoxContainer.ALIGNMENT_CENTER
		slot.add_child(v)
		v.add_child(UI.label("+", 24, ThemeConfig.TEXT_3))
		v.add_child(UI.label("空位", 11, ThemeConfig.TEXT_3))
	else:
		sb.bg_color = ThemeConfig.SURFACE
		sb.border_color = Color(139.0/255,92.0/255,246.0/255,0.3)
		slot.add_theme_stylebox_override("panel", sb)
		var v := VBoxContainer.new()
		v.alignment = BoxContainer.ALIGNMENT_CENTER
		v.add_theme_constant_override("separation", 4)
		slot.add_child(v)
		v.add_child(UI.label(data.get("emoji", "❓"), 36))
		v.add_child(UI.label(data.get("name", "-"), 11, ThemeConfig.TEXT_3))
		var bpc := PanelContainer.new()
		var bsb := StyleBoxFlat.new()
		bsb.bg_color = Color(139.0/255,92.0/255,246.0/255,0.15)
		bsb.border_color = Color(139.0/255,92.0/255,246.0/255,0.3)
		bsb.border_width_left = 1; bsb.border_width_right = 1; bsb.border_width_top = 1; bsb.border_width_bottom = 1
		bsb.corner_radius_top_left = 999; bsb.corner_radius_top_right = 999
		bsb.corner_radius_bottom_left = 999; bsb.corner_radius_bottom_right = 999
		bsb.content_margin_left = 8; bsb.content_margin_right = 8; bsb.content_margin_top = 1; bsb.content_margin_bottom = 1
		bpc.add_theme_stylebox_override("panel", bsb)
		bpc.add_child(UI.label(data.get("bonus", ""), 10, ThemeConfig.BRAND_2, true))
		v.add_child(bpc)

	slot.gui_input.connect(func(event):
		if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
			_selected_slot = idx
	)
	return slot

func _build_detail_into(parent: Control) -> void:
	var v := VBoxContainer.new()
	v.anchor_right = 1.0; v.anchor_bottom = 1.0
	v.add_theme_constant_override("separation", 14)
	parent.add_child(v)

	var sel_p := UI.panel()
	var scol := VBoxContainer.new()
	scol.add_theme_constant_override("separation", 10)
	scol.anchor_right = 1.0; scol.anchor_bottom = 1.0
	sel_p.add_child(scol)
	scol.add_child(_panel_title("📋 选中详情"))

	var detail_box := VBoxContainer.new()
	detail_box.alignment = BoxContainer.ALIGNMENT_CENTER
	detail_box.add_theme_constant_override("separation", 10)
	detail_box.size_flags_horizontal = Control.SIZE_EXPAND_FILL

	var icon_circle := PanelContainer.new()
	var csb := StyleBoxFlat.new()
	csb.bg_color = Color(139.0/255,92.0/255,246.0/255,0.1)
	csb.border_color = Color(139.0/255,92.0/255,246.0/255,0.3)
	csb.border_width_left = 2; csb.border_width_right = 2; csb.border_width_top = 2; csb.border_width_bottom = 2
	csb.corner_radius_top_left = 999; csb.corner_radius_top_right = 999
	csb.corner_radius_bottom_left = 999; csb.corner_radius_bottom_right = 999
	icon_circle.add_theme_stylebox_override("panel", csb)
	icon_circle.custom_minimum_size = Vector2(72, 72)
	var ih := HBoxContainer.new(); ih.alignment = BoxContainer.ALIGNMENT_CENTER
	var icon_lbl := UI.label("🌸", 44)
	icon_circle.add_child(ih)
	ih.add_child(icon_lbl)
	detail_box.add_child(icon_circle)

	_detail_header_name = UI.label("花圃", 16, ThemeConfig.TEXT, true)
	detail_box.add_child(_detail_header_name)
	var type_color := ThemeConfig.BRAND_2
	_detail_header_sub = UI.label("装饰型家具", 12, type_color, true)
	detail_box.add_child(_detail_header_sub)
	_detail_desc = UI.label("为家园增添一抹自然色彩\n提升家园综合评分", 12, ThemeConfig.TEXT_3)
	detail_box.add_child(_detail_desc)

	_detail_effect_pc = PanelContainer.new()
	var esb := StyleBoxFlat.new()
	esb.bg_color = Color(16.0/255,185.0/255,129.0/255,0.08)
	esb.border_color = Color(16.0/255,185.0/255,129.0/255,0.2)
	esb.border_width_left = 1; esb.border_width_right = 1; esb.border_width_top = 1; esb.border_width_bottom = 1
	esb.corner_radius_top_left = ThemeConfig.RADIUS_S
	esb.corner_radius_top_right = ThemeConfig.RADIUS_S
	esb.corner_radius_bottom_left = ThemeConfig.RADIUS_S
	esb.corner_radius_bottom_right = ThemeConfig.RADIUS_S
	esb.content_margin_left = 12; esb.content_margin_right = 12; esb.content_margin_top = 10; esb.content_margin_bottom = 10
	_detail_effect_pc.add_theme_stylebox_override("panel", esb)
	_detail_effect_pc.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_detail_effect_pc.add_child(UI.label("家园评分 +15", 13, ThemeConfig.GREEN, true))
	detail_box.add_child(_detail_effect_pc)
	scol.add_child(detail_box)

	var place_btn := UI.button("📍 放置到家园", "magic")
	place_btn.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scol.add_child(place_btn)

	var zp := UI.panel()
	var zcol := VBoxContainer.new()
	zcol.add_theme_constant_override("separation", 8)
	zp.add_child(zcol)
	zcol.add_child(_panel_title("📊 区域美观度"))
	var zones := [["第1组区域", "★★☆"], ["第2组区域", "★☆☆"], ["第3组区域", "★★★"], ["第4组区域", "★☆☆"], ["公共广场", "★★★"]]
	for zone in zones:
		var zone_name = zone[0]
		var stars = zone[1]
		var row := HBoxContainer.new()
		row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(UI.label(zone_name, 13, ThemeConfig.TEXT_2))
		var sp2 := Control.new(); sp2.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(sp2)
		var color := ThemeConfig.GREEN if "★★★" in stars else ThemeConfig.GOLD if "★★☆" in stars else ThemeConfig.TEXT_3
		row.add_child(UI.label(stars, 13, color, true))
		zcol.add_child(row)
	v.add_child(zp)

	var hint_p := UI.panel_surface2()
	var hsb := hint_p.get_theme_stylebox("panel") as StyleBoxFlat
	hsb.corner_radius_top_left = ThemeConfig.RADIUS_S
	hsb.corner_radius_top_right = ThemeConfig.RADIUS_S
	hsb.corner_radius_bottom_left = ThemeConfig.RADIUS_S
	hsb.corner_radius_bottom_right = ThemeConfig.RADIUS_S
	hsb.content_margin_left = 12; hsb.content_margin_right = 12; hsb.content_margin_top = 10; hsb.content_margin_bottom = 10
	hint_p.add_theme_stylebox_override("panel", hsb)
	hint_p.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hint_p.add_child(UI.label("引导全班讨论布置方案，如\"花圃放哪组区域？\"增强参与感。功能型家具优先放置在公共广场，全班共享加成。", 12, ThemeConfig.TEXT_3))
	v.add_child(hint_p)

func _refresh_selected_detail(item: Dictionary) -> void:
	var is_func: bool = item.get("type", "decorative") == "functional"
	if _detail_header_name:
		_detail_header_name.text = item.get("name", "")
	if _detail_header_sub:
		_detail_header_sub.text = ("功能型家具" if is_func else "装饰型家具")
		_detail_header_sub.add_theme_color_override("font_color", ThemeConfig.BRAND_2 if is_func else _theme.group_color(0))
	if _detail_desc:
		_detail_desc.text = "点击\"放置到家园\"将此家具布置到广场或小组区域。"

func _build_bottom_bar() -> Control:
	var bar := PanelContainer.new()
	bar.custom_minimum_size = Vector2(0, ThemeConfig.BOTTOMBAR_H)
	bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var sb := StyleBoxFlat.new()
	sb.bg_color = ThemeConfig.SURFACE
	sb.border_color = ThemeConfig.BORDER
	sb.border_width_top = 1
	bar.add_theme_stylebox_override("panel", sb)

	var row := HBoxContainer.new()
	row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_theme_constant_override("separation", 12)
	bar.add_child(row)

	for txt in ["🛒 装饰商店", "📦 家具仓库", "✏️ 布局编辑", "🎨 主题切换"]:
		var b := UI.button(txt, "normal")
		if txt == "📦 家具仓库":
			UI._apply_btn_style(b, Color(139.0/255,92.0/255,246.0/255,0.15), Color(139.0/255,92.0/255,246.0/255,0.3), ThemeConfig.RADIUS_S)
			b.add_theme_color_override("font_color", ThemeConfig.BRAND_2)
		row.add_child(b)

	var sp := Control.new(); sp.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(sp)
	row.add_child(_info_pill("已用/总计", "18 / 30", Color(245.0/255,158.0/255,11.0/255,0.12), Color(245.0/255,158.0/255,11.0/255,0.3), ThemeConfig.GOLD))

	var tabs := HBoxContainer.new()
	tabs.add_theme_constant_override("separation", 6)
	var tab_defs := [
		{"text": "🏠 主页", "key": "home", "active": false},
		{"text": "🌍 家园", "key": "habitat", "active": true},
		{"text": "🗺️ 探索", "key": "explore", "active": false},
		{"text": "📖 图鉴", "key": "dex", "active": false},
	]
	for td in tab_defs:
		var b := UI.tab(td["text"], td["active"])
		b.pressed.connect(func(): _on_bottom_tab(td["key"]))
		tabs.add_child(b)
	row.add_child(tabs)
	return bar

func _on_bottom_tab(key: String) -> void:
	match key:
		"home": _app.go_home()
		"habitat": _app.go_habitat()
		"explore": _app.go_explore()
		"dex": _app.go_dex()

func _on_furniture(data: Dictionary) -> void:
	if data.has("inventory") and _refresh_inv:
		_refresh_inv.call(data["inventory"])

func _on_overview(_data: Dictionary) -> void:
	pass
