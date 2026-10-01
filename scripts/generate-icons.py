import os
from PIL import Image, ImageDraw

def create_radar_icon(size):
    # Create image with RGBA
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Base dark rounded background
    radius = int(size * 0.22)
    bg_color = (18, 18, 19, 255) # Apple True Dark surface
    draw.rounded_rectangle([(0, 0), (size - 1, size - 1)], radius=radius, fill=bg_color)

    # Center coordinates
    cx, cy = size / 2, size / 2

    # Radar rings
    stroke_w = max(1, int(size * 0.04))
    
    # Outer ring
    r_outer = size * 0.38
    draw.ellipse([cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer], outline=(0, 113, 227, 180), width=stroke_w)

    # Middle ring
    r_mid = size * 0.25
    draw.ellipse([cx - r_mid, cy - r_mid, cx + r_mid, cy + r_mid], outline=(0, 113, 227, 240), width=stroke_w)

    # Center target pulse dot
    r_dot = max(2, int(size * 0.10))
    draw.ellipse([cx - r_dot, cy - r_dot, cx + r_dot, cy + r_dot], fill=(0, 113, 227, 255))

    # Center white beacon
    r_beacon = max(1, int(size * 0.04))
    draw.ellipse([cx - r_beacon, cy - r_beacon, cx + r_beacon, cy + r_beacon], fill=(255, 255, 255, 255))

    return img

def main():
    icons_dir = os.path.join(os.path.dirname(__file__), '..', 'extension', 'icons')
    os.makedirs(icons_dir, exist_ok=True)

    for s in [16, 48, 128]:
        icon = create_radar_icon(s)
        icon_path = os.path.join(icons_dir, f'icon-{s}.png')
        icon.save(icon_path, 'PNG')
        print(f"Generated {icon_path} ({s}x{s})")

if __name__ == '__main__':
    main()
