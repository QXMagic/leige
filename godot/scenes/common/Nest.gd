extends Control
## The green "nest" an adoptable pet sits in (reference: preview_1.jpg).
## Drawn as stacked ellipses; `front_only` renders just the front rim so it can
## be layered over the pet sprite and make the pet sit *inside* the nest.

const UiSkin = preload("res://scenes/common/UiSkin.gd")

@export var front_only: bool = false


func _draw() -> void:
	var c := size * 0.5
	var rx := size.x * 0.5
	var ry := size.y * 0.5
	if front_only:
		# Front rim of the ring, drawn on top of the pet.
		draw_set_transform(c + Vector2(0, ry * 0.02), 0.0, Vector2(rx, ry))
		draw_arc(Vector2.ZERO, 0.80, 0.10 * PI, 0.90 * PI, 64, UiSkin.NEST_GREEN, 0.36, true)
		draw_arc(Vector2.ZERO, 0.90, 0.20 * PI, 0.80 * PI, 64, UiSkin.NEST_GREEN_LIGHT, 0.12, true)
		return

	# ground shadow
	draw_set_transform(c + Vector2(0, ry * 0.12), 0.0, Vector2(rx, ry))
	draw_circle(Vector2.ZERO, 0.98, Color(0.36, 0.22, 0.12, 0.20))
	# ring: dark base, mid body, lit top
	draw_set_transform(c, 0.0, Vector2(rx, ry))
	draw_circle(Vector2.ZERO, 1.0, UiSkin.NEST_GREEN_DARK)
	draw_set_transform(c - Vector2(0, ry * 0.05), 0.0, Vector2(rx, ry))
	draw_circle(Vector2.ZERO, 0.97, UiSkin.NEST_GREEN)
	draw_set_transform(c - Vector2(0, ry * 0.03), 0.0, Vector2(rx, ry))
	draw_arc(Vector2.ZERO, 0.88, 1.08 * PI, 1.92 * PI, 64, UiSkin.NEST_GREEN_LIGHT, 0.15, true)
	# straw bowl
	draw_set_transform(c + Vector2(0, ry * 0.06), 0.0, Vector2(rx, ry))
	draw_circle(Vector2.ZERO, 0.66, UiSkin.NEST_INNER_DARK)
	draw_set_transform(c + Vector2(0, ry * 0.01), 0.0, Vector2(rx, ry))
	draw_circle(Vector2.ZERO, 0.61, UiSkin.NEST_INNER)
