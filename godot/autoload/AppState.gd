extends Node

# ========== Signals ==========

signal overview_changed(data: Dictionary)
signal furniture_changed(data: Dictionary)
signal page_changed(page_name: String)
signal loading_changed(loading: bool)

# ========== Current page ==========

enum Page { HOME, HABITAT, EXPLORE, DEX }
var current_page: int = Page.HOME
var loading: bool = false

# ========== Data cache ==========

var overview: Dictionary = {}
var furniture: Dictionary = {}
var last_error: String = ""

# ========== Page navigation ==========

func go_home() -> void:
	_switch(Page.HOME)

func go_habitat() -> void:
	_switch(Page.HABITAT)

func go_explore() -> void:
	_switch(Page.EXPLORE)

func go_dex() -> void:
	_switch(Page.DEX)

func _switch(p: int) -> void:
	if p == current_page:
		return
	current_page = p
	var label: String = ["home", "habitat", "explore", "dex"][p]
	emit_signal("page_changed", label)

# ========== Data loaders ==========

func load_overview() -> void:
	var api: Node = get_node("/root/ApiClient")
	if api.request_completed.is_connected(_on_overview):
		return
	loading = true
	emit_signal("loading_changed", true)
	api.request_completed.connect(_on_overview, CONNECT_ONE_SHOT)
	api.request_failed.connect(_on_overview_err, CONNECT_ONE_SHOT)
	api.request_get("/pet/my")

func load_furniture() -> void:
	var api: Node = get_node("/root/ApiClient")
	if api.request_completed.is_connected(_on_furniture):
		return
	api.request_completed.connect(_on_furniture, CONNECT_ONE_SHOT)
	api.request_failed.connect(_on_furniture_err, CONNECT_ONE_SHOT)
	api.request_get("/home/furniture")

func load_all() -> void:
	load_overview()
	load_furniture()

# ========== Callbacks ==========

func _on_overview(endpoint: String, data: Variant) -> void:
	if endpoint.find("pet/my") < 0:
		return
	overview = data if data is Dictionary else {}
	loading = false
	emit_signal("loading_changed", false)
	emit_signal("overview_changed", overview)

func _on_overview_err(endpoint: String, err: String) -> void:
	if endpoint.find("pet/my") < 0:
		return
	last_error = err
	loading = false
	emit_signal("loading_changed", false)
	push_warning("overview err: " + err)

func _on_furniture(endpoint: String, data: Variant) -> void:
	if endpoint.find("home/furniture") < 0:
		return
	furniture = data if data is Dictionary else {}
	emit_signal("furniture_changed", furniture)

func _on_furniture_err(endpoint: String, err: String) -> void:
	if endpoint.find("home/furniture") < 0:
		return
	last_error = err
	push_warning("furniture err: " + err)
