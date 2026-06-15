#!/usr/bin/env python3
"""Generate rich, premium abstract backgrounds for the covers (gpt-image).
The crisp title/type is composited later by render_covers.py over these."""
import base64, json, os, sys, time, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
BG = ROOT / "scripts" / "_bg"; BG.mkdir(parents=True, exist_ok=True)
def key():
    for p in [ROOT/".env", ROOT/".env.local", ROOT.parent/".env"]:
        if p.exists():
            for l in p.read_text().splitlines():
                if l.strip().startswith("OPENAI_API_KEY"): return l.split("=",1)[1].strip().strip('"').strip("'")
    return os.environ.get("OPENAI_API_KEY","")
K=key()
STYLE=("Premium abstract technology book-cover background art, portrait orientation, high-end and cinematic. "
       "{c} Rich gradient with depth and a soft luminous glow, subtle volumetric 3D geometric forms and a faint "
       "glowing network/particle field with bokeh. Elegant, modern, expensive-looking. The lower-left half must be "
       "calmer and darker so white title text overlaid there stays readable. Absolutely no text, no letters, no "
       "numbers, no people, no logos, no UI, no charts.")
BG_SPEC=[
 ("cloud-mastery.png","Deep royal-blue and indigo palette. Floating translucent glowing cloud-like volumetric shapes connected by thin light lines."),
 ("containers-kubernetes.png","Teal and cyan palette. A glowing hexagonal lattice and floating cubes receding into depth."),
 ("iac-automation.png","Indigo and violet palette. A luminous blueprint grid morphing into glowing modular stacked blocks."),
 ("cicd-gitops.png","Warm orange and amber palette on dark. Flowing luminous ribbon loops of light, like an infinity pipeline."),
 ("devops-mastery.png","Emerald and deep-green palette. Concentric glowing radar rings and a soft pulse/heartbeat wave."),
 ("bundle-complete.png","Dark navy with luxe gold light accents. Premium stacked translucent glass planes and soft golden light rays."),
]
def gen(prompt,out):
    body={"model":"gpt-image-2","prompt":prompt,"size":"1024x1536","quality":"high"}
    for a in range(4):
        try:
            req=urllib.request.Request("https://api.openai.com/v1/images/generations",
                data=json.dumps(body).encode(),headers={"Authorization":f"Bearer {K}","Content-Type":"application/json"})
            with urllib.request.urlopen(req,timeout=300) as r: d=json.load(r)
            out.write_bytes(base64.b64decode(d["data"][0]["b64_json"])); print("bg:",out.name,out.stat().st_size//1024,"KB",flush=True); return True
        except Exception as e:
            m=str(e)
            if any(c in m for c in ("400","403","404")) and "model" in m.lower(): body["model"]="gpt-image-1"; continue
            print("retry",a,m[:100],flush=True)
            if a==3: return False
            time.sleep(15*(a+1))
def main():
    if not K: print("no key"); sys.exit(1)
    for fn,c in BG_SPEC:
        out=BG/fn
        if out.exists(): print("skip",fn,flush=True); continue
        print("gen",fn,"...",flush=True); gen(STYLE.format(c=c),out)
    print("DONE backgrounds")
main()
