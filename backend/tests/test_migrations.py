import os
import subprocess
import sys
from pathlib import Path


def test_fresh_schema_migrates_without_drift(tmp_path):
    env={**os.environ, 'DATABASE_URL':'sqlite:///'+(tmp_path/'migration.db').as_posix()}
    backend=Path(__file__).resolve().parents[1]
    for args in [('upgrade','head'),('check',)]:
        result=subprocess.run([sys.executable,'-m','alembic',*args],cwd=backend,env=env,capture_output=True,text=True)
        assert result.returncode == 0, result.stdout+result.stderr
