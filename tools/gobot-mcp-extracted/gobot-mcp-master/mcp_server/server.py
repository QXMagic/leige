"""
Godot MCP Server — Full Edition
================================
Connects AI assistants (Cursor, Claude) to Godot 4 editor + running game.

Editor tools  (port 9500): scene, node, script, animation, 3D, physics,
                            audio, shader, particles, navigation, batch ops…
Runtime tools (port 9501): input simulation, live scene, screenshots, testing

Run:  python server.py
"""

import json
from typing import Optional
from mcp.server.fastmcp import FastMCP
from godot_client import godot, godot_runtime

mcp = FastMCP(
    "Godot MCP",
    instructions="Full Godot 4 editor + game runtime control for AI assistants.",
)

# ─────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────
def _e(command: str, params: Optional[dict] = None) -> str:
    """Send to Editor (port 9500) → return JSON string."""
    try:
        r = godot.send_command(command, params)
        if not r.get("success", True):
            raise RuntimeError(r.get("error", "Godot error"))
        data = r.get("result", r)
        if "error" in data:
            raise RuntimeError(data["error"])
        return json.dumps(data, ensure_ascii=False, indent=2)
    except ConnectionRefusedError as ex:
        raise RuntimeError(str(ex))
    except TimeoutError as ex:
        raise RuntimeError(str(ex))


def _r(command: str, params: Optional[dict] = None) -> str:
    """Send to Runtime (port 9501) → return JSON string."""
    if not godot_runtime.is_available():
        raise RuntimeError(
            "Game is not running. Press F5 in Godot first, then retry."
        )
    try:
        r = godot_runtime.send_command(command, params)
        if not r.get("success", True):
            raise RuntimeError(r.get("error", "Runtime error"))
        data = r.get("result", r)
        if "error" in data:
            raise RuntimeError(data["error"])
        return json.dumps(data, ensure_ascii=False, indent=2)
    except ConnectionRefusedError as ex:
        raise RuntimeError(str(ex))
    except TimeoutError as ex:
        raise RuntimeError(str(ex))


# ═══════════════════════════════════════════════════════════════
# ── META ────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def ping() -> str:
    """Test connection to the Godot editor plugin. Returns version info."""
    return _e("ping")


@mcp.tool()
def ping_runtime() -> str:
    """Test connection to the running game (port 9501). Returns runtime info."""
    return _r("ping")


# ═══════════════════════════════════════════════════════════════
# ── PROJECT ─────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def get_project_info() -> str:
    """Get Godot project name, version, main scene, project path, and engine version."""
    return _e("get_project_info")


@mcp.tool()
def get_filesystem_tree(path: str = "res://", max_depth: int = 3) -> str:
    """List the project file system as a tree.

    Args:
        path: Starting directory (default res://)
        max_depth: How many levels deep to recurse (default 3)
    """
    return _e("get_filesystem_tree", {"path": path, "max_depth": max_depth})


@mcp.tool()
def search_files(pattern: str = "", ext: str = "") -> str:
    """Search project files by name pattern or extension.

    Args:
        pattern: Filename substring (case-insensitive, e.g. "player")
        ext: Extension without dot (e.g. "gd", "tscn", "png")
    """
    return _e("search_files", {"pattern": pattern, "ext": ext})


@mcp.tool()
def get_project_setting(key: str) -> str:
    """Read a ProjectSettings value.

    Args:
        key: Setting key (e.g. "application/run/main_scene")
    """
    return _e("get_project_setting", {"key": key})


@mcp.tool()
def set_project_setting(key: str, value) -> str:
    """Write a ProjectSettings value and save.

    Args:
        key: Setting key (e.g. "physics/2d/gravity")
        value: New value
    """
    return _e("set_project_setting", {"key": key, "value": value})


# ═══════════════════════════════════════════════════════════════
# ── SCENE ───────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def get_scene_tree() -> str:
    """Get the full node hierarchy of the currently open editor scene."""
    return _e("get_scene_tree")


@mcp.tool()
def get_open_scenes() -> str:
    """List all scenes currently open in editor tabs."""
    return _e("get_open_scenes")


@mcp.tool()
def open_scene(path: str) -> str:
    """Open a scene file in the editor.

    Args:
        path: Path to .tscn (e.g. "res://scenes/main.tscn")
    """
    return _e("open_scene", {"path": path})


@mcp.tool()
def save_scene() -> str:
    """Save the currently active scene."""
    return _e("save_scene")


@mcp.tool()
def create_scene(path: str, root_type: str = "Node2D", root_name: str = "") -> str:
    """Create a new scene file with a root node.

    Args:
        path: Save path (e.g. "res://scenes/game.tscn")
        root_type: Node class for the root (e.g. "Node2D", "Node3D", "Control", "CharacterBody2D")
        root_name: Name for the root node (defaults to root_type)
    """
    return _e("create_scene", {"path": path, "root_type": root_type, "root_name": root_name or root_type})


@mcp.tool()
def play_scene(path: str = "") -> str:
    """Play a scene. Leave path empty to play the current scene.

    Args:
        path: Scene to play (e.g. "res://game.tscn"), or "" for current scene
    """
    return _e("play_scene", {"path": path})


@mcp.tool()
def stop_scene() -> str:
    """Stop the currently running game."""
    return _e("stop_scene")


@mcp.tool()
def add_scene_instance(scene_path: str, parent_path: str = "", name: str = "") -> str:
    """Instance a PackedScene (.tscn) into the current scene.

    Args:
        scene_path: Path to the .tscn to instance (e.g. "res://prefabs/enemy.tscn")
        parent_path: Parent node path in current scene (empty = root)
        name: Override instance name
    """
    return _e("add_scene_instance", {"scene_path": scene_path, "parent_path": parent_path, "name": name})


@mcp.tool()
def get_scene_file_content(path: str) -> str:
    """Read the raw text content of a .tscn file.

    Args:
        path: Path to the scene file
    """
    return _e("get_scene_file_content", {"path": path})


# ═══════════════════════════════════════════════════════════════
# ── NODE ────────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def add_node(node_type: str, parent_path: str = "", node_name: str = "") -> str:
    """Add a new node to the current scene.

    Args:
        node_type: Godot class name (e.g. "Sprite2D", "CharacterBody2D", "Label", "MeshInstance3D")
        parent_path: Parent node path (empty = scene root)
        node_name: Name for the new node
    """
    return _e("add_node", {"type": node_type, "parent_path": parent_path, "name": node_name})


@mcp.tool()
def delete_node(path: str) -> str:
    """Delete a node and all its children from the current scene.

    Args:
        path: Scene-relative path (e.g. "Player" or "UI/Button")
    """
    return _e("delete_node", {"path": path})


@mcp.tool()
def rename_node(path: str, name: str) -> str:
    """Rename a node in the current scene.

    Args:
        path: Current node path
        name: New name
    """
    return _e("rename_node", {"path": path, "name": name})


@mcp.tool()
def get_node_properties(path: str) -> str:
    """Get all editor-visible properties of a node with their current values.

    Args:
        path: Scene-relative node path (empty = root)
    """
    return _e("get_node_properties", {"path": path})


@mcp.tool()
def set_node_property(path: str, property: str, value) -> str:
    """Set a property on a node. Handles type conversion automatically.

    Args:
        path: Scene-relative node path
        property: Property name (e.g. "position", "text", "visible", "speed")
        value: New value. Primitives work directly. For Godot types use:
               Vector2: {"_t":"V2","x":100,"y":200}
               Vector3: {"_t":"V3","x":0,"y":1,"z":0}
               Color:   {"_t":"Color","r":1,"g":0,"b":0,"a":1}
               Or arrays: [100, 200] auto-converts to Vector2
    """
    return _e("set_node_property", {"path": path, "property": property, "value": value})


@mcp.tool()
def move_node(path: str, new_parent: str) -> str:
    """Reparent a node to a new parent.

    Args:
        path: Node to move
        new_parent: New parent path (empty = scene root)
    """
    return _e("move_node", {"path": path, "new_parent": new_parent})


@mcp.tool()
def duplicate_node(path: str, name: str = "") -> str:
    """Duplicate a node (deep copy including children).

    Args:
        path: Node to duplicate
        name: Name for the copy (defaults to original_name + "_copy")
    """
    return _e("duplicate_node", {"path": path, "name": name})


@mcp.tool()
def get_node_signals(path: str) -> str:
    """List all signals on a node and their current connections.

    Args:
        path: Scene-relative node path
    """
    return _e("get_node_signals", {"path": path})


@mcp.tool()
def connect_signal(source_path: str, signal: str, target_path: str, method: str) -> str:
    """Connect a signal from one node to a method on another.

    Args:
        source_path: Signal emitter node (e.g. "UI/Button")
        signal: Signal name (e.g. "pressed", "body_entered")
        target_path: Receiver node (e.g. "Player")
        method: Method name on receiver (e.g. "_on_button_pressed")
    """
    return _e("connect_signal", {"source_path": source_path, "signal": signal,
                                  "target_path": target_path, "method": method})


@mcp.tool()
def set_node_group(path: str, group: str, add: bool = True) -> str:
    """Add or remove a node from a group.

    Args:
        path: Node path
        group: Group name (e.g. "enemies", "collectibles")
        add: True to add, False to remove
    """
    return _e("set_node_group", {"path": path, "group": group, "add": add})


@mcp.tool()
def get_nodes_in_group(group: str) -> str:
    """Get all nodes in the current scene that belong to a group.

    Args:
        group: Group name to search
    """
    return _e("get_nodes_in_group", {"group": group})


# ═══════════════════════════════════════════════════════════════
# ── SCRIPT ──────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def create_script(path: str, extends: str = "Node", content: str = "") -> str:
    """Create a new GDScript file.

    Args:
        path: File path (e.g. "res://player.gd")
        extends: Class to extend (e.g. "CharacterBody2D", "Node2D")
        content: Full script content (generates minimal template if empty)
    """
    return _e("create_script", {"path": path, "extends": extends, "content": content})


@mcp.tool()
def read_script(path: str) -> str:
    """Read the full content of a GDScript file.

    Args:
        path: Path to the .gd file
    """
    return _e("read_script", {"path": path})


@mcp.tool()
def edit_script(path: str, content: str = "", search: str = "", replace: str = "") -> str:
    """Edit a GDScript file.
    Mode 1 — Full replace: provide 'content'.
    Mode 2 — Search & replace: provide 'search' and 'replace'.

    Args:
        path: Path to the .gd file
        content: New full file content (full replace mode)
        search: String to find (search & replace mode)
        replace: Replacement string (search & replace mode)
    """
    params: dict = {"path": path}
    if content:
        params["content"] = content
    else:
        params["search"] = search
        params["replace"] = replace
    return _e("edit_script", params)


@mcp.tool()
def attach_script(node_path: str, script_path: str) -> str:
    """Attach an existing GDScript to a node.

    Args:
        node_path: Scene-relative node path
        script_path: Path to the .gd file
    """
    return _e("attach_script", {"node_path": node_path, "script_path": script_path})


@mcp.tool()
def list_scripts() -> str:
    """List all .gd script files in the project."""
    return _e("list_scripts")


@mcp.tool()
def get_editor_errors() -> str:
    """Check all GDScript files for compile errors. Returns list of errors found."""
    return _e("get_editor_errors")


# ═══════════════════════════════════════════════════════════════
# ── ANIMATION ───────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def list_animations(node_path: str) -> str:
    """List all animations in an AnimationPlayer node.

    Args:
        node_path: Path to the AnimationPlayer node (or its parent)
    """
    return _e("list_animations", {"node_path": node_path})


@mcp.tool()
def create_animation(node_path: str, name: str, length: float = 1.0) -> str:
    """Create a new animation in an AnimationPlayer.

    Args:
        node_path: Path to AnimationPlayer
        name: Animation name (e.g. "idle", "walk", "jump")
        length: Duration in seconds
    """
    return _e("create_animation", {"node_path": node_path, "name": name, "length": length})


@mcp.tool()
def get_animation_info(node_path: str, animation: str) -> str:
    """Get tracks and keyframes for an animation.

    Args:
        node_path: Path to AnimationPlayer
        animation: Animation name
    """
    return _e("get_animation_info", {"node_path": node_path, "animation": animation})


@mcp.tool()
def add_animation_track(node_path: str, animation: str, target_path: str,
                         track_type: str = "value") -> str:
    """Add a track to an animation.

    Args:
        node_path: Path to AnimationPlayer
        animation: Animation name
        target_path: Node path and property (e.g. "Player:position")
        track_type: "value", "position", "rotation", "scale", "method"
    """
    return _e("add_animation_track", {"node_path": node_path, "animation": animation,
                                       "target_path": target_path, "track_type": track_type})


@mcp.tool()
def set_animation_keyframe(node_path: str, animation: str, track_index: int,
                            time: float, value) -> str:
    """Insert a keyframe into an animation track.

    Args:
        node_path: Path to AnimationPlayer
        animation: Animation name
        track_index: Track index (from add_animation_track)
        time: Time in seconds
        value: Keyframe value (number, Vector2 dict, etc.)
    """
    return _e("set_animation_keyframe", {"node_path": node_path, "animation": animation,
                                          "track_index": track_index, "time": time, "value": value})


@mcp.tool()
def remove_animation(node_path: str, animation: str) -> str:
    """Remove an animation from an AnimationPlayer.

    Args:
        node_path: Path to AnimationPlayer
        animation: Animation name to remove
    """
    return _e("remove_animation", {"node_path": node_path, "animation": animation})


# ═══════════════════════════════════════════════════════════════
# ── ANIMATION TREE ──────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def create_animation_tree(parent_path: str = "", name: str = "AnimationTree") -> str:
    """Create an AnimationTree node with a StateMachine root.

    Args:
        parent_path: Parent node path (empty = scene root)
        name: Node name
    """
    return _e("create_animation_tree", {"parent_path": parent_path, "name": name})


@mcp.tool()
def get_animation_tree_structure(node_path: str) -> str:
    """Get the structure of an AnimationTree (states, transitions, parameters).

    Args:
        node_path: Path to the AnimationTree node
    """
    return _e("get_animation_tree_structure", {"node_path": node_path})


@mcp.tool()
def add_state_machine_state(node_path: str, state_name: str, animation: str = "") -> str:
    """Add a state to an AnimationTree StateMachine.

    Args:
        node_path: Path to AnimationTree
        state_name: State name (e.g. "Idle", "Walk", "Jump")
        animation: Animation clip to play in this state (optional)
    """
    return _e("add_state_machine_state", {"node_path": node_path, "state_name": state_name, "animation": animation})


@mcp.tool()
def add_state_machine_transition(node_path: str, from_state: str, to_state: str) -> str:
    """Add a transition between two states in a StateMachine.

    Args:
        node_path: Path to AnimationTree
        from_state: Source state name
        to_state: Destination state name
    """
    return _e("add_state_machine_transition", {"node_path": node_path, "from": from_state, "to": to_state})


@mcp.tool()
def set_tree_parameter(node_path: str, param: str, value) -> str:
    """Set an AnimationTree parameter (e.g. blend amount, condition).

    Args:
        node_path: Path to AnimationTree
        param: Parameter name (e.g. "StateMachine/conditions/is_running")
        value: New value
    """
    return _e("set_tree_parameter", {"node_path": node_path, "param": param, "value": value})


# ═══════════════════════════════════════════════════════════════
# ── TILEMAP ─────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def tilemap_set_cell(node_path: str, x: int, y: int, source_id: int = 0,
                     atlas_x: int = 0, atlas_y: int = 0, layer: int = 0) -> str:
    """Place a tile in a TileMap.

    Args:
        node_path: Path to TileMap node
        x, y: Cell coordinates
        source_id: TileSet source ID
        atlas_x, atlas_y: Atlas coordinates
        layer: TileMap layer index
    """
    return _e("tilemap_set_cell", {"node_path": node_path, "x": x, "y": y,
                                    "source_id": source_id, "atlas_x": atlas_x, "atlas_y": atlas_y, "layer": layer})


@mcp.tool()
def tilemap_fill_rect(node_path: str, x: int, y: int, x2: int, y2: int,
                      source_id: int = 0, atlas_x: int = 0, atlas_y: int = 0, layer: int = 0) -> str:
    """Fill a rectangular region of a TileMap with a tile.

    Args:
        node_path: Path to TileMap
        x, y: Top-left corner
        x2, y2: Bottom-right corner
        source_id, atlas_x, atlas_y: Tile to use
        layer: TileMap layer
    """
    return _e("tilemap_fill_rect", {"node_path": node_path, "x": x, "y": y, "x2": x2, "y2": y2,
                                     "source_id": source_id, "atlas_x": atlas_x, "atlas_y": atlas_y, "layer": layer})


@mcp.tool()
def tilemap_clear(node_path: str, layer: int = -1) -> str:
    """Clear a TileMap (all layers or a specific layer).

    Args:
        node_path: Path to TileMap
        layer: Layer to clear (-1 means all layers)
    """
    params: dict = {"node_path": node_path}
    if layer >= 0:
        params["layer"] = layer
    return _e("tilemap_clear", params)


@mcp.tool()
def tilemap_get_info(node_path: str) -> str:
    """Get info about a TileMap (layer count, cell counts, tileset path).

    Args:
        node_path: Path to TileMap
    """
    return _e("tilemap_get_info", {"node_path": node_path})


@mcp.tool()
def tilemap_get_used_cells(node_path: str, layer: int = 0) -> str:
    """Get all occupied cell coordinates in a TileMap layer.

    Args:
        node_path: Path to TileMap
        layer: Layer index
    """
    return _e("tilemap_get_used_cells", {"node_path": node_path, "layer": layer})


# ═══════════════════════════════════════════════════════════════
# ── 3D SCENE ────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def add_mesh_instance(mesh_type: str = "BoxMesh", parent_path: str = "",
                      name: str = "", size: list = None) -> str:
    """Add a 3D mesh to the scene.

    Args:
        mesh_type: "BoxMesh", "SphereMesh", "CylinderMesh", "CapsuleMesh", "PlaneMesh", "TorusMesh"
        parent_path: Parent node path
        name: Node name
        size: [x, y, z] size for BoxMesh
    """
    return _e("add_mesh_instance", {"mesh_type": mesh_type, "parent_path": parent_path,
                                     "name": name, "size": size})


@mcp.tool()
def setup_lighting(light_type: str = "DirectionalLight3D", parent_path: str = "",
                   name: str = "", energy: float = 1.0, preset: str = "") -> str:
    """Add a 3D light to the scene.

    Args:
        light_type: "DirectionalLight3D", "OmniLight3D", "SpotLight3D"
        parent_path: Parent node path
        name: Node name
        energy: Light intensity
        preset: "dramatic", "indoor", or "" for default (DirectionalLight only)
    """
    return _e("setup_lighting", {"light_type": light_type, "parent_path": parent_path,
                                  "name": name, "energy": energy, "preset": preset})


@mcp.tool()
def set_material_3d(node_path: str, albedo_color: str = "#ffffff",
                    metallic: float = 0.0, roughness: float = 1.0,
                    emission: str = "", transparent: bool = False) -> str:
    """Apply a StandardMaterial3D to a MeshInstance3D.

    Args:
        node_path: Path to MeshInstance3D
        albedo_color: Base color as hex string (e.g. "#ff0000") or Color dict
        metallic: 0.0–1.0
        roughness: 0.0–1.0
        emission: Emission color hex (e.g. "#ffff00"), or "" to disable
        transparent: Enable alpha transparency
    """
    params: dict = {"node_path": node_path, "metallic": metallic,
                    "roughness": roughness, "transparent": transparent}
    if albedo_color:
        params["albedo_color"] = albedo_color
    if emission:
        params["emission"] = emission
    return _e("set_material_3d", params)


@mcp.tool()
def setup_environment(parent_path: str = "", name: str = "WorldEnvironment",
                      background: str = "sky", fog: bool = False,
                      fog_density: float = 0.01, glow: bool = False, ssao: bool = False) -> str:
    """Add a WorldEnvironment node.

    Args:
        parent_path: Parent node path
        name: Node name
        background: "sky" or "color"
        fog: Enable volumetric fog
        fog_density: Fog density (if fog=True)
        glow: Enable glow effect
        ssao: Enable ambient occlusion
    """
    return _e("setup_environment", {"parent_path": parent_path, "name": name,
                                     "background": background, "fog": fog,
                                     "fog_density": fog_density, "glow": glow, "ssao": ssao})


@mcp.tool()
def setup_camera_3d(parent_path: str = "", name: str = "Camera3D",
                    fov: float = 75.0, near: float = 0.05, far: float = 4000.0,
                    make_current: bool = True) -> str:
    """Add a Camera3D node.

    Args:
        parent_path: Parent node path
        name: Node name
        fov: Field of view in degrees
        near: Near clip distance
        far: Far clip distance
        make_current: Set as the active camera
    """
    return _e("setup_camera_3d", {"parent_path": parent_path, "name": name,
                                   "fov": fov, "near": near, "far": far, "make_current": make_current})


@mcp.tool()
def add_gridmap(parent_path: str = "", name: str = "GridMap", cell_size: float = 1.0) -> str:
    """Add a GridMap node for 3D tile-based levels.

    Args:
        parent_path: Parent node path
        name: Node name
        cell_size: Size of each grid cell
    """
    return _e("add_gridmap", {"parent_path": parent_path, "name": name, "cell_size": cell_size})


# ═══════════════════════════════════════════════════════════════
# ── PHYSICS ─────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def setup_collision(parent_path: str, shape: str = "rectangle",
                    is_3d: bool = False, size: list = None) -> str:
    """Add a CollisionShape2D or CollisionShape3D to a node.

    Args:
        parent_path: Node to add the collision shape to
        shape: "rectangle"/"circle"/"capsule" (2D) or "box"/"sphere"/"capsule"/"cylinder" (3D)
        is_3d: Use 3D collision shape
        size: [w, h] for rectangle, or radius for circle
    """
    return _e("setup_collision", {"parent_path": parent_path, "shape": shape,
                                   "is_3d": is_3d, "size": size})


@mcp.tool()
def add_raycast(parent_path: str, name: str = "", length: float = 100.0, is_3d: bool = False) -> str:
    """Add a RayCast2D or RayCast3D node.

    Args:
        parent_path: Parent node path
        name: Node name
        length: Ray length
        is_3d: Use 3D raycast (downward by default)
    """
    return _e("add_raycast", {"parent_path": parent_path, "name": name,
                               "length": length, "is_3d": is_3d})


@mcp.tool()
def setup_physics_body(node_path: str, floor_snap_length: float = None,
                       floor_max_angle: float = None, gravity_scale: float = None,
                       mass: float = None) -> str:
    """Configure a physics body node (CharacterBody2D, RigidBody2D, RigidBody3D).

    Args:
        node_path: Path to the physics body node
        floor_snap_length: Snap-to-floor distance (CharacterBody2D)
        floor_max_angle: Max walkable slope angle in degrees (CharacterBody2D)
        gravity_scale: Gravity multiplier (RigidBody)
        mass: Body mass in kg (RigidBody)
    """
    params: dict = {"node_path": node_path}
    if floor_snap_length is not None: params["floor_snap_length"] = floor_snap_length
    if floor_max_angle is not None:   params["floor_max_angle"] = floor_max_angle
    if gravity_scale is not None:     params["gravity_scale"] = gravity_scale
    if mass is not None:              params["mass"] = mass
    return _e("setup_physics_body", params)


@mcp.tool()
def set_physics_layers(node_path: str, collision_layer: int = None, collision_mask: int = None) -> str:
    """Set collision layer and mask bitmasks on a physics node.

    Args:
        node_path: Node path
        collision_layer: Bitmask for what layer this body is on
        collision_mask: Bitmask for what layers this body detects
    """
    params: dict = {"node_path": node_path}
    if collision_layer is not None: params["collision_layer"] = collision_layer
    if collision_mask is not None:  params["collision_mask"] = collision_mask
    return _e("set_physics_layers", params)


@mcp.tool()
def get_collision_info(node_path: str) -> str:
    """Inspect collision configuration of a physics node (layers, masks, shapes).

    Args:
        node_path: Node path
    """
    return _e("get_collision_info", {"node_path": node_path})


# ═══════════════════════════════════════════════════════════════
# ── PARTICLES ───────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def create_particles(parent_path: str = "", name: str = "Particles",
                     is_3d: bool = False, amount: int = 100,
                     lifetime: float = 2.0, preset: str = "") -> str:
    """Create a GPU particle system.

    Args:
        parent_path: Parent node path
        name: Node name
        is_3d: Use GPUParticles3D instead of GPUParticles2D
        amount: Number of particles
        lifetime: Particle lifetime in seconds
        preset: Built-in preset: "fire", "smoke", "rain", "snow", "sparks"
    """
    return _e("create_particles", {"parent_path": parent_path, "name": name, "is_3d": is_3d,
                                    "amount": amount, "lifetime": lifetime, "preset": preset})


@mcp.tool()
def apply_particle_preset(node_path: str, preset: str) -> str:
    """Apply a built-in visual preset to an existing particle system.

    Args:
        node_path: Path to GPUParticles2D or GPUParticles3D
        preset: "fire", "smoke", "rain", "snow", "sparks"
    """
    return _e("apply_particle_preset", {"node_path": node_path, "preset": preset})


@mcp.tool()
def set_particle_color_gradient(node_path: str, colors: list) -> str:
    """Set the color gradient of a particle system.

    Args:
        node_path: Path to particle node
        colors: List of color hex strings or Color dicts (e.g. ["#ff6600", "#ff0000", "#ff000000"])
    """
    return _e("set_particle_color_gradient", {"node_path": node_path, "colors": colors})


# ═══════════════════════════════════════════════════════════════
# ── NAVIGATION ──────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def setup_navigation_region(parent_path: str = "", name: str = "", is_3d: bool = False) -> str:
    """Add a NavigationRegion2D or NavigationRegion3D.

    Args:
        parent_path: Parent node path
        name: Node name
        is_3d: Use 3D navigation region
    """
    return _e("setup_navigation_region", {"parent_path": parent_path, "name": name, "is_3d": is_3d})


@mcp.tool()
def bake_navigation_mesh(node_path: str) -> str:
    """Bake the navigation polygon/mesh for a NavigationRegion.

    Args:
        node_path: Path to NavigationRegion2D or NavigationRegion3D
    """
    return _e("bake_navigation_mesh", {"node_path": node_path})


@mcp.tool()
def setup_navigation_agent(parent_path: str, name: str = "", is_3d: bool = False,
                            avoidance: bool = True) -> str:
    """Add a NavigationAgent2D or NavigationAgent3D for pathfinding.

    Args:
        parent_path: Parent node (usually the character body)
        name: Node name
        is_3d: Use 3D agent
        avoidance: Enable avoidance
    """
    return _e("setup_navigation_agent", {"parent_path": parent_path, "name": name,
                                          "is_3d": is_3d, "avoidance": avoidance})


# ═══════════════════════════════════════════════════════════════
# ── AUDIO ───────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def add_audio_player(parent_path: str = "", name: str = "AudioPlayer",
                     mode: str = "2d", bus: str = "Master") -> str:
    """Add an audio player node.

    Args:
        parent_path: Parent node path
        name: Node name
        mode: "2d" (AudioStreamPlayer2D), "3d" (AudioStreamPlayer3D), or "global" (AudioStreamPlayer)
        bus: Audio bus name (e.g. "Master", "Music", "SFX")
    """
    return _e("add_audio_player", {"parent_path": parent_path, "name": name, "mode": mode, "bus": bus})


@mcp.tool()
def add_audio_bus(name: str, volume_db: float = 0.0) -> str:
    """Create a new audio bus.

    Args:
        name: Bus name (e.g. "Music", "SFX", "Reverb")
        volume_db: Initial volume in decibels
    """
    return _e("add_audio_bus", {"name": name, "volume_db": volume_db})


@mcp.tool()
def add_audio_bus_effect(bus_index: int, effect: str) -> str:
    """Add an effect to an audio bus.

    Args:
        bus_index: Bus index (0 = Master)
        effect: "reverb", "delay", "compressor", "limiter", "eq", "chorus", "distortion"
    """
    return _e("add_audio_bus_effect", {"bus_index": bus_index, "effect": effect})


@mcp.tool()
def get_audio_bus_layout() -> str:
    """Get the full audio bus layout (buses, volumes, effects)."""
    return _e("get_audio_bus_layout")


# ═══════════════════════════════════════════════════════════════
# ── THEME & UI ──────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def create_theme(path: str = "res://theme.tres") -> str:
    """Create a new Theme resource.

    Args:
        path: Save path for the theme (e.g. "res://ui/main_theme.tres")
    """
    return _e("create_theme", {"path": path})


@mcp.tool()
def set_theme_color(theme_path: str, control_type: str, name: str, color: str) -> str:
    """Set a color override in a Theme.

    Args:
        theme_path: Path to the .tres theme file
        control_type: Control class name (e.g. "Label", "Button")
        name: Color property name (e.g. "font_color", "font_shadow_color")
        color: Color as hex string (e.g. "#ffffff") or Color dict
    """
    return _e("set_theme_color", {"theme_path": theme_path, "control_type": control_type,
                                   "name": name, "color": color})


@mcp.tool()
def set_theme_font_size(theme_path: str, control_type: str, name: str = "font_size",
                        size: int = 16) -> str:
    """Set a font size override in a Theme.

    Args:
        theme_path: Path to the theme file
        control_type: Control class name
        name: Property name (usually "font_size")
        size: Font size in pixels
    """
    return _e("set_theme_font_size", {"theme_path": theme_path, "control_type": control_type,
                                       "name": name, "size": size})


@mcp.tool()
def set_theme_stylebox(theme_path: str, control_type: str, name: str = "panel",
                       bg_color: str = "#333333", border_color: str = "",
                       border_width: int = 0, corner_radius: int = 0,
                       content_margin: float = 0) -> str:
    """Set a StyleBoxFlat in a Theme.

    Args:
        theme_path: Path to the theme file
        control_type: Control class name (e.g. "PanelContainer", "Button")
        name: StyleBox slot name (e.g. "panel", "normal", "hover")
        bg_color: Background color hex
        border_color: Border color hex
        border_width: Border width in pixels
        corner_radius: Corner radius for rounded corners
        content_margin: Inner content padding
    """
    return _e("set_theme_stylebox", {"theme_path": theme_path, "control_type": control_type,
                                      "name": name, "bg_color": bg_color, "border_color": border_color,
                                      "border_width": border_width, "corner_radius": corner_radius,
                                      "content_margin": content_margin})


# ═══════════════════════════════════════════════════════════════
# ── SHADER ──────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def create_shader(path: str, shader_type: str = "canvas_item", content: str = "") -> str:
    """Create a new GDShader file.

    Args:
        path: Save path (e.g. "res://shaders/glow.gdshader")
        shader_type: "canvas_item" (2D), "spatial" (3D), "particles"
        content: Shader GLSL code (generates template if empty)
    """
    return _e("create_shader", {"path": path, "shader_type": shader_type, "content": content})


@mcp.tool()
def assign_shader_material(node_path: str, shader_path: str) -> str:
    """Assign a ShaderMaterial (with a specific shader) to a node.

    Args:
        node_path: Target node path
        shader_path: Path to the .gdshader file
    """
    return _e("assign_shader_material", {"node_path": node_path, "shader_path": shader_path})


@mcp.tool()
def set_shader_param(node_path: str, param: str, value) -> str:
    """Set a shader uniform parameter on a node.

    Args:
        node_path: Node with ShaderMaterial
        param: Uniform name in the shader
        value: New value
    """
    return _e("set_shader_param", {"node_path": node_path, "param": param, "value": value})


@mcp.tool()
def get_shader_params(node_path: str) -> str:
    """List all shader uniform parameters and their current values.

    Args:
        node_path: Node with ShaderMaterial
    """
    return _e("get_shader_params", {"node_path": node_path})


# ═══════════════════════════════════════════════════════════════
# ── RESOURCE ────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def create_resource(path: str, resource_type: str = "Resource") -> str:
    """Create a new .tres resource file.

    Args:
        path: Save path (e.g. "res://data/config.tres")
        resource_type: Resource class name (e.g. "Resource", "PhysicsMaterial")
    """
    return _e("create_resource", {"path": path, "type": resource_type})


@mcp.tool()
def read_resource(path: str) -> str:
    """Read properties of a .tres resource file.

    Args:
        path: Path to the resource
    """
    return _e("read_resource", {"path": path})


@mcp.tool()
def edit_resource(path: str, properties: dict) -> str:
    """Modify properties of a .tres resource file and save.

    Args:
        path: Path to the resource
        properties: Dict of {property_name: new_value}
    """
    return _e("edit_resource", {"path": path, "properties": properties})


# ═══════════════════════════════════════════════════════════════
# ── BATCH & REFACTORING ─────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def find_nodes_by_type(node_type: str, scene_path: str = "") -> str:
    """Find all nodes of a specific type in the current or a specified scene.

    Args:
        node_type: Godot class name to search for (e.g. "Sprite2D", "Label")
        scene_path: Scene file to search (empty = current open scene)
    """
    return _e("find_nodes_by_type", {"type": node_type, "scene_path": scene_path})


@mcp.tool()
def batch_set_property(node_paths: list, property: str, value) -> str:
    """Set the same property on multiple nodes at once.

    Args:
        node_paths: List of scene-relative node paths
        property: Property name
        value: Value to set on all nodes
    """
    return _e("batch_set_property", {"node_paths": node_paths, "property": property, "value": value})


@mcp.tool()
def find_signal_connections(signal: str = "") -> str:
    """Find all signal connections in the current scene.

    Args:
        signal: Filter by signal name (empty = all signals)
    """
    return _e("find_signal_connections", {"signal": signal})


@mcp.tool()
def find_node_references(name: str) -> str:
    """Search all project scripts for references to a node name or symbol.

    Args:
        name: Symbol or node name to search for
    """
    return _e("find_node_references", {"name": name})


@mcp.tool()
def get_scene_dependencies(scene_path: str) -> str:
    """List all external resources referenced by a scene.

    Args:
        scene_path: Path to the .tscn file
    """
    return _e("get_scene_dependencies", {"scene_path": scene_path})


@mcp.tool()
def cross_scene_set_property(node_type: str, property: str, value) -> str:
    """Set a property on all nodes of a given type across ALL project scenes.
    WARNING: This modifies and saves every .tscn file in the project.

    Args:
        node_type: Target node class (e.g. "CharacterBody2D")
        property: Property name
        value: New value
    """
    return _e("cross_scene_set_property", {"node_type": node_type, "property": property, "value": value})


# ═══════════════════════════════════════════════════════════════
# ── CODE ANALYSIS ───────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def get_project_statistics() -> str:
    """Get overview statistics: file counts by type, node count, scene depth."""
    return _e("get_project_statistics")


@mcp.tool()
def find_unused_resources() -> str:
    """Find asset files (images, audio, etc.) not referenced in any scene or script."""
    return _e("find_unused_resources")


@mcp.tool()
def analyze_scene_complexity(scene_path: str = "") -> str:
    """Analyze a scene's complexity: total nodes, max depth, scripts count.

    Args:
        scene_path: Scene to analyze (empty = current open scene)
    """
    return _e("analyze_scene_complexity", {"scene_path": scene_path})


@mcp.tool()
def find_script_references(symbol: str) -> str:
    """Search all GDScript files for a symbol (function, variable, class name).

    Args:
        symbol: Symbol name to search for
    """
    return _e("find_script_references", {"symbol": symbol})


@mcp.tool()
def detect_circular_dependencies() -> str:
    """Detect circular dependency chains in GDScript 'extends' relationships."""
    return _e("detect_circular_dependencies")


@mcp.tool()
def analyze_signal_flow() -> str:
    """Map all signal connections in the current scene as a flow graph."""
    return _e("analyze_signal_flow")


# ═══════════════════════════════════════════════════════════════
# ── PROFILING ───────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def get_performance_monitors() -> str:
    """Get real-time performance metrics: FPS, memory, object count, draw calls, physics."""
    return _e("get_performance_monitors")


@mcp.tool()
def get_editor_performance() -> str:
    """Get editor-level performance info: FPS, scene node count, physics ticks."""
    return _e("get_editor_performance")


# ═══════════════════════════════════════════════════════════════
# ── EXPORT ──────────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def list_export_presets() -> str:
    """List all export presets configured in export_presets.cfg."""
    return _e("list_export_presets")


@mcp.tool()
def export_project(preset: str, export_path: str = "") -> str:
    """Generate the CLI command to export the project with a given preset.
    (Returns the command to run — Godot export must be done from command line.)

    Args:
        preset: Export preset name (from list_export_presets)
        export_path: Output file path
    """
    return _e("export_project", {"preset": preset, "export_path": export_path})


# ═══════════════════════════════════════════════════════════════
# ── EDITOR UTILS ────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def set_main_scene(path: str) -> str:
    """Set the project main scene (runs when pressing F5).

    Args:
        path: Path to the .tscn file
    """
    return _e("set_main_scene", {"path": path})


@mcp.tool()
def get_editor_screenshot() -> str:
    """Take a screenshot of the current Godot editor screen. Returns base64 PNG."""
    return _e("get_editor_screenshot")


@mcp.tool()
def reload_project() -> str:
    """Rescan the project file system (use after external file changes)."""
    return _e("reload_project")


# ═══════════════════════════════════════════════════════════════
# ── RUNTIME: INPUT SIMULATION (requires game running) ───────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def simulate_key(key: str, pressed: bool = True, shift: bool = False,
                 ctrl: bool = False, alt: bool = False) -> str:
    """Simulate a keyboard key press/release in the running game.
    REQUIRES: game must be running (F5).

    Args:
        key: Key name (e.g. "W", "A", "S", "D", "Space", "Escape", "Return")
        pressed: True for press, False for release
        shift, ctrl, alt: Modifier keys
    """
    return _r("simulate_key", {"key": key, "pressed": pressed,
                                "shift": shift, "ctrl": ctrl, "alt": alt})


@mcp.tool()
def simulate_mouse_click(x: float, y: float, button: str = "left",
                         pressed: bool = True, auto_release: bool = True) -> str:
    """Simulate a mouse click in the running game.
    REQUIRES: game must be running (F5).

    Args:
        x, y: Screen coordinates
        button: "left", "right", or "middle"
        pressed: True for press, False for release
        auto_release: Automatically send the release event after press
    """
    return _r("simulate_mouse_click", {"x": x, "y": y, "button": button,
                                        "pressed": pressed, "auto_release": auto_release})


@mcp.tool()
def simulate_mouse_move(x: float, y: float, dx: float = 0, dy: float = 0) -> str:
    """Simulate mouse movement in the running game.
    REQUIRES: game must be running.

    Args:
        x, y: Target position
        dx, dy: Relative movement delta
    """
    return _r("simulate_mouse_move", {"x": x, "y": y, "dx": dx, "dy": dy})


@mcp.tool()
def simulate_action(action: str, pressed: bool = True, strength: float = 1.0) -> str:
    """Simulate a Godot InputMap action in the running game.
    REQUIRES: game must be running.

    Args:
        action: Action name from InputMap (e.g. "ui_accept", "jump", "move_left")
        pressed: True to press, False to release
        strength: Action strength 0.0–1.0
    """
    return _r("simulate_action", {"action": action, "pressed": pressed, "strength": strength})


@mcp.tool()
def simulate_sequence(events: list) -> str:
    """Execute a sequence of input events in the running game.
    REQUIRES: game must be running.

    Args:
        events: List of event dicts, each with a 'type' field:
                {"type": "key", "key": "W", "pressed": true}
                {"type": "mouse_click", "x": 100, "y": 200}
                {"type": "action", "action": "jump"}
                {"type": "wait", "seconds": 0.5}
    """
    return _r("simulate_sequence", {"events": events})


# ═══════════════════════════════════════════════════════════════
# ── RUNTIME: SCENE INSPECTION ───────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def get_game_scene_tree() -> str:
    """Get the live node hierarchy of the running game.
    REQUIRES: game must be running (F5).
    """
    return _r("get_game_scene_tree")


@mcp.tool()
def get_game_node_properties(path: str) -> str:
    """Read all properties of a node in the running game.
    REQUIRES: game must be running.

    Args:
        path: Node path relative to the game root (e.g. "Player" or "UI/HUD")
    """
    return _r("get_game_node_properties", {"path": path})


@mcp.tool()
def set_game_node_properties(path: str, properties: dict) -> str:
    """Modify properties of a node in the running game (live tweak).
    REQUIRES: game must be running.

    Args:
        path: Node path
        properties: Dict of {property: value} to set
    """
    return _r("set_game_node_properties", {"path": path, "properties": properties})


@mcp.tool()
def execute_game_script(code: str) -> str:
    """Execute GDScript code in the context of the running game.
    REQUIRES: game must be running.

    Args:
        code: GDScript code to run (can set result variable to return a value)
    """
    return _r("execute_game_script", {"code": code})


@mcp.tool()
def get_game_screenshot() -> str:
    """Take a screenshot of the running game viewport.
    REQUIRES: game must be running. Returns base64 PNG.
    """
    return _r("get_game_screenshot")


@mcp.tool()
def capture_frames(count: int = 3, interval: float = 0.5) -> str:
    """Capture multiple screenshots from the running game over time.
    REQUIRES: game must be running.

    Args:
        count: Number of frames to capture
        interval: Seconds between captures
    """
    return _r("capture_frames", {"count": count, "interval": interval})


@mcp.tool()
def find_ui_elements(text: str = "") -> str:
    """Find UI elements (Labels, Buttons, RichTextLabel) in the running game.
    REQUIRES: game must be running.

    Args:
        text: Filter by text content (empty = all UI text elements)
    """
    return _r("find_ui_elements", {"text": text})


@mcp.tool()
def click_button_by_text(text: str) -> str:
    """Click a Button node by its text label in the running game.
    REQUIRES: game must be running.

    Args:
        text: Text label of the button to click
    """
    return _r("click_button_by_text", {"text": text})


@mcp.tool()
def wait_for_node(path: str, timeout: float = 5.0) -> str:
    """Wait until a node appears in the running game scene tree.
    REQUIRES: game must be running.

    Args:
        path: Node path to wait for
        timeout: Max wait time in seconds
    """
    return _r("wait_for_node", {"path": path, "timeout": timeout})


@mcp.tool()
def find_nodes_by_script_runtime(script_path: str) -> str:
    """Find all nodes using a specific script in the running game.
    REQUIRES: game must be running.

    Args:
        script_path: Path to the .gd file (e.g. "res://player.gd")
    """
    return _r("find_nodes_by_script", {"script_path": script_path})


# ═══════════════════════════════════════════════════════════════
# ── RUNTIME: TESTING & QA ───────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def assert_node_state(path: str, properties: dict) -> str:
    """Assert that a node has expected property values. Returns pass/fail.
    REQUIRES: game must be running.

    Args:
        path: Node path
        properties: Dict of {property: expected_value}

    Example:
        assert_node_state("Player", {"position_x": 100, "health": 100})
    """
    return _r("assert_node_state", {"path": path, "properties": properties})


@mcp.tool()
def assert_screen_text(text: str) -> str:
    """Assert that specific text is visible on screen. Returns pass/fail.
    REQUIRES: game must be running.

    Args:
        text: Text to look for in any Label/Button/RichTextLabel
    """
    return _r("assert_screen_text", {"text": text})


@mcp.tool()
def run_test_scenario(steps: list, stop_on_failure: bool = False) -> str:
    """Run an automated test scenario (sequence of commands with assertions).
    REQUIRES: game must be running.

    Args:
        steps: List of {"command": "...", "params": {...}} steps
        stop_on_failure: Stop scenario on first failed assertion

    Example:
        run_test_scenario([
            {"command": "simulate_action", "params": {"action": "jump"}},
            {"command": "wait_for_node", "params": {"path": "Player", "timeout": 1}},
            {"command": "assert_node_state", "params": {"path": "Player", "properties": {"is_on_floor": false}}}
        ])
    """
    return _r("run_test_scenario", {"steps": steps, "stop_on_failure": stop_on_failure})


@mcp.tool()
def run_stress_test(duration: float = 3.0) -> str:
    """Stress test the running game with random keyboard and mouse input.
    REQUIRES: game must be running.

    Args:
        duration: How many seconds to run the stress test
    """
    return _r("run_stress_test", {"duration": duration})


@mcp.tool()
def get_test_report() -> str:
    """Get the accumulated test results from all assertions run in this session.
    REQUIRES: game must be running.
    """
    return _r("get_test_report")


@mcp.tool()
def monitor_properties(path: str, properties: list, duration: float = 1.0,
                       samples: int = 10) -> str:
    """Record property values over time in the running game.
    REQUIRES: game must be running.

    Args:
        path: Node path to monitor
        properties: List of property names (e.g. ["position", "velocity"])
        duration: Total monitoring duration in seconds
        samples: Number of samples to collect
    """
    return _r("monitor_properties", {"path": path, "properties": properties,
                                      "duration": duration, "samples": samples})


# ═══════════════════════════════════════════════════════════════
# ── NEW: PROJECT UID ────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def project_path_to_uid(path: str) -> str:
    """Convert a resource file path to its Godot UID.

    Args:
        path: Resource path (e.g. "res://scenes/player.tscn")

    Returns UID as both integer and "uid://xxxx" text format.
    """
    return _e("project_path_to_uid", {"path": path})


@mcp.tool()
def uid_to_project_path(uid: str) -> str:
    """Convert a Godot UID back to its resource file path.

    Args:
        uid: UID as integer string or "uid://xxxx" text (e.g. "uid://abc123" or "12345678")
    """
    return _e("uid_to_project_path", {"uid": uid})


# ═══════════════════════════════════════════════════════════════
# ── NEW: NODE ───────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def disconnect_signal(source_path: str, signal: str, target_path: str, method: str) -> str:
    """Disconnect an existing signal connection between two nodes.

    Args:
        source_path: Node that emits the signal
        signal: Signal name
        target_path: Node that receives the signal
        method: Connected method name on the target
    """
    return _e("disconnect_signal", {
        "source_path": source_path, "signal": signal,
        "target_path": target_path, "method": method,
    })


@mcp.tool()
def set_anchor_preset(path: str, preset: str = "full_rect") -> str:
    """Set the anchor preset of a UI Control node.

    Args:
        path: Path to the Control node
        preset: One of:
                "top_left", "top_right", "bottom_left", "bottom_right",
                "center_left", "center_right", "center_top", "center_bottom",
                "center", "left_wide", "right_wide", "top_wide", "bottom_wide",
                "vcenter_wide", "hcenter_wide", "full_rect"
    """
    return _e("set_anchor_preset", {"path": path, "preset": preset})


@mcp.tool()
def add_resource_to_node(path: str, property: str, resource_type: str,
                          properties: dict = None) -> str:
    """Create a Resource and assign it to a node property.

    Useful for adding shapes to CollisionShape2D, materials to MeshInstance3D, etc.

    Args:
        path: Node path
        property: Property name to set (e.g. "shape", "material_override")
        resource_type: Resource class to create (e.g. "CircleShape2D", "StandardMaterial3D")
        properties: Optional dict of initial property values on the resource
                    (e.g. {"radius": 32.0} for CircleShape2D)

    Examples:
        add_resource_to_node("Player/CollisionShape2D", "shape", "CircleShape2D", {"radius": 24})
        add_resource_to_node("Player", "material_override", "StandardMaterial3D", {"albedo_color": "#ff0000"})
    """
    return _e("add_resource_to_node", {
        "path": path, "property": property,
        "resource_type": resource_type,
        "properties": properties or {},
    })


# ═══════════════════════════════════════════════════════════════
# ── NEW: SCRIPT ─────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def get_open_scripts() -> str:
    """List all scripts currently open in the Godot script editor."""
    return _e("get_open_scripts")


# ═══════════════════════════════════════════════════════════════
# ── NEW: EDITOR ─────────────────────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def clear_editor_output() -> str:
    """Clear the Godot editor Output panel (prints a visual separator)."""
    return _e("clear_editor_output")


@mcp.tool()
def reload_plugin(name: str = "") -> str:
    """Reload a Godot editor plugin by disabling and re-enabling it.

    Args:
        name: Plugin folder name (e.g. "godot_mcp"). Leave empty to rescan filesystem.
    """
    return _e("reload_plugin", {"name": name})


@mcp.tool()
def execute_editor_script(code: str) -> str:
    """Execute arbitrary GDScript code in the editor context.

    The code runs as a @tool RefCounted script with access to EditorInterface.
    Set the 'result' variable to return a value.

    Args:
        code: GDScript code to execute (multi-line supported)

    Examples:
        execute_editor_script("result = EditorInterface.get_open_scenes()")
        execute_editor_script("EditorInterface.save_scene()\\nresult = 'saved'")
    """
    return _e("execute_editor_script", {"code": code})


@mcp.tool()
def compare_screenshots(mode: str = "compare", threshold: int = 10,
                         max_diff_percent: float = 5.0) -> str:
    """Compare the current editor screenshot against a saved reference.

    Two-step workflow:
    1. Call with mode='save_reference' to capture the baseline
    2. Make changes in the editor
    3. Call with mode='compare' to get the pixel difference

    Args:
        mode: "save_reference" to capture baseline, "compare" to diff against it
        threshold: Pixel color difference threshold (0-255, default 10)
        max_diff_percent: Max acceptable diff% to be considered "similar" (default 5%)

    Returns diff_percent and whether the screenshots are "similar".
    """
    return _e("compare_screenshots", {
        "mode": mode, "threshold": threshold, "max_diff_percent": max_diff_percent,
    })


# ═══════════════════════════════════════════════════════════════
# ── NEW: RUNTIME INPUT RECORDING ────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def start_recording() -> str:
    """Start recording all player input events in the running game.
    REQUIRES: game must be running (F5).

    Captures: keyboard, mouse clicks, mouse movement.
    Stop with stop_recording(), then replay with replay_recording().
    """
    return _r("start_recording")


@mcp.tool()
def stop_recording() -> str:
    """Stop the input recording session and return the captured events.
    REQUIRES: game must be running.

    Returns the full event list that can be passed back to replay_recording().
    """
    return _r("stop_recording")


@mcp.tool()
def replay_recording(events: list = None, speed: float = 1.0) -> str:
    """Replay a previously recorded input sequence in the running game.
    REQUIRES: game must be running.

    Args:
        events: Event list from stop_recording() — if omitted, uses the last recording
        speed: Playback speed multiplier (0.5 = half speed, 2.0 = double speed)

    Use case: Record a gameplay sequence once, then replay it for regression testing.
    """
    params: dict = {"speed": speed}
    if events is not None:
        params["events"] = events
    return _r("replay_recording", params)


# ═══════════════════════════════════════════════════════════════
# ── PREVIOUSLY MISSING: TileMap ────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def tilemap_get_cell(node_path: str, layer: int = 0, x: int = 0, y: int = 0) -> str:
    """Get the tile data at a specific cell in a TileMap.

    Args:
        node_path: Path to the TileMap node
        layer: TileMap layer index
        x: Cell X coordinate
        y: Cell Y coordinate
    """
    return _e("tilemap_get_cell", {"node_path": node_path, "layer": layer, "x": x, "y": y})


# ═══════════════════════════════════════════════════════════════
# ── PREVIOUSLY MISSING: Physics ────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def get_physics_layers(node_path: str) -> str:
    """Get the collision_layer and collision_mask bitmasks of a physics node.

    Args:
        node_path: Path to the physics body node
    """
    return _e("get_physics_layers", {"node_path": node_path})


# ═══════════════════════════════════════════════════════════════
# ── PREVIOUSLY MISSING: AnimationTree ──────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def remove_state_machine_state(node_path: str, state_name: str) -> str:
    """Remove a state from an AnimationNodeStateMachine.

    Args:
        node_path: Path to the AnimationTree node
        state_name: Name of the state to remove
    """
    return _e("remove_state_machine_state", {"node_path": node_path, "state_name": state_name})


@mcp.tool()
def remove_state_machine_transition(node_path: str, from_state: str, to_state: str) -> str:
    """Remove a transition between two states in an AnimationNodeStateMachine.

    Args:
        node_path: Path to the AnimationTree node
        from_state: Source state name
        to_state: Destination state name
    """
    return _e("remove_state_machine_transition", {
        "node_path": node_path, "from_state": from_state, "to_state": to_state,
    })


@mcp.tool()
def set_blend_tree_node(node_path: str, blend_node_name: str,
                         blend_node_type: str, position: list = None) -> str:
    """Add or configure a node inside an AnimationNodeBlendTree.

    Args:
        node_path: Path to the AnimationTree node
        blend_node_name: Name for the blend tree node
        blend_node_type: Type to create (e.g. "AnimationNodeAnimation", "AnimationNodeBlend2")
        position: Optional [x, y] position in the blend tree graph
    """
    return _e("set_blend_tree_node", {
        "node_path": node_path,
        "blend_node_name": blend_node_name,
        "blend_node_type": blend_node_type,
        "position": position or [0, 0],
    })


# ═══════════════════════════════════════════════════════════════
# ── PREVIOUSLY MISSING: Particles ──────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def set_particle_material(node_path: str, velocity_min: float = None, velocity_max: float = None,
                           spread: float = None, gravity: list = None, direction: list = None) -> str:
    """Configure the ParticleProcessMaterial on a GPUParticles2D/3D node.

    Args:
        node_path: Path to the particles node
        velocity_min: Minimum initial velocity
        velocity_max: Maximum initial velocity
        spread: Spread angle in degrees
        gravity: Gravity vector as [x, y, z]
        direction: Emission direction vector as [x, y, z]
    """
    params: dict = {"node_path": node_path}
    if velocity_min is not None: params["velocity_min"] = velocity_min
    if velocity_max is not None: params["velocity_max"] = velocity_max
    if spread       is not None: params["spread"] = spread
    if gravity      is not None: params["gravity"] = {"_t": "V3", "x": gravity[0], "y": gravity[1], "z": gravity[2]}
    if direction    is not None: params["direction"] = {"_t": "V3", "x": direction[0], "y": direction[1], "z": direction[2]}
    return _e("set_particle_material", params)


@mcp.tool()
def get_particle_info(node_path: str) -> str:
    """Get current configuration of a GPUParticles2D/3D node.

    Args:
        node_path: Path to the particles node
    """
    return _e("get_particle_info", {"node_path": node_path})


# ═══════════════════════════════════════════════════════════════
# ── PREVIOUSLY MISSING: Navigation ─────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def set_navigation_layers(node_path: str, layers: int = 1) -> str:
    """Set the navigation_layers bitmask on a NavigationRegion or NavigationAgent node.

    Args:
        node_path: Path to the navigation node
        layers: Bitmask value for navigation layers (default 1 = layer 1 only)
    """
    return _e("set_navigation_layers", {"node_path": node_path, "layers": layers})


@mcp.tool()
def get_navigation_info(node_path: str) -> str:
    """Get navigation configuration of a NavigationRegion or NavigationAgent node.

    Args:
        node_path: Path to the navigation node
    """
    return _e("get_navigation_info", {"node_path": node_path})


# ═══════════════════════════════════════════════════════════════
# ── PREVIOUSLY MISSING: Audio ───────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def set_audio_bus(node_path: str, bus_name: str) -> str:
    """Assign an AudioStreamPlayer/2D/3D node to a named audio bus.

    Args:
        node_path: Path to the AudioStreamPlayer node
        bus_name: Name of the target bus (e.g. "Master", "Music", "SFX")
    """
    return _e("set_audio_bus", {"node_path": node_path, "bus_name": bus_name})


@mcp.tool()
def get_audio_info(node_path: str) -> str:
    """Get the current audio configuration of an AudioStreamPlayer node.

    Args:
        node_path: Path to the AudioStreamPlayer node
    """
    return _e("get_audio_info", {"node_path": node_path})


# ═══════════════════════════════════════════════════════════════
# ── PREVIOUSLY MISSING: Theme ───────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def set_theme_constant(theme_path: str, constant_name: str, node_type: str,
                        value: int = 0) -> str:
    """Set an integer constant in a Theme resource.

    Args:
        theme_path: Resource path to the .theme file (e.g. "res://ui/theme.tres")
        constant_name: Name of the constant (e.g. "separation", "margin_left")
        node_type: Node type the constant applies to (e.g. "VBoxContainer", "Button")
        value: Integer value for the constant
    """
    return _e("set_theme_constant", {
        "theme_path": theme_path, "constant_name": constant_name,
        "node_type": node_type, "value": value,
    })


@mcp.tool()
def get_theme_info(theme_path: str) -> str:
    """Get all colors, constants, font sizes, and styleboxes defined in a Theme.

    Args:
        theme_path: Resource path to the .theme file
    """
    return _e("get_theme_info", {"theme_path": theme_path})


# ═══════════════════════════════════════════════════════════════
# ── PREVIOUSLY MISSING: Shader ──────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def read_shader(path: str) -> str:
    """Read the GLSL source code of a shader file.

    Args:
        path: Resource path to the .gdshader file (e.g. "res://shaders/glow.gdshader")
    """
    return _e("read_shader", {"path": path})


# ═══════════════════════════════════════════════════════════════
# ── PREVIOUSLY MISSING: Export ──────────────────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def get_export_info() -> str:
    """Get detailed information about all export presets, including all config keys."""
    return _e("get_export_info")


# ═══════════════════════════════════════════════════════════════
# ── PREVIOUSLY MISSING: Runtime Utilities ───────────────────────
# ═══════════════════════════════════════════════════════════════

@mcp.tool()
def batch_get_properties_runtime(requests: list) -> str:
    """Get multiple properties from multiple nodes in the running game in one call.
    REQUIRES: game must be running (F5).

    Args:
        requests: List of dicts, each with:
                  - path: node path in the running game
                  - properties: list of property names to read

    Example:
        batch_get_properties_runtime([
            {"path": "Player", "properties": ["position", "health"]},
            {"path": "Enemy", "properties": ["position"]}
        ])
    """
    return _r("batch_get_properties", {"requests": requests})


@mcp.tool()
def get_autoload(name: str = "") -> str:
    """Get information about autoload singletons in the running game.
    REQUIRES: game must be running (F5).

    Args:
        name: Specific autoload name to get. Leave empty to list all autoloads.
    """
    return _r("get_autoload", {"name": name})


# ─────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    mcp.run()
