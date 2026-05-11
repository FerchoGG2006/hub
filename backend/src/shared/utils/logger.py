import logging
import sys
import os
from datetime import datetime

# Configuración básica de logs estructurados
def setup_logger():
    logger = logging.getLogger("platorin")
    logger.setLevel(logging.INFO)
    
    # Formato: timestamp | level | tenant_id | message
    formatter = logging.Formatter(
        '%(asctime)s | %(levelname)s | %(name)s | %(message)s'
    )
    
    # Console handler
    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setFormatter(formatter)
    logger.addHandler(stdout_handler)
    
    # Optional file handler
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
        
    file_handler = logging.FileHandler(f"logs/platorin_{datetime.now().strftime('%Y%m%d')}.log")
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    return logger

logger = setup_logger()
