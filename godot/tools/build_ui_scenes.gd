@tool
extends RefCounted
## Generates the wooden-skin UI scenes from resource/references/preview_*.jpg.
## Run from the editor:  load("res://tools/build_ui_scenes.gd").new().build()
## All geometry is in design space (1920x1080 viewport).

const UiSkin = preload("res://scenes/common/UiSkin.gd")

const UI := "res://resource/ui/"
const SPR := "res://resource/sprites/"

# ---- sanctuary panel ----------------------------------------------------
const PANEL := Rect2(70, 38, 1780, 998)
const SIGN := Rect2(454, 9, 872, 118)          # relative to PANEL
const GRID_AREA := Rect2(69, 178, 1641, 792)   # relative to PANEL
const CLOSE_RECT := Rect2(1715, 62, 76, 70)

# ---- pet cell -----------------------------------------------------------
const CELL := Vector2(396, 254)
const CELL_HSEP := 19
const CELL_VSEP := 15
const FENCE_RECT := Rect2(22, 4, 364, 215)
const CELL_PET_CENTER := Vector2(216, 118)
const CELL_PET_BOX := 292.0
const PLATE_RECT := Rect2(56, 198, 190, 46)
const FEED_RECT := Rect2(318, 2, 90, 90)

# ---- adopt dialog -------------------------------------------------------
const DLG := Rect2(492, 143, 936, 759)
const DLG_PAD := 38.0
const DLG_PLATE_RECT := Rect2(229, -36, 519, 101)   # relative to DLG
const DLG_CLOSE_RECT := Rect2(845, 46, 60, 56)      # relative to DLG
const SLOT := Vector2(240, 200)
const SLOT_HSEP := 40
const SLOT_VSEP := 25
const NEST := Rect2(0, 0, 240, 195)
const SLOT_PET_CENTER := Vector2(119, 78)
const SLOT_PET_BOX := 370.0
const ADOPT_BTN := Rect2(44, 163, 152, 47)

# ---- loading ------------------------------------------------------------
const LOAD_TITLE := Rect2(310, 286, 1300, 120)
const LOAD_PET_CENTER := Vector2(960, 600)
const LOAD_PET_BOX := 320.0
const LOAD_SHADOW := Rect2(896, 686, 128, 34)
const LOAD_BAR := Rect2(660, 792, 600, 46)
const LOAD_BAR_INSET := 7.0
const LOAD_PERCENT := Rect2(660, 852, 600, 40)

# ---- home ---------------------------------------------------------------
const HOUSE_HOTSPOT := Rect2(701, 97, 499, 358)
## Pet standing on the lawn, matching the panda composited into preview_3.jpg.
## The frame centre is nudged up/left because the sprite's body sits slightly
## below-right of its 256px frame centre.
const HOME_PET_CENTER := Vector2(342, 827)
const HOME_PET_BOX := 286.0
const HOME_PET_TYPE := "panda"
const HOME_SHADOW := Rect2(315, 882, 122, 32)
const HOME_PET_HIT := Rect2(300, 768, 152, 142)


func build() -> String:
	var out := PackedStringArray()
	out.append(_build_pet_cell())
	out.append(_build_adopt_slot())
	out.append(_build_adopt_dialog())
	out.append(_build_sanctuary())
	out.append(_build_home())
	out.append(_build_loading())
	out.append(_build_main())
	EditorInterface.get_resource_filesystem().scan()
	return "\n".join(out)


# =========================================================================
#  helpers
# =========================================================================

func _add(root: Node, parent: Node, n: Node, nm: String) -> Node:
	n.name = nm
	parent.add_child(n)
	n.owner = root
	return n


func _place(c: Control, r: Rect2) -> void:
	c.set_anchors_preset(Control.PRESET_TOP_LEFT, false)
	c.offset_left = r.position.x
	c.offset_top = r.position.y
	c.offset_right = r.position.x + r.size.x
	c.offset_bottom = r.position.y + r.size.y


func _full(c: Control) -> void:
	c.set_anchors_preset(Control.PRESET_FULL_RECT, false)
	c.offset_left = 0.0
	c.offset_top = 0.0
	c.offset_right = 0.0
	c.offset_bottom = 0.0


func _centered_box(center: Vector2, box: float) -> Rect2:
	return Rect2(center - Vector2(box, box) * 0.5, Vector2(box, box))


func _texrect(tex: String, stretch: int = TextureRect.STRETCH_SCALE) -> TextureRect:
	var t := TextureRect.new()
	t.texture = load(tex)
	t.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	t.stretch_mode = stretch
	t.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return t


func _ninepatch(tex: String, margin: int) -> NinePatchRect:
	var n := NinePatchRect.new()
	n.texture = load(tex)
	n.patch_margin_left = margin
	n.patch_margin_top = margin
	n.patch_margin_right = margin
	n.patch_margin_bottom = margin
	n.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return n


func _texbutton(tex: String) -> TextureButton:
	var b := TextureButton.new()
	b.texture_normal = load(tex)
	b.ignore_texture_size = true
	b.stretch_mode = TextureButton.STRETCH_SCALE
	return b


func _label(txt: String, fsize: int, color: Color) -> Label:
	var l := Label.new()
	l.text = txt
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	l.add_theme_font_size_override("font_size", fsize)
	l.add_theme_color_override("font_color", color)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l


func _transparent_button() -> Button:
	var b := Button.new()
	b.flat = true
	for st in ["normal", "hover", "pressed", "focus", "disabled"]:
		b.add_theme_stylebox_override(st, StyleBoxEmpty.new())
	return b


func _petview(center: Vector2, box: float, pet: String) -> Control:
	var p := Control.new()
	p.set_script(load("res://scenes/pet/PetView.gd"))
	p.set("pet_type", pet)
	p.set("target_size", box * 0.98)
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	p.clip_contents = false
	_place(p, _centered_box(center, box))
	return p


func _save(root: Node, path: String) -> String:
	var ps := PackedScene.new()
	var err := ps.pack(root)
	if err != OK:
		root.free()
		return "PACK FAIL %s (%d)" % [path, err]
	err = ResourceSaver.save(ps, path)
	root.free()
	return ("saved %s" % path) if err == OK else "SAVE FAIL %s (%d)" % [path, err]


# =========================================================================
#  PetCell.tscn
# =========================================================================

func _build_pet_cell() -> String:
	var root := Control.new()
	root.name = "PetCell"
	root.set_script(load("res://scenes/common/PetCell.gd"))
	root.custom_minimum_size = CELL
	_place(root, Rect2(Vector2.ZERO, CELL))
	root.clip_contents = false
	root.mouse_filter = Control.MOUSE_FILTER_PASS

	var slot := _add(root, root, _ninepatch(UI + "bg_grid.png", 30), "Slot") as NinePatchRect
	_full(slot)
	slot.modulate = Color(1, 1, 1, 0.12)

	var fence := _add(root, root, _texrect(UI + "fence.png"), "Fence") as TextureRect
	_place(fence, FENCE_RECT)

	var shadow := _add(root, root, _texrect(UI + "shadow.png"), "Shadow") as TextureRect
	_place(shadow, Rect2(CELL_PET_CENTER.x - 59, 158, 118, 36))
	shadow.modulate = Color(1, 1, 1, 0.45)

	_add(root, root, _petview(CELL_PET_CENTER, CELL_PET_BOX, "cat"), "PetView")

	var hit := _add(root, root, _transparent_button(), "Hit") as Button
	_place(hit, FENCE_RECT)

	var plate := _add(root, root, _texrect(UI + "name_plate.png"), "Plate") as TextureRect
	_place(plate, PLATE_RECT)

	var nm := _add(root, root, _label("Luna", 27, UiSkin.NAME_TEXT), "NameLabel") as Label
	_place(nm, PLATE_RECT)

	var plus := _add(root, root, _label("+", 96, UiSkin.PLUS), "Plus") as Label
	_place(plus, FENCE_RECT)
	plus.add_theme_color_override("font_outline_color", Color(0.42, 0.56, 0.28, 0.55))
	plus.add_theme_constant_override("outline_size", 6)

	var hl := Panel.new()
	var hlsb := StyleBoxFlat.new()
	hlsb.bg_color = Color(UiSkin.SELECT, 0.10)
	hlsb.set_corner_radius_all(16)
	hlsb.set_border_width_all(5)
	hlsb.border_color = UiSkin.SELECT
	hl.add_theme_stylebox_override("panel", hlsb)
	hl.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hl.visible = false
	_add(root, root, hl, "Highlight")
	_full(hl)

	var feed := _add(root, root, _texbutton(UI + "btn_feed.png"), "FeedButton") as TextureButton
	_place(feed, FEED_RECT)
	feed.tooltip_text = "FEED"
	var feed_cap := _add(root, feed, _label("FEED", 16, UiSkin.FEED_TEXT), "Caption") as Label
	_place(feed_cap, Rect2(0, 56, FEED_RECT.size.x, 22))
	feed_cap.add_theme_color_override("font_outline_color", Color(0.72, 0.36, 0.26, 0.8))
	feed_cap.add_theme_constant_override("outline_size", 4)

	return _save(root, "res://scenes/common/PetCell.tscn")


# =========================================================================
#  AdoptSlot.tscn
# =========================================================================

func _build_adopt_slot() -> String:
	var root := Control.new()
	root.name = "AdoptSlot"
	root.set_script(load("res://scenes/common/AdoptSlot.gd"))
	root.custom_minimum_size = SLOT
	_place(root, Rect2(Vector2.ZERO, SLOT))
	root.clip_contents = false
	root.mouse_filter = Control.MOUSE_FILTER_PASS

	var nest := Control.new()
	nest.set_script(load("res://scenes/common/Nest.gd"))
	nest.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_add(root, root, nest, "Nest")
	_place(nest, NEST)

	_add(root, root, _petview(SLOT_PET_CENTER, SLOT_PET_BOX, "hamster"), "PetView")

	var front := Control.new()
	front.set_script(load("res://scenes/common/Nest.gd"))
	front.set("front_only", true)
	front.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_add(root, root, front, "NestFront")
	_place(front, NEST)

	var btn := Button.new()
	btn.text = "领养"
	_add(root, root, btn, "AdoptButton")
	_place(btn, ADOPT_BTN)
	btn.add_theme_font_size_override("font_size", 27)
	for st in ["normal", "hover", "pressed"]:
		var sb := StyleBoxFlat.new()
		sb.bg_color = UiSkin.BTN_RED
		if st == "hover":
			sb.bg_color = UiSkin.BTN_RED_HOVER
		elif st == "pressed":
			sb.bg_color = UiSkin.BTN_RED_DARK
		sb.set_corner_radius_all(UiSkin.R_BUTTON)
		sb.set_border_width_all(5)
		sb.border_color = UiSkin.BTN_RED_DARK
		btn.add_theme_stylebox_override(st, sb)
	btn.add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	btn.add_theme_color_override("font_color", UiSkin.BTN_TEXT)
	btn.add_theme_color_override("font_hover_color", UiSkin.BTN_TEXT)
	btn.add_theme_color_override("font_pressed_color", UiSkin.BTN_TEXT)

	return _save(root, "res://scenes/common/AdoptSlot.tscn")


# =========================================================================
#  Sanctuary.tscn
# =========================================================================

func _build_sanctuary() -> String:
	var root := Control.new()
	root.name = "Sanctuary"
	root.set_script(load("res://scenes/sanctuary/Sanctuary.gd"))
	_full(root)

	var bg := _add(root, root, _texrect(SPR + "illustration.png", TextureRect.STRETCH_KEEP_ASPECT_COVERED), "Background") as TextureRect
	_full(bg)

	var panel := _add(root, root, _texrect(UI + "bg_panel.png"), "Panel") as TextureRect
	_place(panel, PANEL)
	panel.mouse_filter = Control.MOUSE_FILTER_PASS

	var title := _add(root, panel, _label("PET SANCTUARY MANAGEMENT", 52, UiSkin.TITLE_TEXT), "Title") as Label
	_place(title, SIGN)
	title.add_theme_color_override("font_outline_color", UiSkin.TITLE_OUTLINE)
	title.add_theme_constant_override("outline_size", 10)
	title.add_theme_color_override("font_shadow_color", Color(0.35, 0.18, 0.08, 0.45))
	title.add_theme_constant_override("shadow_offset_y", 3)

	var area := Control.new()
	area.mouse_filter = Control.MOUSE_FILTER_PASS
	_add(root, panel, area, "GridArea")
	_place(area, GRID_AREA)

	var grid := GridContainer.new()
	grid.columns = 4
	grid.add_theme_constant_override("h_separation", CELL_HSEP)
	grid.add_theme_constant_override("v_separation", CELL_VSEP)
	grid.mouse_filter = Control.MOUSE_FILTER_PASS
	_add(root, area, grid, "Grid")
	_full(grid)

	var cell_scene: PackedScene = load("res://scenes/common/PetCell.tscn")
	for i in 12:
		var c: Control = cell_scene.instantiate()
		c.name = "Cell%d" % (i + 1)
		grid.add_child(c)
		c.owner = root

	var close := _add(root, root, _texbutton(UI + "btn_close.png"), "CloseButton") as TextureButton
	_place(close, CLOSE_RECT)

	return _save(root, "res://scenes/sanctuary/Sanctuary.tscn")


# =========================================================================
#  AdoptDialog.tscn
# =========================================================================

func _build_adopt_dialog() -> String:
	var root := Control.new()
	root.name = "AdoptDialog"
	root.set_script(load("res://scenes/sanctuary/AdoptDialog.gd"))
	_full(root)
	root.mouse_filter = Control.MOUSE_FILTER_PASS

	var dim := ColorRect.new()
	dim.color = UiSkin.DIM
	dim.mouse_filter = Control.MOUSE_FILTER_STOP
	_add(root, root, dim, "Dim")
	_full(dim)

	var panel := Panel.new()
	var outer := StyleBoxFlat.new()
	outer.bg_color = UiSkin.DLG_FRAME
	outer.set_corner_radius_all(46)
	outer.set_border_width_all(5)
	outer.border_color = UiSkin.DLG_FRAME_DARK
	outer.shadow_color = Color(0.2, 0.1, 0.05, 0.35)
	outer.shadow_size = 22
	outer.shadow_offset = Vector2(0, 10)
	panel.add_theme_stylebox_override("panel", outer)
	_add(root, root, panel, "Panel")
	_place(panel, DLG)

	var inner := Panel.new()
	var isb := StyleBoxFlat.new()
	isb.bg_color = UiSkin.DLG_FILL
	isb.set_corner_radius_all(26)
	isb.set_border_width_all(4)
	isb.border_color = Color(UiSkin.DLG_FRAME_DARK, 0.35)
	inner.add_theme_stylebox_override("panel", isb)
	inner.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_add(root, panel, inner, "Inner")
	_place(inner, Rect2(30, 30, DLG.size.x - 60, DLG.size.y - 60))

	var plate := _add(root, panel, _texrect(UI + "name_plate.png"), "TopPlate") as TextureRect
	_place(plate, DLG_PLATE_RECT)
	plate.modulate = Color(0.72, 0.55, 0.47)

	var scroll := ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.follow_focus = true
	_add(root, panel, scroll, "Scroll")
	_place(scroll, Rect2(DLG_PAD, 58.0, DLG.size.x - DLG_PAD * 2.0, DLG.size.y - 58.0 - DLG_PAD))

	var grid := GridContainer.new()
	grid.columns = 3
	grid.add_theme_constant_override("h_separation", SLOT_HSEP)
	grid.add_theme_constant_override("v_separation", SLOT_VSEP)
	grid.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	_add(root, scroll, grid, "Grid")

	var slot_scene: PackedScene = load("res://scenes/common/AdoptSlot.tscn")
	for i in 7:
		var s: Control = slot_scene.instantiate()
		s.name = "Slot%d" % (i + 1)
		grid.add_child(s)
		s.owner = root

	var close := _add(root, panel, _texbutton(UI + "btn_close.png"), "CloseButton") as TextureButton
	_place(close, DLG_CLOSE_RECT)

	return _save(root, "res://scenes/sanctuary/AdoptDialog.tscn")


# =========================================================================
#  MainHome.tscn
# =========================================================================

func _build_home() -> String:
	var root := Control.new()
	root.name = "MainHome"
	root.set_script(load("res://scenes/home/MainHome.gd"))
	_full(root)

	var bg := _add(root, root, _texrect(SPR + "illustration.png", TextureRect.STRETCH_KEEP_ASPECT_COVERED), "Background") as TextureRect
	_full(bg)

	var shadow := _add(root, root, _texrect(UI + "shadow.png"), "Shadow") as TextureRect
	_place(shadow, HOME_SHADOW)
	shadow.modulate = Color(1, 1, 1, 0.30)

	_add(root, root, _petview(HOME_PET_CENTER, HOME_PET_BOX, HOME_PET_TYPE), "Pet")

	var pet_hit := _add(root, root, _transparent_button(), "PetHit") as Button
	_place(pet_hit, HOME_PET_HIT)

	var hot := _add(root, root, _transparent_button(), "HouseHotspot") as Button
	_place(hot, HOUSE_HOTSPOT)
	hot.tooltip_text = "进入宠物庇护所"

	var close := _add(root, root, _texbutton(UI + "btn_close.png"), "CloseButton") as TextureButton
	_place(close, CLOSE_RECT)

	return _save(root, "res://scenes/home/MainHome.tscn")


# =========================================================================
#  Loading.tscn
# =========================================================================

func _build_loading() -> String:
	var root := Control.new()
	root.name = "Loading"
	root.set_script(load("res://scenes/loading/Loading.gd"))
	_full(root)

	var bg := _add(root, root, _texrect(SPR + "illustration.png", TextureRect.STRETCH_KEEP_ASPECT_COVERED), "Background") as TextureRect
	_full(bg)

	var dim := ColorRect.new()
	dim.color = Color(0.20, 0.11, 0.06, 0.45)
	dim.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_add(root, root, dim, "Dim")
	_full(dim)

	var title := _add(root, root, _label(ProjectSettings.get_setting("application/config/name", "幻兽学园"), 88, UiSkin.TITLE_TEXT), "Title") as Label
	_place(title, LOAD_TITLE)
	title.add_theme_color_override("font_outline_color", UiSkin.TITLE_OUTLINE)
	title.add_theme_constant_override("outline_size", 14)
	title.add_theme_color_override("font_shadow_color", Color(0.30, 0.15, 0.06, 0.5))
	title.add_theme_constant_override("shadow_offset_y", 5)

	var shadow := _add(root, root, _texrect(UI + "shadow.png"), "Shadow") as TextureRect
	_place(shadow, LOAD_SHADOW)
	shadow.modulate = Color(1, 1, 1, 0.35)

	_add(root, root, _petview(LOAD_PET_CENTER, LOAD_PET_BOX, "panda"), "Pet")

	var track := _add(root, root, _ninepatch(UI + "bg_grid.png", 30), "BarTrack") as NinePatchRect
	_place(track, LOAD_BAR)
	# self_modulate, not modulate: modulate would tint the BarFill child too.
	track.self_modulate = Color(0.62, 0.50, 0.41)

	var fill := Panel.new()
	var fsb := StyleBoxFlat.new()
	fsb.bg_color = UiSkin.NEST_GREEN
	fsb.set_corner_radius_all(16)
	fsb.border_width_top = 5
	fsb.border_color = UiSkin.NEST_GREEN_LIGHT
	fill.add_theme_stylebox_override("panel", fsb)
	fill.mouse_filter = Control.MOUSE_FILTER_IGNORE
	fill.custom_minimum_size = Vector2(36, 0)
	_add(root, track, fill, "BarFill")
	_place(fill, Rect2(LOAD_BAR_INSET, LOAD_BAR_INSET, 36,
		LOAD_BAR.size.y - LOAD_BAR_INSET * 2.0))

	var pct := _add(root, root, _label("0%", 30, UiSkin.TITLE_TEXT), "Percent") as Label
	_place(pct, LOAD_PERCENT)
	pct.add_theme_color_override("font_outline_color", UiSkin.TITLE_OUTLINE)
	pct.add_theme_constant_override("outline_size", 6)

	return _save(root, "res://scenes/loading/Loading.tscn")


# =========================================================================
#  main.tscn
# =========================================================================

func _build_main() -> String:
	var root := Control.new()
	root.name = "Main"
	root.set_script(load("res://Main.gd"))
	_full(root)
	return _save(root, "res://main.tscn")
