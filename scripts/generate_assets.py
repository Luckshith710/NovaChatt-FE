import os
import subprocess
from PIL import Image

def generate_favicons_and_og():
    project1_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    public_dir = os.path.join(project1_dir, "public")
    edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    
    logo_icon_path = os.path.join(public_dir, "logo-icon.png")
    logo_full_path = os.path.join(public_dir, "logo.png")

    if not os.path.exists(logo_icon_path):
        src_img = Image.open(logo_full_path)
        logo_icon = src_img.crop((250, 140, 770, 630))
        logo_icon.save(logo_icon_path)

    # 1. Generate Favicons from logo-icon.png
    icon_img = Image.open(logo_icon_path).convert("RGBA")
    
    # 16x16 PNG
    icon_img.resize((16, 16), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "favicon-16x16.png"))
    # 32x32 PNG
    icon_img.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "favicon-32x32.png"))
    
    # apple-touch-icon 180x180 with rounded dark container
    apple_img = Image.new("RGBA", (180, 180), (10, 5, 20, 255))
    icon_resized = icon_img.resize((150, 150), Image.Resampling.LANCZOS)
    apple_img.paste(icon_resized, (15, 15), icon_resized if icon_resized.mode == "RGBA" else None)
    apple_img.save(os.path.join(public_dir, "apple-touch-icon.png"))

    # favicon.ico
    ico_img = icon_img.resize((48, 48), Image.Resampling.LANCZOS)
    ico_img.save(os.path.join(public_dir, "favicon.ico"), format="ICO", sizes=[(16,16), (32,32), (48,48)])
    print("Favicons (ico, 16x16, 32x32, apple-touch-icon) created from official logo!")

    # 2. Render Open Graph Social Preview Banner (1200x630) using official logo image
    logo_full_url = f"file:///{logo_full_path.replace(os.sep, '/')}"

    og_html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
  * {{ box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }}
  body {{
    width: 1200px;
    height: 630px;
    background: radial-gradient(circle at 70% 30%, #170d2b 0%, #0a0414 70%, #05020a 100%);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 60px 80px;
    position: relative;
    overflow: hidden;
  }}
  .glow-bg {{
    position: absolute;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(71, 191, 255, 0.2) 0%, rgba(134, 59, 255, 0.15) 50%, rgba(0,0,0,0) 75%);
    top: -100px;
    right: -100px;
    pointer-events: none;
  }}
  .glow-bg-left {{
    position: absolute;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(134, 59, 255, 0.2) 0%, rgba(0,0,0,0) 70%);
    bottom: -150px;
    left: -150px;
    pointer-events: none;
  }}
  
  .left-container {{
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    max-width: 620px;
    z-index: 2;
  }}

  .badge {{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(71, 191, 255, 0.12);
    border: 1px solid rgba(71, 191, 255, 0.3);
    color: #47bfff;
    font-size: 14px;
    font-weight: 700;
    padding: 6px 16px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    width: fit-content;
  }}

  .main-title {{
    font-size: 48px;
    font-weight: 800;
    line-height: 1.15;
    margin-top: 16px;
    margin-bottom: 16px;
    letter-spacing: -1px;
    color: #ffffff;
  }}
  .main-title span {{
    background: linear-gradient(135deg, #00d2ff 0%, #a86bff 50%, #ff4b91 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }}

  .description {{
    font-size: 20px;
    color: #a3a1b8;
    line-height: 1.5;
    font-weight: 500;
  }}

  .tech-pills {{
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 24px;
  }}
  .tech-pill {{
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 6px 14px;
    border-radius: 30px;
    font-size: 14px;
    font-weight: 600;
    color: #d1ccf0;
  }}

  .right-container {{
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
  }}
  .logo-preview-img {{
    width: 380px;
    height: 380px;
    border-radius: 40px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(71, 191, 255, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.15);
    object-fit: cover;
  }}
</style>
</head>
<body>
  <div class="glow-bg"></div>
  <div class="glow-bg-left"></div>

  <div class="left-container">
    <div>
      <div class="badge">✦ Official Platform</div>
      <h1 class="main-title">Real-Time Chat &amp; <span>Photo Feed Platform</span></h1>
      <p class="description">
        Connect seamlessly with instant messaging and photo sharing. Built with React, Node.js, Socket.IO, Firebase, MongoDB Atlas, and Cloudinary.
      </p>
    </div>

    <div class="tech-pills">
      <div class="tech-pill">React 19</div>
      <div class="tech-pill">Node.js</div>
      <div class="tech-pill">Socket.IO</div>
      <div class="tech-pill">Firebase Auth</div>
      <div class="tech-pill">MongoDB Atlas</div>
      <div class="tech-pill">Cloudinary</div>
    </div>
  </div>

  <div class="right-container">
    <img src="{logo_full_url}" class="logo-preview-img" alt="NovaChat Logo" />
  </div>
</body>
</html>"""

    temp_og_html = os.path.join(project1_dir, "temp_og.html")
    og_image_png = os.path.join(public_dir, "og-image.png")

    with open(temp_og_html, "w", encoding="utf-8") as f:
        f.write(og_html_content)

    cmd_og = [
        edge_path,
        "--headless",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        "--window-size=1200,630",
        f"--screenshot={og_image_png}",
        f"file:///{temp_og_html.replace(os.sep, '/')}"
    ]
    subprocess.run(cmd_og, check=True)
    print("Rendered og-image.png (1200x630) with official logo successfully!")

    if os.path.exists(temp_og_html):
        os.remove(temp_og_html)

if __name__ == "__main__":
    generate_favicons_and_og()
