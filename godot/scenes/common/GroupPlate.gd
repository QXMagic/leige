extends Control
## 宠物脚下的小组铭牌：组名、能量条、等级和能量、还有可以用来投喂的积分。

signal rename_pressed(plate: Control)

## 能量条填充相对外框的内缩。
const BAR_INSET := 3.0
const FILL_TIME := 0.35

@onready var _name_label: Label = $NameLabel
@onready var _bar_bg: Panel = $BarBg
@onready var _bar_fill: Panel = $BarBg/BarFill
@onready var _energy: Label = $Energy
@onready var _points: Label = $Points
@onready var _rename_hit: Button = $RenameHit
@onready var _plate: TextureRect = $Plate

var _progress: float = 0.0
var _level: int = 1


func _ready() -> void:
	_rename_hit.pressed.connect(func(): rename_pressed.emit(self))
	_rename_hit.mouse_entered.connect(func(): _plate.modulate = Color(1.12, 1.12, 1.12))
	_rename_hit.mouse_exited.connect(func(): _plate.modulate = Color.WHITE)
	_bar_bg.resized.connect(_apply_bar)
	_apply_bar()


## `animate` 为 true 时能量条会滑过去，课堂上加分看得见。
func set_data(group_name: String, points: int, energy: int, level: int, progress: float,
		animate: bool = false) -> void:
	_name_label.text = group_name
	_energy.text = "Lv.%d · %d" % [level, energy]
	_points.text = "%d 分" % points
	progress = clampf(progress, 0.0, 1.0)
	var prev_level := _level
	_level = level
	if not animate:
		_progress = progress
		_apply_bar()
		return
	# 跨级时进度会突然从接近满跳回 0（或反过来），先走到头再从另一头出来，
	# 不然升级看着像在倒扣。同级内的加减就直接滑过去。
	var t := create_tween()
	if level > prev_level:
		t.tween_method(_set_progress, _progress, 1.0, FILL_TIME * 0.6)
		t.tween_method(_set_progress, 0.0, progress, FILL_TIME * 0.6)
	elif level < prev_level:
		t.tween_method(_set_progress, _progress, 0.0, FILL_TIME * 0.6)
		t.tween_method(_set_progress, 1.0, progress, FILL_TIME * 0.6)
	else:
		t.tween_method(_set_progress, _progress, progress, FILL_TIME)


func _set_progress(value: float) -> void:
	_progress = value
	_apply_bar()


func _apply_bar() -> void:
	if not _bar_fill:
		return
	var full := _bar_bg.size.x - BAR_INSET * 2.0
	_bar_fill.size.x = maxf(0.0, full * _progress)
