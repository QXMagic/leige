extends Node
## 班级积分与投喂。
##
## 两套数值分工明确：
##   表现好 → 小组拿积分（award）
##   积分 → 换食物投喂（feed），宠物吃下去才长能量
##   能量 → 宠物等级、小组排行
##
## 积分记在小组上，能量记在宠物身上（PetState）。小组 g 的能量是庇护所第 g 列
## 三只宠物的能量之和。

signal points_changed(group: int, delta: int, total: int, label: String, is_undo: bool)
signal fed(group: int, index: int, cost: int, gain: int, is_undo: bool)
signal history_changed()
signal group_renamed(group: int, group_name: String)
## 加减分项目换了（老师在积分设置页改过，CloudSave 拉回来了）。
signal reasons_changed()
## 本地存档写完了，CloudSave 听这个去同步。
signal saved()

const GROUP_COUNT := 4
const NAME_MAX_LENGTH := 6
const SAVE_FILE := "class_scores.json"
## 上次从服务端拉到的加减分项目，断网时用它。
const REASONS_FILE := "reasons.json"
## 流水只保留最近这么多条，够撤销和课后回顾用。
const MAX_HISTORY := 200

## 老师还没在积分设置页改过时的加减分项目，和服务端 TeacherReasonLogic::DEFAULTS
## 保持一致。加减的是积分。
const DEFAULT_REASONS := [
	{"label": "积极发言", "delta": 5},
	{"label": "作业全交", "delta": 10},
	{"label": "小组合作", "delta": 8},
	{"label": "帮助同学", "delta": 6},
	{"label": "课堂喧哗", "delta": -3},
	{"label": "迟到早退", "delta": -5},
]

## 投喂菜单：花积分换能量，买大份更划算，鼓励攒一攒再喂。
const FOODS := [
	{"id": "snack", "label": "小零食", "cost": 5, "energy": 6},
	{"id": "meal", "label": "正餐", "cost": 10, "energy": 14},
	{"id": "feast", "label": "大餐", "cost": 20, "energy": 32},
]

## 课堂上一键点击的加减分项目 {id, label, delta}，按菜单顺序。名称唯一，直接当 id。
var reasons: Array = []
var groups: Array = []
## 加减分和投喂的流水，最新的在最后，撤销从末尾取。
var history: Array = []


func _ready() -> void:
	_reset_groups()
	reasons = _clean_reasons(DEFAULT_REASONS)
	_load_reasons()
	load_scores()


func _reset_groups() -> void:
	groups = []
	for i in GROUP_COUNT:
		groups.append({"name": "第%d组" % (i + 1), "points": 0})


## 清空积分和流水，比如新学期开始。宠物能量在 PetState，不在这里清。
func reset_scores() -> void:
	_reset_groups()
	history = []
	for i in GROUP_COUNT:
		points_changed.emit(i, 0, 0, "重置", false)
	history_changed.emit()
	save_scores()


func has_group(group: int) -> bool:
	return group >= 0 and group < groups.size()


func points(group: int) -> int:
	return int(groups[group]["points"]) if has_group(group) else 0


func group_name(group: int) -> String:
	return str(groups[group]["name"]) if has_group(group) else ""


func reason(reason_id: String) -> Dictionary:
	for r in reasons:
		if str(r["id"]) == reason_id:
			return r
	return {}


func food(food_id: String) -> Dictionary:
	for f in FOODS:
		if str(f["id"]) == food_id:
			return f
	return {}


func can_afford(group: int, food_id: String) -> bool:
	var f := food(food_id)
	return not f.is_empty() and points(group) >= int(f["cost"])


# ---- 加减分 -------------------------------------------------------------

## 表现好给积分。积分不会扣成负数，实际生效的增减记进流水，撤销时原样还回去。
func award(group: int, reason_id: String) -> bool:
	var r := reason(reason_id)
	if not has_group(group) or r.is_empty():
		return false
	var before := points(group)
	var after: int = maxi(0, before + int(r["delta"]))
	groups[group]["points"] = after
	_push_history({
		"kind": "award",
		"group": group,
		"delta": after - before,
		"reason": reason_id,
		"label": str(r["label"]),
	})
	points_changed.emit(group, after - before, after, str(r["label"]), false)
	save_scores()
	return true


# ---- 投喂 ---------------------------------------------------------------

## 花积分喂 index 上的宠物，宠物长能量。积分不够就喂不了。
func feed(index: int, food_id: String) -> bool:
	var f := food(food_id)
	if f.is_empty() or PetState.is_empty_slot(index):
		return false
	var group := PetState.group_of(index)
	var cost := int(f["cost"])
	if not has_group(group) or points(group) < cost:
		return false
	var gain := int(f["energy"])
	groups[group]["points"] = points(group) - cost
	PetState.add_energy(index, gain)
	_push_history({
		"kind": "feed",
		"group": group,
		"index": index,
		"cost": cost,
		"gain": gain,
		"label": str(f["label"]),
	})
	fed.emit(group, index, cost, gain, false)
	save_scores()
	return true


# ---- 撤销 ---------------------------------------------------------------

func can_undo() -> bool:
	return not history.is_empty()


## 撤销最近一次操作，加减分和投喂都能撤——老师课上点错很常见。
func undo_last() -> bool:
	if history.is_empty():
		return false
	var entry: Dictionary = history.pop_back()
	var group := int(entry["group"])
	if str(entry.get("kind", "award")) == "feed":
		var cost := int(entry["cost"])
		var gain := int(entry["gain"])
		groups[group]["points"] = points(group) + cost
		PetState.add_energy(int(entry["index"]), -gain)
		fed.emit(group, int(entry["index"]), cost, gain, true)
	else:
		var back := -int(entry["delta"])
		var total: int = maxi(0, points(group) + back)
		groups[group]["points"] = total
		points_changed.emit(group, back, total, "撤销 · %s" % entry["label"], true)
	history_changed.emit()
	save_scores()
	return true


func _push_history(entry: Dictionary) -> void:
	entry["time"] = Time.get_datetime_string_from_system(false, true)
	history.append(entry)
	if history.size() > MAX_HISTORY:
		history = history.slice(history.size() - MAX_HISTORY)
	history_changed.emit()


# ---- 排行与组名 ---------------------------------------------------------

## 按小组能量从高到低排序，能量相同的并列同名次。
func ranking() -> Array:
	var rows: Array = []
	for i in groups.size():
		var energy: int = PetState.group_energy(i)
		rows.append({
			"group": i,
			"name": group_name(i),
			"points": points(i),
			"energy": energy,
			"level": PetState.level_of(energy),
		})
	rows.sort_custom(func(a, b): return a["energy"] > b["energy"])
	var rank := 1
	for i in rows.size():
		if i > 0 and rows[i]["energy"] < rows[i - 1]["energy"]:
			rank = i + 1
		rows[i]["rank"] = rank
	return rows


## 组名不能为空、不超过 NAME_MAX_LENGTH 个字、不能和别的组重名。参数顺序
## 方便当作 Modal.prompt 的校验器：validate_group_name.bind(group)。
func validate_group_name(new_name: String, group: int) -> String:
	new_name = new_name.strip_edges()
	if new_name.is_empty():
		return "组名不能为空"
	if new_name.length() > NAME_MAX_LENGTH:
		return "组名最多 %d 个字" % NAME_MAX_LENGTH
	for i in groups.size():
		if i != group and group_name(i) == new_name:
			return "已经有「%s」了" % new_name
	return ""


func set_group_name(group: int, new_name: String) -> bool:
	if not has_group(group) or validate_group_name(new_name, group) != "":
		return false
	groups[group]["name"] = new_name.strip_edges()
	group_renamed.emit(group, group_name(group))
	save_scores()
	return true


# ---- 存档 ---------------------------------------------------------------

func to_save() -> Dictionary:
	return {"groups": groups, "history": history}


## 换成一份存档（本地文件或云端），格式不对就不动，返回是否生效。
func apply_save(data: Dictionary) -> bool:
	if typeof(data.get("groups")) != TYPE_ARRAY:
		return false
	_reset_groups()
	var saved_groups: Array = data["groups"]
	for i in mini(saved_groups.size(), groups.size()):
		if typeof(saved_groups[i]) != TYPE_DICTIONARY:
			continue
		groups[i]["name"] = str(saved_groups[i].get("name", groups[i]["name"]))
		groups[i]["points"] = maxi(0, int(saved_groups[i].get("points", 0)))
	var saved_history: Variant = data.get("history", [])
	history = saved_history if typeof(saved_history) == TYPE_ARRAY else []
	return true


func save_scores() -> void:
	var f := FileAccess.open(ClientId.path(SAVE_FILE), FileAccess.WRITE)
	if f == null:
		push_warning("班级积分保存失败：%s" % error_string(FileAccess.get_open_error()))
		return
	f.store_string(JSON.stringify(to_save()))
	f.close()
	saved.emit()


## 读档失败就当新学期开始，不打断上课。
func load_scores() -> void:
	var path := ClientId.path(SAVE_FILE)
	if not FileAccess.file_exists(path):
		return
	var f := FileAccess.open(path, FileAccess.READ)
	if f == null:
		return
	var data: Variant = JSON.parse_string(f.get_as_text())
	if typeof(data) == TYPE_DICTIONARY:
		apply_save(data)


# ---- 加减分项目 ---------------------------------------------------------

## 换成服务端下发的项目并缓存到本地。没变就什么都不做，免得菜单无故刷新。
func set_reasons(items: Array) -> void:
	var clean := _clean_reasons(items)
	if clean.is_empty() or clean == reasons:
		return
	reasons = clean
	var f := FileAccess.open(ClientId.path(REASONS_FILE), FileAccess.WRITE)
	if f != null:
		f.store_string(JSON.stringify(reasons))
	reasons_changed.emit()


## 名称为空、分值为 0、名称重复的项目丢掉。
func _clean_reasons(items: Array) -> Array:
	var clean: Array = []
	var seen := {}
	for item: Variant in items:
		if typeof(item) != TYPE_DICTIONARY:
			continue
		var label := str(item.get("label", "")).strip_edges()
		var delta := int(item.get("delta", 0))
		if label.is_empty() or delta == 0 or seen.has(label):
			continue
		seen[label] = true
		clean.append({"id": label, "label": label, "delta": delta})
	return clean


func _load_reasons() -> void:
	var path := ClientId.path(REASONS_FILE)
	if not FileAccess.file_exists(path):
		return
	var f := FileAccess.open(path, FileAccess.READ)
	if f == null:
		return
	var data: Variant = JSON.parse_string(f.get_as_text())
	if typeof(data) == TYPE_ARRAY:
		var clean := _clean_reasons(data)
		if not clean.is_empty():
			reasons = clean
