# Baby Bingo

Generate printable, baby-themed bingo cards as PDFs for baby showers!

## Features

- Automatically creates bingo cards with random baby-related icons.
- Supports any number of PNG images in the `img/` folder (images will repeat if fewer than 24).
- "FREE" space in the center of each card.
- Cute blue-themed title and subtitle, with baby icons near the title.
- Output is a centered, printable A4 landscape PDF.

## Usage

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Add PNG images**  
   Place your baby-themed PNG images in the `img/` folder.  
   Example images: `teddy-bear.png`, `baby-footprint-48.png`, `baby-stroller-48.png`, etc.

3. **Generate bingo cards:**
   ```bash
   node index.js [number_of_cards]
   ```
   - Replace `[number_of_cards]` with how many unique cards you want (default is 1).

4. **Find your PDFs:**  
   Generated cards will be in the `result/` folder.

## Customization

- **Icons near the title:**  
  Change the filenames in `index.js` for `leftIcon` and `rightIcon` to use any PNG from your `img/` folder.
- **Grid size:**  
  Change the `rows` and `cols` variables in `index.js` for different bingo layouts.
- **Theme:**  
  Adjust colors and fonts in `index.js` for a different look.

## Requirements

- Node.js
- PNG images in the `img/` folder

---

Enjoy your baby shower!