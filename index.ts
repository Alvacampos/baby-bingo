import PDFDocument from 'pdfkit';
import fs from 'fs-extra';
import path from 'path';


function generateBingoCard(imageFiles: string[]): { imagePath: string | null; isFree: boolean }[] {
  const totalCells = 25;
  const card = [];

  // Shuffle images to minimize repetition
  let imagesPool = [...imageFiles];
  let poolIndex = 0;

  const getNextImage = () => {
    // If we've used all images, reshuffle and continue
    if (poolIndex >= imagesPool.length) {
      imagesPool = [...imageFiles].sort(() => Math.random() - 0.5);
      poolIndex = 0;
    }
    return imagesPool[poolIndex++];
  };

  for (let i = 0; i < totalCells; i++) {
    if (i === 12) {
      card.push({ imagePath: null, isFree: true });
    } else {
      card.push({ imagePath: getNextImage(), isFree: false });
    }
  }

  return card;
}

async function generateBingoPDF(cardCount: number = 1): Promise<void> {
  await fs.ensureDir('result');

  const imgDir = path.join(__dirname, 'img');
  const imageFiles = (await fs.readdir(imgDir))
    .filter(f => f.endsWith('.png'))
    .map(f => path.join(imgDir, f));

  for (let i = 1; i <= cardCount; i++) {
    const card = generateBingoCard(imageFiles);
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
    const stream = fs.createWriteStream(path.join('result', `bingo_card_${i}.pdf`));
    doc.pipe(stream);

       // Title area with icons and subtitle
    const titleY = 30;
    const iconSize = 60;
    const titleText = "Baby Shower";
    const subtitleText = "Bingo";

     // Paths to your cute icons (make sure these files exist in your img/ folder)
    const leftIcon = path.join(__dirname, 'img', 'teddy-bear.png');
    const rightIcon = path.join(__dirname, 'img', 'baby-footprint-48.png');

    // Draw left icon closer to the title
    doc.image(leftIcon, doc.page.margins.left + 10, titleY + 2, { width: iconSize, height: iconSize });

    // Draw right icon closer to the title
    doc.image(rightIcon, doc.page.width - doc.page.margins.right - iconSize - 10, titleY + 2, { width: iconSize, height: iconSize });

    // Draw title (centered between icons)
    doc.fontSize(38)
      .fillColor('#4FC3F7')
      .font('Helvetica-Bold')
      .text(titleText, doc.page.margins.left + iconSize + 30, titleY + 8, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 2 * (iconSize + 30),
        align: 'center'
      });

    // Draw subtitle just below title with less margin
    doc.fontSize(28)
      .fillColor('#1976D2')
      .font('Helvetica-BoldOblique')
      .text(subtitleText, doc.page.margins.left, titleY + iconSize + 10, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        align: 'center'
      });

    // Move grid up to make more space for the last row
    const titleBlockHeight = iconSize + 40;

    // Grid layout
    const rows = 3;
    const cols = 5;
    const gap = 10;
    const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    // Reduce the reserved space for title area to fit the grid
    const usableHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom - titleBlockHeight - 10;
    const cellSize = Math.min(
      Math.floor((usableWidth - (cols - 1) * gap) / cols),
      Math.floor((usableHeight - (rows - 1) * gap) / rows)
    );
    const totalWidth = cols * cellSize + (cols - 1) * gap;
    const totalHeight = rows * cellSize + (rows - 1) * gap;
    const startX = doc.page.margins.left + (usableWidth - totalWidth) / 2;
    const startY = doc.page.margins.top + titleBlockHeight + 5 + (usableHeight - totalHeight) / 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const x = startX + col * (cellSize + gap);
        const y = startY + row * (cellSize + gap);

        // Border
        doc.roundedRect(x, y, cellSize, cellSize, 12)
          .fillAndStroke('#FFF8F0', '#CCCCCC');

        // Image or FREE
        if (card[idx].isFree) {
          doc.fontSize(20).fillColor('#4A90E2').font('Helvetica-Bold')
            .text('FREE', x, y + cellSize / 2 - 10, { width: cellSize, align: 'center' });
        } else if (card[idx].imagePath) {
          doc.image(card[idx].imagePath, x + 10, y + 10, {
            width: cellSize - 20,
            height: cellSize - 20,
            align: 'center',
            valign: 'center'
          });
        }
      }
    }

    doc.end();
    await new Promise<void>(resolve => stream.on('finish', () => resolve()));
  }
}

// Run script with optional argument
(async function () {
  const numCards = parseInt(process.argv[2], 10) || 1;
  await generateBingoPDF(numCards);
  console.log(`✅ Generated ${numCards} bingo card(s) in /result`);
})();
