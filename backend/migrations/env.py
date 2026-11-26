from logging.config import fileConfig
from alembic import context
from database import engine, Base
import models

fileConfig(context.config.config_file_name)
target_metadata = Base.metadata

if context.is_offline_mode():
    context.configure(url=str(engine.url), target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()
else:
    def run_with_connection(connection):
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True, render_as_batch=connection.dialect.name == 'sqlite')
        with context.begin_transaction():
            context.run_migrations()
    connection = context.config.attributes.get('connection')
    if connection is not None:
        run_with_connection(connection)
    else:
        with engine.connect() as connection:
            run_with_connection(connection)
