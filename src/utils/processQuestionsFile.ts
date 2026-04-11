/**
 * Utility for reading and analyzing JBQ questions from Excel file
 * Run as a build-time script to generate question metadata
 */

import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import type { Question, QuestionAnalysis, WordStatistics } from '../types/PracticeSetGenerator';

const XLSX_FILE_PATH = path.resolve('./public/assets/jbq_questions/jbq questions.xlsx');
const OUTPUT_FILE_PATH = path.resolve('./src/data/generated/jbq-questions-analyzed.json');

/**
 * Common stop words to exclude from analysis
 */
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

/**
 * Normalize text for analysis (lowercase, remove punctuation)
 */
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[?!.,'";:-]/g, '')
        .trim();
}

/**
 * Split text into words
 */
function getWords(text: string): string[] {
    return normalizeText(text)
        .split(/\s+/)
        .filter(word => word.length > 0);
}

/**
 * Extract unique words, excluding stop words
 */
function getContentWords(text: string): string[] {
    return getWords(text).filter(word => !STOP_WORDS.has(word));
}

/**
 * Analyze a single question
 */
function analyzeQuestion(questionText: string): QuestionAnalysis {
    const words = getWords(questionText);
    const contentWords = getContentWords(questionText);
    const uniqueWords = [...new Set(contentWords)];

    // Calculate word frequency
    const wordFrequency: Record<string, number> = {};
    contentWords.forEach(word => {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });

    // Get starting phrase (first 2-3 meaningful words)
    const startsWithPhrase = words.slice(0, 3).join(' ');

    // Calculate average word length
    const averageWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;

    // Complexity score based on unique word ratio and length
    const uniqueWordRatio = uniqueWords.length / (contentWords.length || 1);
    const lengthScore = Math.min(100, (words.length / 40) * 100);
    const complexityScore = Math.round((uniqueWordRatio * 50) + (lengthScore * 0.5));

    return {
        totalWordCount: words.length,
        uniqueWordCount: uniqueWords.length,
        uniqueWords,
        startsWithPhrase,
        wordFrequency,
        averageWordLength,
        complexityScore,
        rareWords: [], // Will be filled later with cross-document analysis
    };
}

/**
 * Extract scripture reference and books from question
 */
function extractScriptureInfo(text: string): { reference: string; books: string[] } {
    // This is a simplified extraction - you may need to enhance based on actual format
    const bibleBooks = [
        'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
        'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings',
        '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalm',
        'Proverbs', 'Ecclesiastes', 'Song', 'Isaiah', 'Jeremiah', 'Lamentations',
        'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah',
        'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
        'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians',
        '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians',
        '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus',
        'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John',
        '3 John', 'Jude', 'Revelation'
    ];

    let books: string[] = [];
    let reference = '';

    // Look for bible book mentions
    bibleBooks.forEach(book => {
        if (text.toLowerCase().includes(book.toLowerCase())) {
            books.push(book);
        }
    });

    return { reference, books: [...new Set(books)] };
}

/**
 * Identify rare and common words across all questions
 */
function computeWordStatistics(allQuestions: Question[]): WordStatistics {
    const wordFrequencyGlobal: Record<string, number> = {};
    const totalQuestions = allQuestions.length;

    // Count word frequencies across all questions
    allQuestions.forEach(q => {
        const uniqueWords = new Set(q.analysis.uniqueWords);
        uniqueWords.forEach(word => {
            wordFrequencyGlobal[word] = (wordFrequencyGlobal[word] || 0) + 1;
        });
    });

    // Identify rare and common words
    const rareWords = new Set<string>();
    const commonWords = new Set<string>();

    Object.entries(wordFrequencyGlobal).forEach(([word, count]) => {
        const frequency = count / totalQuestions;
        if (frequency < 0.1) { // Appears in less than 10% of questions
            rareWords.add(word);
        } else if (frequency > 0.5) { // Appears in more than 50% of questions
            commonWords.add(word);
        }
    });

    const averageUniqueWords = allQuestions.reduce((sum, q) => sum + q.analysis.uniqueWordCount, 0) / totalQuestions;

    return {
        totalUniqueWords: Object.keys(wordFrequencyGlobal).length,
        rareWords,
        commonWords,
        averageUniqueWords,
    };
}

/**
 * Main function to read and analyze all questions
 */
export async function processQuestionsFile(): Promise<void> {
    console.log(`Reading questions from: ${XLSX_FILE_PATH}`);

    if (!fs.existsSync(XLSX_FILE_PATH)) {
        throw new Error(`Questions file not found: ${XLSX_FILE_PATH}`);
    }

    // Read the Excel file
    const workbook = XLSX.readFile(XLSX_FILE_PATH);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`Found ${data.length} questions`);

    // Process each question
    const questions: Question[] = data.map((row: any, index: number) => {
        const text = row['Question'] || row['question'] || '';
        const answer = row['Answer'] || row['answer'] || '';
        const pointValue = parseInt(row['PointValue'] || row['Point Value'] || row['Points'] || '20');
        const isQuotation = (row['IsQuotation'] || row['Quotation'] || row['Quote'] || '').toString().toLowerCase() === 'true' || row['IsQuotation'] === true;
        const season = parseInt(row['Season'] || row['Year'] || new Date().getFullYear().toString());

        const { reference, books } = extractScriptureInfo(text);
        const analysis = analyzeQuestion(text);

        return {
            id: index + 1,
            text,
            answer,
            pointValue,
            isQuotation,
            scriptureReference: reference,
            books,
            season,
            analysis,
        };
    });

    // Compute word statistics and update rare words
    const wordStats = computeWordStatistics(questions);
    questions.forEach(q => {
        q.analysis.rareWords = q.analysis.uniqueWords.filter(word => wordStats.rareWords.has(word));
    });

    // Prepare output
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

    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE_PATH);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write to file
    fs.writeFileSync(OUTPUT_FILE_PATH, JSON.stringify(output, null, 2));
    console.log(`✓ Analysis complete! Wrote ${questions.length} questions to ${OUTPUT_FILE_PATH}`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    processQuestionsFile().catch(error => {
        console.error('Error processing questions:', error);
        process.exit(1);
    });
}
