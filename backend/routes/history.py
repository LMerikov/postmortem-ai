from flask import Blueprint, jsonify
from models.postmortem import get_all_postmortems, get_postmortem_by_id, delete_postmortem, get_total_count, get_dashboard_stats

history_bp = Blueprint("history", __name__)


@history_bp.route("/api/stats", methods=["GET"])
def stats():
    return jsonify({"total_postmortems": get_total_count()})


@history_bp.route("/api/dashboard", methods=["GET"])
def dashboard():
    return jsonify(get_dashboard_stats())


@history_bp.route("/api/postmortems", methods=["GET"])
def list_postmortems():
    return jsonify(get_all_postmortems())


@history_bp.route("/api/postmortems/<postmortem_id>", methods=["GET"])
def get_postmortem(postmortem_id):
    pm = get_postmortem_by_id(postmortem_id)
    if not pm:
        return jsonify({"error": "Not found"}), 404
    return jsonify(pm)


@history_bp.route("/api/postmortems/<postmortem_id>", methods=["DELETE"])
def delete(postmortem_id):
    deleted = delete_postmortem(postmortem_id)
    if not deleted:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"message": "Deleted successfully"})
