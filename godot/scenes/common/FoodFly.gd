extends RefCounted
## A food icon that arcs from the FEED button into a pet's mouth.
##
##   await FoodFly.fly(self, FoodFly.texture_for("panda"), from, to)
##   pet.play_eat()

const FOOD_DIR := "res://resource/ui/"
## Species -> food icon. Sheep has no dedicated art yet, so it shares the carrot.
const FOOD := {
	"bear": "food_honey",
	"cat": "food_fish",
	"dog": "food_dog_food",
	"hamster": "food_seeds",
	"panda": "food_bamboo",
	"rabbit": "food_carrot",
	"sheep": "food_carrot",
}
const DEFAULT_FOOD := "food_drumstick"

const ICON_PX := 72.0
const FLY_TIME := 0.55
const ARC_HEIGHT := 120.0
const SWALLOW_TIME := 0.12


static func texture_for(pet_type: String) -> Texture2D:
	return load("%s%s.png" % [FOOD_DIR, FOOD.get(pet_type, DEFAULT_FOOD)])


static func all_textures() -> Array:
	var paths: Array = []
	for food in FOOD.values() + [DEFAULT_FOOD]:
		var path := "%s%s.png" % [FOOD_DIR, food]
		if not paths.has(path):
			paths.append(path)
	return paths


## Spawns the icon as the top child of `host` (`from`/`to` in host-local
## coordinates) and returns once it reaches `to`. The swallow shrink and the
## cleanup carry on by themselves after that, so the eat animation can start
## exactly on arrival.
static func fly(host: Control, tex: Texture2D, from: Vector2, to: Vector2) -> void:
	var icon := TextureRect.new()
	icon.texture = tex
	icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	icon.size = Vector2(ICON_PX, ICON_PX)
	icon.pivot_offset = icon.size / 2.0
	host.add_child(icon)

	var half := icon.size / 2.0
	var peak := (from + to) / 2.0 + Vector2(0, -ARC_HEIGHT)
	var step := func(t: float) -> void:
		# Quadratic bezier from -> peak -> to.
		icon.position = from.lerp(peak, t).lerp(peak.lerp(to, t), t) - half
		icon.rotation = sin(t * TAU) * 0.35
		icon.scale = Vector2.ONE * (lerpf(0.8, 0.9, t) + 0.3 * sin(t * PI))
	step.call(0.0)

	var fly_tw := icon.create_tween()
	fly_tw.tween_method(step, 0.0, 1.0, FLY_TIME).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_IN_OUT)
	await fly_tw.finished

	var swallow := icon.create_tween().set_parallel()
	swallow.tween_property(icon, "scale", Vector2.ZERO, SWALLOW_TIME).set_ease(Tween.EASE_IN)
	swallow.tween_property(icon, "modulate:a", 0.0, SWALLOW_TIME)
	swallow.chain().tween_callback(icon.queue_free)
