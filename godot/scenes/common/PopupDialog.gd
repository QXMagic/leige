extends Control
## Shared wooden popup: ribbon title, message body and up to two buttons.
## Open it through the Modal autoload rather than instancing it directly.

signal closed(result: StringName)

const TEX_GREEN := preload("res://resource/ui/btn_green.png")
const TEX_RED := preload("res://resource/ui/btn_red.png")

const RESULT_CONFIRM := &"confirm"
const RESULT_CANCEL := &"cancel"

## The panel art is 1110x871; it is shown slightly smaller on the 1920x1080 canvas.
const PANEL_SCALE := 0.85
const OPEN_TIME := 0.22
const CLOSE_TIME := 0.12

@onready var _dim: ColorRect = $Dim
@onready var _panel: TextureRect = $Panel
@onready var _title: Label = $Panel/Title
@onready var _message: Label = $Panel/Message
@onready var _cancel_slot: Control = $Panel/Buttons/CancelSlot
@onready var _cancel: TextureButton = $Panel/Buttons/CancelSlot/CancelButton
@onready var _cancel_label: Label = $Panel/Buttons/CancelSlot/CancelButton/Label
@onready var _confirm: TextureButton = $Panel/Buttons/ConfirmSlot/ConfirmButton
@onready var _confirm_label: Label = $Panel/Buttons/ConfirmSlot/ConfirmButton/Label
@onready var _close: TextureButton = $Panel/CloseButton

var _options: Dictionary = {}
var _dismissible: bool = true
var _closing: bool = false


## Options (all optional):
##   title: String         ribbon text
##   message: String       body text
##   confirm_text: String  confirm button text, default "确定"
##   cancel_text: String   cancel button text, default "取消"; "" hides the button
##   danger: bool          swap colours so confirm is red (destructive actions)
##   show_close: bool      top-right close button, default false
##   dismissible: bool     dim click / Esc cancels, default true
func setup(options: Dictionary) -> void:
	_options = options
	if is_node_ready():
		_apply()


func _ready() -> void:
	_confirm.pressed.connect(_finish.bind(RESULT_CONFIRM))
	_cancel.pressed.connect(_finish.bind(RESULT_CANCEL))
	_close.pressed.connect(_finish.bind(RESULT_CANCEL))
	_dim.gui_input.connect(_on_dim_input)
	for btn: TextureButton in [_confirm, _cancel, _close]:
		_add_press_feedback(btn)
	_apply()
	_play_open()


func _apply() -> void:
	_title.text = str(_options.get("title", ""))
	_message.text = str(_options.get("message", ""))
	_confirm_label.text = str(_options.get("confirm_text", "确定"))
	var cancel_text := str(_options.get("cancel_text", "取消"))
	_cancel_label.text = cancel_text
	_cancel_slot.visible = cancel_text != ""
	var danger := bool(_options.get("danger", false))
	_confirm.texture_normal = TEX_RED if danger else TEX_GREEN
	_cancel.texture_normal = TEX_GREEN if danger else TEX_RED
	_close.visible = bool(_options.get("show_close", false))
	_dismissible = bool(_options.get("dismissible", true))


## Buttons sit inside plain slot Controls, so the HBox re-sorting never resets
## the press scale applied here.
func _add_press_feedback(btn: TextureButton) -> void:
	btn.pivot_offset = btn.size / 2.0
	btn.resized.connect(func(): btn.pivot_offset = btn.size / 2.0)
	btn.mouse_entered.connect(func(): btn.modulate = Color(1.08, 1.08, 1.08))
	btn.mouse_exited.connect(func(): btn.modulate = Color.WHITE)
	btn.button_down.connect(func(): btn.scale = Vector2.ONE * 0.94)
	btn.button_up.connect(func(): btn.scale = Vector2.ONE)


func _play_open() -> void:
	_dim.modulate.a = 0.0
	_panel.modulate.a = 0.0
	_panel.scale = Vector2.ONE * PANEL_SCALE * 0.8
	var t := create_tween().set_parallel()
	t.tween_property(_dim, "modulate:a", 1.0, OPEN_TIME)
	t.tween_property(_panel, "modulate:a", 1.0, OPEN_TIME * 0.6)
	t.tween_property(_panel, "scale", Vector2.ONE * PANEL_SCALE, OPEN_TIME) \
		.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)


func _finish(result: StringName) -> void:
	if _closing:
		return
	_closing = true
	closed.emit(result)
	var t := create_tween().set_parallel()
	t.tween_property(_dim, "modulate:a", 0.0, CLOSE_TIME)
	t.tween_property(_panel, "modulate:a", 0.0, CLOSE_TIME)
	t.tween_property(_panel, "scale", Vector2.ONE * PANEL_SCALE * 0.9, CLOSE_TIME)
	t.chain().tween_callback(queue_free)


func _on_dim_input(event: InputEvent) -> void:
	if _dismissible and event is InputEventMouseButton and event.pressed:
		_finish(RESULT_CANCEL)


## _input (not _unhandled_input): autoload-owned dialogs come before the views
## in the tree, so views would otherwise see Esc first and close underneath us.
func _input(event: InputEvent) -> void:
	if _closing:
		return
	if event.is_action_pressed("ui_cancel"):
		if _dismissible:
			_finish(RESULT_CANCEL)
		get_viewport().set_input_as_handled()
	elif event.is_action_pressed("ui_accept"):
		_finish(RESULT_CONFIRM)
		get_viewport().set_input_as_handled()
