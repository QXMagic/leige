extends Node
## 宠物名册：庇护所的 12 个栏位 = 4 个小组 × 每组 3 栏。
##
## 庇护所网格是 4 列，一列就是一个小组的宠物栏：栏位 i 属于第 i % GROUP_COUNT
## 组，所以第 1 列从上到下是 0、4、8。每个小组有一只宠物在主场景草地上，就是
## lawn[组号]，在庇护所里双击本列的别的宠物就能换上去。
##
## 能量长在宠物身上（吃了食物才有），宠物等级按能量算；积分长在小组身上，
## 投喂要花积分，那部分在 ScoreState。

signal roster_changed(roster: Array)
signal lawn_changed(lawn: Array)
signal pet_energy_changed(index: int, energy: int)
## 本地存档写完了，CloudSave 听这个去同步。
signal saved()

const GROUP_COUNT := 4
const ROWS := 3
const SLOT_COUNT := GROUP_COUNT * ROWS
const NAME_MAX_LENGTH := 8
## 每 LEVEL_STEP 点能量升一级。
const LEVEL_STEP := 100
const SAVE_FILE := "class_pets.json"

## 开局名册，按列分给 4 个小组。第 2 列留了一个空栏用来试领养。
const DEFAULT_ROSTER := [
	{"name": "Luna", "type": "cat"},
	{"name": "Rocky", "type": "dog"},
	{"name": "Clover", "type": "sheep"},
	{"name": "Mochi", "type": "panda"},
	{"name": "Pip", "type": "dog"},
	{"name": "Snowball", "type": "rabbit"},
	{"name": "Mittens", "type": "cat"},
	{"name": "Coco", "type": "hamster"},
	{"name": "Bamboo", "type": "panda"},
	{},
	{"name": "Rex", "type": "bear"},
	{"name": "Bella", "type": "dog"},
]

var roster: Array = []
## 每个小组正在草地上的宠物栏位，-1 表示这组还没有宠物。
var lawn: Array = []


func _ready() -> void:
	reset()
	load_pets()


func reset() -> void:
	set_roster(DEFAULT_ROSTER.duplicate(true))


## 换掉整个名册，比如以后由后端下发。
func set_roster(pets: Array) -> void:
	roster = pets.duplicate(true)
	while roster.size() < SLOT_COUNT:
		roster.append({})
	for p: Dictionary in roster:
		if not p.is_empty():
			p["energy"] = maxi(0, int(p.get("energy", 0)))
	_fill_lawn()
	roster_changed.emit(roster)
	lawn_changed.emit(lawn)


# ---- 栏位与小组 ---------------------------------------------------------

func group_of(index: int) -> int:
	return index % GROUP_COUNT


## 某个小组的 3 个栏位，从上到下。
func pens_of(group: int) -> Array:
	var pens: Array = []
	for row in ROWS:
		pens.append(group + row * GROUP_COUNT)
	return pens


func pet_at(index: int) -> Dictionary:
	if index < 0 or index >= roster.size():
		return {}
	return roster[index]


func is_empty_slot(index: int) -> bool:
	return pet_at(index).is_empty()


func first_empty_slot() -> int:
	for i in roster.size():
		if roster[i].is_empty():
			return i
	return -1


func first_filled_slot() -> int:
	for i in roster.size():
		if not roster[i].is_empty():
			return i
	return -1


# ---- 草地 ---------------------------------------------------------------

func is_on_lawn(index: int) -> bool:
	return index >= 0 and lawn.has(index)


## 某个小组正在草地上的宠物栏位，没有则为 -1。
func lawn_pet(group: int) -> int:
	return int(lawn[group]) if group >= 0 and group < lawn.size() else -1


## 把这只宠物放到它所属小组的草地位置上，换下原来那只。
func place_on_lawn(index: int) -> bool:
	if is_empty_slot(index):
		return false
	var group := group_of(index)
	if lawn[group] == index:
		return true
	lawn[group] = index
	lawn_changed.emit(lawn)
	save_pets()
	return true


## 空掉的位置用本列第一只还在的宠物补上。
func _fill_lawn() -> void:
	lawn.resize(GROUP_COUNT)
	for group in GROUP_COUNT:
		var current = lawn[group]
		if current != null and int(current) >= 0 and not is_empty_slot(int(current)) \
				and group_of(int(current)) == group:
			continue
		lawn[group] = -1
		for pen: int in pens_of(group):
			if not is_empty_slot(pen):
				lawn[group] = pen
				break


# ---- 能量与等级 ---------------------------------------------------------

func energy_of(index: int) -> int:
	return int(pet_at(index).get("energy", 0))


## 宠物吃了食物就长能量，撤销投喂时用负数还回去。
func add_energy(index: int, amount: int) -> int:
	if is_empty_slot(index):
		return 0
	var total: int = maxi(0, energy_of(index) + amount)
	roster[index]["energy"] = total
	pet_energy_changed.emit(index, total)
	save_pets()
	return total


## 一个小组的总能量 = 这一列 3 只宠物的能量之和，排行按它来。
func group_energy(group: int) -> int:
	var total := 0
	for pen: int in pens_of(group):
		total += energy_of(pen)
	return total


func level_of(value: int) -> int:
	return value / LEVEL_STEP + 1


## 当前等级内的进度 0..1，能量条用它。
func progress_of(value: int) -> float:
	return float(value % LEVEL_STEP) / float(LEVEL_STEP)


func pet_level(index: int) -> int:
	return level_of(energy_of(index))


# ---- 领养与改名 ---------------------------------------------------------

## 这只待领养的宠物是不是已经被领走了——领养时记下的是候选名，所以宠物改名
## 之后这里判断不受影响。
func is_owned(candidate: String) -> bool:
	for p in roster:
		if not p.is_empty() and str(p.get("candidate", "")) == candidate:
			return true
	return false


func adopt(slot_index: int, pet_type: String, pet_name: String) -> bool:
	if slot_index < 0 or slot_index >= roster.size():
		return false
	if not roster[slot_index].is_empty() or is_owned(pet_name):
		return false
	roster[slot_index] = {
		"name": pet_name, "type": pet_type, "candidate": pet_name, "energy": 0,
	}
	_fill_lawn()
	roster_changed.emit(roster)
	lawn_changed.emit(lawn)
	save_pets()
	return true


## 为什么这个名字不能给 index 上的宠物用，能用就返回 ""。参数顺序方便当作
## Modal.prompt 的校验器：validate_name.bind(index)。
func validate_name(pet_name: String, index: int) -> String:
	pet_name = pet_name.strip_edges()
	if pet_name.is_empty():
		return "名字不能为空哦"
	if pet_name.length() > NAME_MAX_LENGTH:
		return "名字最多 %d 个字" % NAME_MAX_LENGTH
	for i in roster.size():
		if i != index and not roster[i].is_empty() and str(roster[i].get("name", "")) == pet_name:
			return "已经有叫「%s」的宠物了" % pet_name
	return ""


func rename(index: int, pet_name: String) -> bool:
	if is_empty_slot(index) or validate_name(pet_name, index) != "":
		return false
	pet_name = pet_name.strip_edges()
	if roster[index]["name"] == pet_name:
		return true
	roster[index]["name"] = pet_name
	roster_changed.emit(roster)
	save_pets()
	return true


# ---- 存档 ---------------------------------------------------------------

func to_save() -> Dictionary:
	return {"roster": roster, "lawn": lawn}


## 换成一份存档（本地文件或云端），格式不对就不动，返回是否生效。
func apply_save(data: Dictionary) -> bool:
	if typeof(data.get("roster")) != TYPE_ARRAY:
		return false
	var saved_roster: Array = data["roster"]
	var pets: Array = []
	for i in SLOT_COUNT:
		pets.append(saved_roster[i] if i < saved_roster.size() and typeof(saved_roster[i]) == TYPE_DICTIONARY else {})
	var saved_lawn: Variant = data.get("lawn", [])
	if typeof(saved_lawn) == TYPE_ARRAY:
		lawn = []
		for v in saved_lawn:
			lawn.append(int(v))
	set_roster(pets)
	return true


func save_pets() -> void:
	var f := FileAccess.open(ClientId.path(SAVE_FILE), FileAccess.WRITE)
	if f == null:
		push_warning("宠物名册保存失败：%s" % error_string(FileAccess.get_open_error()))
		return
	f.store_string(JSON.stringify(to_save()))
	f.close()
	saved.emit()


## 读档失败就用默认名册，不打断上课。
func load_pets() -> void:
	var path := ClientId.path(SAVE_FILE)
	if not FileAccess.file_exists(path):
		return
	var f := FileAccess.open(path, FileAccess.READ)
	if f == null:
		return
	var data: Variant = JSON.parse_string(f.get_as_text())
	if typeof(data) == TYPE_DICTIONARY:
		apply_save(data)
