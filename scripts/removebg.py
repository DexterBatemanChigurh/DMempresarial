"""Remove background from all client images in public/clients/"""
import sys
sys.path.insert(0, "/home/lucas/.local/lib/python3.12/site-packages")

from pathlib import Path
from rembg import remove

src = Path(__file__).parent.parent / "public/clients"
dst = src / "processed"
dst.mkdir(exist_ok=True)

files = sorted(
    (f for f in src.iterdir() if f.is_file() and f.suffix.lower() in (".webp", ".jpg", ".jpeg", ".png")),
    key=lambda f: int(f.stem) if f.stem.isdigit() else 999
)

for f in files:
    out = dst / (f.stem + ".png")
    print(f"  {f.name} ...", end=" ", flush=True)
    result = remove(open(f, "rb").read())
    out.write_bytes(result)
    print("ok")

print(f"\nConcluído: {len(list(dst.glob('*.png')))} PNGs em {dst}")
