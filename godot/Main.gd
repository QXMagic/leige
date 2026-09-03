extends Control
## Root router: Home <-> Sanctuary, with a short cross-fade between them.
## Shared data lives in the PetState autoload, not in the views, because each
## view is rebuilt from scratch on every navigation.

const LOADING_SCENE := "res://scenes/loading/Loading.tscn"
const HOME_SCENE := "res://scenes/home/MainHome.tscn"
const SANCTUARY_SCENE := "res://scenes/sanctuary/Sanctuary.tscn"
const FADE_TIME := 0.18

var _current: Control = null
var _fade: ColorRect = null
var _busy: bool = false


func _ready() -> void:
	_fade = ColorRect.new()
	_fade.color = Color(0.16, 0.09, 0.05, 0.0)
	_fade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_fade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_fade.z_index = 100
	add_child(_fade)
	_show(LOADING_SCENE, false)


func _show_home() -> void:
	_show(HOME_SCENE)


func _show_sanctuary() -> void:
	_show(SANCTUARY_SCENE)


func _show(path: String, animate: bool = true) -> void:
	if _busy:
		return
	_busy = true
	if animate:
		await _tween_fade(1.0)
	_swap((load(path) as PackedScene).instantiate())
	if animate:
		await _tween_fade(0.0)
	_busy = false


func _tween_fade(alpha: float) -> void:
	var t := create_tween()
	t.tween_property(_fade, "color:a", alpha, FADE_TIME)
	await t.finished


func _swap(view: Control) -> void:
	if _current and is_instance_valid(_current):
		_current.queue_free()
	_current = view
	view.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(view)
	move_child(_fade, get_child_count() - 1)   # keep the fade on top
	_wire(view)


func _wire(view: Control) -> void:
	if view.has_signal("finished"):
		view.finished.connect(_show_home)
	if view.has_signal("enter_sanctuary"):
		view.enter_sanctuary.connect(_show_sanctuary)
	if view.has_signal("closed"):
		view.closed.connect(_on_view_closed.bind(view))


func _on_view_closed(view: Control) -> void:
	# The sanctuary closes back to the home screen; the home screen exits.
	if view.scene_file_path == SANCTUARY_SCENE:
		_show_home()
	else:
		get_tree().quit()
