extends Control
## Adoption modal — reference: resource/references/preview_1.jpg

signal adopted(pet_type: String, pet_label: String)
signal closed()

## 宠物市场里的候选，都可以领养，不同小组也能领同一种。
const CANDIDATES := [
	{"type": "hamster", "label": "Nibbles"},
	{"type": "dog", "label": "Shiba"},
	{"type": "cat", "label": "Ginger"},
	{"type": "rabbit", "label": "Cotton"},
	{"type": "bear", "label": "Barley"},
	{"type": "sheep", "label": "Cloud"},
	{"type": "panda", "label": "Dumpling"},
]

@onready var _scroll: ScrollContainer = $Panel/Scroll
@onready var _grid: GridContainer = $Panel/Scroll/Grid
@onready var _close: TextureButton = $Panel/CloseButton
@onready var _dim: ColorRect = $Dim


func _ready() -> void:
	_close.pressed.connect(func(): closed.emit())
	_dim.gui_input.connect(_on_dim_input)
	_hide_scrollbar()
	for i in _grid.get_child_count():
		var slot: Control = _grid.get_child(i)
		if i < CANDIDATES.size():
			var c: Dictionary = CANDIDATES[i]
			slot.setup(str(c["type"]), str(c["label"]), true)
			slot.adopt_pressed.connect(_on_adopt)
		else:
			slot.visible = false


func _hide_scrollbar() -> void:
	var vs := _scroll.get_v_scroll_bar()
	for st in ["scroll", "scroll_focus", "grabber", "grabber_highlight", "grabber_pressed"]:
		vs.add_theme_stylebox_override(st, StyleBoxEmpty.new())


func _on_adopt(slot: Control) -> void:
	adopted.emit(slot.pet_type, slot.pet_label)


func _on_dim_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		closed.emit()


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		closed.emit()
		get_viewport().set_input_as_handled()
