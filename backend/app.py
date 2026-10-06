from __future__ import annotations

import hashlib
import os
import secrets
import sqlite3
from datetime import datetime, timezone
from functools import wraps
from pathlib import Path
from typing import Any, Callable

from flask import Flask, g, jsonify, request
from flask_cors import CORS

ROOT = Path(__file__).resolve().parent
DATABASE = Path(os.getenv("TOCA_DATABASE", ROOT / "toca.db"))
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": os.getenv("TOCA_CORS_ORIGIN", "http://localhost:5173")}})

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    system TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT '',
    level TEXT NOT NULL DEFAULT 'Nível 1',
    visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
    data_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    system TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS character_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    event TEXT NOT NULL,
    created_at TEXT NOT NULL
);
"""


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def db() -> sqlite3.Connection:
    if "db" not in g:
        DATABASE.parent.mkdir(parents=True, exist_ok=True)
        connection = sqlite3.connect(DATABASE)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        g.db = connection
    return g.db


@app.teardown_appcontext
def close_db(_: BaseException | None) -> None:
    connection = g.pop("db", None)
    if connection is not None:
        connection.close()


def init_db() -> None:
    connection = sqlite3.connect(DATABASE)
    connection.executescript(SCHEMA)
    connection.commit()
    connection.close()


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return f"{salt.hex()}:{digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    salt_hex, digest_hex = stored.split(":", 1)
    salt = bytes.fromhex(salt_hex)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return secrets.compare_digest(digest.hex(), digest_hex)


def user_payload(row: sqlite3.Row) -> dict[str, Any]:
    return {"id": row["id"], "email": row["email"], "displayName": row["display_name"]}


def character_payload(row: sqlite3.Row) -> dict[str, Any]:
    import json

    return {
        "id": row["id"],
        "name": row["name"],
        "system": row["system"],
        "role": row["role"],
        "level": row["level"],
        "visibility": row["visibility"],
        "data": json.loads(row["data_json"]),
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def require_auth(handler: Callable[..., Any]) -> Callable[..., Any]:
    @wraps(handler)
    def wrapped(*args: Any, **kwargs: Any) -> Any:
        token = request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
        row = db().execute("SELECT user_id FROM sessions WHERE token = ?", (token,)).fetchone()
        if not row:
            return jsonify({"error": "Autenticação necessária."}), 401
        g.user_id = row["user_id"]
        return handler(*args, **kwargs)

    return wrapped


@app.get("/api/health")
def health() -> Any:
    return jsonify({"status": "ok", "service": "toca-api"})


@app.get("/")
def index() -> Any:
    return jsonify({
        "service": "Toca do Coelho API",
        "status": "online",
        "frontend": "http://localhost:5173",
        "health": "/api/health",
        "message": "Abra o frontend no endereço indicado acima.",
    })


@app.post("/api/auth/register")
def register() -> Any:
    body = request.get_json(silent=True) or {}
    email = str(body.get("email", "")).strip().lower()
    password = str(body.get("password", ""))
    display_name = str(body.get("displayName", "Agente")).strip() or "Agente"
    if "@" not in email or len(password) < 8:
        return jsonify({"error": "Informe um e-mail válido e uma senha com pelo menos 8 caracteres."}), 400
    try:
        cursor = db().execute("INSERT INTO users (email, password_hash, display_name, created_at) VALUES (?, ?, ?, ?)", (email, hash_password(password), display_name, now()))
        db().commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "Este e-mail já está cadastrado."}), 409
    return _issue_session(cursor.lastrowid)


@app.post("/api/auth/login")
def login() -> Any:
    body = request.get_json(silent=True) or {}
    row = db().execute("SELECT * FROM users WHERE email = ?", (str(body.get("email", "")).strip().lower(),)).fetchone()
    if not row or not verify_password(str(body.get("password", "")), row["password_hash"]):
        return jsonify({"error": "E-mail ou senha inválidos."}), 401
    return _issue_session(row["id"])


def _issue_session(user_id: int) -> Any:
    token = secrets.token_urlsafe(32)
    db().execute("INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)", (token, user_id, now()))
    db().commit()
    user = db().execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return jsonify({"token": token, "user": user_payload(user)}), 201


@app.get("/api/me")
@require_auth
def me() -> Any:
    user = db().execute("SELECT * FROM users WHERE id = ?", (g.user_id,)).fetchone()
    return jsonify(user_payload(user))


@app.get("/api/characters")
@require_auth
def characters() -> Any:
    rows = db().execute("SELECT * FROM characters WHERE user_id = ? ORDER BY updated_at DESC", (g.user_id,)).fetchall()
    return jsonify([character_payload(row) for row in rows])


@app.post("/api/characters")
@require_auth
def create_character() -> Any:
    body = request.get_json(silent=True) or {}
    name = str(body.get("name", "")).strip()
    if not name:
        return jsonify({"error": "O nome da ficha é obrigatório."}), 400
    timestamp = now()
    cursor = db().execute("INSERT INTO characters (user_id, name, system, role, level, visibility, data_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", (g.user_id, name, body.get("system", "Sistema próprio"), body.get("role", ""), body.get("level", "Nível 1"), body.get("visibility", "private"), __import__("json").dumps(body.get("data", {})), timestamp, timestamp))
    db().commit()
    return jsonify(character_payload(db().execute("SELECT * FROM characters WHERE id = ?", (cursor.lastrowid,)).fetchone())), 201


@app.put("/api/characters/<int:character_id>")
@require_auth
def update_character(character_id: int) -> Any:
    import json

    body = request.get_json(silent=True) or {}
    existing = db().execute("SELECT * FROM characters WHERE id = ? AND user_id = ?", (character_id, g.user_id)).fetchone()
    if not existing:
        return jsonify({"error": "Ficha não encontrada."}), 404
    db().execute("UPDATE characters SET name = ?, system = ?, role = ?, level = ?, visibility = ?, data_json = ?, updated_at = ? WHERE id = ?", (body.get("name", existing["name"]), body.get("system", existing["system"]), body.get("role", existing["role"]), body.get("level", existing["level"]), body.get("visibility", existing["visibility"]), json.dumps(body.get("data", json.loads(existing["data_json"]))), now(), character_id))
    db().commit()
    return jsonify(character_payload(db().execute("SELECT * FROM characters WHERE id = ?", (character_id,)).fetchone()))


@app.get("/api/characters/<int:character_id>/history")
@require_auth
def history(character_id: int) -> Any:
    owned = db().execute("SELECT id FROM characters WHERE id = ? AND user_id = ?", (character_id, g.user_id)).fetchone()
    if not owned:
        return jsonify({"error": "Ficha não encontrada."}), 404
    rows = db().execute("SELECT id, event, created_at AS createdAt FROM character_history WHERE character_id = ? ORDER BY created_at DESC", (character_id,)).fetchall()
    return jsonify([dict(row) for row in rows])


@app.post("/api/characters/<int:character_id>/history")
@require_auth
def add_history(character_id: int) -> Any:
    body = request.get_json(silent=True) or {}
    if not str(body.get("event", "")).strip():
        return jsonify({"error": "O acontecimento é obrigatório."}), 400
    owned = db().execute("SELECT id FROM characters WHERE id = ? AND user_id = ?", (character_id, g.user_id)).fetchone()
    if not owned:
        return jsonify({"error": "Ficha não encontrada."}), 404
    cursor = db().execute("INSERT INTO character_history (character_id, event, created_at) VALUES (?, ?, ?)", (character_id, body["event"], now()))
    db().commit()
    return jsonify({"id": cursor.lastrowid, "event": body["event"]}), 201


@app.get("/api/campaigns")
@require_auth
def campaigns() -> Any:
    rows = db().execute("SELECT id, title, system, description, created_at AS createdAt FROM campaigns WHERE user_id = ? ORDER BY created_at DESC", (g.user_id,)).fetchall()
    return jsonify([dict(row) for row in rows])


@app.post("/api/campaigns")
@require_auth
def create_campaign() -> Any:
    body = request.get_json(silent=True) or {}
    title = str(body.get("title", "")).strip()
    if not title:
        return jsonify({"error": "O nome da campanha é obrigatório."}), 400
    cursor = db().execute("INSERT INTO campaigns (user_id, title, system, description, created_at) VALUES (?, ?, ?, ?, ?)", (g.user_id, title, body.get("system", "Sistema próprio"), body.get("description", ""), now()))
    db().commit()
    row = db().execute("SELECT id, title, system, description, created_at AS createdAt FROM campaigns WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return jsonify(dict(row)), 201


if __name__ == "__main__":
    init_db()
    app.run(host=os.getenv("HOST", "127.0.0.1"), port=int(os.getenv("PORT", "5000")), debug=os.getenv("FLASK_DEBUG", "0") == "1")
