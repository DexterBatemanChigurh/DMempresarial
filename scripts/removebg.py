"""
Remove fundo branco/claro de logos usando Pillow (sem IA, sem RAM extra).
Estratégia: flood-fill a partir dos 4 cantos para apagar o fundo conectado ao bordo.
Tolerância ajustável — padrão 30 funciona bem para logos com fundo branco sólido ou quase sólido.
"""
import sys
sys.path.insert(0, "/home/lucas/.local/lib/python3.12/site-packages")

from pathlib import Path
from PIL import Image
from collections import deque

TOLERANCE = 40   # 0–255: quanto desviar do fundo ainda é considerado fundo


def color_distance(c1: tuple, c2: tuple) -> float:
    return ((c1[0]-c2[0])**2 + (c1[1]-c2[1])**2 + (c1[2]-c2[2])**2) ** 0.5


def remove_background(img: Image.Image, tolerance: int = TOLERANCE) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    pixels = img.load()

    # Cor de fundo = média das 4 bordas (1px de cada canto)
    corners = [pixels[0, 0], pixels[w-1, 0], pixels[0, h-1], pixels[w-1, h-1]]
    bg = tuple(sum(c[i] for c in corners) // 4 for i in range(3))

    visited = [[False] * h for _ in range(w)]
    queue = deque()

    # Semear a fila com todos os pixels da borda
    for x in range(w):
        queue.append((x, 0)); queue.append((x, h-1))
    for y in range(1, h-1):
        queue.append((0, y)); queue.append((w-1, y))

    while queue:
        x, y = queue.popleft()
        if x < 0 or x >= w or y < 0 or y >= h:
            continue
        if visited[x][y]:
            continue
        visited[x][y] = True
        r, g, b, a = pixels[x, y]
        if color_distance((r, g, b), bg) <= tolerance:
            pixels[x, y] = (r, g, b, 0)  # transparente
            for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                nx, ny = x+dx, y+dy
                if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny]:
                    queue.append((nx, ny))

    return img


src = Path(__file__).parent.parent / "public/clients"
dst = src / "processed"
dst.mkdir(exist_ok=True)

files = sorted(
    (f for f in src.iterdir() if f.is_file() and f.suffix.lower() in (".webp", ".jpg", ".jpeg", ".png")),
    key=lambda f: int(f.stem) if f.stem.isdigit() else 999,
)

for f in files:
    out = dst / (f.stem + ".png")
    print(f"  {f.name} ...", end=" ", flush=True)
    img = Image.open(f)
    result = remove_background(img)
    result.save(out, "PNG")
    print("ok")

print(f"\nConcluído: {len(list(dst.glob('*.png')))} PNGs em {dst}")
