"""
TCP clients for Godot MCP bridge.

godot        → port 9500 (editor plugin, always available when Godot is open)
godot_runtime → port 9501 (game autoload, only available while game is running)
"""

import json
import socket
import threading
import time
from typing import Any, Optional


class GodotClient:
    """Thread-safe TCP client — line-delimited JSON protocol."""

    def __init__(self, host: str = "127.0.0.1", port: int = 9500,
                 timeout: float = 30.0, label: str = "Godot"):
        self.host = host
        self.port = port
        self.timeout = timeout
        self.label = label
        self._sock: Optional[socket.socket] = None
        self._lock = threading.Lock()
        self._counter = 0

    # ──────────────────────────────────────────────────────────
    # Connection management
    # ──────────────────────────────────────────────────────────
    def _connect(self) -> None:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(self.timeout)
        try:
            sock.connect((self.host, self.port))
        except ConnectionRefusedError:
            raise ConnectionRefusedError(
                f"[{self.label}] Cannot connect to {self.host}:{self.port}. "
                + ("Make sure Godot is open and the 'Godot MCP' plugin is enabled."
                   if self.port == 9500 else
                   "Make sure the game is running (press F5 in Godot).")
            )
        self._sock = sock

    def _ensure_connected(self) -> None:
        if self._sock is None:
            self._connect()
            return
        try:
            self._sock.getpeername()
        except OSError:
            self._sock = None
            self._connect()

    def disconnect(self) -> None:
        if self._sock:
            try:
                self._sock.close()
            except OSError:
                pass
            self._sock = None

    def is_available(self) -> bool:
        """Non-blocking check if the port is reachable."""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(1.0)
            s.connect((self.host, self.port))
            s.close()
            return True
        except OSError:
            return False

    # ──────────────────────────────────────────────────────────
    # Command execution
    # ──────────────────────────────────────────────────────────
    def send_command(self, command: str, params: Optional[dict] = None) -> dict[str, Any]:
        """Send a command and return the parsed response. Thread-safe."""
        with self._lock:
            try:
                self._ensure_connected()
                self._counter += 1
                req = {
                    "id": str(self._counter),
                    "command": command,
                    "params": params or {},
                }
                payload = json.dumps(req, ensure_ascii=False) + "\n"
                self._sock.sendall(payload.encode("utf-8"))
                return self._read_response()
            except (ConnectionRefusedError, ConnectionResetError, BrokenPipeError):
                self._sock = None
                raise
            except socket.timeout:
                self._sock = None
                raise TimeoutError(
                    f"[{self.label}] No response within {self.timeout}s for '{command}'"
                )

    def _read_response(self) -> dict[str, Any]:
        buf = ""
        while True:
            chunk = self._sock.recv(65536)
            if not chunk:
                raise ConnectionResetError(f"[{self.label}] Connection closed by remote")
            buf += chunk.decode("utf-8")
            if "\n" in buf:
                line, _ = buf.split("\n", 1)
                return json.loads(line.strip())

    # ──────────────────────────────────────────────────────────
    # Helpers
    # ──────────────────────────────────────────────────────────
    def ping(self) -> bool:
        try:
            r = self.send_command("ping")
            return r.get("success", False)
        except Exception:
            return False

    def wait_until_ready(self, max_wait: float = 30.0, interval: float = 1.0) -> bool:
        deadline = time.time() + max_wait
        while time.time() < deadline:
            if self.ping():
                return True
            time.sleep(interval)
        return False


# ─────────────────────────────────────────────────────────────
# Singletons used by server.py
# ─────────────────────────────────────────────────────────────
godot         = GodotClient(port=9500, label="Editor")      # Editor bridge
godot_runtime = GodotClient(port=9501, label="Runtime")     # Running game
