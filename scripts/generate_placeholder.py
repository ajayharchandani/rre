"""Generates the standardized 'RRE Image Coming Soon' placeholder as a
PNG (not SVG) so it renders reliably via <img> everywhere, including
strict/sandboxed renderers where SVG-via-img was observed to fail to
decode despite a valid 200 response and content-type."""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PATH = os.path.join(ROOT, "src", "public", "images", "products", "rre-image-coming-soon.png")

SIZE = 640
bg = (248, 250, 252)
border = (226, 232, 240)
icon = (148, 163, 184)
icon_line = (203, 213, 225)
text_dark = (51, 65, 85)
text_muted = (100, 116, 139)
text_navy = (15, 23, 42)
accent = (245, 158, 11)

img = Image.new("RGB", (SIZE, SIZE), bg)
draw = ImageDraw.Draw(img)
draw.rectangle([0, 0, SIZE - 1, SIZE - 1], outline=border, width=1)

def font(size, bold=False):
    names = ["arialbd.ttf", "Arial Bold.ttf"] if bold else ["arial.ttf", "Arial.ttf"]
    for n in names:
        try:
            return ImageFont.truetype(n, size)
        except Exception:
            continue
    return ImageFont.load_default()

cx, cy = 320, 268
draw.rounded_rectangle([cx - 95, cy - 34, cx + 95, cy + 65], radius=10, outline=icon, width=10)
draw.polygon([(cx - 46, cy - 34), (cx - 32, cy - 54), (cx + 32, cy - 54), (cx + 46, cy - 34)], outline=icon, width=10)
draw.ellipse([cx - 34, cy - 18, cx + 34, cy + 50], outline=icon, width=10)
draw.line([cx - 130, cy - 84, cx + 130, cy + 84], fill=icon_line, width=10)

def center_text(y, text, f, fill, spacing=0):
    if spacing:
        text = (" " * 1).join(list(text)) if False else text
    bbox = draw.textbbox((0, 0), text, font=f)
    w = bbox[2] - bbox[0]
    draw.text((320 - w / 2, y), text, font=f, fill=fill)

center_text(378, "IMAGE COMING SOON", font(28, bold=True), text_dark)
center_text(416, "Photograph not yet available for this part", font(16), text_muted)
center_text(578, "RRE INTERNATIONAL", font(15, bold=True), text_navy)
draw.rectangle([270, 602, 370, 605], fill=accent)

img.save(OUT_PATH, "PNG", optimize=True)
print("Saved", OUT_PATH, img.size)
