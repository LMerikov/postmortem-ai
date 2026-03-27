"""
Phase 2: Cache de postmortems por similitud de logs.
- Hash exacto → hit inmediato (<0.2s)
- Similitud Jaccard ≥70% → reutilizar resultado cacheado
- Si no hay match → llamar LLM y guardar en cache
"""
import re
import hashlib
import json
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# ─── Normalización para comparar contenido ────────────────────────────────────

_VARIABLE_PATTERNS = [
    (r'\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?', 'TIMESTAMP'),
    (r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?\b', 'IP'),
    (r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', 'UUID'),
    (r'(?<!\w)[a-f0-9]{32,64}(?!\w)', 'HASH'),
    (r'\b\d{4,}\b', 'NUM'),          # números largos (IDs, puertos, ms)
    (r'\b\d+ms\b|\b\d+s\b', 'DUR'), # duraciones
    (r'https?://\S+', 'URL'),
    (r'/[\w/.-]{5,}', 'PATH'),       # rutas de archivo
]


def normalize_for_cache(content: str) -> str:
    """Normaliza el contenido eliminando valores variables para comparación."""
    text = content.lower().strip()
    for pattern, replacement in _VARIABLE_PATTERNS:
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    # Colapsar espacios y líneas en blanco
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def content_hash(normalized: str) -> str:
    """SHA-256 del contenido normalizado."""
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()


def _extract_keywords(text: str) -> set:
    """Extrae palabras clave de error/servicio para similitud Jaccard."""
    keywords = set()
    # Extraer términos técnicos relevantes (errores, servicios, acciones)
    tokens = re.findall(r'[a-z_]{3,}', text.lower())
    for tok in tokens:
        if tok not in _STOP_WORDS:
            keywords.add(tok)
    return keywords


_STOP_WORDS = {
    'the', 'and', 'for', 'was', 'are', 'not', 'with', 'this', 'that',
    'from', 'has', 'have', 'been', 'its', 'but', 'they', 'our', 'you',
    'num', 'timestamp', 'uuid', 'hash', 'dur', 'url', 'path', 'ip',
    'log', 'logs', 'line', 'lines', 'file', 'level', 'message', 'msg',
}


def jaccard_similarity(set_a: set, set_b: set) -> float:
    """Similitud Jaccard entre dos conjuntos de keywords."""
    if not set_a or not set_b:
        return 0.0
    intersection = set_a & set_b
    union = set_a | set_b
    return len(intersection) / len(union)


# ─── Operaciones de cache en DB ───────────────────────────────────────────────

def init_cache_table():
    """Crea la tabla de cache si no existe."""
    from models.postmortem import get_db, USE_POSTGRES
    try:
        conn = get_db()
        cur = conn.cursor()
        if USE_POSTGRES:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS postmortem_cache (
                    id SERIAL PRIMARY KEY,
                    content_hash TEXT UNIQUE NOT NULL,
                    normalized_content TEXT NOT NULL,
                    keywords TEXT NOT NULL,
                    postmortem_json TEXT NOT NULL,
                    hit_count INTEGER DEFAULT 1,
                    created_at TEXT NOT NULL,
                    last_used_at TEXT NOT NULL
                )
            """)
            cur.execute("CREATE INDEX IF NOT EXISTS idx_cache_hash ON postmortem_cache(content_hash)")
        else:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS postmortem_cache (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content_hash TEXT UNIQUE NOT NULL,
                    normalized_content TEXT NOT NULL,
                    keywords TEXT NOT NULL,
                    postmortem_json TEXT NOT NULL,
                    hit_count INTEGER DEFAULT 1,
                    created_at TEXT NOT NULL,
                    last_used_at TEXT NOT NULL
                )
            """)
        conn.commit()
        cur.close()
        conn.close()
        logger.info("Cache table initialized OK")
    except Exception as e:
        logger.warning(f"Could not init cache table: {e}")


def find_in_cache(normalized: str, threshold: float = 0.70) -> dict | None:
    """
    Busca en cache:
    1. Primero por hash exacto
    2. Luego por similitud Jaccard ≥ threshold
    Retorna el postmortem dict si hay hit, None si no.
    """
    from models.postmortem import get_db, USE_POSTGRES

    h = content_hash(normalized)
    kws = _extract_keywords(normalized)

    try:
        conn = get_db()
        if USE_POSTGRES:
            cur = conn.cursor()
            # 1. Búsqueda exacta por hash
            cur.execute(
                "SELECT postmortem_json, hit_count FROM postmortem_cache WHERE content_hash = %s",
                (h,)
            )
        else:
            cur = conn.cursor()
            cur.execute(
                "SELECT postmortem_json, hit_count FROM postmortem_cache WHERE content_hash = ?",
                (h,)
            )

        row = cur.fetchone()
        if row:
            # Actualizar hit_count y last_used
            now = datetime.now(timezone.utc).isoformat()
            if USE_POSTGRES:
                cur.execute(
                    "UPDATE postmortem_cache SET hit_count = hit_count + 1, last_used_at = %s WHERE content_hash = %s",
                    (now, h)
                )
            else:
                cur.execute(
                    "UPDATE postmortem_cache SET hit_count = hit_count + 1, last_used_at = ? WHERE content_hash = ?",
                    (now, h)
                )
            conn.commit()
            cur.close()
            conn.close()
            logger.info(f"Cache HIT exacto (hash={h[:8]})")
            return json.loads(row[0])

        # 2. Búsqueda por similitud Jaccard
        # Traer los últimos 200 entries para comparar (suficiente para hackathon)
        cur.execute(
            "SELECT content_hash, keywords, postmortem_json FROM postmortem_cache ORDER BY last_used_at DESC LIMIT 200"
        )

        rows = cur.fetchall()
        best_score = 0.0
        best_row = None

        for row in rows:
            cached_kws = set(json.loads(row[1]))
            score = jaccard_similarity(kws, cached_kws)
            if score > best_score:
                best_score = score
                best_row = row

        cur.close()
        conn.close()

        if best_score >= threshold and best_row:
            logger.info(f"Cache HIT similitud Jaccard={best_score:.2f} (hash={best_row[0][:8]})")
            # Marcar como usado
            try:
                conn2 = get_db()
                now = datetime.now(timezone.utc).isoformat()
                if USE_POSTGRES:
                    cur2 = conn2.cursor()
                    cur2.execute(
                        "UPDATE postmortem_cache SET hit_count = hit_count + 1, last_used_at = %s WHERE content_hash = %s",
                        (now, best_row[0])
                    )
                else:
                    cur2 = conn2.cursor()
                    cur2.execute(
                        "UPDATE postmortem_cache SET hit_count = hit_count + 1, last_used_at = ? WHERE content_hash = ?",
                        (now, best_row[0])
                    )
                conn2.commit()
                cur2.close()
                conn2.close()
            except Exception:
                pass
            cached_pm = json.loads(best_row[2])
            cached_pm['_meta'] = cached_pm.get('_meta', {})
            cached_pm['_meta']['cache_hit'] = True
            cached_pm['_meta']['similarity_score'] = round(best_score, 2)
            return cached_pm

    except Exception as e:
        logger.warning(f"Cache lookup error: {e}")

    return None


def save_to_cache(normalized: str, postmortem: dict) -> None:
    """Guarda un postmortem en cache para reutilización futura."""
    from models.postmortem import get_db, USE_POSTGRES

    h = content_hash(normalized)
    kws = list(_extract_keywords(normalized))
    now = datetime.now(timezone.utc).isoformat()

    try:
        conn = get_db()
        cur = conn.cursor()
        if USE_POSTGRES:
            cur.execute("""
                INSERT INTO postmortem_cache
                    (content_hash, normalized_content, keywords, postmortem_json, hit_count, created_at, last_used_at)
                VALUES (%s, %s, %s, %s, 1, %s, %s)
                ON CONFLICT (content_hash) DO UPDATE SET
                    hit_count = postmortem_cache.hit_count + 1,
                    last_used_at = EXCLUDED.last_used_at
            """, (h, normalized[:2000], json.dumps(kws), json.dumps(postmortem), now, now))
        else:
            cur.execute("""
                INSERT OR REPLACE INTO postmortem_cache
                    (content_hash, normalized_content, keywords, postmortem_json, hit_count, created_at, last_used_at)
                VALUES (?, ?, ?, ?, 1, ?, ?)
            """, (h, normalized[:2000], json.dumps(kws), json.dumps(postmortem), now, now))
        conn.commit()
        cur.close()
        conn.close()
        logger.info(f"Saved to cache (hash={h[:8]}, keywords={len(kws)})")
    except Exception as e:
        logger.warning(f"Cache save error: {e}")
