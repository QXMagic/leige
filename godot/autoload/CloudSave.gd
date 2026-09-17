extends Node
## 云存档：把 PetState 和 ScoreState 合成一份存档传到服务端。
##
## 身份：用 ClientId.device_id 调 /login/guestLogin 换 token，服务端只按 token
## 认出的账号读写存档，所以每个客户端只能看到自己的数据。
##
## 本地文件仍是主存档，断网照常上课。每次本地保存记一个递增的时间戳，和云端的
## client_save_time 比：启动时云端更新（本地存档丢了）就用云端的，本地更新就传上去。
## 没和云端比对过之前不上传，免得一份默认名册盖掉云端的真实存档。

const META_FILE := "cloud_save.cfg"
const SAVE_VERSION := 1
## 连续操作时攒一攒再传。
const SAVE_DEBOUNCE := 2.0
const RETRY_SECONDS := 30.0
## 启动页最多等云端这么久，超时就先离线进游戏，之后在后台补同步。
const BOOT_WAIT_SECONDS := 4.0

var enabled := true
## 启动时的同步有结果了（成功或失败），启动页据此放行。
var boot_done := false
var user_id := 0

var _local_time := 0
var _synced_time := 0
var _compared := false
var _busy := false
var _applying := false
var _timer := Timer.new()


func _ready() -> void:
	_read_meta()
	PetState.saved.connect(_on_local_saved)
	ScoreState.saved.connect(_on_local_saved)
	_timer.one_shot = true
	_timer.timeout.connect(_sync)
	add_child(_timer)
	if enabled:
		_sync()
	else:
		boot_done = true


func _on_local_saved() -> void:
	if _applying:
		return
	# 保证严格递增：同一秒内连着存两次，第二次也要算“比已上传的新”。
	_local_time = maxi(int(Time.get_unix_time_from_system()), _local_time + 1)
	_write_meta()
	if enabled:
		_timer.start(SAVE_DEBOUNCE)


## 登录 → 比对 → 上传，缺哪步做哪步，每次只有一个请求在路上。
func _sync() -> void:
	if _busy:
		return
	if ApiClient.api_token.is_empty():
		_login()
	elif not _compared:
		_load()
	elif _local_time > _synced_time:
		_upload()


func _login() -> void:
	_busy = true
	var body := {"device_id": ClientId.device_id, "platform": OS.get_name().to_lower(), "terminal": 4}
	var done := func(ok: bool, code: int, data: Variant, msg: String):
		_busy = false
		if not ok or typeof(data) != TYPE_DICTIONARY or str(data.get("token", "")).is_empty():
			_fail(code, "登录", msg)
			return
		ApiClient.api_token = str(data["token"])
		user_id = int(data.get("user_id", 0))
		_sync()
	ApiClient.send(HTTPClient.METHOD_POST, "/login/guestLogin", body, done, BOOT_WAIT_SECONDS)


func _load() -> void:
	_busy = true
	var done := func(ok: bool, code: int, data: Variant, msg: String):
		_busy = false
		if not ok or typeof(data) != TYPE_DICTIONARY:
			_fail(code, "读取云存档", msg)
			return
		var cloud_time := int(data.get("client_save_time", 0))
		var save_data: Variant = data.get("save_data")
		if int(data.get("has_save", 0)) == 1 and cloud_time > _local_time and typeof(save_data) == TYPE_DICTIONARY:
			if boot_done:
				# 已经在上课了，不在老师眼前把数据换掉；下次本地保存会覆盖云端。
				push_warning("云存档比本地新，但已进入游戏，本次保留本地数据")
			else:
				_apply(save_data)
				_local_time = cloud_time
		_synced_time = cloud_time
		_compared = true
		boot_done = true
		_write_meta()
		_sync()
	ApiClient.send(HTTPClient.METHOD_GET, "/game_save/load", {}, done, BOOT_WAIT_SECONDS)


func _upload() -> void:
	_busy = true
	var sending := _local_time
	var body := {
		"save_data": {
			"version": SAVE_VERSION,
			"pets": PetState.to_save(),
			"scores": ScoreState.to_save(),
		},
		"client_version": str(ProjectSettings.get_setting("application/config/version", "")),
		"client_save_time": sending,
	}
	ApiClient.send(HTTPClient.METHOD_POST, "/game_save/save", body, func(ok: bool, code: int, _data: Variant, msg: String):
		_busy = false
		if not ok:
			_fail(code, "上传云存档", msg)
			return
		_synced_time = maxi(_synced_time, sending)
		_write_meta()
		_sync()
	)


func _apply(save_data: Dictionary) -> void:
	_applying = true
	var pets: Variant = save_data.get("pets")
	if typeof(pets) == TYPE_DICTIONARY and PetState.apply_save(pets):
		PetState.save_pets()
	var scores: Variant = save_data.get("scores")
	if typeof(scores) == TYPE_DICTIONARY and ScoreState.apply_save(scores):
		ScoreState.save_scores()
	_applying = false


## 失败不打断上课：token 失效就重新登录，其他情况过一会再试。
func _fail(code: int, what: String, msg: String) -> void:
	boot_done = true
	if code == -1 and not ApiClient.api_token.is_empty():
		ApiClient.api_token = ""
		_sync()
		return
	push_warning("云存档%s失败：%s" % [what, msg])
	_timer.start(RETRY_SECONDS)


func _read_meta() -> void:
	var cfg := ConfigFile.new()
	if cfg.load(ClientId.path(META_FILE)) != OK:
		return
	_local_time = int(cfg.get_value("sync", "local_time", 0))
	_synced_time = int(cfg.get_value("sync", "synced_time", 0))


func _write_meta() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("sync", "local_time", _local_time)
	cfg.set_value("sync", "synced_time", _synced_time)
	cfg.save(ClientId.path(META_FILE))
