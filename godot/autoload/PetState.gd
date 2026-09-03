extends Node
## Single source of truth for the sanctuary roster, shared by MainHome,
## Sanctuary and AdoptDialog. Views are rebuilt on every navigation, so any
## state that must survive a screen change lives here, not in the scene.

signal roster_changed(roster: Array)
signal active_changed(index: int, pet: Dictionary)

const SLOT_COUNT := 12

## Starting roster. Slot 9 is the empty pen that opens the adoption dialog.
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

## Which pen's pet is the one roaming the lawn on the home screen.
var active_index: int = 3

var roster: Array = []


func _ready() -> void:
	reset()


func reset() -> void:
	roster = DEFAULT_ROSTER.duplicate(true)
	while roster.size() < SLOT_COUNT:
		roster.append({})
	active_index = 3
	roster_changed.emit(roster)
	active_changed.emit(active_index, active_pet())


## Replace the whole roster, e.g. once the backend serves it.
func set_roster(pets: Array) -> void:
	roster = pets.duplicate(true)
	while roster.size() < SLOT_COUNT:
		roster.append({})
	if is_empty_slot(active_index):
		active_index = first_filled_slot()
	roster_changed.emit(roster)
	active_changed.emit(active_index, active_pet())


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


func active_pet() -> Dictionary:
	return pet_at(active_index)


## The pet shown on the home lawn. Falls back to any occupied pen.
func active_pet_type() -> String:
	var p := active_pet()
	if p.is_empty():
		p = pet_at(first_filled_slot())
	return str(p.get("type", "panda"))


func set_active(index: int) -> void:
	if index == active_index or is_empty_slot(index):
		return
	active_index = index
	active_changed.emit(active_index, active_pet())


## True once a candidate with this name lives in a pen — used to grey out
## entries in the adoption dialog so the same pet cannot be taken twice.
func is_owned(pet_name: String) -> bool:
	for p in roster:
		if not p.is_empty() and str(p.get("name", "")) == pet_name:
			return true
	return false


func adopt(slot_index: int, pet_type: String, pet_name: String) -> bool:
	if slot_index < 0 or slot_index >= roster.size():
		return false
	if not roster[slot_index].is_empty() or is_owned(pet_name):
		return false
	roster[slot_index] = {"name": pet_name, "type": pet_type}
	roster_changed.emit(roster)
	set_active(slot_index)
	return true
