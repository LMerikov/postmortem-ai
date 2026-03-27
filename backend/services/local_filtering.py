"""
Phase 1: Local Filtering & Triage
Filtra ruido y detecta severidad localmente antes de enviar a LLM.
Reduce 40-60% de tokens input y evita llamadas LLM para eventos triviales.
"""
import re


class LocalFilter:
    """Filtra ruido y detecta tipos de incidentes localmente."""

    PATTERNS_TO_STRIP = {
        'hashes': r'(?<![=\/\w])[a-f0-9]{32,64}(?![=\/\w])',  # MD5/SHA hashes
        'uuids': r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
        'memory_addresses': r'0x[a-fA-F0-9]{4,16}',
        'timestamps_precise': r'\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}\.\d+',  # milisegundos
    }

    NOISE_LEVELS = ['[INFO]', '[DEBUG]', '[TRACE]', ' INFO ', ' DEBUG ', ' TRACE ',
                    'INFO:', 'DEBUG:', 'TRACE:']

    @classmethod
    def clean(cls, content: str) -> str:
        """Elimina hashes, UUIDs, direcciones de memoria del contenido."""
        for key, pattern in cls.PATTERNS_TO_STRIP.items():
            content = re.sub(pattern, f'[{key.upper()}]', content, flags=re.IGNORECASE)
        return content

    @classmethod
    def filter_noise(cls, content: str) -> str:
        """Elimina líneas INFO, DEBUG, TRACE y trunca líneas muy largas."""
        lines = content.split('\n')
        filtered = []
        for line in lines:
            # Saltar líneas de ruido (INFO/DEBUG/TRACE)
            if any(lvl in line for lvl in cls.NOISE_LEVELS):
                continue
            # Truncar líneas muy largas (stack traces verbosos)
            if len(line) > 300:
                filtered.append(line[:300] + '... [truncated]')
                continue
            filtered.append(line)
        return '\n'.join(filtered)

    @classmethod
    def estimate_severity_local(cls, content: str) -> tuple:
        """
        Estima severidad sin LLM.
        Retorna (nivel: str, confidence: float)
        """
        content_upper = content.upper()

        # Contar indicadores de severidad
        fatal_count = len(re.findall(r'\bFATAL\b|\bCRITICAL\b', content_upper))
        error_count = len(re.findall(r'\[ERROR\]|\bERROR\b|\bEXCEPTION\b|\bCRASH\b', content_upper))
        warn_count = len(re.findall(r'\[WARN\]|\bWARNING\b|\bWARN\b', content_upper))

        # Indicadores críticos de sistema
        has_oom = bool(re.search(r'OUT.OF.MEMORY|OOM|KILLED|SEGFAULT|SIGSEGV', content_upper))
        has_timeout = bool(re.search(r'TIMEOUT|TIMED.OUT|CONNECTION.REFUSED', content_upper))
        has_data_loss = bool(re.search(r'DATA.LOSS|CORRUPTION|ROLLBACK|DEADLOCK', content_upper))

        if fatal_count > 0 or has_oom or has_data_loss:
            return ('P0', 0.9)
        elif error_count > 3 or has_timeout:
            return ('P1', 0.8)
        elif error_count > 0:
            return ('P2', 0.75)
        elif warn_count > 3:
            return ('P2', 0.6)
        elif warn_count > 0:
            return ('P3', 0.65)
        else:
            return ('P3', 0.5)

    @classmethod
    def should_send_to_llm(cls, cleaned_content: str, severity: str) -> bool:
        """
        Determina si el contenido merece análisis LLM.
        Retorna False para ruido puro que puede manejarse localmente.
        """
        stripped = cleaned_content.strip()

        # Contenido muy corto (< 80 chars) probablemente es ruido
        if len(stripped) < 80:
            return False

        # Menos de 2 líneas con contenido real
        meaningful_lines = [l for l in stripped.split('\n') if l.strip() and len(l.strip()) > 10]
        if len(meaningful_lines) < 2:
            return False

        # P3 sin errores claros no necesita LLM
        error_lines = [l for l in stripped.split('\n')
                       if any(kw in l.upper() for kw in ['ERROR', 'FATAL', 'CRITICAL', 'EXCEPTION', 'CRASH'])]
        if severity == 'P3' and len(error_lines) == 0:
            return False

        return True

    @classmethod
    def create_default_postmortem(cls, content: str, severity: str, reason: str) -> dict:
        """Crea un postmortem básico sin LLM para eventos rutinarios detectados localmente."""
        return {
            'title': f'Evento Rutinario - Severidad {severity}',
            'severity': severity,
            'summary': f'{reason}. Evento menor que no requiere análisis detallado de postmortem.',
            'timeline': [],
            'root_cause': 'Evento esperado / Ruido operacional detectado localmente.',
            'impact': {
                'users_affected': '0',
                'duration': '< 1 min',
                'services_affected': [],
                'revenue_impact': '$0'
            },
            'actions_taken': ['Evento registrado automáticamente'],
            'action_items': [
                {
                    'description': 'Evaluar si este tipo de eventos requiere alertas adicionales',
                    'owner': 'Equipo de SRE',
                    'priority': 'LOW'
                }
            ],
            'lessons_learned': ['Considerar ajustar umbrales de alertas para reducir ruido operacional'],
            'monitoring_recommendations': [],
            '_meta': {
                'generated_locally': True,
                'filtered_out': True,
                'filter_reason': reason
            }
        }


def process_with_local_filter(content: str) -> tuple:
    """
    Procesa el contenido con el filtro local.

    Retorna:
        (postmortem_or_none, should_call_llm, severity, cleaned_content)
        - Si should_call_llm=False → usar postmortem_or_none directamente
        - Si should_call_llm=True  → enviar cleaned_content al LLM
    """
    # 1. Limpiar hashes y datos irrelevantes
    cleaned = LocalFilter.clean(content)

    # 2. Filtrar líneas de ruido (INFO/DEBUG)
    filtered = LocalFilter.filter_noise(cleaned)

    # 3. Estimar severidad localmente
    severity, _ = LocalFilter.estimate_severity_local(filtered)

    # 4. Decidir si mandar al LLM
    if not LocalFilter.should_send_to_llm(filtered, severity):
        postmortem = LocalFilter.create_default_postmortem(
            filtered, severity,
            reason='Contenido insuficiente o ruido operacional detectado localmente'
        )
        return (postmortem, False, severity, filtered)

    return (None, True, severity, filtered)
