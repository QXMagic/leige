extends AnimatedSprite2D

const PETS := ["bear", "cat", "dog", "hamster", "panda", "rabbit", "sheep"]
const ACTIONS := ["idle", "eat", "sad"]
const FRAME_COUNT := 32
const BASE_DIR := "res://resource/animations"

## Frames are stored cropped to each species' union alpha box (see
## tools/shrink_animations.py) at the pixel density of a FRAME_PX square.
## FRAME_OFFSET re-centres the crop so the pet still renders exactly where an
## uncropped frame would have put it.
const FRAME_PX := 512.0
const FRAME_OFFSET := {
	"bear": Vector2(7.87, -13.47),
	"cat": Vector2(-0.4, 5.47),
	"dog": Vector2(-2.8, 1.73),
	"hamster": Vector2(-26.67, -7.07),
	"panda": Vector2(20.53, 16.53),
	"rabbit": Vector2(-17.73, -1.2),
	"sheep": Vector2(1.73, 27.2),
}
## Actions the loading screen warms up. "sad" is left out on purpose: nothing
## in the UI plays it yet and it would cost ~49 MB of resident texture memory.
## play_sad() still loads it on demand.
const PRELOAD_ACTIONS := ["idle", "eat"]

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


## Frames are appended in ascending order by whichever producer gets there
## first -- the loading screen's preloader and a live pet's lazy queue can both
## target the same cached SpriteFrames. Skipping an index that already exists
## keeps that idempotent instead of appending the animation twice.
static func _load_single_frame(sf: SpriteFrames, pet: String, action: String, i: int) -> void:
	_ensure_animation(sf, action)
	if sf.get_frame_count(action) > i - 1:
		return
	var tex: Texture2D = load(_frame_path(pet, action, i))
	if tex:
		sf.add_frame(action, tex)


static func _make_sprite_frames(pet: String) -> SpriteFrames:
	var sf := SpriteFrames.new()
	if sf.has_animation("default"):
		sf.remove_animation("default")
	_load_single_frame(sf, pet, "idle", 1)
	return sf


## Every (species, action, frame) triple the loading screen should warm, in the
## order it should warm them. `first` is loaded up front so the loading screen
## can show that mascot while the rest streams in.
static func preload_plan(first: String = "panda") -> Array:
	var order: Array = [first]
	for pet in PETS:
		if pet != first:
			order.append(pet)
	var plan: Array = []
	for pet in order:
		for action in PRELOAD_ACTIONS:
			for i in range(1, FRAME_COUNT + 1):
				plan.append([pet, action, i])
	return plan


## Load one entry from preload_plan() into the shared SpriteFrames cache.
static func preload_one(entry: Array) -> void:
	var pet: String = entry[0]
	if not _frames_cache.has(pet):
		var sf := SpriteFrames.new()
		if sf.has_animation("default"):
			sf.remove_animation("default")
		_frames_cache[pet] = sf
	_load_single_frame(_frames_cache[pet], pet, entry[1], int(entry[2]))


## True once `pet` has a full idle loop cached, i.e. it is safe to display.
static func is_ready(pet: String) -> bool:
	if not _frames_cache.has(pet):
		return false
	var sf: SpriteFrames = _frames_cache[pet]
	return sf.has_animation("idle") and sf.get_frame_count("idle") >= FRAME_COUNT


func set_pet(pet: String) -> void:
	pet_type = pet
	if not _frames_cache.has(pet):
		_frames_cache[pet] = _make_sprite_frames(pet)
		_lazy_owner = true
		for i in range(2, FRAME_COUNT + 1):
			_lazy_queue.append(i)
	sprite_frames = _frames_cache[pet]
	offset = FRAME_OFFSET.get(pet, Vector2.ZERO)
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
