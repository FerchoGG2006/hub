"""Exercise recovery in disposable databases, including rollback safeguards."""
import os
from pathlib import Path
import subprocess
import sys

import sqlalchemy as sa

import models


def run_adoption(tmp_path, extra_column=False):
    url = 'sqlite:///' + (tmp_path / 'legacy.db').as_posix()
    engine = sa.create_engine(url)
    models.Base.metadata.create_all(engine)
    with engine.begin() as connection:
        connection.execute(sa.text("INSERT INTO tenants (id,name,slug) VALUES (1,'Conservar','conservar')"))
        # Simulate a historical table missing a new field.
        connection.execute(sa.text('ALTER TABLE customers DROP COLUMN tags'))
        if extra_column:
            connection.execute(sa.text('ALTER TABLE tenants ADD COLUMN historical_note TEXT'))
            connection.execute(sa.text("UPDATE tenants SET historical_note='intacto'"))
    env_file = tmp_path / 'recovery.env'
    env_file.write_text(f'DATABASE_URL={url}\nRECOVERY_BRANCH_ID=test-recovery\n', encoding='utf-8')
    backend = Path(__file__).resolve().parents[1]
    result = subprocess.run(
        [sys.executable, str(backend / 'adopt_legacy.py'), '--env-file', str(env_file),
         '--confirm-recovery-branch', 'test-recovery', '--apply'],
        cwd=backend, env=os.environ.copy(), capture_output=True, text=True,
    )
    return engine, result


def test_adoption_adds_missing_fields_and_stamps_atomically(tmp_path):
    engine, result = run_adoption(tmp_path)
    try:
        assert result.returncode == 0, result.stdout + result.stderr
        with engine.connect() as connection:
            assert connection.execute(sa.text('SELECT name FROM tenants WHERE id=1')).scalar() == 'Conservar'
            assert connection.execute(sa.text('SELECT version_num FROM alembic_version')).scalar() == '49054796119c'
        assert 'tags' in {c['name'] for c in sa.inspect(engine).get_columns('customers')}
        assert (tmp_path / 'recovery-integrity.json').exists()
    finally:
        engine.dispose()


def test_adoption_rejects_a_plan_that_would_drop_historical_data(tmp_path):
    engine, result = run_adoption(tmp_path, extra_column=True)
    try:
        assert result.returncode != 0
        assert 'DropColumnOp' in result.stdout + result.stderr
        with engine.connect() as connection:
            assert connection.execute(sa.text('SELECT historical_note FROM tenants')).scalar() == 'intacto'
        assert 'tags' not in {c['name'] for c in sa.inspect(engine).get_columns('customers')}
        assert not sa.inspect(engine).has_table('alembic_version')
        assert not (tmp_path / 'recovery-integrity.json').exists()
    finally:
        engine.dispose()
