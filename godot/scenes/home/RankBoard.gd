extends Control
## 小组排行榜，按能量排。每个小组固定一行，名次变了行会滑到新位置，学生能看
## 出谁被超了。积分是另一列小字，方便老师一眼看出谁还喂得起。

const ROW_H := 62.0
const TOP := 84.0
const MOVE_TIME := 0.35

## 第 1/2/3 名和其余名次的奖牌底色。
const RANK_COLORS := [
	Color("f0b93b"),
	Color("c9ccd4"),
	Color("cd8b4e"),
	Color("a97a54"),
]

@onready var _rows: Control = $Rows


## rows 用 ScoreState.ranking() 的结果。并列同名次时按排序先后上下排开。
func refresh(rows: Array, animate: bool = true) -> void:
	for i in rows.size():
		var entry: Dictionary = rows[i]
		var row: Control = _rows.get_node_or_null("Row%d" % (int(entry["group"]) + 1))
		if row == null:
			continue
		row.get_node("NameLabel").text = str(entry["name"])
		row.get_node("PointsLabel").text = "%d分" % int(entry["points"])
		row.get_node("EnergyLabel").text = str(entry["energy"])
		var rank := int(entry["rank"])
		row.get_node("Badge/RankLabel").text = str(rank)
		var style: StyleBoxFlat = row.get_node("Badge").get_theme_stylebox("panel").duplicate()
		style.bg_color = RANK_COLORS[mini(rank - 1, RANK_COLORS.size() - 1)]
		row.get_node("Badge").add_theme_stylebox_override("panel", style)
		var y := TOP + i * ROW_H
		if animate:
			row.create_tween().tween_property(row, "position:y", y, MOVE_TIME) \
				.set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
		else:
			row.position.y = y
