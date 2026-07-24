import os
import subprocess
import sys

root = os.path.join(os.path.expanduser('~'), 'Desktop', 'Gymini')
log_path = os.path.join(root, 'validation.log')
steps = [
    (['npm', 'install'], root),
    (['npm', 'install'], os.path.join(root, 'backend')),
    (['npm', 'install'], os.path.join(root, 'frontend')),
    (['npm', 'run', 'build'], os.path.join(root, 'frontend')),
]

with open(log_path, 'w', encoding='utf-8') as log:
    for cmd, cwd in steps:
        log.write(f'Running {" ".join(cmd)} in {cwd}\n')
        log.flush()
        result = subprocess.run(cmd, cwd=cwd, text=True, stdout=log, stderr=log, shell=True)
        log.write(f'Exit code: {result.returncode}\n\n')
        log.flush()
        if result.returncode != 0:
            sys.exit(result.returncode)
    log.write('Gymini validation completed successfully.\n')
