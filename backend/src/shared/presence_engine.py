import logging
from datetime import datetime
import pytz
import models

logger = logging.getLogger("platorin.presence")

def is_branch_open(branch: models.Branch) -> bool:
    """
    Calcula si una sede está abierta en tiempo real considerando:
    1. Si tiene el piloto automático activo.
    2. Su zona horaria configurada (ej. America/Bogota).
    3. Rangos de horarios comerciales diurnos y nocturnos (trans-noche).
    """
    if not branch.autopilot_active:
        # Si el piloto automático no está activo, la sede está abierta por defecto
        return True

    if not branch.opening_time or not branch.closing_time:
        # Si faltan configurar horas, asumimos abierta por defecto para no romper ventas
        return True

    try:
        # 1. Obtener la hora actual en la zona horaria de la sede
        tz_name = branch.timezone or "America/Bogota"
        local_tz = pytz.timezone(tz_name)
        now_local = datetime.now(local_tz)
        current_time_str = now_local.strftime("%H:%M")

        # 2. Parsear las horas
        op_h, op_m = map(int, branch.opening_time.split(":"))
        cl_h, cl_m = map(int, branch.closing_time.split(":"))
        cur_h, cur_m = map(int, current_time_str.split(":"))

        current_val = cur_h * 60 + cur_m
        open_val = op_h * 60 + op_m
        close_val = cl_h * 60 + cl_m

        # 3. Validar si el horario cruza la medianoche (ej: abre 18:00 y cierra 02:00)
        if open_val <= close_val:
            # Horario normal diurno
            is_open = open_val <= current_val <= close_val
        else:
            # Horario nocturno que cruza la medianoche
            is_open = current_val >= open_val or current_val <= close_val

        logger.debug(f"[Presence] Sede '{branch.name}' en {tz_name}: Actual {current_time_str}, Rango {branch.opening_time}-{branch.closing_time} => ABIERTO: {is_open}")
        return is_open

    except Exception as e:
        logger.error(f"❌ Error calculando estado de presencia para sede {branch.id}: {e}")
        # En caso de fallo imprevisto, retornar True para no bloquear la operación
        return True
