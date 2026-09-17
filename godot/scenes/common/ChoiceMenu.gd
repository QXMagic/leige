extends Control
## 弹在宠物头顶的选择菜单：加减分理由、投喂的食物都用它。
##
##   var menu = ChoiceMenu 实例
##   menu.setup("第1组 · 35积分", items, anchor)
##   menu.picked.connect(...)
##
## items 每项：{id, label, note(右侧小字，可选), positive(绿/红), disabled,
##            group(分组标题，可选：相邻同 group 的项归到一个标题下)}
##
## 项目多了（老师自定义的加减分可能有几十个）就排成多列，还放不下就在面板里滚动；
## 多列时菜单开在屏幕中间，少的时候仍然开在宠物头顶。

signal picked(id: String)
signal closed()

const UiSkin = preload("res://scenes/common/UiSkin.gd")

const GREEN := Color("7ba045")
const GREEN_HOVER := Color("8cb352")
const GREEN_PRESSED := Color("658a3a")
const DISABLED := Color("9a9187")

## 菜单和宠物头顶之间留的空隙，以及贴边时的最小留白。
const GAP := 30.0
const MARGIN := 24.0
const OPEN_TIME := 0.16

const BUTTON_WIDTH := 340.0
const BUTTON_HEIGHT := 74.0
const CELL_GAP := 12
const MAX_COLUMNS := 4
## 不超过这么多项就一列排开，和以前一样。
const SINGLE_COLUMN_MAX := 6
## 面板四周内边距 + 滚动条留位，算列数和高度时要扣掉。
const PANEL_PADDING := Vector2(44, 42)
const SCROLLBAR_ROOM := 18.0

@onready var _dim: ColorRect = $Dim
@onready var _panel: PanelContainer = $Panel
@onready var _title: Label = $Panel/Content/Title
@onready var _content: VBoxContainer = $Panel/Content
@onready var _scroll: ScrollContainer = $Panel/Content/Scroll
@onready var _list: VBoxContainer = $Panel/Content/Scroll/List

var _title_text: String = ""
var _items: Array = []
var _anchor: Vector2 = Vector2(960, 540)
var _columns: int = 1


## `anchor` 是宠物头顶在本节点坐标系里的位置，菜单会开在它上方。
func setup(title: String, items: Array, anchor: Vector2) -> void:
	_title_text = title
	_items = items
	_anchor = anchor
	if is_node_ready():
		_apply()


func _ready() -> void:
	_dim.gui_input.connect(_on_dim_input)
	_apply()
	_play_open()


func _apply() -> void:
	_title.text = _title_text
	for child in _list.get_children():
		_list.remove_child(child)
		child.queue_free()
	_columns = _columns_for(_items.size())
	var sections := _sections()
	for section: Dictionary in sections:
		if sections.size() > 1 and str(section["title"]) != "":
			_list.add_child(_make_header(str(section["title"])))
		var grid := GridContainer.new()
		grid.columns = _columns
		grid.add_theme_constant_override("h_separation", CELL_GAP)
		grid.add_theme_constant_override("v_separation", CELL_GAP)
		for item: Dictionary in section["items"]:
			grid.add_child(_make_button(item))
		_list.add_child(grid)
	_place.call_deferred()


## 列数随项目数增加，但不超过屏幕宽度放得下的列数。
func _columns_for(count: int) -> int:
	var wanted := 1
	if count > SINGLE_COLUMN_MAX:
		wanted = 2 if count <= 14 else (3 if count <= 30 else MAX_COLUMNS)
	var room := size.x if size.x > 0 else get_viewport_rect().size.x
	var fit := int((room - MARGIN * 2 - PANEL_PADDING.x - SCROLLBAR_ROOM + CELL_GAP) / (BUTTON_WIDTH + CELL_GAP))
	return clampi(wanted, 1, maxi(1, fit))


## 按 group 把相邻的项分段，保持原来的顺序。
func _sections() -> Array:
	var sections: Array = []
	for item: Dictionary in _items:
		var title := str(item.get("group", ""))
		if sections.is_empty() or sections[-1]["title"] != title:
			sections.append({"title": title, "items": []})
		sections[-1]["items"].append(item)
	return sections


func _make_header(text: String) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", 26)
	label.add_theme_color_override("font_color", _title.get_theme_color("font_color"))
	label.modulate.a = 0.8
	return label


func _make_button(item: Dictionary) -> Button:
	var disabled := bool(item.get("disabled", false))
	var positive := bool(item.get("positive", true))
	var btn := Button.new()
	btn.text = str(item.get("label", ""))
	btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
	btn.custom_minimum_size = Vector2(BUTTON_WIDTH, BUTTON_HEIGHT)
	btn.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	btn.focus_mode = Control.FOCUS_NONE
	# 让拖动事件继续传给 ScrollContainer，触屏上按住按钮也能滑动列表。
	btn.mouse_filter = Control.MOUSE_FILTER_PASS
	btn.disabled = disabled
	btn.mouse_default_cursor_shape = Control.CURSOR_ARROW if disabled \
		else Control.CURSOR_POINTING_HAND
	btn.add_theme_font_size_override("font_size", 34)
	for state in ["font_color", "font_hover_color", "font_pressed_color", "font_disabled_color"]:
		btn.add_theme_color_override(state, UiSkin.BTN_TEXT)
	var base: Color = DISABLED if disabled else (GREEN if positive else UiSkin.BTN_RED)
	btn.add_theme_stylebox_override("normal", _style(base))
	btn.add_theme_stylebox_override("disabled", _style(base))
	btn.add_theme_stylebox_override("hover",
		_style(GREEN_HOVER if positive else UiSkin.BTN_RED_HOVER))
	btn.add_theme_stylebox_override("pressed",
		_style(GREEN_PRESSED if positive else UiSkin.BTN_RED_DARK))
	var note := str(item.get("note", ""))
	if note != "":
		btn.add_child(_make_note(note))
	var id := str(item.get("id", ""))
	btn.pressed.connect(func(): picked.emit(id))
	return btn


## 右侧小字（价钱、分值），放在按钮里靠右对齐。
func _make_note(text: String) -> Label:
	var label := Label.new()
	label.text = text
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	label.offset_right = -22.0
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 26)
	label.add_theme_color_override("font_color", UiSkin.BTN_TEXT)
	label.modulate.a = 0.85
	return label


func _style(color: Color) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = color
	sb.set_corner_radius_all(UiSkin.R_BUTTON)
	sb.content_margin_left = 22.0
	sb.content_margin_right = 22.0
	return sb


## 菜单开在宠物头顶上方，靠边时贴着屏幕收回来；多列或需要滚动时开在屏幕中间。
func _place() -> void:
	var list_size := _list.get_combined_minimum_size()
	var max_height := size.y - MARGIN * 2 - PANEL_PADDING.y 		- _title.get_combined_minimum_size().y - _content.get_theme_constant("separation")
	var scrolls := list_size.y > max_height
	_scroll.custom_minimum_size = Vector2(
		list_size.x + (SCROLLBAR_ROOM if scrolls else 0.0),
		minf(list_size.y, max_height))
	_panel.reset_size()
	var box := _panel.size
	var pos := _anchor - Vector2(box.x / 2.0, box.y + GAP)
	if _columns > 1 or scrolls:
		pos = (size - box) / 2.0
	pos.x = clampf(pos.x, MARGIN, size.x - box.x - MARGIN)
	pos.y = clampf(pos.y, MARGIN, size.y - box.y - MARGIN)
	_panel.position = pos
	_panel.pivot_offset = Vector2(box.x / 2.0, box.y)


func _play_open() -> void:
	_dim.modulate.a = 0.0
	_panel.modulate.a = 0.0
	_panel.scale = Vector2.ONE * 0.85
	var t := create_tween().set_parallel()
	t.tween_property(_dim, "modulate:a", 1.0, OPEN_TIME)
	t.tween_property(_panel, "modulate:a", 1.0, OPEN_TIME)
	t.tween_property(_panel, "scale", Vector2.ONE, OPEN_TIME) \
		.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


func _on_dim_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		closed.emit()


func _input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		closed.emit()
		get_viewport().set_input_as_handled()
