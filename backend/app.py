from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models.postmortem import init_db
from routes.analyze import analyze_bp
from routes.simulate import simulate_bp
from routes.history import history_bp
from routes.export import export_bp

app = Flask(__name__)
app.config.from_object(Config)

CORS(app, origins=Config.CORS_ORIGINS)

app.register_blueprint(analyze_bp)
app.register_blueprint(simulate_bp)
app.register_blueprint(history_bp)
app.register_blueprint(export_bp)


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "model": Config.CLAUDE_MODEL})


with app.app_context():
    init_db()

if __name__ == "__main__":
    app.run(debug=Config.DEBUG, host="0.0.0.0", port=5000)
