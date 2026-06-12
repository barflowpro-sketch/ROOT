from PIL import Image, ImageDraw, ImageFont
import os

# --- App Icon 512x512 ---
S = 512
icon = Image.new("RGB", (S, S), color=(41, 37, 36))
idraw = ImageDraw.Draw(icon)

# Subtle radial-ish gradient (lighten center slightly)
for y in range(S):
    for x in range(S):
        dx = (x - S/2) / (S/2)
        dy = (y - S/2) / (S/2)
        d = (dx*dx + dy*dy) ** 0.5
        t = max(0, 1 - d * 0.6)
        r = int(41 + t * 18)
        g = int(37 + t * 16)
        b = int(36 + t * 15)
        idraw.point((x, y), fill=(r, g, b))

def load_font(size, prefer_bold=False):
    font_paths = [
        "C:/Windows/Fonts/georgiab.ttf",
        "C:/Windows/Fonts/georgia.ttf",
        "C:/Windows/Fonts/segoeuib.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ]
    bold_paths = [p for p in font_paths if "b.ttf" in p or "bd.ttf" in p]
    regular_paths = [p for p in font_paths if p not in bold_paths]
    candidates = bold_paths + regular_paths if prefer_bold else regular_paths + bold_paths
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

# Big R centered — same style as feature graphic
r_font = load_font(380, prefer_bold=True)
bbox = idraw.textbbox((0, 0), "R", font=r_font)
rw = bbox[2] - bbox[0]
rh = bbox[3] - bbox[1]
rx = (S - rw) // 2 - bbox[0]
ry = (S - rh) // 2 - bbox[1] - 10
# Shadow
idraw.text((rx + 4, ry + 4), "R", fill=(20, 18, 17), font=r_font)
# Letter
idraw.text((rx, ry), "R", fill=(231, 220, 200), font=r_font)

icon_path = "C:/Users/bumba/root/app_icon.png"
icon.save(icon_path, "PNG", optimize=True)
sz = os.path.getsize(icon_path)
print(f"Icon saved: {icon_path}")
print(f"Size: {sz/1024:.1f} KB  |  Dimensions: {icon.size}")

# --- Feature Graphic 1024x500 ---
W, H = 1024, 500
img = Image.new("RGB", (W, H), color=(41, 37, 36))
draw = ImageDraw.Draw(img)

# Subtle gradient
for y in range(H):
    t = y / H
    r = int(41 + t * 15)
    g = int(37 + t * 13)
    b = int(36 + t * 12)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# Left amber accent bar
draw.rectangle([0, 0, 6, H], fill=(180, 83, 9))

font_paths = [
    "C:/Windows/Fonts/georgiab.ttf",
    "C:/Windows/Fonts/georgia.ttf",
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/arial.ttf",
]

def load_font(size, prefer_bold=False):
    bold_paths = [p for p in font_paths if "b.ttf" in p or "bd.ttf" in p]
    regular_paths = [p for p in font_paths if p not in bold_paths]
    candidates = bold_paths + regular_paths if prefer_bold else regular_paths + bold_paths
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

r_font = load_font(260, prefer_bold=True)
app_name_font = load_font(80, prefer_bold=True)
tagline_font = load_font(26)
sub_font = load_font(20)

# Large decorative R on left
r_color = (231, 220, 200)
bbox = draw.textbbox((0, 0), "R", font=r_font)
rw = bbox[2] - bbox[0]
rh = bbox[3] - bbox[1]
rx = 55
ry = (H - rh) // 2 - 10
# Soft shadow
draw.text((rx + 4, ry + 4), "R", fill=(20, 18, 17), font=r_font)
draw.text((rx, ry), "R", fill=r_color, font=r_font)

# Divider
draw.rectangle([355, 55, 358, H - 55], fill=(78, 70, 60))

# App name "Root" in amber
name_bbox = draw.textbbox((0, 0), "Root", font=app_name_font)
nw = name_bbox[2] - name_bbox[0]
nx = 390 + (610 - nw) // 2
draw.text((nx, 115), "Root", fill=(217, 119, 6), font=app_name_font)

# Tagline
tagline = "Book the specialist you trust"
tl_bbox = draw.textbbox((0, 0), tagline, font=tagline_font)
tlw = tl_bbox[2] - tl_bbox[0]
tlx = 390 + (610 - tlw) // 2
draw.text((tlx, 218), tagline, fill=(168, 162, 158), font=tagline_font)

# Feature bullets - left-aligned as a block, centered on the right panel
bullet_font = load_font(19)
features = [
    "•  Your full hair history, always on hand",
    "•  Find trusted local specialists",
    "•  Request appointments in seconds",
]
# Find widest line to center the block
widths = []
for line in features:
    bb = draw.textbbox((0, 0), line, font=bullet_font)
    widths.append(bb[2] - bb[0])
block_w = max(widths)
block_x = 390 + (610 - block_w) // 2
for i, line in enumerate(features):
    draw.text((block_x, 265 + i * 30), line, fill=(168, 162, 158), font=bullet_font)

out_path = "C:/Users/bumba/root/feature_graphic.png"
img.save(out_path, "PNG", optimize=True)
sz = os.path.getsize(out_path)
print(f"Saved: {out_path}")
print(f"Size: {sz / 1024:.1f} KB")
print(f"Dimensions: {img.size}")
