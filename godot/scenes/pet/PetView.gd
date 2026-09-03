extends Control
## Control wrapper that hosts a Pet (AnimatedSprite2D) centred in this rect and
## scaled so the 256px animation frame fits `target_size` pixels.

const PetScript = preload("res://scenes/pet/Pet.gd")
const FRAME_PX := PetScript.FRAME_PX

@export var pet_type: String = "cat":
	set(v):
		pet_type = v
		if _sprite:
			_sprite.set_pet(v)

@export var target_size: float = 160.0:
	set(v):
		target_size = v
		_update_layout()

var _sprite: AnimatedSprite2D = null


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	clip_contents = false
	_sprite = PetScript.new()
	_sprite.centered = true
	add_child(_sprite)
	_sprite.set_pet(pet_type)
	resized.connect(_update_layout)
	_update_layout()


func set_pet(pet: String) -> void:
	pet_type = pet


func play_idle() -> void:
	if _sprite:
		_sprite.play_idle()


func play_eat() -> void:
	if _sprite:
		_sprite.play_eat()


func play_sad() -> void:
	if _sprite:
		_sprite.play_sad()


func is_sad() -> bool:
	return _sprite != null and _sprite.return_action == "sad"


func _update_layout() -> void:
	if not _sprite:
		return
	_sprite.position = size * 0.5
	var s := target_size / FRAME_PX
	_sprite.scale = Vector2(s, s)
