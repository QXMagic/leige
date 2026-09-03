extends Control
## One entry in the adoption dialog: a green nest ring with a pet sitting in it
## and (when adoptable) a red 领养 button underneath.

signal adopt_pressed(slot: Control)

@export var pet_type: String = "cat"
@export var pet_label: String = ""
@export var adoptable: bool = false

@onready var _pet: Control = $PetView
@onready var _btn: Button = $AdoptButton


func _ready() -> void:
	_btn.pressed.connect(func(): adopt_pressed.emit(self))
	_apply()


func setup(p_type: String, p_label: String, p_adoptable: bool) -> void:
	pet_type = p_type
	pet_label = p_label
	adoptable = p_adoptable
	if is_node_ready():
		_apply()


func _apply() -> void:
	_pet.set_pet(pet_type)
	_btn.visible = adoptable
