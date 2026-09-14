extends Control
## One pen in the sanctuary grid: brown slot + fence + pet + name plate + FEED
## badge. An "empty" cell shows a green plus instead and acts as the adopt slot.

signal feed_pressed(cell: Control)
signal add_pressed(cell: Control)
## Double-click / double-tap on an occupied pen: put this pet on the home lawn.
signal place_requested(cell: Control)

const FoodFly = preload("res://scenes/common/FoodFly.gd")
## Food lands a little below the centre of the pet box, roughly at the mouth.
const MOUTH_OFFSET := Vector2(0, 22)
## Two clicks on the pen within this window count as a double-click. Timed by
## hand rather than InputEventMouseButton.double_click so touch taps work too.
const DOUBLE_CLICK_MS := 350

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
var _feeding: bool = false
var _last_click_ms: int = -DOUBLE_CLICK_MS


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


## Throws this pet's food from the FEED button into its mouth, then plays eat.
## Clicks while the food is still in the air are ignored.
func feed() -> void:
	if empty or _feeding:
		return
	_feeding = true
	_bounce_feed_button()
	var from := _feed.position + _feed.size / 2.0
	var to := _pet.position + _pet.size / 2.0 + MOUTH_OFFSET
	await FoodFly.fly(self, FoodFly.texture_for(pet_type), from, to)
	play_eat()
	_feeding = false


func _bounce_feed_button() -> void:
	_feed.pivot_offset = _feed.size / 2.0
	var t := create_tween()
	t.tween_property(_feed, "scale", Vector2.ONE * 0.85, 0.06)
	t.tween_property(_feed, "scale", Vector2.ONE, 0.18).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


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
	if _feeding:
		return
	feed()
	feed_pressed.emit(self)


func _on_hit() -> void:
	if empty:
		add_pressed.emit(self)
		return
	var now := Time.get_ticks_msec()
	if now - _last_click_ms <= DOUBLE_CLICK_MS:
		_last_click_ms = -DOUBLE_CLICK_MS
		place_requested.emit(self)
	else:
		_last_click_ms = now
