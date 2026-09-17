extends Control
## 主场景 / 班级草地 —— 参考 resource/references/preview_3.jpg
##
## 左侧「积分设置」打开网页版管理页，老师在里面增删加减分项目，只影响这台客户端。
##
## 草地上的 4 个位置就是班级的 4 个小组：位置 g 站着 PetState.lawn[g] 那只宠
## 物，也就是庇护所第 g 列当前出场的那只。点宠物弹菜单：表现好给积分，投喂花
## 积分，宠物吃了才长能量。脚下铭牌显示组名、能量条和剩余积分，左上角是按能
## 量排的排行榜和撤销。
##
## 位置节点是 Pets/Spot1~4，节点原点就是宠物脚下，可以在编辑器里直接拖动或
## 改缩放，脚本不关心它们具体在哪。

signal enter_sanctuary()

const CHOICE_MENU_SCENE := "res://scenes/common/ChoiceMenu.tscn"
const FloatText = preload("res://scenes/common/FloatText.gd")
const FoodFly = preload("res://scenes/common/FoodFly.gd")

## 菜单里通往投喂那一项。
const FEED_ITEM_ID := "feed"

## 相对宠物脚下的位置：头顶（飘字和菜单锚点）、嘴巴（食物落点）。
const HEAD_OFFSET := Vector2(0, -250)
const MOUTH_OFFSET := Vector2(0, -105)
## 食物从脚下的铭牌飞出来。
const FOOD_FROM_OFFSET := Vector2(0, 60)
## 扣分后难过多久回到 idle。
const SAD_TIME := 2.5
const UNDO_DISABLED_ALPHA := 0.45

@onready var _house: Button = $HouseHotspot
@onready var _pets: Control = $Pets
@onready var _rank: Control = $RankBoard
@onready var _undo: TextureButton = $UndoButton
@onready var _manage: TextureButton = $ManageButton
@onready var _state: Node = get_node("/root/PetState")

var _spots: Array[Control] = []
var _menu: Control = null


func _ready() -> void:
	_house.pressed.connect(func(): enter_sanctuary.emit())
	_undo.pressed.connect(func(): ScoreState.undo_last())
	_manage.pressed.connect(_open_teacher_page)
	for i in _state.GROUP_COUNT:
		var spot: Control = _pets.get_node("Spot%d" % (i + 1))
		spot.get_node("Hit").pressed.connect(_on_pet_pressed.bind(i))
		spot.get_node("GroupPlate").rename_pressed.connect(func(_plate): _rename_group(i))
		_spots.append(spot)
	_state.lawn_changed.connect(func(_lawn): _sync_pets())
	_state.pet_energy_changed.connect(func(index: int, _e: int): _sync_plate(_state.group_of(index)))
	_state.pen_unlocked.connect(_on_pen_unlocked)
	ScoreState.points_changed.connect(_on_points_changed)
	ScoreState.fed.connect(_on_fed)
	ScoreState.group_renamed.connect(func(group: int, _n: String): _sync_plate(group))
	_sync_pets()
	for i in _spots.size():
		_sync_plate(i)
	_rank.refresh(ScoreState.ranking(), false)
	# 每次回到主场景都拉一次，老师刚在设置页改过的项目马上生效。
	CloudSave.refresh_reasons()
	_sync_undo()


func _sync_pets() -> void:
	for i in _spots.size():
		var p: Dictionary = _state.pet_at(_state.lawn_pet(i))
		_spots[i].visible = not p.is_empty()
		if not p.is_empty():
			_spots[i].get_node("Pet").set_pet(str(p.get("type", "panda")))


func _sync_plate(group: int, animate: bool = false) -> void:
	if group < 0 or group >= _spots.size():
		return
	var energy: int = _state.group_energy(group)
	_spots[group].get_node("GroupPlate").set_data(ScoreState.group_name(group),
		ScoreState.points(group), energy, _state.level_of(energy),
		_state.progress_of(energy), animate)


func _sync_undo() -> void:
	_undo.disabled = not ScoreState.can_undo()
	_undo.modulate.a = UNDO_DISABLED_ALPHA if _undo.disabled else 1.0


func _after_change(group: int) -> void:
	_sync_plate(group, true)
	_rank.refresh(ScoreState.ranking())
	_sync_undo()


## 加减分只动积分，不喂食；扣分时宠物会难过一下。
func _on_points_changed(group: int, delta: int, _total: int, _label: String, is_undo: bool) -> void:
	_after_change(group)
	var spot := _visible_spot(group)
	if spot == null:
		return
	var color: Color = FloatText.UNDO if is_undo else \
		(FloatText.POINT if delta >= 0 else FloatText.LOSS)
	_pop(spot, "%+d 分" % delta, color)
	if not is_undo and delta < 0:
		_sulk(spot)


## 投喂：食物飞过去，宠物吃下，能量到账。撤销只退数字，不再演一遍。
func _on_fed(group: int, index: int, _cost: int, gain: int, is_undo: bool) -> void:
	_after_change(group)
	var spot := _visible_spot(group)
	if spot == null or is_undo or _state.lawn_pet(group) != index:
		return
	_feed(spot, gain)


## 升级解锁了新栏位：在这组宠物头顶提示一下，去庇护所就能领养。
func _on_pen_unlocked(index: int) -> void:
	var spot := _visible_spot(_state.group_of(index))
	if spot != null:
		_pop(spot, "解锁第 %d 只宠物栏位！" % (index / _state.GROUP_COUNT + 1), FloatText.GAIN)


func _visible_spot(group: int) -> Control:
	if group < 0 or group >= _spots.size() or not _spots[group].visible:
		return null
	return _spots[group]


func _pop(spot: Control, text: String, color: Color) -> void:
	FloatText.pop(self, text, spot.position + HEAD_OFFSET * spot.scale.y, color)


func _feed(spot: Control, gain: int) -> void:
	var pet: Control = spot.get_node("Pet")
	var from: Vector2 = spot.position + FOOD_FROM_OFFSET * spot.scale.y
	var to: Vector2 = spot.position + MOUTH_OFFSET * spot.scale.y
	await FoodFly.fly(self, FoodFly.texture_for(pet.pet_type), from, to)
	if not is_instance_valid(pet):
		return
	pet.play_eat()
	_pop(spot, "+%d 能量" % gain, FloatText.GAIN)


func _sulk(spot: Control) -> void:
	var pet: Control = spot.get_node("Pet")
	pet.play_sad()
	await get_tree().create_timer(SAD_TIME).timeout
	if is_instance_valid(pet) and pet.is_sad():
		pet.play_idle()


# ---- 菜单 ---------------------------------------------------------------

## 点宠物弹出加减分菜单；已经开着就当作收起来。
func _on_pet_pressed(group: int) -> void:
	if _menu and is_instance_valid(_menu):
		_close_menu()
		return
	_open_menu(group, _reason_items(group), _title_for(group), func(id: String):
		if id == FEED_ITEM_ID:
			_open_feed_menu(group)
		else:
			ScoreState.award(group, id)
			_close_menu())


func _open_feed_menu(group: int) -> void:
	_close_menu()
	_open_menu(group, _food_items(group), "投喂 · %s" % _title_for(group), func(id: String):
		ScoreState.feed(_state.lawn_pet(group), id)
		_close_menu())


func _open_menu(group: int, items: Array, title: String, on_pick: Callable) -> void:
	_menu = (load(CHOICE_MENU_SCENE) as PackedScene).instantiate()
	add_child(_menu)
	_menu.setup(title, items, _spots[group].position + HEAD_OFFSET * _spots[group].scale.y)
	_menu.picked.connect(on_pick)
	_menu.closed.connect(_close_menu)


func _title_for(group: int) -> String:
	return "%s · %d分" % [ScoreState.group_name(group), ScoreState.points(group)]


func _reason_items(group: int) -> Array:
	var items: Array = []
	# 这一组还没有宠物上场时就没什么可喂的。投喂最常用，放最前面。
	if _state.lawn_pet(group) >= 0:
		items.append({
			"id": FEED_ITEM_ID,
			"label": "投喂…",
			"note": "花积分换能量",
			"positive": true,
			"group": "投喂",
		})
	# 老师自定义的项目可能有几十个，加分、扣分各归一段，段内保持设置页里的顺序。
	for positive: bool in [true, false]:
		for r: Dictionary in ScoreState.reasons:
			var delta := int(r["delta"])
			if (delta > 0) != positive:
				continue
			items.append({
				"id": str(r["id"]),
				"label": str(r["label"]),
				"note": "%+d 分" % delta,
				"positive": positive,
				"group": "加分" if positive else "扣分",
			})
	return items


## 积分不够的食物是灰的，点不动，免得老师点了才发现喂不起。
func _food_items(group: int) -> Array:
	var items: Array = []
	for f: Dictionary in ScoreState.FOODS:
		items.append({
			"id": str(f["id"]),
			"label": str(f["label"]),
			"note": "%d分 → +%d能量" % [int(f["cost"]), int(f["energy"])],
			"positive": true,
			"disabled": not ScoreState.can_afford(group, str(f["id"])),
		})
	return items


func _close_menu() -> void:
	if _menu and is_instance_valid(_menu):
		_menu.queue_free()
	_menu = null


func _rename_group(group: int) -> void:
	if Modal.has_open():
		return
	var new_name: Variant = await Modal.prompt("给小组改名", "小组也可以有自己的名字",
		ScoreState.group_name(group), "输入组名",
		ScoreState.NAME_MAX_LENGTH, ScoreState.validate_group_name.bind(group))
	if new_name != null:
		ScoreState.set_group_name(group, new_name)


## 设置页是网页，放在服务器上；链接里带着这台客户端的登录凭证，所以只能改自己的菜单。
func _open_teacher_page() -> void:
	if Modal.has_open():
		return
	var url := CloudSave.teacher_page_url()
	if url.is_empty():
		Modal.alert("暂时连不上服务器", "积分设置保存在服务器上，网络恢复后再点一次试试。")
		return
	var err := OS.shell_open(url)
	if err != OK:
		Modal.alert("打不开设置页", "浏览器没有打开新页面，请检查是否拦截了弹出窗口。")
