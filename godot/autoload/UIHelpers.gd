extends RefCounted

# =====================================================================
#  Static helpers for building styled Godot Control nodes that match the
#  dark purple/teal prototype palette defined in ThemeConfig.
# =====================================================================

static func panel() -> PanelContainer:
	var p := PanelContainer.new()
	var sb := StyleBoxFlat.new()
	sb.bg_color = ThemeConfig.SURFACE
	sb.border_color = ThemeConfig.BORDER
	sb.border_width_bottom = 1
	sb.corner_radius_top_left = ThemeConfig.RADIUS_M
	sb.corner_radius_top_right = ThemeConfig.RADIUS_M
	sb.corner_radius_bottom_left = ThemeConfig.RADIUS_M
	sb.corner_radius_bottom_right = ThemeConfig.RADIUS_M
	p.add_theme_stylebox_override("panel", sb)
	return p

static func panel_surface2() -> PanelContainer:
	var p := PanelContainer.new()
	var sb := StyleBoxFlat.new()
	sb.bg_color = ThemeConfig.SURFACE_2
	sb.border_color = ThemeConfig.BORDER
	sb.border_width_left = 1
	sb.border_width_right = 1
	sb.border_width_top = 1
	sb.border_width_bottom = 1
	sb.corner_radius_top_left = ThemeConfig.RADIUS_S
	sb.corner_radius_top_right = ThemeConfig.RADIUS_S
	sb.corner_radius_bottom_left = ThemeConfig.RADIUS_S
	sb.corner_radius_bottom_right = ThemeConfig.RADIUS_S
	p.add_theme_stylebox_override("panel", sb)
	return p

static func label(text: String, size: int = 14, color: Color = ThemeConfig.TEXT, bold: bool = false) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	if bold:
		l.add_theme_font_override("font", _bold_font())
	return l

static func label_gradient(text: String, size: int = 20) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", ThemeConfig.BRAND_2)
	l.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.6))
	l.add_theme_constant_override("outline_size", 1)
	return l

static func pill(icon_text: String, label_text: String, value_text: String, bg_color: Color, border_color: Color, value_color: Color) -> PanelContainer:
	var row := HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)

	var sb := StyleBoxFlat.new()
	sb.bg_color = bg_color
	sb.border_color = border_color
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
	var pc := PanelContainer.new()
	pc.add_theme_stylebox_override("panel", sb)
	pc.add_child(row)

	var icon := Label.new()
	icon.text = icon_text
	icon.add_theme_font_size_override("font_size", 22)
	icon.add_theme_color_override("font_color", value_color)
	icon.custom_minimum_size = Vector2(28, 0)
	row.add_child(icon)

	var mid := VBoxContainer.new()
	mid.add_theme_constant_override("separation", 0)
	var lt := Label.new()
	lt.text = label_text
	lt.add_theme_font_size_override("font_size", 14)
	lt.add_theme_color_override("font_color", ThemeConfig.TEXT_3)
	mid.add_child(lt)
	var vt := Label.new()
	vt.text = value_text
	vt.add_theme_font_size_override("font_size", 18)
	vt.add_theme_color_override("font_color", value_color)
	vt.add_theme_font_override("font", _bold_font())
	mid.add_child(vt)
	row.add_child(mid)

	return pc

static func button(text: String, kind: String = "normal") -> Button:
	var b := Button.new()
	b.text = text
	b.add_theme_font_size_override("font_size", 14)
	b.add_theme_color_override("font_color", ThemeConfig.TEXT)

	var bg_col := ThemeConfig.SURFACE_2
	var border_col := ThemeConfig.BORDER
	var text_col := ThemeConfig.TEXT
	if kind == "primary":
		bg_col = Color(245.0/255, 158.0/255, 11.0/255, 0.15)
		border_col = Color(245.0/255, 158.0/255, 11.0/255, 0.3)
		text_col = ThemeConfig.GOLD
	elif kind == "magic":
		bg_col = Color(139.0/255, 92.0/255, 246.0/255, 0.15)
		border_col = Color(139.0/255, 92.0/255, 246.0/255, 0.3)
		text_col = ThemeConfig.BRAND_2

	b.add_theme_color_override("font_color", text_col)
	_apply_btn_style(b, bg_col, border_col, ThemeConfig.RADIUS_S)
	b.add_theme_constant_override("h_separation", 10)
	b.custom_minimum_size = Vector2(0, 40)
	return b

static func tab(text: String, active: bool = false) -> Button:
	var b := Button.new()
	b.text = text
	b.add_theme_font_size_override("font_size", 14)
	b.custom_minimum_size = Vector2(0, 40)
	if active:
		_apply_btn_style(b, ThemeConfig.BRAND, ThemeConfig.BRAND, ThemeConfig.RADIUS_S)
		b.add_theme_color_override("font_color", Color.WHITE)
	else:
		b.add_theme_color_override("font_color", ThemeConfig.TEXT_3)
		_apply_btn_style(b, Color.TRANSPARENT, Color.TRANSPARENT, ThemeConfig.RADIUS_S)
	return b

static func energy_bar(progress: float, bar_color: Color) -> ProgressBar:
	var pb := ProgressBar.new()
	pb.max_value = 100.0
	pb.value = clamp(progress, 0.0, 1.0) * 100.0
	pb.custom_minimum_size = Vector2(0, 14)

	var bg_sb := StyleBoxFlat.new()
	bg_sb.bg_color = ThemeConfig.SURFACE_2
	bg_sb.border_color = ThemeConfig.BORDER
	bg_sb.border_width_left = 1
	bg_sb.border_width_right = 1
	bg_sb.border_width_top = 1
	bg_sb.border_width_bottom = 1
	bg_sb.corner_radius_top_left = 999
	bg_sb.corner_radius_top_right = 999
	bg_sb.corner_radius_bottom_left = 999
	bg_sb.corner_radius_bottom_right = 999
	pb.add_theme_stylebox_override("background", bg_sb)

	var fill_sb := StyleBoxFlat.new()
	fill_sb.bg_color = bar_color
	fill_sb.corner_radius_top_left = 999
	fill_sb.corner_radius_top_right = 999
	fill_sb.corner_radius_bottom_left = 999
	fill_sb.corner_radius_bottom_right = 999
	pb.add_theme_stylebox_override("fill", fill_sb)
	pb.show_percentage = false
	return pb

static func group_zone_frame(group_color: Color, can_evolve: bool = false) -> PanelContainer:
	var sb := StyleBoxFlat.new()
	sb.bg_color = ThemeConfig.SURFACE
	if can_evolve:
		sb.border_color = ThemeConfig.GOLD
	else:
		sb.border_color = group_color
	sb.border_width_left = 2
	sb.border_width_right = 2
	sb.border_width_top = 2
	sb.border_width_bottom = 2
	sb.corner_radius_top_left = ThemeConfig.RADIUS_L
	sb.corner_radius_top_right = ThemeConfig.RADIUS_L
	sb.corner_radius_bottom_left = ThemeConfig.RADIUS_L
	sb.corner_radius_bottom_right = ThemeConfig.RADIUS_L
	var pc := PanelContainer.new()
	pc.add_theme_stylebox_override("panel", sb)
	return pc

static func panel_title(text: String) -> Control:
	var p := PanelContainer.new()
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color.TRANSPARENT
	sb.border_color = ThemeConfig.BORDER
	sb.border_width_bottom = 1
	sb.content_margin_bottom = 8
	sb.content_margin_left = 0
	sb.content_margin_right = 0
	sb.content_margin_top = 0
	p.add_theme_stylebox_override("panel", sb)
	p.add_child(label(text, 12, ThemeConfig.TEXT_3, true))
	return p

static func plaza_frame() -> PanelContainer:
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color(139.0/255, 92.0/255, 246.0/255, 0.12)
	sb.border_color = Color(139.0/255, 92.0/255, 246.0/255, 0.25)
	sb.border_width_left = 2
	sb.border_width_right = 2
	sb.border_width_top = 2
	sb.border_width_bottom = 2
	sb.corner_radius_top_left = ThemeConfig.RADIUS_L
	sb.corner_radius_top_right = ThemeConfig.RADIUS_L
	sb.corner_radius_bottom_left = ThemeConfig.RADIUS_L
	sb.corner_radius_bottom_right = ThemeConfig.RADIUS_L
	var pc := PanelContainer.new()
	pc.add_theme_stylebox_override("panel", sb)
	return pc

# --- internals ---

static func _apply_btn_style(b: Button, bg: Color, border: Color, radius: int) -> void:
	var normal := StyleBoxFlat.new()
	normal.bg_color = bg
	normal.border_color = border
	normal.border_width_left = 1
	normal.border_width_right = 1
	normal.border_width_top = 1
	normal.border_width_bottom = 1
	normal.corner_radius_top_left = radius
	normal.corner_radius_top_right = radius
	normal.corner_radius_bottom_left = radius
	normal.corner_radius_bottom_right = radius
	normal.content_margin_left = 16
	normal.content_margin_right = 16
	normal.content_margin_top = 8
	normal.content_margin_bottom = 8
	b.add_theme_stylebox_override("normal", normal)

	var hover := normal.duplicate()
	hover.bg_color = Color(bg.r, bg.g, bg.b, clamp(bg.a + 0.04, 0.0, 1.0))
	b.add_theme_stylebox_override("hover", hover)

	var pressed := normal.duplicate()
	pressed.bg_color = Color(bg.r, bg.g, bg.b, clamp(bg.a + 0.08, 0.0, 1.0))
	b.add_theme_stylebox_override("pressed", pressed)

	b.add_theme_stylebox_override("disabled", normal)

static func _bold_font() -> Font:
	# Godot 4 defaults to ThemeDB system font; bold variant comes from ThemeDB fallback
	var f := ThemeDB.fallback_font
	return f
