extends Control
## Home / sanctuary grounds — reference: resource/references/preview_3.jpg
##
## The pet on the lawn is whichever pen is active in PetState, so adopting or
## picking a pet in the sanctuary is visible here the moment you come back.

signal enter_sanctuary()
signal closed()

@onready var _house: Button = $HouseHotspot
@onready var _close: TextureButton = $CloseButton
@onready var _pet: Control = $Pet
@onready var _pet_hit: Button = $PetHit
@onready var _state: Node = get_node("/root/PetState")


func _ready() -> void:
	_house.pressed.connect(func(): enter_sanctuary.emit())
	_close.pressed.connect(func(): closed.emit())
	_pet_hit.pressed.connect(func(): _pet.play_eat())
	_state.active_changed.connect(_on_active_changed)
	_sync()


func _sync() -> void:
	_pet.set_pet(_state.active_pet_type())


func _on_active_changed(_index: int, _pet_data: Dictionary) -> void:
	_sync()
