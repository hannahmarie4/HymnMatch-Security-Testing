const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

function getEaster(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

const thematicPools = {
    ordinary: [
        { verse: '"The Lord is my shepherd, I lack nothing." — Ps 23:1', reflection: 'When we surrender our anxieties to the Divine Shepherd, we discover that His providence is entirely sufficient for our spiritual journey. This verse invites us to rest in the quiet assurance that our needs are met through His loving guidance.' },
        { verse: '"Trust in the LORD with all your heart and lean not on your own understanding." — Prov 3:5', reflection: 'True faith requires us to release our grip on self-reliance and place our complete confidence in God\'s divine plan. By letting go of our own limited understanding, we open our hearts to be guided by His eternal wisdom.' },
        { verse: '"I am the light of the world. Whoever follows me will never walk in darkness." — Jn 8:12', reflection: 'In a world often overshadowed by confusion and doubt, Christ stands as the steady light that shows us the true path. Following Him means letting His light illuminate our daily decisions and scatter all our fears.' },
        { verse: '"Rejoice always, pray continually, give thanks in all circumstances." — 1 Thess 5:16-18', reflection: 'A life of continuous prayer and gratitude keeps us anchored in the peace of God despite any earthly trials. By giving thanks in all situations, we align our souls with the Father\'s loving will for us.' },
        { verse: '"Love the Lord your God with all your heart and with all your soul and with all your strength." — Deut 6:5', reflection: 'Loving God with our entire being means that every thought, action, and source of energy is offered as a gift of devotion. This absolute love transforms our relationship with others and anchors our identity in Him.' }
    ],
    solemnity: [
        { verse: '"My soul glorifies the Lord and my spirit rejoices in God my Savior." — Lk 1:46-47', reflection: 'Like the Blessed Mother, our hearts are called to magnify the Lord\'s presence and celebrate the joy of His salvation. This song of praise reminds us that humility allows God to perform great wonders in our lives.' },
        { verse: '"For to us a child is born, to us a son is given, and the government will be on his shoulders." — Is 9:6', reflection: 'The birth of the Prince of Peace brings hope and divine leadership into our fragile human history. We are invited to place our burdens on His capable shoulders and trust in His eternal reign.' },
        { verse: '"This is the day the LORD has made; let us rejoice and be glad in it." — Ps 118:24', reflection: 'Every single day is a precious gift of grace designed for us to live out our faith with joy and gratitude. We are called to embrace the present moment as a sacred opportunity to witness to God\'s goodness.' }
    ],
    lent: [
        { verse: '"Return to me with all your heart, with fasting and weeping and mourning." — Joel 2:12', reflection: 'Lent calls us to turn back to God with sincere repentance and strip away the superficial distractions of life. Through fasting and prayer, we create room for genuine spiritual healing and reconciliation.' },
        { verse: '"Create in me a pure heart, O God, and renew a steadfast spirit within me." — Ps 51:10', reflection: 'This prayer asks God to perform a spiritual restoration in our souls by washing away our past transgressions. By seeking a clean heart, we invite the Holy Spirit to strengthen our resolve to walk in holiness.' }
    ],
    easter: [
        { verse: '"He is not here; he has risen, just as he said." — Mt 28:6', reflection: 'Christ\'s resurrection fulfills the greatest promise of history and conquers the final power of sin and death. This truth fills our hearts with hope, declaring that new life is always possible through Him.' },
        { verse: '"I am the resurrection and the life. The one who believes in me will live, even though they die." — Jn 11:25', reflection: 'Belief in Jesus unites us with His eternal life, transcending the temporary boundaries of physical death. He promises that our faith will lead us into a destiny of endless light and communion with Him.' }
    ],
    advent: [
        { verse: '"Prepare the way for the Lord, make straight paths for him." — Mk 1:3', reflection: 'Advent is a time to remove the obstacles of sin and pride that block God\'s entry into our hearts. We make straight paths for Him by practicing love, patience, and active readiness.' },
        { verse: '"The virgin will conceive and give birth to a son, and they will call him Immanuel." — Mt 1:23', reflection: 'The promise of Immanuel reveals that the infinite God chooses to dwell intimately among us in human form. This miracle reassures us that we are never alone, for God is forever present in our midst.' }
    ]
};

function parseGCatholic(htmlContent) {
    const trRegex = /<tr([^>]*)>([\s\S]*?)<\/tr>/g;
    let match;
    
    const monthsNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    let currentMonth = '';
    let currentSeason = 'Ordinary Time';
    
    const dayGroups = [];
    let currentDay = null;
    
    const cleanText = (h) => {
        if (!h) return '';
        return h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    };
    
    while ((match = trRegex.exec(htmlContent)) !== null) {
        const attrs = match[1];
        const content = match[2];
        
        if (attrs.includes('class="tbhd"')) {
            const idMatch = attrs.match(/id="(\d+)"/);
            if (idMatch) {
                currentMonth = monthsNames[parseInt(idMatch[1], 10) - 1];
            }
            continue;
        }
        
        const seasonMatch = content.match(/<div class="season">([\s\S]*?)<\/div>/);
        if (seasonMatch) {
            currentSeason = cleanText(seasonMatch[1]);
        }
        
        const idMatch = attrs.match(/id="(\d{4})"/);
        if (idMatch) {
            if (currentDay) {
                dayGroups.push(currentDay);
            }
            
            currentDay = {
                id: idMatch[1],
                monthName: currentMonth,
                seasonName: currentSeason,
                rows: [{ attrs, content }]
            };
        } else if (currentDay) {
            if (content.includes('class="indent"') || content.includes('feast')) {
                currentDay.rows.push({ attrs, content });
            }
        }
    }
    
    if (currentDay) {
        dayGroups.push(currentDay);
    }
    
    const parsedDays = [];
    
    for (const group of dayGroups) {
        const monthNum = parseInt(group.id.substring(0, 2), 10);
        const dayNum = parseInt(group.id.substring(2, 4), 10);
        
        const events = [];
        
        for (const row of group.rows) {
            const typeMatch = row.content.match(/class="feast\d*" title="([^"]+)"/);
            const type = typeMatch ? typeMatch[1] : 'Feria';
            
            let color = 'green';
            if (row.content.includes('feastw') || row.content.includes('class="feast"')) color = 'white';
            if (row.content.includes('feastg')) color = 'green';
            if (row.content.includes('feastr')) color = 'red';
            if (row.content.includes('feastv')) color = 'violet';
            if (row.content.includes('feastp')) color = 'rose';
            
            let title = '';
            const cellMatch = row.content.match(/<td>([\s\S]*?)<\/td>/g);
            if (cellMatch) {
                for (const cell of cellMatch) {
                    if (cell.includes('class="indent"')) {
                        title = cleanText(cell);
                        break;
                    }
                }
            }
            
            if (!title && cellMatch && cellMatch.length > 0) {
                const lastCell = cellMatch[cellMatch.length - 1];
                title = cleanText(lastCell);
            }
            
            title = title.replace(/\s+/g, ' ').trim();
            
            if (title) {
                events.push({
                    title,
                    type,
                    color
                });
            }
        }
        
        let primaryEvent = null;
        // Prioritize solemnities, feasts, and memorials over ferias on the calendar grid
        const priorities = ['Solemnity', 'Feast', 'Memorial', 'Optional Memorial', 'Opt. Memorial', 'Feria'];
        
        for (const type of priorities) {
            primaryEvent = events.find(e => e.type === type);
            if (primaryEvent) break;
        }
        
        if (!primaryEvent && events.length > 0) {
            primaryEvent = events[0];
        }
        
        if (!primaryEvent) {
            let defaultTitle = group.seasonName;
            if (group.seasonName === 'Ordinary Time') {
                defaultTitle = 'Ordinary Time';
            }
            let defaultColor = 'green';
            if (group.seasonName === 'Lent' || group.seasonName === 'Advent') {
                defaultColor = 'violet';
            } else if (group.seasonName === 'Easter Time') {
                defaultColor = 'white';
            } else if (group.seasonName === 'Christmas Time') {
                defaultColor = 'white';
            }
            
            primaryEvent = {
                title: defaultTitle,
                type: 'Feria',
                color: defaultColor
            };
        }
        
        parsedDays.push({
            dateCode: group.id,
            month: group.monthName,
            monthNum,
            day: dayNum,
            season: group.seasonName,
            events,
            primaryEvent
        });
    }
    
    return parsedDays;
}

async function getOrScrapeCalendar(year) {
    const cacheDir = path.join(__dirname, '..', 'cache');
    const cachePath = path.join(cacheDir, `calendar_${year}.json`);
    
    if (fs.existsSync(cachePath)) {
        try {
            const data = fs.readFileSync(cachePath, 'utf8');
            return JSON.parse(data);
        } catch (e) {
            console.error(`[calendar] Failed to read calendar cache for ${year}:`, e);
        }
    }
    
    try {
        console.log(`[calendar] Fetching calendar for ${year} from GCatholic...`);
        const url = `https://gcatholic.org/calendar/${year}/PH-en`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} fetching ${url}`);
        }
        const htmlContent = await response.text();
        const parsed = parseGCatholic(htmlContent);
        
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        fs.writeFileSync(cachePath, JSON.stringify(parsed, null, 2), 'utf8');
        console.log(`[calendar] Successfully scraped and cached calendar for ${year}`);
        return parsed;
    } catch (e) {
        console.error(`[calendar] Scraping failed for ${year}:`, e.message);
        return null;
    }
}

function getTwoSentenceReflection(verse) {
    if (!verse) {
        return "Let us open our hearts to the divine word proclaimed in today's liturgy. May its wisdom guide our thoughts and inspire our actions throughout the day.";
    }
    const cleanVerse = verse.toLowerCase();
    if (cleanVerse.includes("ps 23:1")) {
        return "When we surrender our anxieties to the Divine Shepherd, we discover that His providence is entirely sufficient for our spiritual journey. This verse invites us to rest in the quiet assurance that our needs are met through His loving guidance.";
    }
    if (cleanVerse.includes("prov 3:5")) {
        return "True faith requires us to release our grip on self-reliance and place our complete confidence in God's divine plan. By letting go of our own limited understanding, we open our hearts to be guided by His eternal wisdom.";
    }
    if (cleanVerse.includes("jn 8:12")) {
        return "In a world often overshadowed by confusion and doubt, Christ stands as the steady light that shows us the true path. Following Him means letting His light illuminate our daily decisions and scatter all our fears.";
    }
    if (cleanVerse.includes("1 th") || cleanVerse.includes("1 thess")) {
        return "A life of continuous prayer and gratitude keeps us anchored in the peace of God despite any earthly trials. By giving thanks in all situations, we align our souls with the Father's loving will for us.";
    }
    if (cleanVerse.includes("deut 6:5")) {
        return "Loving God with our entire being means that every thought, action, and source of energy is offered as a gift of devotion. This absolute love transforms our relationship with others and anchors our identity in Him.";
    }
    if (cleanVerse.includes("lk 1:46-47")) {
        return "Like the Blessed Mother, our hearts are called to magnify the Lord's presence and celebrate the joy of His salvation. This song of praise reminds us that humility allows God to perform great wonders in our lives.";
    }
    if (cleanVerse.includes("is 9:6")) {
        return "The birth of the Prince of Peace brings hope and divine leadership into our fragile human history. We are invited to place our burdens on His capable shoulders and trust in His eternal reign.";
    }
    if (cleanVerse.includes("ps 118:24")) {
        return "Every single day is a precious gift of grace designed for us to live out our faith with joy and gratitude. We are called to embrace the present moment as a sacred opportunity to witness to God's goodness.";
    }
    if (cleanVerse.includes("joel 2:12")) {
        return "Lent calls us to turn back to God with sincere repentance and strip away the superficial distractions of life. Through fasting and prayer, we create room for genuine spiritual healing and reconciliation.";
    }
    if (cleanVerse.includes("ps 51:10")) {
        return "This prayer asks God to perform a spiritual restoration in our souls by washing away our past transgressions. By seeking a clean heart, we invite the Holy Spirit to strengthen our resolve to walk in holiness.";
    }
    if (cleanVerse.includes("mt 28:6")) {
        return "Christ's resurrection fulfills the greatest promise of history and conquers the final power of sin and death. This truth fills our hearts with hope, declaring that new life is always possible through Him.";
    }
    if (cleanVerse.includes("jn 11:25")) {
        return "Belief in Jesus unites us with His eternal life, transcending the temporary boundaries of physical death. He promises that our faith will lead us into a destiny of endless light and communion with Him.";
    }
    if (cleanVerse.includes("mk 1:3")) {
        return "Advent is a time to remove the obstacles of sin and pride that block God's entry into our hearts. We make straight paths for Him by practicing love, patience, and active readiness.";
    }
    if (cleanVerse.includes("mt 1:23")) {
        return "The promise of Immanuel reveals that the infinite God chooses to dwell intimately among us in human form. This miracle reassures us that we are never alone, for God is forever present in our midst.";
    }
    
    return "Reflecting on this sacred passage, we are invited to deepen our spiritual connection with the divine lessons of the day. Let us carry this verse in our hearts as a source of strength and guidance in all our actions.";
}

router.get('/:year/:month', async (req, res) => {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10) - 1; // 0-indexed

    if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
        return res.status(400).json({ error: "Invalid year or month" });
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarData = [];

    // Attempt to load GCatholic data
    const parsedCalendar = await getOrScrapeCalendar(year);

    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const mm = String(month + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        const dateCode = `${mm}${dd}`;

        // Locate scraped day
        const scrapedDay = parsedCalendar ? parsedCalendar.find(d => d.dateCode === dateCode) : null;

        if (scrapedDay) {
            const seasonName = scrapedDay.season || 'Ordinary Time';
            let seasonKey = 'ordinary';
            if (seasonName.toLowerCase().includes('lent')) seasonKey = 'lent';
            else if (seasonName.toLowerCase().includes('advent')) seasonKey = 'advent';
            else if (seasonName.toLowerCase().includes('easter')) seasonKey = 'easter';
            else if (seasonName.toLowerCase().includes('christmas')) seasonKey = 'solemnity';

            // Generate verse/reflection
            const seed = year * 10000 + month * 100 + day;
            const pool = thematicPools[seasonKey] || thematicPools.ordinary;
            const randIndex = seed % pool.length;

            calendarData.push({
                day: day,
                title: scrapedDay.primaryEvent.title,
                displayTitle: scrapedDay.primaryEvent.title,
                type: scrapedDay.primaryEvent.type,
                color: scrapedDay.primaryEvent.color,
                allEvents: scrapedDay.events,
                verse: pool[randIndex].verse,
                reflection: getTwoSentenceReflection(pool[randIndex].verse),
                date: currentDate.toISOString().split('T')[0]
            });
        } else {
            // FALLBACK LOGIC if scraping failed or date is missing
            const easterDate = getEaster(year);
            const ashWednesday = addDays(easterDate, -46);
            const pentecost = addDays(easterDate, 49);
            const corpusChristiPH = addDays(easterDate, 63); 
            const sacredHeart = addDays(easterDate, 68); 
            const ascensionPH = addDays(easterDate, 42); 
            const christTheKing = new Date(year, 10, 20 + (26 - new Date(year, 10, 20).getDay()) % 7);
            const firstSundayOfAdvent = addDays(christTheKing, 7);

            let title = "Ordinary Time";
            let type = "Ordinary Time";
            let season = "ordinary";
            let color = "green";
            let isSunday = currentDate.getDay() === 0;

            if (currentDate >= ashWednesday && currentDate < easterDate) {
                title = isSunday ? "Sunday of Lent" : "Lenten Feria";
                type = "Lent";
                season = "lent";
                color = "violet";
            } else if (currentDate >= easterDate && currentDate <= pentecost) {
                title = isSunday ? "Sunday of Easter" : "Easter Feria";
                type = "Easter";
                season = "easter";
                color = "white";
            } else if (currentDate >= firstSundayOfAdvent && currentDate < new Date(year, 11, 25)) {
                title = isSunday ? "Sunday of Advent" : "Advent Feria";
                type = "Advent";
                season = "advent";
                color = "violet";
            } else if (currentDate >= new Date(year, 11, 25) || currentDate < new Date(year, 0, 10)) {
                title = "Christmas Time";
                type = "Christmas";
                season = "solemnity";
                color = "white";
            } else if (isSunday) {
                title = "Sunday in Ordinary Time";
            } else {
                title = "Feria";
            }

            // Movable Feasts overrides
            if (currentDate.getTime() === easterDate.getTime()) {
                title = "EASTER SUNDAY OF THE RESURRECTION OF THE LORD";
                type = "Solemnity";
                season = "easter";
                color = "white";
            } else if (currentDate.getTime() === pentecost.getTime()) {
                title = "PENTECOST SUNDAY";
                type = "Solemnity";
                season = "easter";
                color = "red";
            } else if (currentDate.getTime() === ashWednesday.getTime()) {
                title = "ASH WEDNESDAY";
                type = "Ash Wednesday";
                season = "lent";
                color = "violet";
            } else if (currentDate.getTime() === corpusChristiPH.getTime()) {
                title = "SOLEMNITY OF THE MOST HOLY BODY AND BLOOD OF CHRIST (Corpus Christi)";
                type = "Solemnity";
                season = "solemnity";
                color = "white";
            } else if (currentDate.getTime() === sacredHeart.getTime()) {
                title = "SOLEMNITY OF THE MOST SACRED HEART OF JESUS";
                type = "Solemnity";
                season = "solemnity";
                color = "white";
            } else if (currentDate.getTime() === ascensionPH.getTime()) {
                title = "SOLEMNITY OF THE ASCENSION OF THE LORD";
                type = "Solemnity";
                season = "solemnity";
                color = "white";
            }

            // Fixed Feasts overrides
            const m = month + 1;
            if (m === 1 && day === 1) { title = "SOLEMNITY OF MARY, THE HOLY MOTHER OF GOD"; type = "Solemnity"; season = "solemnity"; color = "white"; }
            if (m === 1 && day >= 15 && day <= 21 && isSunday) { title = "FEAST OF THE SANTO NIÑO (Philippines)"; type = "Feast"; season = "solemnity"; color = "white"; }
            if (m === 3 && day === 19) { title = "SOLEMNITY OF SAINT JOSEPH, SPOUSE OF THE BLESSED VIRGIN MARY"; type = "Solemnity"; season = "solemnity"; color = "white"; }
            if (m === 3 && day === 25) { title = "SOLEMNITY OF THE ANNUNCIATION OF THE LORD"; type = "Solemnity"; season = "solemnity"; color = "white"; }
            if (m === 6 && day === 12) { title = "Philippine Independence Day"; type = "Opt. Memorial"; color = "red"; }
            if (m === 6 && day === 24) { title = "SOLEMNITY OF THE NATIVITY OF SAINT JOHN THE BAPTIST"; type = "Solemnity"; season = "solemnity"; color = "white"; }
            if (m === 6 && day === 29) { title = "SOLEMNITY OF SAINTS PETER AND PAUL, APOSTLES"; type = "Solemnity"; season = "solemnity"; color = "red"; }
            if (m === 8 && day === 15) { title = "SOLEMNITY OF THE ASSUMPTION OF THE BLESSED VIRGIN MARY"; type = "Solemnity"; season = "solemnity"; color = "white"; }
            if (m === 11 && day === 1) { title = "SOLEMNITY OF ALL SAINTS"; type = "Solemnity"; season = "solemnity"; color = "white"; }
            if (m === 11 && day === 2) { title = "The Commemoration of All the Faithful Departed (All Souls' Day)"; type = "Memorial"; color = "violet"; }
            if (m === 12 && day === 8) { title = "SOLEMNITY OF THE IMMACULATE CONCEPTION OF THE BLESSED VIRGIN MARY"; type = "Solemnity"; season = "solemnity"; color = "white"; }
            if (m === 12 && day === 25) { title = "THE NATIVITY OF THE LORD (Christmas)"; type = "Solemnity"; season = "solemnity"; color = "white"; }

            // Determine specific text styling string
            let displayTitle = title;
            if (type === "Ordinary Time") {
                displayTitle = isSunday ? "Sunday" : "Feria";
            }

            const seed = year * 10000 + month * 100 + day;
            const pool = thematicPools[season] || thematicPools.ordinary;
            const randIndex = seed % pool.length;

            calendarData.push({
                day: day,
                title: title,
                displayTitle: displayTitle,
                type: type,
                color: color,
                verse: pool[randIndex].verse,
                reflection: getTwoSentenceReflection(pool[randIndex].verse),
                date: currentDate.toISOString().split('T')[0]
            });
        }
    }

    res.json(calendarData);
});

module.exports = router;
