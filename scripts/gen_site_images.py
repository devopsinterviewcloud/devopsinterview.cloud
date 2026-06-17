#!/usr/bin/env python3
"""Generate the site logo + book covers with gpt-image-2, compositing clean
title text over the AI art (so titles are never misspelled by the model).
Outputs to public/logo.png and public/ebook-covers/*.jpg."""
import base64, json, os, sys, time, urllib.request
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent          # devopsinterview.cloud/
PUBLIC = ROOT / "public"
COVERS = PUBLIC / "ebook-covers"
COVERS.mkdir(parents=True, exist_ok=True)

def load_key():
    for p in [ROOT / ".env", ROOT / ".env.local", ROOT.parent / ".env"]:
        if p.exists():
            for line in p.read_text().splitlines():
                if line.strip().startswith("OPENAI_API_KEY"):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    return os.environ.get("OPENAI_API_KEY", "")

KEY = load_key()
TITLE_FONT = "/home/ubuntu/side-projects/SadhanaGate/app/build/intermediates/packaged_res/debug/packageDebugResources/font/poppins_bold.ttf"
SANS_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"

def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.truetype(SANS_BOLD, size)

def gen(prompt, size, out):
    body = {"model": "gpt-image-2", "prompt": prompt, "size": size, "quality": "high"}
    for attempt in range(4):
        try:
            req = urllib.request.Request(
                "https://api.openai.com/v1/images/generations",
                data=json.dumps(body).encode(),
                headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=300) as r:
                data = json.load(r)
            out.write_bytes(base64.b64decode(data["data"][0]["b64_json"]))
            print("  art:", out.name, out.stat().st_size // 1024, "KB", flush=True)
            return True
        except Exception as e:
            msg = str(e)
            if any(c in msg for c in ("400", "403", "404")) and "model" in msg.lower():
                body["model"] = "gpt-image-1"; continue
            print("  retry", attempt, msg[:120], flush=True)
            if attempt == 3:
                return False
            time.sleep(15 * (attempt + 1))

def wrap(draw, text, fnt, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=fnt) <= max_w:
            cur = t
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines

def scrim(img):
    """Darken the lower ~55% so white text reads, regardless of the art."""
    W, H = img.size
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    start = int(H * 0.42)
    for y in range(start, H):
        a = int(225 * (y - start) / (H - start))
        d.line([(0, y), (W, y)], fill=(8, 15, 40, min(a, 225)))
    return Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB")

def make_cover(art_path, out_path, kicker, title, subtitle):
    img = Image.open(art_path).convert("RGB").resize((1024, 1536))
    img = scrim(img)
    d = ImageDraw.Draw(img)
    W, H = img.size
    margin = 80
    maxw = W - 2 * margin
    f_kick = font(SANS_BOLD, 34)
    f_title = font(TITLE_FONT, 84)
    f_sub = font(SANS_BOLD, 40)
    f_brand = font(SANS_BOLD, 30)
    BLUE = (147, 197, 253)
    WHITE = (255, 255, 255)
    GREY = (203, 213, 225)

    # title wrapped; shrink font if too many lines
    lines = wrap(d, title, f_title, maxw)
    while len(lines) > 3 and f_title.size > 56:
        f_title = font(TITLE_FONT, f_title.size - 8)
        lines = wrap(d, title, f_title, maxw)

    # compute block height to place from a baseline
    lh = f_title.size + 12
    title_h = len(lines) * lh
    y = int(H * 0.60)
    # kicker
    d.text((margin, y), kicker.upper(), font=f_kick, fill=BLUE)
    y += 56
    # title
    for ln in lines:
        d.text((margin, y), ln, font=f_title, fill=WHITE)
        y += lh
    # subtitle
    y += 8
    for ln in wrap(d, subtitle, f_sub, maxw):
        d.text((margin, y), ln, font=f_sub, fill=GREY)
        y += f_sub.size + 8
    # brand at bottom
    d.text((margin, H - margin - 30), "DEVOPSINTERVIEW.CLOUD", font=f_brand, fill=BLUE)

    img.save(out_path, "JPEG", quality=88)
    print("  cover:", out_path.name, out_path.stat().st_size // 1024, "KB", flush=True)

STYLE = ("Professional flat vector-style abstract book-cover background art, portrait orientation. "
         "Deep blue #1e40af dominant over a clean white-to-light-blue gradient, with soft pastel "
         "light-green and light-amber accent shapes. {theme} Geometric, premium, calm, generous empty "
         "space in the lower half, no photorealism, no 3D, no isometric, no people, no logos, and "
         "ABSOLUTELY NO TEXT, NO LETTERS, NO NUMBERS anywhere.")

COVERS_SPEC = [
    ("cloud-mastery.jpg", "Cloud Platforms", "Cloud Interview Mastery", "AWS · Azure · GCP",
     "Three stylized cloud forms linked by thin network lines and small nodes, with a faint world-map arc."),
    ("containers-kubernetes.jpg", "Containers & Orchestration", "Container Orchestration Journey", "Docker to Kubernetes",
     "A balanced grid of rounded container tiles connecting with thin lines to a central hexagonal orchestrator hub."),
    ("iac-automation.jpg", "Infrastructure as Code", "Infrastructure Automation Mastery", "Terraform · Ansible",
     "A blueprint-style grid with modular infrastructure blocks and interlocking gears and pipeline lines."),
    ("cicd-gitops.jpg", "CI/CD & GitOps", "Modern CI/CD & GitOps", "Jenkins · GitHub Actions · Argo CD",
     "Flowing left-to-right pipeline arrows with a branching and merging git graph and a circular automation loop."),
    ("devops-mastery.jpg", "Advanced DevOps", "Senior DevOps Engineer Handbook", "Monitoring · Security · SRE",
     "Layered observability waveforms and dashboard panels with a shield emblem and a circular feedback loop."),
    ("bundle-complete.jpg", "Complete Bundle", "DevOps Mastery Bundle", "All 5 Books",
     "A fanned stack of five layered book-spine cards in graduated deep-blue tones, premium and clean."),
]

def main():
    if not KEY:
        print("NO OPENAI_API_KEY found"); sys.exit(1)
    tmp = COVERS / "_art"
    tmp.mkdir(exist_ok=True)

    # Logo (square, no text)
    logo = PUBLIC / "logo.png"
    if not logo.exists():
        print("logo...", flush=True)
        if gen("Minimal flat vector logo icon, square, centered on a pure white background. A clean "
               "geometric emblem combining a stylized cloud and an upward chevron, deep blue #1e40af "
               "with a light-blue accent, modern, high contrast, app-icon style with generous padding, "
               "no gradients of grey, NO TEXT, NO LETTERS, NO NUMBERS.", "1024x1024", logo):
            Image.open(logo).convert("RGB").resize((512, 512)).save(logo)
            print("  logo saved 512x512", flush=True)

    # Covers
    for fname, kicker, title, sub, theme in COVERS_SPEC:
        out = COVERS / fname
        art = tmp / (fname.replace(".jpg", ".png"))
        print(fname, "...", flush=True)
        if not art.exists():
            if not gen(STYLE.format(theme=theme), "1024x1536", art):
                print("  SKIP (art gen failed)"); continue
        make_cover(art, out, kicker, title, sub)
    print("DONE site images")

if __name__ == "__main__":
    main()
