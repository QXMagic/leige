extends Node
## 这台客户端是谁。
##
## 首次启动时生成一个随机 device_id 存在 user:// 里，CloudSave 拿它去服务端换
## 这台客户端自己的账号，A 老师和 B 老师的客户端各是各的账号，存档不会串。
## 不用 OS.get_unique_id()：两位老师共用一台教室电脑时它是一样的。
##
## 同一台电脑要分开两份（共用电脑，或本地联调两个客户端），启动时带上
## `-- --profile=B`，每个 profile 有自己的 device_id 和本地存档目录。

const CONFIG_FILE := "client.cfg"

var profile: String = ""
var device_id: String = ""


func _ready() -> void:
	profile = _read_profile()
	DirAccess.make_dir_recursive_absolute(data_dir())
	_load_or_create_device_id()


## 当前 profile 的本地存档目录。默认 profile 就是 user:// 根目录，老存档照常读到。
func data_dir() -> String:
	return "user://" if profile.is_empty() else "user://profiles/%s/" % profile


func path(file_name: String) -> String:
	return data_dir() + file_name


func _read_profile() -> String:
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--profile="):
			return arg.trim_prefix("--profile=").strip_edges().validate_filename()
	return ""


func _load_or_create_device_id() -> void:
	var cfg := ConfigFile.new()
	var file := path(CONFIG_FILE)
	if cfg.load(file) == OK:
		device_id = str(cfg.get_value("client", "device_id", ""))
	if device_id.length() >= 8:
		return
	device_id = "gd_" + Crypto.new().generate_random_bytes(16).hex_encode()
	cfg.set_value("client", "device_id", device_id)
	var err := cfg.save(file)
	if err != OK:
		push_warning("客户端标识保存失败：%s" % error_string(err))
