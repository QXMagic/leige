extends Node

# ========== Color palette (matches HTML prototype tokens) ==========

const BG_1 := Color("14142b")
const BG_2 := Color("1a1d3a")
const BG_3 := Color("1b2d2e")
const SURFACE := Color(1, 1, 1, 0.06)
const SURFACE_2 := Color(1, 1, 1, 0.04)
const SURFACE_HOVER := Color(1, 1, 1, 0.1)
const BORDER := Color(1, 1, 1, 0.1)
const BORDER_STRONG := Color(1, 1, 1, 0.2)
const TEXT := Color("f0f0f5")
const TEXT_2 := Color("b8b8cc")
const TEXT_3 := Color("7a7a92")
const BRAND := Color("8B5CF6")
const BRAND_2 := Color("A78BFA")
const BRAND_GLOW := Color(139.0/255, 92.0/255, 246.0/255, 0.35)
const GOLD := Color("F59E0B")
const GOLD_GLOW := Color(245.0/255, 158.0/255, 11.0/255, 0.3)
const GREEN := Color("10B981")
const RED := Color("EF4444")

# Group color series (4 小组)
const GROUP_COLORS := [
	Color("38BDF8"),  # g1 sky
	Color("6366F1"),  # g2 indigo
	Color("F97316"),  # g3 orange
	Color("EC4899"),  # g4 pink
]

# Energy bar gradient endpoints (start → end), matches CSS ef-1..ef-4
const GROUP_FILL_A := [
	Color("0EA5E9"),  # g1
	Color("4F46E5"),  # g2
	Color("EA580C"),  # g3
	Color("DB2777"),  # g4
]
const GROUP_FILL_B := [
	Color("38BDF8"),  # g1
	Color("818CF8"),  # g2
	Color("F97316"),  # g3
	Color("EC4899"),  # g4
]

# ========== Dimension constants ==========

const RADIUS_S := 12
const RADIUS_M := 20
const RADIUS_L := 28

const TOPBAR_H := 64
const BOTTOMBAR_H := 72
const SIDEBAR_W := 200
const SIDEBAR_W_WIDE := 240
const GAP := 16
const PAD := 16

# ========== Helpers ==========

func group_color(idx: int) -> Color:
	return GROUP_COLORS[idx % 4]

func gradient_bg() -> Gradient:
	var g := Gradient.new()
	g.offsets = PackedFloat32Array([0.0, 0.45, 1.0])
	g.colors = PackedColorArray([BG_1, BG_2, BG_3])
	return g
