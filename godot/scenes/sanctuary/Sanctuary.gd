extends Control
## "PET SANCTUARY MANAGEMENT" 界面 —— 参考 resource/references/preview_2.jpg
##
## 网格的 4 列就是班级的 4 个小组，每列 3 个栏位是这个小组的宠物栏。列头显示
## 组名和剩余积分。FEED 要花这一列小组的积分，宠物吃了才长能量；双击栏位把这
## 只宠物换到草地上当本组的出场宠物。

signal closed()

const ADOPT_DIALOG_SCENE := "res://scenes/sanctuary/AdoptDialog.tscn"
const CHOICE_MENU_SCENE := "res://scenes/common/ChoiceMenu.tscn"
const PLACE_DELAY := 0.25
## 投喂菜单开在这个栏位上方多高的位置。
const MENU_ANCHOR := Vector2(198, 40)

@onready var _grid: GridContainer = $Panel/GridArea/Grid
@onready var _headers: Control = $Panel/Headers
@onready var _close: TextureButton = $CloseButton
@onready var _state: Node = get_node("/root/PetState")

var _dialog: Control = null
var _menu: Control = null
var _leaving: bool = false


func _ready() -> void:
	_close.pressed.connect(func(): closed.emit())
	for i in _grid.get_child_count():
		var cell: Control = _grid.get_child(i)
		cell.feed_pressed.connect(_on_feed.bind(i))
		cell.add_pressed.connect(_on_add.bind(i))
		cell.place_requested.connect(_on_place_requested.bind(i))
		cell.rename_pressed.connect(_on_rename.bind(i))
	_state.roster_changed.connect(func(_roster): _refresh())
	_state.lawn_changed.connect(func(_lawn): _refresh())
	_state.pet_energy_changed.connect(func(_i, _e): _refresh())
	ScoreState.points_changed.connect(func(_g, _d, _t, _l, _u): _refresh_headers())
	ScoreState.fed.connect(func(_g, _i, _c, _gain, _u): _refresh_headers())
	ScoreState.group_renamed.connect(func(_g, _n): _refresh_headers())
	_refresh()
	# 一只宠物都没有（第一次打开）就直接弹出宠物市场，领养到第一个空栏位。
	if _state.first_filled_slot() < 0 and _state.first_empty_slot() >= 0:
		_on_add.call_deferred(null, _state.first_empty_slot())


func _refresh() -> void:
	for i in _grid.get_child_count():
		var cell: Control = _grid.get_child(i)
		var d: Dictionary = _state.pet_at(i)
		if d.is_empty():
			var need: int = 0 if _state.is_unlocked(i) else _state.unlock_level(i)
			cell.setup("", "", true, 0, need)
		else:
			cell.setup(str(d.get("name", "")), str(d.get("type", "cat")), false,
				_state.energy_of(i))
		cell.set_selected(_state.is_on_lawn(i))
	_refresh_headers()


## 列头：这一列属于哪个小组，还剩多少积分可以用来投喂。
func _refresh_headers() -> void:
	for group in _state.GROUP_COUNT:
		var label: Label = _headers.get_node("Group%d" % (group + 1))
		label.text = "%s · %d分" % [ScoreState.group_name(group), ScoreState.points(group)]


# ---- 投喂 ---------------------------------------------------------------

## FEED 打开这一组的食物菜单，买得起的才点得动。
func _on_feed(cell: Control, index: int) -> void:
	if _menu and is_instance_valid(_menu):
		_close_menu()
		return
	var group: int = _state.group_of(index)
	var items: Array = []
	for f: Dictionary in ScoreState.FOODS:
		items.append({
			"id": str(f["id"]),
			"label": str(f["label"]),
			"note": "%d分 → +%d能量" % [int(f["cost"]), int(f["energy"])],
			"positive": true,
			"disabled": not ScoreState.can_afford(group, str(f["id"])),
		})
	_menu = (load(CHOICE_MENU_SCENE) as PackedScene).instantiate()
	add_child(_menu)
	_menu.setup("投喂 %s · %s %d分" % [cell.pet_name, ScoreState.group_name(group),
		ScoreState.points(group)], items, cell.global_position + MENU_ANCHOR)
	_menu.picked.connect(func(food_id: String):
		if ScoreState.feed(index, food_id):
			cell.feed()
		_close_menu())
	_menu.closed.connect(_close_menu)


func _close_menu() -> void:
	if _menu and is_instance_valid(_menu):
		_menu.queue_free()
	_menu = null


# ---- 上场、领养、改名 ---------------------------------------------------

## 双击占用中的栏位，把这只宠物换成本组在草地上的出场宠物，然后回主场景。
## 停顿一下是为了让高亮看得见地跳过去。
func _on_place_requested(_cell: Control, index: int) -> void:
	if _leaving:
		return
	_leaving = true
	_state.place_on_lawn(index)
	await get_tree().create_timer(PLACE_DELAY).timeout
	closed.emit()


func _on_add(_cell: Control, index: int) -> void:
	if _dialog and is_instance_valid(_dialog):
		return
	if not _state.is_unlocked(index):
		var group: int = _state.group_of(index)
		Modal.alert("栏位未解锁", "%s 的宠物最高 Lv.%d，升到 Lv.%d 就能领养第 %d 只宠物" % [
			ScoreState.group_name(group), _state.top_level(group),
			_state.unlock_level(index), index / _state.GROUP_COUNT + 1])
		return
	_dialog = (load(ADOPT_DIALOG_SCENE) as PackedScene).instantiate()
	add_child(_dialog)
	_dialog.adopted.connect(_on_adopted.bind(index))
	_dialog.closed.connect(_close_dialog)


func _on_adopted(pet_type: String, pet_name: String, index: int) -> void:
	var ok: bool = _state.adopt(index, pet_type, pet_name)
	_close_dialog()
	if ok:
		_prompt_name(index, "给新伙伴取名", "欢迎回家！给它起个名字吧", "就叫这个")


func _on_rename(_cell: Control, index: int) -> void:
	_prompt_name(index, "宠物改名", "给 %s 起个新名字吧" % _state.pet_at(index).get("name", ""))


## 取消就保留原来的名字。
func _prompt_name(index: int, title: String, message: String, confirm_text: String = "确定") -> void:
	if _leaving or Modal.has_open() or _state.is_empty_slot(index):
		return
	var new_name: Variant = await Modal.prompt(title, message,
		str(_state.pet_at(index).get("name", "")), "输入宠物名字",
		_state.NAME_MAX_LENGTH, _state.validate_name.bind(index), confirm_text)
	if new_name != null and is_instance_valid(self):
		_state.rename(index, new_name)


func _close_dialog() -> void:
	if _dialog and is_instance_valid(_dialog):
		_dialog.queue_free()
	_dialog = null


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		closed.emit()
		get_viewport().set_input_as_handled()
