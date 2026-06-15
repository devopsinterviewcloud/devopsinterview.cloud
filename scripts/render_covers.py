#!/usr/bin/env python3
"""Render premium, type-led ebook covers from HTML/CSS via Playwright/Chromium
(crisp vector text + flat SVG icons), then save to public/ebook-covers/*.jpg.
This replaces the AI-art-overlay covers with a clean, thumbnail-legible series."""
import base64
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
COVERS = ROOT / "public" / "ebook-covers"
COVERS.mkdir(parents=True, exist_ok=True)
BG = ROOT / "scripts" / "_bg"   # rich AI backgrounds from gen_cover_bg.py
INTER = "/home/ubuntu/devops-ebooks/Interview e-books/v2-cloud-platforms/fonts/Inter-latin-var.woff2"
# Inline assets as data URIs — Chromium blocks file:// subresources on set_content pages.
INTER_B64 = base64.b64encode(Path(INTER).read_bytes()).decode()

def bg_data_uri(path: str) -> str:
    p = Path(path)
    if not p.exists():
        return ""
    return "data:image/png;base64," + base64.b64encode(p.read_bytes()).decode()

W, H = 1024, 1536

# --- flat white SVG icons (simple, recognizable, drawn with primitives) ---
ICONS = {
    "cloud": '<svg viewBox="0 0 170 110"><g fill="#fff"><circle cx="58" cy="60" r="32"/><circle cx="100" cy="50" r="40"/><circle cx="132" cy="66" r="27"/><rect x="42" y="62" width="104" height="38" rx="19"/></g></svg>',
    "hexagon": '<svg viewBox="0 0 100 104"><g fill="none" stroke="#fff" stroke-width="6.5" stroke-linejoin="round" stroke-linecap="round"><polygon points="50,6 88,28 88,74 50,96 12,74 12,28"/><circle cx="50" cy="51" r="11"/><line x1="50" y1="19" x2="50" y2="40"/><line x1="78" y1="36" x2="60" y2="46"/><line x1="72" y1="78" x2="57" y2="61"/><line x1="28" y1="78" x2="43" y2="61"/><line x1="22" y1="36" x2="40" y2="46"/></g></svg>',
    "layers": '<svg viewBox="0 0 100 96"><g fill="none" stroke="#fff" stroke-width="6.5" stroke-linejoin="round" stroke-linecap="round"><polygon points="50,8 90,30 50,52 10,30"/><polyline points="10,48 50,70 90,48"/><polyline points="10,66 50,88 90,66"/></g></svg>',
    "loop": '<svg viewBox="0 0 150 76"><g fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"><circle cx="48" cy="38" r="28"/><circle cx="102" cy="38" r="28"/></g></svg>',
    "shield": '<svg viewBox="0 0 100 112"><g fill="none" stroke="#fff" stroke-width="6.5" stroke-linejoin="round" stroke-linecap="round"><path d="M50 7 L87 22 V53 C87 80 69 97 50 105 C31 97 13 80 13 53 V22 Z"/><polyline points="27,57 41,57 48,42 57,72 64,57 75,57"/></g></svg>',
    "books": '<svg viewBox="0 0 100 100"><g fill="none" stroke="#fff" stroke-width="6.5" stroke-linejoin="round"><rect x="18" y="22" width="64" height="16" rx="3"/><rect x="18" y="44" width="64" height="16" rx="3"/><rect x="18" y="66" width="64" height="16" rx="3"/><line x1="30" y1="22" x2="30" y2="38"/><line x1="30" y1="44" x2="30" y2="60"/><line x1="30" y1="66" x2="30" y2="82"/></g></svg>',
}

BRANDMARK = '<svg viewBox="0 0 150 100"><g fill="#fff"><circle cx="52" cy="50" r="22"/><circle cx="84" cy="44" r="27"/><circle cx="108" cy="58" r="17"/><rect x="40" y="52" width="80" height="22" rx="11"/></g><polygon points="75,96 56,80 75,64 94,80" fill="#fff"/></svg>'

# (filename, [c1,c2] bg gradient, accent, icon, kicker, title, subtitle)
BOOKS = [
    ("cloud-mastery.jpg", ["#1e3a8a", "#2563eb"], "#93c5fd", "cloud",
     "Cloud Platforms", "Cloud Interview Mastery", "AWS · Azure · GCP"),
    ("containers-kubernetes.jpg", ["#0f766e", "#0891b2"], "#5eead4", "hexagon",
     "Containers & Orchestration", "Container Orchestration", "Docker · Kubernetes"),
    ("iac-automation.jpg", ["#4338ca", "#7c3aed"], "#c4b5fd", "layers",
     "Infrastructure as Code", "Infrastructure Automation", "Terraform · Ansible"),
    ("cicd-gitops.jpg", ["#9a3412", "#ea580c"], "#fdba74", "loop",
     "CI/CD & GitOps", "Modern CI/CD &amp; GitOps", "Jenkins · GitHub Actions · Argo CD"),
    ("devops-mastery.jpg", ["#065f46", "#0d9488"], "#6ee7b7", "shield",
     "Advanced DevOps", "Senior DevOps Handbook", "Monitoring · Security · SRE"),
    ("bundle-complete.jpg", ["#0b1220", "#1e3a8a"], "#fbbf24", "books",
     "Complete Bundle", "DevOps Mastery Bundle", "All 5 Books · One Price"),
]

def html(c1, c2, accent, icon, kicker, title, subtitle, bg_path):
    # Rich AI art as the background, with a dark gradient scrim so the type stays
    # crisp and readable. Solid color is a fallback if the art is missing.
    art = bg_data_uri(bg_path)
    bg = (f"linear-gradient(to bottom, rgba(6,9,24,0) 0%, rgba(6,9,24,0.04) 34%, rgba(6,9,24,0.42) 64%, rgba(6,9,24,0.88) 100%), "
          f"url('{art}') center/cover no-repeat" if art
          else f"linear-gradient(150deg, {c1} 0%, {c2} 100%)")
    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face {{ font-family:'Inter'; src:url(data:font/woff2;base64,{INTER_B64}) format('woff2'); font-weight:100 900; font-style:normal; }}
* {{ margin:0; padding:0; box-sizing:border-box; }}
html,body {{ width:{W}px; height:{H}px; }}
.cover {{ position:relative; width:{W}px; height:{H}px; overflow:hidden; background:{bg};
  font-family:'Inter',sans-serif; color:#fff; display:flex; flex-direction:column;
  justify-content:space-between; padding:92px 84px; }}
.head {{ position:relative; display:flex; align-items:center; gap:14px; z-index:2; }}
.head .bm {{ width:34px; height:34px; filter:drop-shadow(0 2px 8px rgba(0,0,0,.4)); }}
.brand {{ font-weight:700; font-size:22px; letter-spacing:.16em; opacity:.9; text-shadow:0 2px 10px rgba(0,0,0,.5); }}
.mid {{ position:relative; z-index:2; }}
.icon {{ width:128px; height:128px; margin-bottom:40px; opacity:.92; filter:drop-shadow(0 6px 20px rgba(0,0,0,.45)); }}
.icon svg {{ width:100%; height:100%; }}
.kicker {{ display:inline-block; background:rgba(255,255,255,.18); color:#fff;
  font-weight:700; font-size:24px; letter-spacing:.14em; text-transform:uppercase;
  padding:11px 20px; border-radius:999px; }}
.title {{ font-weight:800; font-size:106px; line-height:1.02; letter-spacing:-.02em;
  margin:30px 0 26px; text-shadow:0 2px 16px rgba(0,0,0,.75), 0 8px 40px rgba(0,0,0,.5); }}
.rule {{ width:96px; height:7px; border-radius:4px; background:{accent}; margin-bottom:26px; }}
.sub {{ font-weight:500; font-size:40px; color:rgba(255,255,255,.94); text-shadow:0 2px 16px rgba(0,0,0,.5); }}
.foot {{ position:relative; z-index:2; display:flex; justify-content:space-between; align-items:center;
  font-weight:600; font-size:24px; letter-spacing:.04em; color:rgba(255,255,255,.82); text-shadow:0 2px 12px rgba(0,0,0,.5); }}
.foot .edition {{ color:{accent}; }}
</style></head><body>
<div class="cover">
  <div class="head"><span class="bm">{BRANDMARK}</span><span class="brand">DEVOPSINTERVIEW.CLOUD</span></div>
  <div class="mid">
    <div class="icon">{ICONS[icon]}</div>
    <span class="kicker">{kicker}</span>
    <h1 class="title">{title}</h1>
    <div class="rule"></div>
    <p class="sub">{subtitle}</p>
  </div>
  <div class="foot"><span>Senior Interview Prep</span><span class="edition">2026 Edition</span></div>
</div></body></html>"""

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--allow-file-access-from-files"])
        page = browser.new_page(viewport={"width": W, "height": H}, device_scale_factor=2)
        for fname, (c1, c2), accent, icon, kicker, title, sub in BOOKS:
            bg_path = str(BG / (fname[:-4] + ".png"))
            page.set_content(html(c1, c2, accent, icon, kicker, title, sub, bg_path), wait_until="networkidle")
            page.evaluate("document.fonts.ready")
            page.wait_for_timeout(250)
            png = COVERS / (fname[:-4] + ".png")
            page.screenshot(path=str(png))
            # downscale the 2x screenshot to exact 1024x1536 and save crisp JPG
            Image.open(png).convert("RGB").resize((W, H), Image.LANCZOS).save(COVERS / fname, "JPEG", quality=92)
            png.unlink()
            print("cover:", fname, (COVERS / fname).stat().st_size // 1024, "KB", flush=True)
        browser.close()
    print("DONE covers")

if __name__ == "__main__":
    main()
