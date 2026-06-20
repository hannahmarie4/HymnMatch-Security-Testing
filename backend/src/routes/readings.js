const express = require('express');
const router = express.Router();

const monthMapping = {
  // English
  january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
  // Tagalog
  enero: 0, pebrero: 1, marso: 2, abril: 3, mayo: 4, hunyo: 5, hulyo: 6, agosto: 7, setyembre: 8, oktubre: 9, nobyembre: 10, disyembre: 11
};

function parseDate(dateStr) {
  // Clean up dateStr (e.g. remove spaces, commas)
  const cleaned = dateStr.toLowerCase().replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = cleaned.split(' ');
  
  if (tokens.length === 3) {
    const monthStr = tokens[0];
    const day = parseInt(tokens[1], 10);
    const year = parseInt(tokens[2], 10);
    const month = monthMapping[monthStr];
    if (month !== undefined && !isNaN(day) && !isNaN(year)) {
      const date = new Date(Date.UTC(year, month, day));
      return date.toISOString().split('T')[0];
    }
  } else if (tokens.length === 2) {
    const monthStr = tokens[0];
    const year = parseInt(tokens[1], 10);
    const month = monthMapping[monthStr];
    if (month !== undefined && !isNaN(year)) {
      const date = new Date(Date.UTC(year, month, 1));
      return date.toISOString().split('T')[0];
    }
  }
  return null;
}

router.get('/scrape', async (req, res) => {
  try {
    console.log('[readings] Fetching downloads page from Word & Life...');
    const response = await fetch('https://www.wordandlife.org/downloads.php');
    if (!response.ok) {
      throw new Error(`Failed to fetch downloads page: HTTP ${response.status}`);
    }
    const html = await response.text();
    console.log('[readings] Successfully fetched HTML. Parsing content...');

    const readings = [];
    const parts = html.split('<h3 class="dl-section-title serif">');

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      const headerMatch = part.match(/^([^<]+)<\/h3>/);
      if (!headerMatch) continue;

      const sectionTitle = headerMatch[1].trim();
      let language = 'English';
      if (sectionTitle.toLowerCase().includes('tagalog')) {
        language = 'Tagalog';
      } else if (sectionTitle.toLowerCase().includes('english')) {
        language = 'English';
      } else {
        continue;
      }

      const boxes = part.split('<div class="dl-box">');
      for (let j = 1; j < boxes.length; j++) {
        const boxHtml = boxes[j];
        const dateMatch = boxHtml.match(/<div class="dl-date">([\s\S]*?)<\/div>/);
        const titleMatch = boxHtml.match(/<div class="dl-title">([\s\S]*?)<\/div>/);
        const hrefMatch = boxHtml.match(/href="([^"]+)"/);

        if (dateMatch && titleMatch && hrefMatch) {
          const dateStr = dateMatch[1].replace(/<[^>]+>/g, '').trim();
          const title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
          const pdfUrl = hrefMatch[1].trim();

          const parsedDate = parseDate(dateStr);
          if (parsedDate) {
            readings.push({
              date: parsedDate,
              liturgical_title: title,
              language: language,
              pdf_url: pdfUrl,
              reading_type: 'Complete'
            });
          }
        }
      }
    }

    console.log(`[readings] Scraped ${readings.length} readings successfully.`);
    return res.status(200).json(readings);
  } catch (error) {
    console.error('[readings] Scraping failed:', error.message);
    return res.status(500).json({ error: `Failed to scrape readings: ${error.message}` });
  }
});

module.exports = router;
