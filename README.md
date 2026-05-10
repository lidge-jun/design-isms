# Design -isms — Visual Reference Board

25개 디자인 -ism의 시각적 레퍼런스 보드.  
각 ism별 3개 이상의 이미지 + 대표 예시 사이트 + 컬러 팔레트.

## Structure

```
701_design-isms/
├── index.html              # Single-page app (GitHub Pages ready)
├── assets/
│   ├── css/style.css       # Sketch-tone aesthetic
│   ├── js/app.js           # JSON loader + masonry + lightbox
│   ├── data/isms.json      # 25 isms with metadata
│   └── images/{ism-id}/    # 3+ images per ism
└── README.md
```

## Deploy

```bash
# GitHub Pages — just push to main and enable Pages
git init && git add -A && git commit -m "init"
gh repo create design-isms --public --source=. --push
# Settings > Pages > Deploy from branch: main
```

## Add/Edit isms

Edit `assets/data/isms.json`. Add images to `assets/images/{ism-id}/`.

## Tech

- Vanilla HTML/CSS/JS (no build step)
- CSS columns masonry layout
- Lightbox for image zoom
- Keyword filter + search
- Sketch-tone (warm paper) background
