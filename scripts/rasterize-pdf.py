from io import BytesIO
from pathlib import Path
import sys

import fitz
from PIL import Image


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: rasterize-pdf.py INPUT.pdf OUTPUT.tiff", file=sys.stderr)
        return 2

    source = Path(sys.argv[1])
    output = Path(sys.argv[2])
    document = fitz.open(source)
    scale = 400 / 72
    pages: list[Image.Image] = []

    for page in document:
        pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
        pages.append(Image.open(BytesIO(pixmap.tobytes("png"))).convert("L"))

    if not pages:
        print("PDF contains no pages", file=sys.stderr)
        return 1

    pages[0].save(
        output,
        save_all=True,
        append_images=pages[1:],
        compression="tiff_lzw",
        dpi=(400, 400),
    )
    print(f"Rasterized {len(pages)} page(s) at 400 DPI to {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
