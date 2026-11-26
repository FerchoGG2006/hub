"""Review and add missing schema on an isolated recovery database.

Never drops tables, columns, indexes or existing values. Defaults to plan only.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path

from dotenv import load_dotenv


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--env-file', required=True)
    parser.add_argument('--confirm-recovery-branch', required=True)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    load_dotenv(args.env_file, override=True)
    if os.getenv('RECOVERY_BRANCH_ID') != args.confirm_recovery_branch:
        raise SystemExit('La rama no coincide con el archivo de recuperación')

    import sqlalchemy as sa
    from alembic import command
    from alembic.config import Config
    from alembic.autogenerate import produce_migrations
    from alembic.migration import MigrationContext
    from alembic.operations import Operations, ops
    from database import engine, Base
    import models

    defaults = {
        ('tenants', 'business_type'): "'restaurant'",
        ('tenants', 'settings'): "'{}'",
        ('tenants', 'chatbot_enabled'): 'false',
        ('customers', 'whatsapp_opt_in'): 'false',
        ('customers', 'tags'): "'[]'",
        ('products', 'price_type'): "'fixed'",
    }

    def flatten(operation):
        if isinstance(operation, ops.OpContainer):
            for child in operation.ops:
                yield from flatten(child)
        else:
            yield operation

    def allowed(operation):
        if isinstance(operation, (ops.CreateTableOp, ops.CreateIndexOp, ops.AddColumnOp)):
            return True
        return (isinstance(operation, ops.AlterColumnOp)
                and operation.table_name == 'inventory'
                and operation.column_name == 'tenant_id'
                and operation.modify_nullable is False
                and operation.modify_type is None
                and operation.modify_server_default is False)

    def fingerprints(connection, columns_by_table):
        result = {}
        for name, columns in sorted(columns_by_table.items()):
            table = sa.table(name, *(sa.column(c) for c in columns))
            rows = [dict(row) for row in connection.execute(sa.select(*(table.c[c] for c in columns))).mappings()]
            serialized = sorted(json.dumps(row, sort_keys=True, default=str, ensure_ascii=False) for row in rows)
            result[name] = {'rows': len(rows), 'sha256': hashlib.sha256('\n'.join(serialized).encode()).hexdigest()}
        return result

    with engine.begin() as connection:
        inspector = sa.inspect(connection)
        if inspector.has_table('alembic_version'):
            raise SystemExit('Esta base ya tiene Alembic; usa las migraciones normales')
        if not inspector.has_table('tenants'):
            raise SystemExit('No es una base histórica de Platorin')
        old_columns = {name: [c['name'] for c in inspector.get_columns(name)] for name in inspector.get_table_names()}
        print('Comprobando integridad de las tablas históricas...', flush=True)
        before = fingerprints(connection, old_columns)
        context = MigrationContext.configure(connection, opts={'compare_type': True})
        operations = list(flatten(produce_migrations(context, Base.metadata).upgrade_ops))
        rejected = [f'{type(o).__name__}:{getattr(o, "table_name", "")}.{getattr(o, "column_name", "")}:type={getattr(o, "modify_type", None)},nullable={getattr(o, "modify_nullable", None)}' for o in operations if not allowed(o)]
        if rejected:
            raise SystemExit('Plan rechazado; requiere revisión: '+', '.join(rejected))
        print(json.dumps([{'operation':type(o).__name__, 'table':getattr(o,'table_name',None)} for o in operations]))
        if not args.apply:
            print('Solo revisión. No se modificó el esquema.')
            return
        executor = Operations(context)
        for operation in operations:
            if isinstance(operation, ops.AddColumnOp):
                default = defaults.get((operation.table_name, operation.column.name))
                if default:
                    operation.column.server_default = sa.DefaultClause(sa.text(default))
            executor.invoke(operation)
        connection.execute(sa.text("""UPDATE orders SET payment_status='paid',
            paid_at=COALESCE((SELECT MAX(p.created_at) FROM payments p JOIN payment_sessions s
                ON s.id=p.payment_session_id WHERE s.order_id=orders.id AND p.status='APPROVED'), created_at)
            WHERE status='paid' OR id IN (SELECT order_id FROM payment_sessions WHERE status='paid')"""))
        after = fingerprints(connection, old_columns)
        if before != after:
            raise RuntimeError('Cambió un dato histórico; se revierte la transacción')
        remaining = list(flatten(produce_migrations(context, Base.metadata).upgrade_ops))
        if remaining:
            raise RuntimeError('El esquema aún difiere del modelo; se revierte la transacción')
        config = Config(str(Path(__file__).with_name('alembic.ini')))
        config.attributes['connection'] = connection
        command.stamp(config, 'head')
    report = Path(args.env_file).parent / 'recovery-integrity.json'
    report.write_text(json.dumps({'branch':args.confirm_recovery_branch,'tables':after}, indent=2), encoding='utf-8')
    print('Rama de recuperación adaptada. Datos originales conservados y esquema verificado.')


if __name__ == '__main__':
    main()
