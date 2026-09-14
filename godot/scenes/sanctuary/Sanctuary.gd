extends Control
## "PET SANCTUARY MANAGEMENT" screen — reference: resource/references/preview_2.jpg
##
## Reads its roster from the PetState autoload, so adoptions and the picked pet
## survive navigating back to the home screen.

signal closed()

const ADOPT_DIALOG_SCENE := "res://scenes/sanctuary/AdoptDialog.tscn"
const PLACE_DELAY := 0.25

@onready var _grid: GridContainer = $Panel/GridArea/Grid
@onready var _close: TextureButton = $CloseButton
@onready var _state: Node = get_node("/root/PetState")

var _dialog: Control = null
var _leaving: bool = false


func _ready() -> void:
	_close.pressed.connect(func(): closed.emit())
	for i in _grid.get_child_count():
		var cell: Control = _grid.get_child(i)
		cell.feed_pressed.connect(_on_feed)
		cell.add_pressed.connect(_on_add.bind(i))
		cell.place_requested.connect(_on_place_requested.bind(i))
	_state.roster_changed.connect(_on_roster_changed)
	_state.active_changed.connect(_on_active_changed)
	_refresh()


func _refresh() -> void:
	for i in _grid.get_child_count():
		var cell: Control = _grid.get_child(i)
		var d: Dictionary = _state.pet_at(i)
		if d.is_empty():
			cell.setup("", "", true)
		else:
			cell.setup(str(d.get("name", "")), str(d.get("type", "cat")), false)
		cell.set_selected(i == _state.active_index)


func _on_roster_changed(_roster: Array) -> void:
	_refresh()


func _on_active_changed(index: int, _pet: Dictionary) -> void:
	for i in _grid.get_child_count():
		_grid.get_child(i).set_selected(i == index)


func _on_feed(_cell: Control) -> void:
	pass  # the cell already plays its eat animation


## Double-clicking an occupied pen puts that pet on the home lawn and heads
## back there. The short pause lets the highlight visibly jump to the new pen.
func _on_place_requested(_cell: Control, index: int) -> void:
	if _leaving:
		return
	_leaving = true
	_state.set_active(index)
	await get_tree().create_timer(PLACE_DELAY).timeout
	closed.emit()


func _on_add(_cell: Control, index: int) -> void:
	if _dialog and is_instance_valid(_dialog):
		return
	_dialog = (load(ADOPT_DIALOG_SCENE) as PackedScene).instantiate()
	add_child(_dialog)
	_dialog.adopted.connect(_on_adopted.bind(index))
	_dialog.closed.connect(_close_dialog)


func _on_adopted(pet_type: String, pet_name: String, index: int) -> void:
	_state.adopt(index, pet_type, pet_name)
	_close_dialog()


func _close_dialog() -> void:
	if _dialog and is_instance_valid(_dialog):
		_dialog.queue_free()
	_dialog = null


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		closed.emit()
		get_viewport().set_input_as_handled()
