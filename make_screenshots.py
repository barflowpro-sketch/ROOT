from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1080, 1920
PAD = 52
OUT = "C:/Users/bumba/root"

BG    = (41,  37,  36)
CARD  = (68,  64,  60)
CARD2 = (55,  51,  48)
BORD  = (87,  83,  78)
T1    = (245, 245, 244)
T2    = (168, 162, 158)
T3    = (120, 113, 108)
AMB   = (180,  83,   9)
AMBH  = (217, 119,   6)
AMBL  = (245, 158,  11)
GRN   = ( 22, 163,  74)
GBKG  = ( 14,  79,  36)
RED   = (220,  38,  38)
RBKG  = (127,  29,  29)
PEND  = (251, 191,  36)
PNBG  = ( 92,  45,  10)

_f = {}
def F(sz, b=False):
    k = (sz, b)
    if k in _f: return _f[k]
    bp = ["C:/Windows/Fonts/georgiab.ttf", "C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"]
    rp = ["C:/Windows/Fonts/segoeui.ttf",  "C:/Windows/Fonts/georgia.ttf",  "C:/Windows/Fonts/arial.ttf"]
    for p in (bp + rp if b else rp + bp):
        if os.path.exists(p):
            try: _f[k] = ImageFont.truetype(p, sz); return _f[k]
            except: pass
    _f[k] = ImageFont.load_default(); return _f[k]

def mk():
    img = Image.new("RGB", (W, H), BG)
    return img, ImageDraw.Draw(img)

def rr(d, x1, y1, x2, y2, r=24, fill=None, ol=None, ow=2):
    d.rounded_rectangle([x1, y1, x2, y2], radius=r, fill=fill, outline=ol, width=ow)

def tx(d, x, y, s, sz, b=False, c=T1, a="la"):
    d.text((x, y), str(s), font=F(sz, b), fill=c, anchor=a)

def txc(d, y, s, sz, b=False, c=T1):
    d.text((W // 2, y), str(s), font=F(sz, b), fill=c, anchor="mm")

def sbar(d):
    d.rectangle([0, 0, W, 66], fill=(35, 31, 30))
    tx(d, PAD, 14, "9:41", 30, b=True)
    bx = W - PAD
    d.rounded_rectangle([bx-66, 22, bx-10, 44], radius=5, outline=T2, width=2)
    d.rounded_rectangle([bx-64, 24, bx-26, 42], radius=3, fill=T1)
    d.rounded_rectangle([bx-9, 29, bx-7, 37], radius=2, fill=T2)
    for i, h_ in enumerate([10, 16, 22, 28]):
        xi = bx - 120 + i * 18
        d.rectangle([xi, 44 - h_, xi + 12, 44], fill=T2)

def hdr_back(d, title, right=None, y=66):
    d.rectangle([0, y, W, y + 108], fill=BG)
    d.line([0, y + 108, W, y + 108], fill=BORD, width=2)
    tx(d, PAD, y + 54, "← Back", 32, c=T2, a="lm")
    txc(d, y + 54, title, 40, b=True)
    if right:
        tx(d, W - PAD, y + 54, right, 28, c=T3, a="rm")
    return y + 108

def hdr_main(d, title, sub=None, right=None, y=66):
    ht = 128 if sub else 100
    d.rectangle([0, y, W, y + ht], fill=BG)
    d.line([0, y + ht, W, y + ht], fill=BORD, width=2)
    tx(d, PAD, y + 28, title, 48, b=True)
    if sub:
        tx(d, PAD, y + 84, sub, 28, c=T3)
    if right:
        tx(d, W - PAD, y + ht // 2, right, 28, c=T3, a="rm")
    return y + ht

def tabbar(d, items, ai, y):
    tw = W // len(items)
    d.rectangle([0, y, W, y + 90], fill=BG)
    d.line([0, y, W, y], fill=BORD, width=2)
    d.line([0, y + 90, W, y + 90], fill=BORD, width=2)
    for i, lbl in enumerate(items):
        cx = i * tw + tw // 2
        is_a = i == ai
        d.text((cx, y + 45), lbl, font=F(32, b=is_a), fill=AMBH if is_a else T3, anchor="mm")
        if is_a:
            d.line([i * tw + 50, y + 82, (i + 1) * tw - 50, y + 82], fill=AMB, width=5)
    return y + 90

def inf(d, y, lbl=None, val="", ph=False, h=86):
    if lbl:
        tx(d, PAD, y, lbl.upper(), 22, c=T3)
        y += 36
    rr(d, PAD, y, W - PAD, y + h, fill=CARD, ol=BORD)
    tx(d, PAD + 28, y + h // 2, val, 34, c=T3 if ph else T1, a="lm")
    return y + h

def btn(d, y, lbl, fill=AMB, tc=(255, 251, 235), h=96):
    rr(d, PAD, y, W - PAD, y + h, fill=fill)
    txc(d, y + h // 2, lbl, 36, b=True, c=tc)
    return y + h

def smbtn(d, x1, y, x2, lbl, fill=AMB, tc=(255,251,235), h=80):
    rr(d, x1, y, x2, y + h, fill=fill)
    cx = (x1 + x2) // 2
    d.text((cx, y + h // 2), lbl, font=F(30, b=True), fill=tc, anchor="mm")

def stars_row(d, x, y, rating, sz=32):
    for i in range(5):
        d.text((x + i * (sz + 6), y), "★", font=F(sz), fill=AMBL if i < round(rating) else CARD2, anchor="la")

def chipd(d, x, y, lbl, bg=CARD2, tc=T2):
    bb = d.textbbox((0, 0), lbl, font=F(26))
    cw = bb[2] - bb[0] + 28
    rr(d, x, y, x + cw, y + 46, r=23, fill=bg)
    tx(d, x + 14, y + 23, lbl, 26, c=tc, a="lm")
    return cw + 14

def bdg(d, x, y, lbl, bg, tc):
    f = F(24, b=True)
    bb = d.textbbox((0, 0), lbl, font=f)
    bw = bb[2] - bb[0] + 24
    bh = 42
    rr(d, x, y, x + bw, y + bh, r=12, fill=bg)
    d.text((x + 12, y + bh // 2), lbl, font=f, fill=tc, anchor="lm")
    return bw

def slbl(d, y, txt):
    tx(d, PAD, y, txt.upper(), 24, c=T3)
    return y + 42

def save(img, name):
    p = f"{OUT}/{name}"
    img.save(p, "PNG")
    print(f"  {name}  {os.path.getsize(p)//1024} KB")


# ─────────────────────────────────────────────────────────────
# SCREEN 1 · Client: Discover — search results
# ─────────────────────────────────────────────────────────────
def screen1():
    img, d = mk()
    sbar(d)
    y = hdr_main(d, "Find a Specialist", sub="Search by city or use your location",
                 right="Sign out", y=66)
    y += 30

    # Search row
    rr(d, PAD, y, W - PAD - 108, y + 86, fill=CARD, ol=BORD)
    tx(d, PAD + 28, y + 43, "Atlanta, GA", 34, c=T1, a="lm")
    rr(d, W - PAD - 98, y, W - PAD, y + 86, fill=CARD, ol=BORD)
    tx(d, W - PAD - 49, y + 43, "◎", 36, c=T2, a="mm")
    y += 100

    # Service filter
    rr(d, PAD, y, W - PAD, y + 86, fill=CARD, ol=BORD)
    tx(d, PAD + 28, y + 43, "Box Braids", 34, c=T1, a="lm")
    y += 100

    # Search button
    y = btn(d, y, "Search")
    y += 28

    # Results header + sort pills
    tx(d, PAD, y + 6, "3 specialists found", 28, c=T3)
    pill_x = W - PAD
    for lbl, active in reversed([("Top rated", True), ("Nearest", False)]):
        f_ = F(24, b=active)
        bb = d.textbbox((0, 0), lbl, font=f_)
        pw = bb[2] - bb[0] + 36
        pill_x -= pw
        rr(d, pill_x, y, pill_x + pw, y + 46, r=23,
           fill=AMB if active else (0, 0, 0, 0), ol=BORD if not active else None)
        d.text((pill_x + pw // 2, y + 23), lbl, font=f_,
               fill=(255, 251, 235) if active else T3, anchor="mm")
        pill_x -= 16
    y += 66

    # ── Card 1: Amara Johnson ──────────────────────────────
    cy = y
    card_h = 510
    rr(d, PAD, cy, W - PAD, cy + card_h, r=28, fill=CARD, ol=BORD)
    # photo
    d.rectangle([PAD, cy, W - PAD, cy + 216], fill=CARD2)
    tx(d, W // 2, cy + 108, "A", 90, b=True, c=BORD, a="mm")
    # content
    cx = PAD + 40
    iy = cy + 236
    tx(d, cx, iy, "Amara Johnson", 40, b=True)
    tx(d, cx, iy + 52, "Atlanta, GA", 28, c=T3)
    stars_row(d, cx, iy + 96, 4.8, 32)
    tx(d, cx + 5 * 38 + 14, iy + 96, "4.8  (12 reviews)", 28, c=T2, a="la")
    tx(d, cx, iy + 148, "Specializing in natural hair and protective styles.", 28, c=T2)
    tx(d, cx, iy + 184, "8+ years of experience.", 28, c=T2)
    # chips
    chip_x = cx
    chip_y = iy + 232
    for chip in ["Box Braids", "Loc Retwist", "Silk Press"]:
        chip_x += chipd(d, chip_x, chip_y, chip)
    # view button
    by = cy + card_h - 96
    rr(d, cx, by, W - PAD - 40, by + 72, fill=AMB)
    d.text(((cx + W - PAD - 40) // 2, by + 36), "View profile",
           font=F(32, b=True), fill=(255, 251, 235), anchor="mm")
    y = cy + card_h + 24

    # ── Card 2: Kezia Williams (partial) ──────────────────
    cy2 = y
    rr(d, PAD, cy2, W - PAD, cy2 + 290, r=28, fill=CARD, ol=BORD)
    d.rectangle([PAD, cy2, W - PAD, cy2 + 216], fill=CARD2)
    tx(d, W // 2, cy2 + 108, "K", 90, b=True, c=BORD, a="mm")
    tx(d, PAD + 40, cy2 + 232, "Kezia Williams", 40, b=True)
    tx(d, PAD + 40 + 340, cy2 + 232, "· Decatur, GA", 28, c=T3, a="la")
    stars_row(d, PAD + 40, cy2 + 272, 4.3, 28)
    tx(d, PAD + 40 + 5 * 34 + 12, cy2 + 272, "4.3  (5 reviews)", 26, c=T2, a="la")

    # bottom nav hint
    d.rectangle([0, H - 80, W, H], fill=(35, 31, 30))
    d.line([0, H - 80, W, H - 80], fill=BORD, width=2)

    save(img, "screenshot_01_client_discover.png")


# ─────────────────────────────────────────────────────────────
# SCREEN 2 · Client: Specialist profile detail
# ─────────────────────────────────────────────────────────────
def screen2():
    img, d = mk()
    sbar(d)
    hdr_back(d, "Amara Johnson", right="Report", y=66)

    # Hero photo
    d.rectangle([0, 174, W, 420], fill=CARD2)
    tx(d, W // 2, 297, "A", 130, b=True, c=BORD, a="mm")

    y = 446
    # Name + location + rating
    tx(d, PAD, y, "Amara Johnson", 48, b=True)
    tx(d, PAD, y + 58, "Atlanta, GA", 30, c=T3)
    stars_row(d, PAD, y + 106, 4.8, 34)
    tx(d, PAD + 5 * 40 + 14, y + 106, "4.8  ·  12 reviews", 30, c=T2, a="la")
    y += 158

    d.line([PAD, y, W - PAD, y], fill=BORD, width=1); y += 28

    # About
    y = slbl(d, y, "About")
    tx(d, PAD, y, "I specialize in natural hair care, protective styles, and", 30, c=T2)
    tx(d, PAD, y + 40, "locs. With 8+ years of experience I'll make sure your", 30, c=T2)
    tx(d, PAD, y + 80, "hair is healthy, beautiful, and exactly what you want.", 30, c=T2)
    y += 128

    d.line([PAD, y, W - PAD, y], fill=BORD, width=1); y += 28

    # Services
    y = slbl(d, y, "Services")
    services = [
        ("Box Braids",   "1 hr 30 min", "$150"),
        ("Loc Retwist",  "1 hr",        " $80"),
        ("Silk Press",   "45 min",      " $65"),
    ]
    for svc, dur, price in services:
        rr(d, PAD, y, W - PAD, y + 82, fill=CARD2, ol=BORD)
        tx(d, PAD + 28, y + 41, svc, 32, c=T1, a="lm")
        tx(d, PAD + 28 + 260, y + 41, dur, 26, c=T3, a="lm")
        tx(d, W - PAD - 28, y + 41, price, 32, b=True, c=AMBH, a="rm")
        y += 96

    y += 8
    d.line([PAD, y, W - PAD, y], fill=BORD, width=1); y += 28

    # Availability
    y = slbl(d, y, "Availability")
    days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    active_days = {"Mon", "Tue", "Wed", "Thu", "Fri"}
    day_w = (W - PAD * 2 - 6 * 10) // 7
    for i, day in enumerate(days):
        dx = PAD + i * (day_w + 10)
        is_a = day in active_days
        rr(d, dx, y, dx + day_w, y + 66, fill=(60, 30, 10) if is_a else CARD2,
           ol=(120, 60, 20) if is_a else BORD)
        d.text((dx + day_w // 2, y + 33), day, font=F(24, b=is_a),
               fill=AMBH if is_a else BORD, anchor="mm")
    tx(d, PAD, y + 80, "9:00 AM  –  6:00 PM", 28, c=T3)
    y += 128

    d.line([PAD, y, W - PAD, y], fill=BORD, width=1); y += 28

    # Reviews
    y = slbl(d, y, "Reviews")
    rr(d, PAD, y, W - PAD, y + 130, fill=CARD, ol=BORD)
    stars_row(d, PAD + 28, y + 26, 5, 28)
    tx(d, W - PAD - 28, y + 26, "Mar 15, 2025", 24, c=T3, a="ra")
    tx(d, PAD + 28, y + 68, '"Amazing work. My braids lasted 3 months and', 28, c=T2)
    tx(d, PAD + 28, y + 104, 'everyone keeps asking where I got them done."', 28, c=T2)

    # Sticky bottom
    d.rectangle([0, H - 120, W, H], fill=BG)
    d.line([0, H - 120, W, H - 120], fill=BORD, width=2)
    btn(d, H - 108, "Request appointment", h=90)

    save(img, "screenshot_02_client_profile.png")


# ─────────────────────────────────────────────────────────────
# SCREEN 3 · Client: Booking request modal
# ─────────────────────────────────────────────────────────────
def screen3():
    img, d = mk()
    sbar(d)

    # Dimmed BG
    overlay = Image.new("RGB", (W, H), (20, 18, 17))
    img.paste(overlay, (0, 0))
    d = ImageDraw.Draw(img)
    sbar(d)

    # Modal card
    mx, my = PAD - 10, 220
    mw = W - mx * 2
    modal_h = 1360
    rr(d, mx, my, mx + mw, my + modal_h, r=32, fill=CARD, ol=BORD, ow=2)

    y = my + 52

    # Modal header
    tx(d, mx + 40, y, "Request Appointment", 44, b=True)
    y += 58
    tx(d, mx + 40, y, "with Amara Johnson", 32, c=AMBH)
    y += 72

    d.line([mx + 30, y, mx + mw - 30, y], fill=BORD, width=1); y += 36

    # Service field
    tx(d, mx + 40, y, "SERVICE", 22, c=T3); y += 36
    rr(d, mx + 40, y, mx + mw - 40, y + 86, fill=CARD2, ol=BORD)
    tx(d, mx + 68, y + 43, "Box Braids", 34, c=T1, a="lm")
    tx(d, mx + mw - 68, y + 43, "▾", 30, c=T3, a="rm")
    y += 110

    # Date field
    tx(d, mx + 40, y, "DATE", 22, c=T3); y += 36
    rr(d, mx + 40, y, mx + mw - 40, y + 86, fill=CARD2, ol=BORD)
    tx(d, mx + 68, y + 43, "Saturday, May 17, 2025", 34, c=T1, a="lm")
    tx(d, mx + mw - 68, y + 43, "📅", 30, c=T3, a="rm")
    y += 110

    # Time field
    tx(d, mx + 40, y, "PREFERRED TIME", 22, c=T3); y += 36
    rr(d, mx + 40, y, mx + mw - 40, y + 86, fill=CARD2, ol=BORD)
    tx(d, mx + 68, y + 43, "10:00 AM", 34, c=T1, a="lm")
    y += 110

    # Note field
    tx(d, mx + 40, y, "NOTE  (OPTIONAL)", 22, c=T3); y += 36
    rr(d, mx + 40, y, mx + mw - 40, y + 156, fill=CARD2, ol=BORD)
    tx(d, mx + 68, y + 32, "My hair is shoulder length, medium", 32, c=T1)
    tx(d, mx + 68, y + 74, "density. No extensions needed.", 32, c=T1)
    tx(d, mx + 68, y + 116, "Can't wait!", 32, c=T3)
    y += 180

    # Estimated price note
    rr(d, mx + 40, y, mx + mw - 40, y + 66, r=16, fill=(60, 30, 10))
    tx(d, mx + 68, y + 33, "Estimated cost:  $150  ·  1 hr 30 min", 28, c=PEND, a="lm")
    y += 90

    # Send button
    rr(d, mx + 40, y, mx + mw - 40, y + 96, fill=AMB)
    d.text(((mx + 40 + mx + mw - 40) // 2, y + 48), "Send request",
           font=F(36, b=True), fill=(255, 251, 235), anchor="mm")
    y += 116

    # Cancel
    tx(d, mx + mw // 2, y, "Cancel", 30, c=T3, a="mm")

    save(img, "screenshot_03_client_booking.png")


# ─────────────────────────────────────────────────────────────
# SCREEN 4 · Specialist: Bookings management
# ─────────────────────────────────────────────────────────────
def screen4():
    img, d = mk()
    sbar(d)
    # Header with specialist name
    d.rectangle([0, 66, W, 180], fill=BG)
    d.line([0, 180, W, 180], fill=BORD, width=2)
    tx(d, PAD, 96, "Amara Johnson", 48, b=True)
    tx(d, W - PAD, 120, "⚙  Sign out", 28, c=T3, a="rm")

    y = tabbar(d, ["Profile", "Bookings", "Clients"], 1, y=180)
    y += 30

    # UPCOMING
    y = slbl(d, y, "Upcoming")

    # ── Booking 1: Maya Thompson — PENDING ─────────────────
    card_y = y
    rr(d, PAD, card_y, W - PAD, card_y + 250, fill=CARD, ol=BORD)
    cx = PAD + 36
    iy = card_y + 30
    tx(d, cx, iy, "Maya Thompson", 36, b=True)
    bdg(d, cx + 310, iy, "PENDING", PNBG, PEND)
    tx(d, cx, iy + 52, "Box Braids", 30, c=T2)
    tx(d, cx, iy + 92, "Sat, May 17, 2025  ·  10:00 AM", 28, c=T3)
    tx(d, cx, iy + 132, '"My hair is shoulder length, medium density."', 26, c=T3)
    # Action buttons
    smbtn(d, cx, card_y + 184, cx + 260, "Accept", fill=GRN, tc=T1)
    smbtn(d, cx + 276, card_y + 184, cx + 276 + 240, "Decline", fill=RBKG, tc=(252, 165, 165))
    y = card_y + 270

    # ── Booking 2: Jordan Lee — ACCEPTED ───────────────────
    card_y = y
    rr(d, PAD, card_y, W - PAD, card_y + 220, fill=CARD, ol=BORD)
    cx = PAD + 36
    iy = card_y + 30
    tx(d, cx, iy, "Jordan Lee", 36, b=True)
    bdg(d, cx + 230, iy, "ACCEPTED", GBKG, GRN)
    tx(d, cx, iy + 52, "Loc Retwist", 30, c=T2)
    tx(d, cx, iy + 92, "Sun, May 18, 2025  ·  2:00 PM", 28, c=T3)
    smbtn(d, cx, card_y + 154, cx + 220, "Message", fill=CARD2, tc=T2, h=72)
    smbtn(d, cx + 236, card_y + 154, W - PAD - 36, "Mark complete", fill=AMB, tc=(255,251,235), h=72)
    y = card_y + 240

    y += 14
    d.line([PAD, y, W - PAD, y], fill=BORD, width=1)
    y += 28

    # PAST
    y = slbl(d, y, "Past")

    # ── Booking 3: Tanya Brooks — COMPLETED ────────────────
    card_y = y
    rr(d, PAD, card_y, W - PAD, card_y + 170, fill=CARD, ol=BORD)
    cx = PAD + 36
    iy = card_y + 28
    tx(d, cx, iy, "Tanya Brooks", 36, b=True)
    bdg(d, cx + 278, iy, "COMPLETED", CARD2, T3)
    tx(d, cx, iy + 52, "Silk Press", 30, c=T2)
    tx(d, cx, iy + 92, "Sat, May 10, 2025  ·  11:00 AM", 28, c=T3)
    tx(d, W - PAD - 36, iy + 52, "★★★★★", 28, c=AMBL, a="ra")
    y = card_y + 190

    # ── Booking 4: Imani Davis — COMPLETED ─────────────────
    card_y = y
    rr(d, PAD, card_y, W - PAD, card_y + 170, fill=CARD, ol=BORD)
    cx = PAD + 36
    iy = card_y + 28
    tx(d, cx, iy, "Imani Davis", 36, b=True)
    bdg(d, cx + 258, iy, "COMPLETED", CARD2, T3)
    tx(d, cx, iy + 52, "Box Braids", 30, c=T2)
    tx(d, cx, iy + 92, "Fri, May 9, 2025  ·  9:00 AM", 28, c=T3)
    tx(d, W - PAD - 36, iy + 52, "★★★★★", 28, c=AMBL, a="ra")
    y = card_y + 190

    d.rectangle([0, H - 80, W, H], fill=(35, 31, 30))
    d.line([0, H - 80, W, H - 80], fill=BORD, width=2)

    save(img, "screenshot_04_specialist_bookings.png")


# ─────────────────────────────────────────────────────────────
# SCREEN 5 · Specialist: Own profile view
# ─────────────────────────────────────────────────────────────
def screen5():
    img, d = mk()
    sbar(d)
    d.rectangle([0, 66, W, 180], fill=BG)
    d.line([0, 180, W, 180], fill=BORD, width=2)
    tx(d, PAD, 96, "Amara Johnson", 48, b=True)
    tx(d, W - PAD, 120, "⚙  Sign out", 28, c=T3, a="rm")

    y = tabbar(d, ["Profile", "Bookings", "Clients"], 0, y=180)
    y += 36

    # Avatar + edit prompt
    ar = 70
    ax, ay = W // 2, y + ar
    d.ellipse([ax - ar, ay - ar, ax + ar, ay + ar], fill=CARD, outline=BORD, width=3)
    tx(d, ax, ay, "A", 68, b=True, c=T2, a="mm")
    # small edit badge
    d.ellipse([ax + 40, ay + 40, ax + 72, ay + 72], fill=AMB)
    tx(d, ax + 56, ay + 56, "✎", 24, c=(255,251,235), a="mm")
    y = ay + ar + 26

    txc(d, y + 14, "Amara Johnson", 40, b=True)
    txc(d, y + 60, "Atlanta, GA", 28, c=T3)
    stars_row(d, W // 2 - 96, y + 100, 4.8, 28)
    tx(d, W // 2 + 58, y + 100, "4.8  (12 reviews)", 26, c=T2, a="la")
    y += 148

    d.line([PAD, y, W - PAD, y], fill=BORD, width=1); y += 28

    # Bio
    y = slbl(d, y, "Bio")
    rr(d, PAD, y, W - PAD, y + 142, fill=CARD, ol=BORD)
    tx(d, PAD + 28, y + 24, "I specialize in natural hair care, protective", 30, c=T1)
    tx(d, PAD + 28, y + 64, "styles, and locs. 8+ years experience in Atlanta.", 30, c=T1)
    tx(d, PAD + 28, y + 104, "Healthy hair is my passion.", 30, c=T1)
    y += 162

    # Services
    y = slbl(d, y, "Services")
    chip_x = PAD
    for svc in ["Box Braids", "Loc Retwist", "Silk Press", "Twist Out"]:
        chip_x += chipd(d, chip_x, y, svc)
        if chip_x > W - PAD - 200:
            chip_x = PAD
            y += 56
    y += 62

    # Availability
    y = slbl(d, y, "Availability")
    days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    active_days = {"Mon", "Tue", "Wed", "Thu", "Fri"}
    day_w = (W - PAD * 2 - 6 * 10) // 7
    for i, day in enumerate(days):
        dx = PAD + i * (day_w + 10)
        is_a = day in active_days
        rr(d, dx, y, dx + day_w, y + 66, fill=(60, 30, 10) if is_a else CARD2,
           ol=(120, 60, 20) if is_a else BORD)
        d.text((dx + day_w // 2, y + 33), day, font=F(24, b=is_a),
               fill=AMBH if is_a else BORD, anchor="mm")
    y += 80
    tx(d, PAD, y, "9:00 AM  –  6:00 PM", 30, c=T2)
    y += 52

    # Portfolio preview
    y = slbl(d, y, "Portfolio")
    ph_size = (W - PAD * 2 - 2 * 16) // 3
    for i in range(3):
        px = PAD + i * (ph_size + 16)
        d.rounded_rectangle([px, y, px + ph_size, y + ph_size], radius=18, fill=CARD2, outline=BORD, width=2)
        # placeholder icons
        tx(d, px + ph_size // 2, y + ph_size // 2, "◻", 48, c=BORD, a="mm")
    y += ph_size + 36

    # Save button
    btn(d, y, "Save changes")
    d.rectangle([0, H - 80, W, H], fill=(35, 31, 30))
    d.line([0, H - 80, W, H - 80], fill=BORD, width=2)

    save(img, "screenshot_05_specialist_profile.png")


# ─────────────────────────────────────────────────────────────
# SCREEN 6 · Specialist: Messaging with a client
# ─────────────────────────────────────────────────────────────
def screen6():
    img, d = mk()
    sbar(d)
    hdr_back(d, "Maya Thompson", right="Report", y=66)

    # Booking context banner
    bany = 174
    d.rectangle([0, bany, W, bany + 72], fill=CARD2)
    d.line([0, bany, W, bany], fill=BORD, width=1)
    d.line([0, bany + 72, W, bany + 72], fill=BORD, width=1)
    txc(d, bany + 36, "Box Braids  ·  Sat May 17  ·  10:00 AM", 28, c=T3)

    y = bany + 90

    def client_bubble(text_lines, ts, yy):
        bw = max(d.textbbox((0,0), l, font=F(30))[2] for l in text_lines) + 60
        bw = min(bw, W - PAD * 2 - 80)
        bh = len(text_lines) * 44 + 28
        rr(d, PAD, yy, PAD + bw, yy + bh, r=22, fill=CARD, ol=BORD)
        for i, line in enumerate(text_lines):
            tx(d, PAD + 24, yy + 14 + i * 44, line, 30, c=T1)
        tx(d, PAD, yy + bh + 8, ts, 24, c=T3)
        return yy + bh + 46

    def spec_bubble(text_lines, ts, yy):
        bw = max(d.textbbox((0,0), l, font=F(30))[2] for l in text_lines) + 60
        bw = min(bw, W - PAD * 2 - 80)
        bh = len(text_lines) * 44 + 28
        x0 = W - PAD - bw
        rr(d, x0, yy, W - PAD, yy + bh, r=22, fill=(60, 30, 10), ol=(120, 60, 20))
        for i, line in enumerate(text_lines):
            tx(d, x0 + 24, yy + 14 + i * 44, line, 30, c=(255, 251, 235))
        tx(d, W - PAD, yy + bh + 8, ts, 24, c=T3, a="ra")
        return yy + bh + 46

    y = client_bubble(["Hi! I just sent a booking request",
                       "for box braids on May 17."], "2:14 PM", y)
    y += 10
    y = spec_bubble(["Hi Maya! Got your request 😊",
                     "Quick question — medium or",
                     "large box braids?"], "2:16 PM", y)
    y += 10
    y = client_bubble(["Medium please! And I'd love",
                       "them waist length if possible."], "2:18 PM", y)
    y += 10
    y = spec_bubble(["Perfect! Waist length medium braids",
                     "will take about 1.5 hrs. I've",
                     "accepted your appointment —",
                     "see you Saturday! 🎉"], "2:20 PM", y)
    y += 10
    y = client_bubble(["Amazing, thank you so much!",
                       "Can't wait 🙏"], "2:21 PM", y)

    # Input bar
    d.rectangle([0, H - 120, W, H], fill=(35, 31, 30))
    d.line([0, H - 120, W, H - 120], fill=BORD, width=2)
    rr(d, PAD, H - 102, W - PAD - 110, H - 18, fill=CARD, ol=BORD)
    tx(d, PAD + 24, H - 60, "Message...", 30, c=T3, a="lm")
    rr(d, W - PAD - 100, H - 104, W - PAD, H - 16, fill=AMB)
    txc(d, H - 60, "Send", 30, b=True, c=(255, 251, 235))

    save(img, "screenshot_06_specialist_messaging.png")


print("Generating screenshots...")
screen1()
screen2()
screen3()
screen4()
screen5()
screen6()
print("Done.")
