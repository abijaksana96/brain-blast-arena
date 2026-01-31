import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const soalDir = path.join(publicDir, 'soal');

if (!fs.existsSync(soalDir)) {
    fs.mkdirSync(soalDir, { recursive: true });
}

// Use memory storage first, then save with proper filename
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Only parse filenames that EXPLICITLY follow soal format: soal_X_Y or q_X_Y
// Do NOT try to extract random numbers from arbitrary filenames
const parseFilename = (filename) => {
    const nameWithoutExt = filename.replace(/\.(png|jpg|jpeg|gif|webp|bmp)$/i, '');

    // Only match explicit soal format: soal_1_5, soal-2-10, q_3_5, q-4-10
    const patterns = [
        /^soal[_\-](\d+)[_\-](\d+)$/i,  // soal_1_5 or soal-1-5
        /^q[_\-](\d+)[_\-](\d+)$/i,      // q_1_5 or q-1-5
    ];

    for (const pattern of patterns) {
        const match = nameWithoutExt.match(pattern);
        if (match) {
            return {
                questionNumber: Number(match[1]),
                points: Number(match[2]),
            };
        }
    }

    // No pattern matched - return null, let server auto-assign
    return null;
};

const getExistingQuestionNumbers = () => {
    const files = fs.existsSync(soalDir) ? fs.readdirSync(soalDir) : [];
    const numbers = files
        .map((name) => {
            const match = name.match(/soal_(\d+)_/i);
            return match ? Number(match[1]) : 0;
        })
        .filter(Boolean);
    return new Set(numbers);
};

const getNextQuestionNumber = (existingSet) => {
    let nextId = 1;
    while (existingSet.has(nextId)) {
        nextId++;
    }
    return nextId;
};

app.use('/soal', express.static(soalDir));

app.post('/api/upload', upload.array('files'), (req, res) => {
    const files = req.files || [];
    if (!files.length) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const meta = (() => {
        try {
            return JSON.parse(req.body.meta || '[]');
        } catch {
            return [];
        }
    })();

    const results = [];
    const errors = [];

    // Get all existing question numbers from disk
    const existingNumbers = getExistingQuestionNumbers();
    console.log('Existing question numbers on disk:', [...existingNumbers]);

    files.forEach((file, index) => {
        const metaItem = meta[index];
        let questionNumber = Number(metaItem?.questionNumber || 0);
        let points = Number(metaItem?.points || 0);

        // If no metadata provided, try parsing filename
        if (!questionNumber || !points) {
            const parsed = parseFilename(file.originalname);
            if (parsed) {
                questionNumber = parsed.questionNumber;
                points = parsed.points;
            }
        }

        // Auto-assign question number if still not set
        if (!questionNumber) {
            questionNumber = getNextQuestionNumber(existingNumbers);
            // Add to set so next file in batch gets different number
            existingNumbers.add(questionNumber);
            console.log(`Auto-assigned question number ${questionNumber} for ${file.originalname}`);
        } else {
            // Also add explicitly set numbers to prevent duplicates within batch
            existingNumbers.add(questionNumber);
        }

        // Auto-assign points based on question number:
        // Questions 1-10 = 5 points, Questions 11-15 = 10 points
        if (!points) {
            points = questionNumber <= 10 ? 5 : 10;
            console.log(`Auto-assigned ${points} points for question ${questionNumber}`);
        }

        if (!questionNumber || !points) {
            errors.push({ originalName: file.originalname, error: 'Missing questionNumber or points' });
            return;
        }

        const ext = path.extname(file.originalname) || '.png';
        const filename = `soal_${questionNumber}_${points}${ext}`;
        const filepath = path.join(soalDir, filename);

        fs.writeFileSync(filepath, file.buffer);

        results.push({
            id: questionNumber,
            points,
            url: `/soal/${filename}`,
            filename,
            originalName: file.originalname,
        });
    });

    if (errors.length) {
        return res.status(400).json({ error: 'Some files failed to upload', details: errors });
    }

    return res.json({ items: results });
});

// GET endpoint to list existing questions from disk
app.get('/api/questions', (req, res) => {
    if (!fs.existsSync(soalDir)) {
        return res.json({ items: [] });
    }

    const files = fs.readdirSync(soalDir);
    const items = files
        .filter(name => /\.(png|jpg|jpeg|gif|webp|bmp)$/i.test(name))
        .map(name => {
            const match = name.match(/^soal_(\d+)_(\d+)\./i);
            if (match) {
                return {
                    id: Number(match[1]),
                    points: Number(match[2]),
                    url: `/soal/${name}`,
                    filename: name,
                    originalName: name,
                };
            }
            return null;
        })
        .filter(Boolean)
        .sort((a, b) => a.id - b.id);

    console.log(`Loaded ${items.length} existing questions from disk`);
    return res.json({ items });
});

app.listen(PORT, () => {
    console.log(`Upload server running on http://localhost:${PORT}`);
});
