extends Control
## One pen in the sanctuary grid: brown slot + fence + pet + name plate + FEED
## badge. An "empty" cell shows a green plus instead and acts as the adopt slot;
## a locked empty cell shows the level that unlocks it.

signal feed_pressed(cell: Control)
signal add_pressed(cell: Control)
## Double-click / double-tap on an occupied pen: put this pet on the home lawn.
signal place_requested(cell: Control)
## Click on the name plate of an occupied pen: rename this pet.
signal rename_pressed(cell: Control)

const FoodFly = preload("res://scenes/common/FoodFly.gd")
## Food lands a little below the centre of the pet box, roughly at the mouth.
const MOUTH_OFFSET := Vector2(0, 22)
## Two clicks on the pen within this window count as a double-click. Timed by
## hand rather than InputEventMouseButton.double_click so touch taps work too.
const DOUBLE_CLICK_MS := 350

@export var pet_name: String = ""
@export var pet_type: String = "cat"
@export var empty: bool = true
## 这只宠物吃出来的能量，决定它的等级。
@export var energy: int = 0
## 空栏位还没解锁时，本组宠物要达到的等级；0 表示已解锁。
@export var locked_level: int = 0

const LOCKED_FONT_SIZE := 34
const LOCKED_COLOR := Color(0.93, 0.85, 0.74, 0.9)

@onready var _fence: TextureRect = $Fence
@onready var _shadow: TextureRect = $Shadow
@onready var _pet: Control = $PetView
@onready var _plate: TextureRect = $Plate
@onready var _name_label: Label = $NameLabel
@onready var _level_label: Label = $LevelLabel
@onready var _plus: Label = $Plus
@onready var _feed: TextureButton = $FeedButton
@onready var _hit: Button = $Hit
@onready var _rename_hit: Button = $RenameHit
@onready var _highlight: Panel = $Highlight

var _is_selected: bool = false
var _feeding: bool = false
var _last_click_ms: int = -DOUBLE_CLICK_MS
var _plus_font_size: int = 0
var _plus_color: Color


func _ready() -> void:
	_feed.pressed.connect(_on_feed)
	_hit.pressed.connect(_on_hit)
	_rename_hit.pressed.connect(func(): rename_pressed.emit(self))
	_rename_hit.mouse_entered.connect(func(): _plate.modulate = Color(1.12, 1.12, 1.12))
	_rename_hit.mouse_exited.connect(func(): _plate.modulate = Color.WHITE)
	_plus_font_size = _plus.get_theme_font_size("font_size")
	_plus_color = _plus.get_theme_color("font_color")
	_apply()


func setup(p_name: String, p_type: String, p_empty: bool = false, p_energy: int = 0,
		p_locked_level: int = 0) -> void:
	pet_name = p_name
	pet_type = p_type
	empty = p_empty
	energy = p_energy
	locked_level = p_locked_level
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
## Only call this once the food has actually been paid for (ScoreState.feed
## returned true). Clicks while the food is still in the air are ignored.
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
	_rename_hit.visible = not empty
	_level_label.visible = not empty
	_plus.visible = empty
	_highlight.visible = _is_selected and not empty
	var locked := empty and locked_level > 0
	_plus.text = "Lv.%d
解锁" % locked_level if locked else "+"
	_plus.add_theme_font_size_override("font_size", LOCKED_FONT_SIZE if locked else _plus_font_size)
	_plus.add_theme_color_override("font_color", LOCKED_COLOR if locked else _plus_color)
	if not empty:
		_pet.set_pet(pet_type)
		_name_label.text = pet_name
		_level_label.text = "Lv.%d · %d" % [PetState.level_of(energy), energy]


## FEED 只负责打开食物菜单；买得起、选好食物之后 Sanctuary 才会调 feed() 播动画。
func _on_feed() -> void:
	if _feeding:
		return
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
