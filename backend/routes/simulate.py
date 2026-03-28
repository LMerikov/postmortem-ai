import logging

from flask import Blueprint, request, jsonify

from services.llm_service import generate_simulation
from models.postmortem import save_postmortem

simulate_bp = Blueprint("simulate", __name__)
logger = logging.getLogger(__name__)

VALID_INCIDENT_TYPES = {
    "database_outage", "memory_leak", "ddos_attack", "dns_failure",
    "bad_deployment", "certificate_expiration", "api_rate_limiting",
    "disk_space_full", "cascading_failure", "security_breach",
}
VALID_SEVERITIES = {"P0", "P1", "P2", "P3", "P4"}
VALID_STACKS = {"nodejs", "python", "java", "go", "ruby", "rust", "dotnet"}
VALID_INFRAS = {"aws", "gcp", "azure", "cubepath", "onpremise"}
VALID_COMPLEXITIES = {"simple", "moderate", "complex"}


@simulate_bp.route("/api/simulate", methods=["POST"])
def simulate():
    data = request.get_json(force=True)

    incident_type = data.get("incident_type", "database_outage")
    severity = data.get("severity", "P1")
    tech_stack = data.get("tech_stack", "nodejs")
    infrastructure = data.get("infrastructure", "aws")
    complexity = data.get("complexity", "moderate")

    if incident_type not in VALID_INCIDENT_TYPES:
        return jsonify({"error": f"Invalid incident_type. Valid: {sorted(VALID_INCIDENT_TYPES)}"}), 400
    if severity not in VALID_SEVERITIES:
        return jsonify({"error": "Invalid severity. Valid: P0-P4"}), 400

    try:
        result = generate_simulation(incident_type, severity, tech_stack, infrastructure, complexity)
        postmortem = result.get("postmortem", {})
        postmortem_id = save_postmortem(postmortem, source="simulate")
        return jsonify({
            "id": postmortem_id,
            "logs": result.get("logs", ""),
            "postmortem": postmortem,
        })
    except (ValueError, TimeoutError, RuntimeError) as e:
        logger.warning("Simulation failed: %s", e)
        return jsonify({"error": "Simulation failed"}), 500
    except Exception as e:
        logger.error("Unexpected error in simulate: %s", e, exc_info=True)
        return jsonify({"error": "Simulation failed, try again"}), 500
