const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');

// Helper to get teddy bear SVG path (simple, happy style)
function getTeddyBearSVG() {
    // Simple teddy bear SVG path (head, ears, smile)
    // Source: https://fontawesome.com/icons/bear?s=solid (simplified)
    return 'M256 96a64 64 0 1 1 0 128 64 64 0 1 1 0-128zm-96-64a48 48 0 1 1 0 96 48 48 0 1 1 0-96zm192 0a48 48 0 1 1 0 96 48 48 0 1 1 0-96zm-96 192c-70.7 0-128 57.3-128 128v32c0 53 43 96 96 96h64c53 0 96-43 96-96v-32c0-70.7-57.3-128-128-128zm-40 112a16 16 0 1 1 32 0 16 16 0 1 1-32 0zm80 0a16 16 0 1 1 32 0 16 16 0 1 1-32 0zm-56 40c0 13.3 21.5 24 48 24s48-10.7 48-24c0-8-10.7-16-24-16h-48c-13.3 0-24 8-24 16z';
}

// TileMaker: returns an object with number and image path
function TileMaker(number, imagePath) {
    return { number, imagePath };
}

// BingoCardGenerator: returns a 2D array of tiles with random images
function BingoCardGenerator(rows = 5, cols = 5, imageFiles = []) {
    // Generate unique numbers for the card
    const numbers = [];
    while (numbers.length < rows * cols) {
        const n = Math.floor(Math.random() * 100) + 1; // 1-100
        if (!numbers.includes(n)) numbers.push(n);
    }
    let idx = 0;
    const card = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            // Pick a random image for each tile
            const img = imageFiles[Math.floor(Math.random() * imageFiles.length)];
            row.push(TileMaker(numbers[idx++], img));
        }
        card.push(row);
    }
    return card;
}

// Generate PDF with bingo card(s)
async function generateBingoPDF(cardCount = 1) {
    await fs.ensureDir('result');
    // Get all PNG images from img folder and shuffle them for randomness
    const imgDir = path.join(__dirname, 'img');
    let imageFiles = (await fs.readdir(imgDir))
        .filter(f => f.endsWith('.png'))
        .map(f => path.join(imgDir, f));

    // Shuffle helper
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    for (let i = 1; i <= cardCount; i++) {
        // Shuffle images for each card for more randomness
        const shuffledImages = shuffle([...imageFiles]);

        // Use A4 landscape for more width
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
        const filename = `bingo_card_${i}.pdf`;
        const stream = fs.createWriteStream(path.join('result', filename));
        doc.pipe(stream);

        // Teddy bear background (centered, faded)
        doc.save();
        doc.translate(doc.page.width / 2, doc.page.height / 2);
        doc.path(getTeddyBearSVG()).scale(1.7).fillOpacity(0.08).fill('#A0522D');
        doc.restore();

        // Title
        doc.fontSize(36).fillColor('#FF69B4').font('Helvetica-Bold')
            .text('Bruno BabyShower', { align: 'center', underline: true });
        // Date
        doc.moveDown(0.2);
        doc.fontSize(18).fillColor('#8B4513').font('Helvetica')
            .text('Date: 14/06/2025', { align: 'center' });

        // Bingo grid
        const rows = 3;
        const cols = 5;
        const card = BingoCardGenerator(rows, cols, shuffledImages);

        // Calculate grid size and center it inside the dotted border
        const cellWidth = 90;
        const cellHeight = 90;
        const cellMargin = 18;
        const gridWidth = cols * cellWidth + (cols - 1) * cellMargin;
        const gridHeight = rows * cellHeight + (rows - 1) * cellMargin;
        // Wider border for landscape
        const borderX = 30;
        const borderY = 40;
        const borderWidth = doc.page.width - 60; // much wider now
        const borderHeight = doc.page.height - 80;
        const startX = borderX + (borderWidth - gridWidth) / 2;
        const startY = borderY + (borderHeight - gridHeight) / 2 + 30; // +30 to push below title/date

        for (let r = 0; r < card.length; r++) {
            for (let c = 0; c < card[0].length; c++) {
                const x = startX + c * (cellWidth + cellMargin);
                const y = startY + r * (cellHeight + cellMargin);

                // Baby-friendly border: pastel color, double border, shadow
                doc.save();
                doc.roundedRect(x, y, cellWidth, cellHeight, 22)
                    .fillAndStroke('#F0F8FF', '#87CEFA');
                doc.lineWidth(2);
                doc.roundedRect(x + 4, y + 4, cellWidth - 8, cellHeight - 8, 16)
                    .stroke('#FFD1DC');
                doc.restore();

                // Draw PNG image centered
                if (card[r][c].imagePath) {
                    const imgSize = 48;
                    doc.image(
                        card[r][c].imagePath,
                        x + (cellWidth - imgSize) / 2,
                        y + (cellHeight - imgSize) / 2 - 8,
                        { width: imgSize, height: imgSize }
                    );
                }

                // Draw number in lower right
                doc.fontSize(20).fillColor('#8B4513').font('Helvetica-Bold')
                    .text(
                        card[r][c].number,
                        x + cellWidth - 32,
                        y + cellHeight - 32,
                        { width: 30, align: 'right' }
                    );
            }
        }

        // Cute border (dashed pink) - use new borderX, borderY, borderWidth, borderHeight
        doc.save();
        doc.lineWidth(4);
        doc.dash(10, { space: 6 });
        doc.strokeColor('#FF69B4');
        doc.rect(borderX, borderY, borderWidth, borderHeight).stroke();
        doc.undash();
        doc.restore();

        doc.end();
        await new Promise(resolve => stream.on('finish', resolve));
    }
}

// IIFE to run everything
(async function () {
    const numCards = parseInt(process.argv[2], 10) || 1;
    await generateBingoPDF(numCards);
    console.log(`Generated ${numCards} bingo card PDF(s) in result/`);
})();