extends Control
## One pen in the sanctuary grid: brown slot + fence + pet + name plate + FEED
## badge. An "empty" cell shows a green plus instead and acts as the adopt slot.

signal feed_pressed(cell: Control)
signal add_pressed(cell: Control)
signal selected(cell: Control)

@export var pet_name: String = ""
@export var pet_type: String = "cat"
@export var empty: bool = true

@onready var _fence: TextureRect = $Fence
@onready var _shadow: TextureRect = $Shadow
@onready var _pet: Control = $PetView
@onready var _plate: TextureRect = $Plate
@onready var _name_label: Label = $NameLabel
@onready var _plus: Label = $Plus
@onready var _feed: TextureButton = $FeedButton
@onready var _hit: Button = $Hit
@onready var _highlight: Panel = $Highlight

var _is_selected: bool = false


func _ready() -> void:
	_feed.pressed.connect(_on_feed)
	_hit.pressed.connect(_on_hit)
	_apply()


func setup(p_name: String, p_type: String, p_empty: bool = false) -> void:
	pet_name = p_name
	pet_type = p_type
	empty = p_empty
	if is_node_ready():
		_apply()


## Marks this pen as the pet currently roaming the home lawn.
func set_selected(value: bool) -> void:
	_is_selected = value
	if is_node_ready():
		_highlight.visible = value and not empty


func play_eat() -> void:
	if not empty:
		_pet.play_eat()


func _apply() -> void:
	_pet.visible = not empty
	_shadow.visible = not empty
	_feed.visible = not empty
	_plate.visible = not empty
	_name_label.visible = not empty
	_plus.visible = empty
	_highlight.visible = _is_selected and not empty
	if not empty:
		_pet.set_pet(pet_type)
		_name_label.text = pet_name


func _on_feed() -> void:
	play_eat()
	feed_pressed.emit(self)


func _on_hit() -> void:
	if empty:
		add_pressed.emit(self)
	else:
		selected.emit(self)
