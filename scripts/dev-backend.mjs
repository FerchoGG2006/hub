import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const python = process.platform === 'win32' ? '.venv/Scripts/python.exe' : '.venv/bin/python';
const child = spawn(root + python, ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000', ...(process.platform === 'win32' ? [] : ['--reload'])], {
  cwd: root + 'backend', stdio: 'inherit', windowsHide: true,
  env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' },
});
child.on('error', () => {
  console.error('Configura primero el entorno .venv según docs/desarrollo.md');
  process.exitCode = 1;
});
child.on('exit', code => { process.exitCode = code ?? 0; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
