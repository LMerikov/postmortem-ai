import logging
import traceback
from pathlib import Path

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from config import Config
from models.postmortem import init_db
from routes.analyze import analyze_bp
from routes.simulate import simulate_bp
from routes.history import history_bp
from routes.export import export_bp

logger = logging.getLogger(__name__)

frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"

app = Flask(
    __name__,
    static_folder=str(frontend_dist) if frontend_dist.exists() else None,
    static_url_path="",
)
app.config.from_object(Config)

# CSRF protection is not required here: this is a stateless REST API that uses
# JSON-only requests (Content-Type: application/json), not session cookies.
# CORS is restricted to trusted origins via Config.CORS_ORIGINS, and rate limiting
# is applied below. These controls are sufficient to prevent CSRF attacks.
CORS(app, origins=Config.CORS_ORIGINS)

# Rate limiting para prevenir abuso
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

app.register_blueprint(analyze_bp)
app.register_blueprint(simulate_bp)
app.register_blueprint(history_bp)
app.register_blueprint(export_bp)


@app.route("/api/health", methods=["GET"])
@limiter.exempt
def health():
    return jsonify({"status": "ok", "model": Config.CLAUDE_MODEL})


# Debug endpoint — solo disponible en development
if Config.DEBUG:
    @app.route("/api/debug/phase1", methods=["GET"])
    @limiter.exempt
    def debug_phase1():
        """Diagnóstico temporal de Phase 1 — solo en development."""
        try:
            from services.local_filtering import process_with_local_filter
            test_content = "[INFO] Server started OK\n[DEBUG] Ready"
            postmortem_local, should_call_llm, severity_local, cleaned_content = \
                process_with_local_filter(test_content)
            return jsonify({
                "ok": True,
                "should_call_llm": should_call_llm,
                "severity_local": severity_local,
                "cleaned_content_len": len(cleaned_content),
                "cleaned_content": repr(cleaned_content),
            })
        except Exception as e:
            return jsonify({
                "ok": False,
                "error": str(e),
                "traceback": traceback.format_exc()
            })


@app.route("/", defaults={"path": ""}, methods=["GET"])
@app.route("/<path:path>", methods=["GET"])
def serve_frontend(path):
    if not app.static_folder:
        return jsonify({"error": "Frontend build not found"}), 404

    target = Path(app.static_folder) / path
    if path and target.exists() and target.is_file():
        return send_from_directory(app.static_folder, path)

    return send_from_directory(app.static_folder, "index.html")


with app.app_context():
    try:
        init_db()
    except Exception as e:
        logger.warning(f"init_db failed (DB may be unavailable): {e}")


if __name__ == "__main__":
    # Security: bind to localhost in dev; gunicorn handles 0.0.0.0 in Docker behind Traefik
    import os
    bind_host = os.getenv("BIND_HOST", "127.0.0.1")
    app.run(debug=Config.DEBUG, host=bind_host, port=5000, use_reloader=False)
