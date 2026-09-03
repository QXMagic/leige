extends Node

# ========== Configuration ==========

var base_url: String = "http://localhost:8005/api"
var api_token: String = ""
var mock_mode: bool = true   # 开发阶段默认走 mock，后端就绪后改为 false

const HTTP_TIMEOUT := 15.0

# ========== Signals ==========

signal request_completed(endpoint: String, data: Variant)
signal request_failed(endpoint: String, err: String)

# ========== Public ==========

func configure(url: String, token: String = "") -> void:
	base_url = url.rstrip("/")
	api_token = token
	mock_mode = false

func request_get(endpoint: String, params: Dictionary = {}) -> void:
	var qs := _build_query(params)
	_request(endpoint + qs, HTTPClient.METHOD_GET, Dictionary())

func post(endpoint: String, body: Dictionary = {}) -> void:
	_request(endpoint, HTTPClient.METHOD_POST, body)

# ========== HTTP ==========

func _request(endpoint: String, method: int, body: Dictionary) -> void:
	if mock_mode:
		call_deferred("_mock_response", endpoint)
		return

	var full_url := base_url + endpoint
	var http := HTTPRequest.new()
	http.timeout = HTTP_TIMEOUT
	add_child(http)

	http.request_completed.connect(func(_result: int, response_code: int, _headers: PackedStringArray, body: PackedByteArray):
		http.queue_free()
		if response_code != 200:
			emit_signal("request_failed", endpoint, "HTTP %d" % response_code)
			return
		var text: String = body.get_string_from_utf8()
		var parsed: Variant = JSON.parse_string(text)
		if parsed == null:
			emit_signal("request_failed", endpoint, "JSON parse error")
			return
		if typeof(parsed) == TYPE_DICTIONARY and parsed.has("code"):
			if parsed["code"] == 1 or parsed["code"] == 200:
				emit_signal("request_completed", endpoint, parsed.get("data", {}))
			else:
				emit_signal("request_failed", endpoint, parsed.get("msg", "unknown error"))
		else:
			emit_signal("request_completed", endpoint, parsed)
	)

	var headers := ["Content-Type: application/json"]
	if api_token != "":
		headers.append("token: " + api_token)

	var body_str := JSON.stringify(body) if not body.is_empty() else ""
	var err := http.request(full_url, headers, method, body_str)
	if err != OK:
		http.queue_free()
		emit_signal("request_failed", endpoint, "request err %d" % err)

func _build_query(params: Dictionary) -> String:
	if params.is_empty():
		return ""
	var pairs: Array[String] = []
	for k in params.keys():
		pairs.append("%s=%s" % [k, str(params[k])])
	return "?" + "&".join(pairs)

# ========== Mock ==========

func _mock_response(endpoint: String) -> void:
	var data: Variant = {}
	if endpoint.find("pet/my") >= 0 or endpoint.find("home/overview") >= 0:
		data = _mock_overview()
	elif endpoint.find("pet/catalog") >= 0:
		data = _mock_catalog()
	elif endpoint.find("home/furniture") >= 0:
		data = _mock_furniture()
	else:
		data = _mock_overview()
	emit_signal("request_completed", endpoint, data)

func _mock_overview() -> Dictionary:
	return {
		"class_name": "三年级二班",
		"class_level": 8,
		"class_stage": "小型营地",
		"total_energy": 1250,
		"mood": {
			"type": "happy",
			"label": "开心",
			"emoji": "😊",
			"bonus": "+20%"
		},
		"habitat_score": 850,
		"groups": [
			{"id": 1, "name": "第1组", "pet_name": "乘风鹰", "pet_emoji": "🦅", "level": 8, "energy": 750, "progress": 0.75, "rank": 2},
			{"id": 2, "name": "第2组", "pet_name": "水灵龟", "pet_emoji": "🐢", "level": 6, "energy": 520, "progress": 0.60, "rank": 4},
			{"id": 3, "name": "第3组", "pet_name": "炎火狐", "pet_emoji": "🦊", "level": 10, "energy": 920, "progress": 0.90, "rank": 1, "can_evolve": true},
			{"id": 4, "name": "第4组", "pet_name": "光翼蝶", "pet_emoji": "🦋", "level": 5, "energy": 450, "progress": 0.45, "rank": 3},
		],
		"badges": [
			{"name": "全员达标", "icon": "🏆", "unlocked": true},
			{"name": "活跃课堂", "icon": "📚", "unlocked": true},
			{"name": "团结友爱", "icon": "🤝", "unlocked": true},
			{"name": "文明班级", "icon": "🌟", "unlocked": true},
			{"name": "家园落成", "icon": "🏡", "unlocked": false},
			{"name": "迷宫探险家", "icon": "🗺️", "unlocked": false},
		],
		"ranks": [
			{"name": "第3组", "score": 920, "medal": "🥇"},
			{"name": "第1组", "score": 750, "medal": "🥈"},
			{"name": "第4组", "score": 520, "medal": "🥉"},
		],
		"tasks": [
			{"text": "全班作业上交率 95%", "done": true},
			{"text": "通关一次团队副本", "done": false},
			{"text": "卫生检查达标", "done": false},
		],
		"puzzle": {
			"name": "古诗拼图",
			"current": 6,
			"total": 10,
		},
		"challenge": {
			"streak": 2,
			"reward": "下周奖励：能量果 ×5"
		},
		"plaza_furniture": [
			{"emoji": "💎", "name": "能量水晶"},
			{"emoji": "📚", "name": "智慧书架"},
			{"emoji": "🎠", "name": "活力滑梯"},
		],
		"plaza_bonuses": ["💎 +5能量/日", "📚 智慧+10%", "🎠 精力+15%"],
	}

func _mock_catalog() -> Array:
	return [
		{"name": "乘风鹰", "emoji": "🦅", "quality": 2, "attack": 35, "speed": 80},
		{"name": "水灵龟", "emoji": "🐢", "quality": 1, "defense": 90, "hp": 85},
		{"name": "炎火狐", "emoji": "🦊", "quality": 3, "attack": 75, "speed": 60},
		{"name": "光翼蝶", "emoji": "🦋", "quality": 2, "speed": 95, "cha": 70},
		{"name": "雷霆龙", "emoji": "🐉", "quality": 4, "attack": 100, "hp": 100},
		{"name": "暗影狼", "emoji": "🐺", "quality": 3, "attack": 85, "speed": 75},
	]

func _mock_furniture() -> Dictionary:
	return {
		"placed": [
			{"slot": 0, "emoji": "💎", "name": "能量水晶", "type": "functional", "bonus": "+5能量/日"},
			{"slot": 1, "emoji": "📚", "name": "智慧书架", "type": "functional", "bonus": "智慧+10%"},
			{"slot": 2, "emoji": "🎠", "name": "活力滑梯", "type": "functional", "bonus": "精力+15%"},
			{"slot": 3, "emoji": "⛲", "name": "祝福喷泉", "type": "functional", "bonus": "心情+5%"},
		],
		"inventory": [
			{"emoji": "💎", "name": "能量水晶", "type": "functional", "placed": true},
			{"emoji": "📚", "name": "智慧书架", "type": "functional", "placed": true},
			{"emoji": "🎠", "name": "活力滑梯", "type": "functional", "placed": true},
			{"emoji": "⛲", "name": "祝福喷泉", "type": "functional", "placed": true},
			{"emoji": "🌸", "name": "花圃", "type": "decorative", "placed": false},
			{"emoji": "🏮", "name": "灯笼", "type": "decorative", "placed": false},
			{"emoji": "🚩", "name": "彩旗", "type": "decorative", "placed": false},
			{"emoji": "🎀", "name": "蝴蝶结", "type": "decorative", "placed": false},
			{"emoji": "🌼", "name": "小雏菊", "type": "decorative", "placed": false},
			{"emoji": "🐛", "name": "虫虫屋", "type": "decorative", "placed": false},
		],
		"zone_beauty": [
			{"zone_id": 1, "stars": 2},
			{"zone_id": 2, "stars": 1},
			{"zone_id": 3, "stars": 3},
			{"zone_id": 4, "stars": 1},
		],
		"plaza_slots_total": 6,
		"habitat_score": 850,
		"habitat_level": 15,
		"habitat_stage": "中型村落",
		"decoration_count": 18,
		"event": "🎉 进化仪式举办地",
		"theme": "🌿 森林主题",
	}
