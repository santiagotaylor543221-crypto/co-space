#!/usr/bin/env bash
set -euo pipefail

if [[ "$(node -p 'process.versions.node.split(".")[0]')" != 24 ]]; then
  printf '%s\n' 'El empaquetado requiere Node.js 24.' >&2
  exit 1
fi
command -v python3 >/dev/null

source_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
output_dir="$source_dir/dist"
mkdir -p -- "$output_dir"
staging="$(mktemp -d "$output_dir/.build.XXXXXXXX")"
trap 'rm -rf -- "$staging"' EXIT

cp -- "$source_dir/index.mjs" "$source_dir/package.json" "$source_dir/package-lock.json" "$staging/"
npm ci --prefix "$staging" --os=linux --cpu=x64 --libc=glibc \
  --omit=dev --include=optional --ignore-scripts --no-bin-links --no-audit --no-fund

python3 - "$staging" <<'PY'
from pathlib import Path
from sys import argv
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

root = Path(argv[1])
native = root / 'node_modules' / '@img'
if not any((native / 'sharp-linux-x64/lib').glob('sharp-linux-x64*.node')):
    raise SystemExit('Falta el binario de Sharp para Linux x64 con glibc.')
if not any((native / 'sharp-libvips-linux-x64/lib').glob('libvips-cpp.so.*')):
    raise SystemExit('Falta libvips para Linux x64 con glibc.')

dependencies = root / 'node_modules'
target_packages = {'sharp-linux-x64', 'sharp-libvips-linux-x64'}
other_platforms = {path for path in native.glob('sharp-*') if path.name not in target_packages}
files = [root / 'index.mjs', root / 'package.json', *dependencies.rglob('*')]
with ZipFile(root / 'image-thumbnails.zip', 'w') as archive:
    for file in sorted(files):
        if other_platforms.intersection(file.parents):
            continue
        if file.is_symlink():
            raise SystemExit(f'Enlace simbólico en dependencias: {file.relative_to(root)}')
        if not file.is_file() or file == dependencies / '.package-lock.json':
            continue
        entry = ZipInfo(file.relative_to(root).as_posix(), date_time=(2000, 1, 1, 0, 0, 0))
        entry.create_system = 3
        entry.external_attr = 0o100644 << 16
        archive.writestr(entry, file.read_bytes(), compress_type=ZIP_DEFLATED, compresslevel=9)
PY

mv -- "$staging/image-thumbnails.zip" "$output_dir/image-thumbnails.zip"
printf '%s\n' "$output_dir/image-thumbnails.zip"
