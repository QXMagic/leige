extends Control
## Adoption modal — reference: resource/references/preview_1.jpg

signal adopted(pet_type: String, pet_label: String)
signal closed()

## Mirrors the reference: only the first two entries offer a 领养 button.
const CANDIDATES := [
	{"type": "hamster", "label": "Nibbles", "adoptable": true},
	{"type": "dog", "label": "Shiba", "adoptable": true},
	{"type": "cat", "label": "Ginger", "adoptable": false},
	{"type": "rabbit", "label": "Cotton", "adoptable": false},
	{"type": "bear", "label": "Barley", "adoptable": false},
	{"type": "sheep", "label": "Cloud", "adoptable": false},
	{"type": "panda", "label": "Dumpling", "adoptable": false},
]

@onready var _scroll: ScrollContainer = $Panel/Scroll
@onready var _grid: GridContainer = $Panel/Scroll/Grid
@onready var _close: TextureButton = $Panel/CloseButton
@onready var _dim: ColorRect = $Dim
@onready var _state: Node = get_node("/root/PetState")


func _ready() -> void:
	_close.pressed.connect(func(): closed.emit())
	_dim.gui_input.connect(_on_dim_input)
	_hide_scrollbar()
	for i in _grid.get_child_count():
		var slot: Control = _grid.get_child(i)
		if i < CANDIDATES.size():
			var c: Dictionary = CANDIDATES[i]
			# A candidate already living in a pen can no longer be adopted.
			var can_adopt: bool = bool(c["adoptable"]) and not _state.is_owned(str(c["label"]))
			slot.setup(str(c["type"]), str(c["label"]), can_adopt)
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
