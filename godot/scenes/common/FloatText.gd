extends RefCounted
## 加减分时从宠物头顶飘起来的 "+5"。
##
##   FloatText.pop(self, "+5", head_pos, FloatText.GAIN)

const GAIN := Color("8fd14f")
const LOSS := Color("e2574c")
const UNDO := Color("d9c3a5")
## 积分用金色，能量用绿色，两种数值一眼分得开。
const POINT := Color("f5c542")
const OUTLINE := Color(0.29, 0.14, 0.06, 0.85)

const FONT_SIZE := 64
const BOX := Vector2(300, 90)
const RISE := 110.0
const TIME := 1.0


## 在 host 的局部坐标 at 处弹出一行字，自己飘完自己销毁。
static func pop(host: Control, text: String, at: Vector2, color: Color) -> void:
	var label := Label.new()
	label.text = text
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	label.size = BOX
	label.position = at - BOX / 2.0
	label.pivot_offset = BOX / 2.0
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", FONT_SIZE)
	label.add_theme_color_override("font_color", color)
	label.add_theme_color_override("font_outline_color", OUTLINE)
	label.add_theme_constant_override("outline_size", 14)
	label.scale = Vector2.ONE * 0.6
	host.add_child(label)

	var t := label.create_tween().set_parallel()
	t.tween_property(label, "scale", Vector2.ONE, 0.22) \
		.set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	t.tween_property(label, "position:y", label.position.y - RISE, TIME) \
		.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	t.tween_property(label, "modulate:a", 0.0, TIME * 0.45).set_delay(TIME * 0.55)
	t.chain().tween_callback(label.queue_free)
