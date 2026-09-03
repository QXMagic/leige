extends Control

const PetScript = preload("res://scenes/pet/Pet.gd")

var _sprite: PetScript = null
var _target_size := 64.0
var _pending_pet: String = "cat"
var _layout_retry := 0

var _dbg_bg: ColorRect = null
var _dbg_label: Label = null


func _ready() -> void:
	_dbg_bg = ColorRect.new()
	_dbg_bg.color = Color(0, 1, 0, 0.25)
	_dbg_bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_dbg_bg.anchor_right = 1.0
	_dbg_bg.anchor_bottom = 1.0
	add_child(_dbg_bg)

	_dbg_label = Label.new()
	_dbg_label.text = _pending_pet
	_dbg_label.add_theme_font_size_override("font_size", 10)
	_dbg_label.add_theme_color_override("font_color", Color.BLACK)
	_dbg_label.anchor_right = 1.0
	_dbg_label.anchor_bottom = 1.0
	_dbg_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_dbg_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_dbg_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_dbg_label)

	mouse_filter = Control.MOUSE_FILTER_STOP
	clip_contents = false
	resized.connect(_update_layout)
	_update_layout.call_deferred()


func _process(_delta: float) -> void:
	if _layout_retry < 60:
		_layout_retry += 1
		_update_layout()


func set_pet(pet: String) -> void:
	_pending_pet = pet
	if _sprite:
		_sprite.set_pet(pet)
	if _dbg_label:
		_dbg_label.text = pet
	_update_layout.call_deferred()


func set_target_size(s: float) -> void:
	_target_size = s
	_update_layout.call_deferred()


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


func get_sprite() -> AnimatedSprite2D:
	return _sprite


func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		play_eat()


func _update_layout() -> void:
	if not _sprite:
		return
	_sprite.position = size * 0.5
	var tex := _get_first_texture()
	if tex:
		var tw := float(tex.get_width())
		var th := float(tex.get_height())
		if tw > 0.0 and th > 0.0:
			var s := _target_size / maxf(tw, th)
			_sprite.scale = Vector2(s, s)
	if _dbg_label:
		var sinfo := str(int(size.x)) + "x" + str(int(size.y))
		if tex:
			sinfo += " T" + str(int(tex.get_width()))
		_dbg_label.text = _pending_pet + " " + sinfo


func _get_first_texture() -> Texture2D:
	if not _sprite or not _sprite.sprite_frames:
		return null
	var sf: SpriteFrames = _sprite.sprite_frames
	for anim in ["idle", "sad", "eat"]:
		if sf.has_animation(anim) and sf.get_frame_count(anim) > 0:
			return sf.get_frame_texture(anim, 0)
	return null
