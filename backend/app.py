from pathlib import Path

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from config import Config
from models.postmortem import init_db
from routes.analyze import analyze_bp
from routes.simulate import simulate_bp
from routes.history import history_bp
from routes.export import export_bp

frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"

app = Flask(
    __name__,
    static_folder=str(frontend_dist) if frontend_dist.exists() else None,
    static_url_path="",
)
app.config.from_object(Config)

CORS(app, origins=Config.CORS_ORIGINS)

app.register_blueprint(analyze_bp)
app.register_blueprint(simulate_bp)
app.register_blueprint(history_bp)
app.register_blueprint(export_bp)


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "model": Config.CLAUDE_MODEL})


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if not app.static_folder:
        return jsonify({"error": "Frontend build not found"}), 404

    target = Path(app.static_folder) / path
    if path and target.exists() and target.is_file():
        return send_from_directory(app.static_folder, path)

    return send_from_directory(app.static_folder, "index.html")


with app.app_context():
    init_db()

if __name__ == "__main__":
    app.run(debug=Config.DEBUG, host="0.0.0.0", port=5000)
