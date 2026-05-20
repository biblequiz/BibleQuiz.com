#!/usr/bin/env node

/**
 * Build-time utility to process JBQ questions from Excel file
 * Run this before building the site to generate question metadata
 *
 * Usage: npm run process-questions
 *        node scripts/process-questions.mjs
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import XLSX from 'xlsx';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

const XLSX_FILE_PATH = join(projectRoot, 'public/assets/jbq_questions/jbq questions.xlsx');
const OUTPUT_DIR = join(projectRoot, 'src/data/generated');
const OUTPUT_FILE_PATH = join(OUTPUT_DIR, 'jbq-questions-analyzed.json');

// Common stop words to exclude from analysis
const STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
    'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each',
    'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
    'nor', 'not', 'only', 'same', 'so', 'than', 'too', 'very', 'just',
]);

function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/[?!.,'";:-]/g, '')
        .trim();
}

function getWords(text) {
    return normalizeText(text)
        .split(/\s+/)
        .filter(word => word.length > 0);
}

function getContentWords(text) {
    return getWords(text).filter(word => !STOP_WORDS.has(word));
}

function analyzeQuestion(questionText) {
    const words = getWords(questionText);
    const contentWords = getContentWords(questionText);
    const uniqueWords = [...new Set(contentWords)];

    const wordFrequency = {};
    contentWords.forEach(word => {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });

    const startsWithPhrase = words.slice(0, 3).join(' ');
    const averageWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;

    const uniqueWordRatio = uniqueWords.length / (contentWords.length || 1);
    const lengthScore = Math.min(100, (words.length / 40) * 100);
    const complexityScore = Math.round(uniqueWordRatio * 50 + lengthScore * 0.5);

    return {
        totalWordCount: words.length,
        uniqueWordCount: uniqueWords.length,
        uniqueWords,
        startsWithPhrase,
        wordFrequency,
        averageWordLength: parseFloat(averageWordLength.toFixed(2)),
        complexityScore,
        rareWords: [],
    };
}

function extractScriptureInfo(text) {
    const bibleBooks = [
        'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
        'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings',
        '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalm', 'Psalms',
        'Proverbs', 'Ecclesiastes', 'Song', 'Isaiah', 'Jeremiah', 'Lamentations',
        'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah',
        'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
        'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians',
        '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians',
        '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus',
        'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John',
        '3 John', 'Jude', 'Revelation'
    ];

    let books = [];
    bibleBooks.forEach(book => {
        if (text.toLowerCase().includes(book.toLowerCase())) {
            books.push(book);
        }
    });

    return { reference: '', books: [...new Set(books)] };
}

function computeWordStatistics(allQuestions) {
    const wordFrequencyGlobal = {};
    const totalQuestions = allQuestions.length;

    allQuestions.forEach(q => {
        const uniqueWords = new Set(q.analysis.uniqueWords);
        uniqueWords.forEach(word => {
            wordFrequencyGlobal[word] = (wordFrequencyGlobal[word] || 0) + 1;
        });
    });

    const rareWords = new Set();
    const commonWords = new Set();

    Object.entries(wordFrequencyGlobal).forEach(([word, count]) => {
        const frequency = count / totalQuestions;
        if (frequency < 0.1) {
            rareWords.add(word);
        } else if (frequency > 0.5) {
            commonWords.add(word);
        }
    });

    const averageUniqueWords = allQuestions.reduce((sum, q) => sum + q.analysis.uniqueWordCount, 0) / totalQuestions;

    return {
        totalUniqueWords: Object.keys(wordFrequencyGlobal).length,
        rareWords,
        commonWords,
        averageUniqueWords: parseFloat(averageUniqueWords.toFixed(2)),
    };
}

async function processQuestionsFile() {
    console.log(`📂 Reading questions from: ${XLSX_FILE_PATH}`);

    if (!fs.existsSync(XLSX_FILE_PATH)) {
        throw new Error(`Questions file not found: ${XLSX_FILE_PATH}`);
    }

    const workbook = XLSX.readFile(XLSX_FILE_PATH);
    
    // Find the correct sheet (should be "jbq questions")
    let sheetName = 'jbq questions';
    if (!workbook.SheetNames.includes(sheetName)) {
        sheetName = workbook.SheetNames[workbook.SheetNames.length - 1];
        console.log(`⚠️  "jbq questions" sheet not found, using "${sheetName}" instead`);
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Found ${data.length} questions in sheet "${sheetName}"`);

    const questions = data.map((row, index) => {
        const id = row['Id'] || row['ID'] || index + 1;
        const text = row['Question'] || '';
        const answer = row['Answer'] || '';
        const pointValue = parseInt(row['Points'] || row['Point Value'] || '10');
        const isQuotation = 
            (row['Quote?'] || row['Quotation'] || row['IsQuotation'] || false) === true ||
            (row['Quote?'] || row['Quotation'] || row['IsQuotation'] || '').toString().toLowerCase() === 'true';
        const category = row['Category'] || '';
        const season = parseInt(row['Season'] || row['Year'] || new Date().getFullYear().toString());

        const { reference, books } = extractScriptureInfo(text);
        const analysis = analyzeQuestion(text);

        return {
            id,
            text,
            answer,
            pointValue,
            isQuotation,
            scriptureReference: reference,
            books,
            season,
            category,
            analysis,
        };
    });

    const wordStats = computeWordStatistics(questions);
    questions.forEach(q => {
        q.analysis.rareWords = q.analysis.uniqueWords.filter(word => wordStats.rareWords.has(word));
    });

    const output = {
        generatedAt: new Date().toISOString(),
        totalQuestions: questions.length,
        wordStatistics: {
            totalUniqueWords: wordStats.totalUniqueWords,
            averageUniqueWords: wordStats.averageUniqueWords,
            rareWordsCount: wordStats.rareWords.size,
            commonWordsCount: wordStats.commonWords.size,
        },
        questions,
    };

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE_PATH, JSON.stringify(output, null, 2));
    console.log(`✅ Analysis complete! Generated data for ${questions.length} questions`);
    console.log(`📄 Output saved to: ${OUTPUT_FILE_PATH}`);
}

console.log('🚀 Processing JBQ questions Excel file...\n');

try {
    await processQuestionsFile();
    console.log('\n✨ Done!');
    process.exit(0);
} catch (error) {
    console.error('\n❌ Failed to process questions:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
}

