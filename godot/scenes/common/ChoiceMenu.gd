extends Control
## 弹在宠物头顶的选择菜单：加减分理由、投喂的食物都用它。
##
##   var menu = ChoiceMenu 实例
##   menu.setup("第1组 · 35积分", items, anchor)
##   menu.picked.connect(...)
##
## items 每项：{id, label, note(右侧小字，可选), positive(绿/红), disabled}

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

@onready var _dim: ColorRect = $Dim
@onready var _panel: PanelContainer = $Panel
@onready var _title: Label = $Panel/Content/Title
@onready var _list: VBoxContainer = $Panel/Content/List

var _title_text: String = ""
var _items: Array = []
var _anchor: Vector2 = Vector2(960, 540)


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
	for item: Dictionary in _items:
		_list.add_child(_make_button(item))
	_place.call_deferred()


func _make_button(item: Dictionary) -> Button:
	var disabled := bool(item.get("disabled", false))
	var positive := bool(item.get("positive", true))
	var btn := Button.new()
	btn.text = str(item.get("label", ""))
	btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
	btn.custom_minimum_size = Vector2(0, 74)
	btn.focus_mode = Control.FOCUS_NONE
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


## 菜单开在宠物头顶上方，靠边时贴着屏幕收回来。
func _place() -> void:
	_panel.reset_size()
	var box := _panel.size
	var pos := _anchor - Vector2(box.x / 2.0, box.y + GAP)
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
