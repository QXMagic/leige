extends AnimatedSprite2D

const PETS := ["bear", "cat", "dog", "hamster", "panda", "rabbit", "sheep"]
const ACTIONS := ["idle", "eat", "sad"]
const FRAME_COUNT := 32
const BASE_DIR := "res://resource/animations"
const TEX_SIZE := 256
const FPS_IDLE := 10.0
const FPS_EAT := 12.0
const FPS_SAD := 8.0

var pet_type: String = "cat"
var return_action: String = "idle"

static var _frames_cache: Dictionary = {}

var _lazy_queue: Array = []
var _lazy_owner := false


static func _frame_path(pet: String, action: String, i: int) -> String:
	return "%s/%s/%s/%s_%s_%02d.png" % [BASE_DIR, pet, action, pet, action, i]


static func _ensure_animation(sf: SpriteFrames, action: String) -> void:
	if sf.has_animation(action):
		return
	sf.add_animation(action)
	var fps := FPS_IDLE
	var looped := true
	match action:
		"idle":
			fps = FPS_IDLE
			looped = true
		"eat":
			fps = FPS_EAT
			looped = false
		"sad":
			fps = FPS_SAD
			looped = true
	sf.set_animation_speed(action, fps)
	sf.set_animation_loop(action, looped)


static func _load_single_frame(sf: SpriteFrames, pet: String, action: String, i: int) -> void:
	_ensure_animation(sf, action)
	var p := _frame_path(pet, action, i)
	var tex: Texture2D = ResourceLoader.load(p, "Texture2D", ResourceLoader.CACHE_MODE_IGNORE)
	if not tex:
		return
	var img := tex.get_image()
	if img:
		img.resize(TEX_SIZE, TEX_SIZE)
		var small_tex: ImageTexture = ImageTexture.create_from_image(img)
		sf.add_frame(action, small_tex)


static func _make_sprite_frames(pet: String) -> SpriteFrames:
	var sf := SpriteFrames.new()
	if sf.has_animation("default"):
		sf.remove_animation("default")
	_load_single_frame(sf, pet, "idle", 1)
	return sf


func set_pet(pet: String) -> void:
	pet_type = pet
	if not _frames_cache.has(pet):
		_frames_cache[pet] = _make_sprite_frames(pet)
		_lazy_owner = true
		for i in range(2, FRAME_COUNT + 1):
			_lazy_queue.append(i)
	sprite_frames = _frames_cache[pet]
	if sprite_frames.has_animation("idle"):
		play("idle")


func _process(_delta: float) -> void:
	if not _lazy_owner or _lazy_queue.is_empty():
		return
	var i: int = int(_lazy_queue.pop_front())
	if sprite_frames:
		_load_single_frame(sprite_frames, pet_type, "idle", i)


func play_idle() -> void:
	return_action = "idle"
	if sprite_frames and sprite_frames.has_animation("idle"):
		play("idle")


func play_sad() -> void:
	return_action = "sad"
	if not sprite_frames:
		return
	_ensure_animation(sprite_frames, "sad")
	if sprite_frames.get_frame_count("sad") == 0:
		for i in range(1, FRAME_COUNT + 1):
			_load_single_frame(sprite_frames, pet_type, "sad", i)
	if sprite_frames.has_animation("sad"):
		play("sad")


func play_eat() -> void:
	if not sprite_frames:
		return
	_ensure_animation(sprite_frames, "eat")
	if sprite_frames.get_frame_count("eat") == 0:
		for i in range(1, FRAME_COUNT + 1):
			_load_single_frame(sprite_frames, pet_type, "eat", i)
	if not sprite_frames.has_animation("eat") or sprite_frames.get_frame_count("eat") == 0:
		if sprite_frames.has_animation(return_action):
			play(return_action)
		return
	if not animation_finished.is_connected(_on_eat_finished):
		animation_finished.connect(_on_eat_finished)
	play("eat")


func _on_eat_finished() -> void:
	if animation_finished.is_connected(_on_eat_finished):
		animation_finished.disconnect(_on_eat_finished)
	if sprite_frames and sprite_frames.has_animation(return_action):
		play(return_action)
	else:
		play("idle")
