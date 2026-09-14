extends Control
## Boot screen. Warms the texture/scene caches so that neither the first
## navigation nor the first FEED click hitches, then hands off to the router.
##
## Work is done in time-sliced batches rather than one blocking loop, so the
## bar keeps animating and the mascot keeps playing while loading.

signal finished()

const PetScript = preload("res://scenes/pet/Pet.gd")
const FoodFly = preload("res://scenes/common/FoodFly.gd")

## Milliseconds of loading allowed per rendered frame.
const BUDGET_MS := 8
## Floor on how long the screen stays up, so a fast load does not flash by.
const MIN_SECONDS := 0.9
## Species shown on this screen; its frames are loaded first.
const MASCOT := "panda"

const UI_TEXTURES := [
	"res://resource/ui/bg_panel.png",
	"res://resource/ui/bg_grid.png",
	"res://resource/ui/fence.png",
	"res://resource/ui/name_plate.png",
	"res://resource/ui/btn_feed.png",
	"res://resource/ui/btn_close.png",
	"res://resource/ui/shadow.png",
	"res://resource/ui/popup_panel.png",
	"res://resource/ui/btn_red.png",
	"res://resource/ui/btn_green.png",
	"res://resource/sprites/illustration.png",
]

const SCENES := [
	"res://scenes/common/PetCell.tscn",
	"res://scenes/common/AdoptSlot.tscn",
	"res://scenes/home/MainHome.tscn",
	"res://scenes/sanctuary/Sanctuary.tscn",
	"res://scenes/sanctuary/AdoptDialog.tscn",
	"res://scenes/common/PopupDialog.tscn",
]

@onready var _fill: Panel = $BarTrack/BarFill
@onready var _percent: Label = $Percent
@onready var _pet: Control = $Pet
@onready var _shadow: TextureRect = $Shadow

var _tasks: Array = []
var _total: int = 0
var _done: int = 0
var _elapsed: float = 0.0
var _track_width: float = 0.0
var _emitted: bool = false


func _ready() -> void:
	_pet.visible = false
	_shadow.visible = false
	for path in UI_TEXTURES + FoodFly.all_textures():
		_tasks.append(["res", path])
	for path in SCENES:
		_tasks.append(["res", path])
	for entry in PetScript.preload_plan(MASCOT):
		_tasks.append(["frame", entry])
	_total = maxi(1, _tasks.size())
	_track_width = $BarTrack.size.x
	_set_progress(0.0)


func _process(delta: float) -> void:
	_elapsed += delta

	var started := Time.get_ticks_msec()
	while not _tasks.is_empty() and Time.get_ticks_msec() - started < BUDGET_MS:
		_run(_tasks.pop_front())
		_done += 1

	if not _pet.visible and PetScript.is_ready(MASCOT):
		_pet.set_pet(MASCOT)
		_pet.visible = true
		_shadow.visible = true

	# Advance at whichever is slower: real work, or the minimum display time.
	# That way the bar never sits at 100% waiting, and never flashes past.
	var work := float(_done) / float(_total)
	var floor_progress := _elapsed / MIN_SECONDS
	_set_progress(minf(work, floor_progress))

	if _tasks.is_empty() and _elapsed >= MIN_SECONDS and not _emitted:
		_emitted = true
		set_process(false)
		finished.emit()


func _run(task: Array) -> void:
	if task[0] == "res":
		ResourceLoader.load(task[1])
	else:
		PetScript.preload_one(task[1])


func _set_progress(p: float) -> void:
	p = clampf(p, 0.0, 1.0)
	_fill.size.x = maxf(_fill.custom_minimum_size.x, _track_width * p)
	_percent.text = "%d%%" % roundi(p * 100.0)
