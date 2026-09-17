extends Node
## Global entry point for the shared wooden popup (scenes/common/PopupDialog.tscn).
##
##   if await Modal.confirm("释放宠物", "确定要让 Luna 回归自然吗？", "释放", "再想想", true):
##       ...
##   await Modal.alert("提示", "喂食成功！")
##
## Dialogs live on their own CanvasLayer, so they sit above every view and the
## router's fade, and are not freed when Main swaps views.

const PopupDialog = preload("res://scenes/common/PopupDialog.gd")
const DIALOG_SCENE := "res://scenes/common/PopupDialog.tscn"
const LAYER := 50

var _layer: CanvasLayer = null


func _ready() -> void:
	_layer = CanvasLayer.new()
	_layer.layer = LAYER
	add_child(_layer)


## Opens a dialog and returns it right away; listen to its `closed(result)`
## signal. See PopupDialog.setup() for the accepted options.
func open(options: Dictionary) -> Control:
	var dlg: Control = (load(DIALOG_SCENE) as PackedScene).instantiate()
	dlg.setup(options)
	_layer.add_child(dlg)
	return dlg


## Two-button dialog. Resolves true only when the confirm button (or Enter) is used.
func confirm(title: String, message: String, confirm_text: String = "确定",
		cancel_text: String = "取消", danger: bool = false) -> bool:
	var dlg := open({
		"title": title,
		"message": message,
		"confirm_text": confirm_text,
		"cancel_text": cancel_text,
		"danger": danger,
	})
	var result: StringName = await dlg.closed
	return result == PopupDialog.RESULT_CONFIRM


## Single-button notice.
func alert(title: String, message: String, ok_text: String = "确定") -> void:
	var dlg := open({
		"title": title,
		"message": message,
		"confirm_text": ok_text,
		"cancel_text": "",
	})
	await dlg.closed


## Dialog with a text field. Resolves to the trimmed text on confirm, or null
## when cancelled. `validator` gets the trimmed text and returns an error
## message ("" = ok); while it complains the dialog stays open and shows it.
##
##   var name = await Modal.prompt("取名", "给它起个名字吧", "Luna")
##   if name != null: ...
func prompt(title: String, message: String, text: String = "", placeholder: String = "",
		max_length: int = 0, validator: Callable = Callable(),
		confirm_text: String = "确定", cancel_text: String = "取消") -> Variant:
	var dlg := open({
		"title": title,
		"message": message,
		"confirm_text": confirm_text,
		"cancel_text": cancel_text,
		"input": true,
		"input_text": text,
		"placeholder": placeholder,
		"max_length": max_length,
		"validator": validator,
		"dismissible": false,
	})
	var result: StringName = await dlg.closed
	if result != PopupDialog.RESULT_CONFIRM:
		return null
	return dlg.get_input_text()


func has_open() -> bool:
	return _layer.get_child_count() > 0
