#!/usr/bin/env node

/**
 * Debug script for Practice Set Generator
 * Use this to diagnose issues with question loading and filtering
 */

import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

console.log('\n🔍 Practice Set Generator Debug Report\n');

// Check 1: Excel file exists
const xlsxPath = './public/assets/jbq_questions/jbq questions.xlsx';
console.log('1️⃣  Excel File:');
if (fs.existsSync(xlsxPath)) {
    console.log(`   ✅ Found: ${xlsxPath}`);
    const stats = fs.statSync(xlsxPath);
    console.log(`   📊 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   📅 Modified: ${stats.mtime.toLocaleString()}`);
} else {
    console.log(`   ❌ NOT FOUND: ${xlsxPath}`);
}

// Check 2: Generated JSON file
const jsonPath = './src/data/generated/jbq-questions-analyzed.json';
console.log('\n2️⃣  Generated Questions JSON:');
if (fs.existsSync(jsonPath)) {
    console.log(`   ✅ Found: ${jsonPath}`);
    try {
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        console.log(`   📊 Questions: ${data.totalQuestions || data.questions?.length || 0}`);
        if (data.questions && data.questions.length > 0) {
            const first = data.questions[0];
            console.log(`   ✅ Sample: "${first.text.substring(0, 50)}..."`);
            console.log(`      - Unique words: ${first.analysis.uniqueWordCount}`);
            console.log(`      - Complexity: ${first.analysis.complexityScore}`);
        }
    } catch (e) {
        console.log(`   ❌ JSON Parse Error: ${e instanceof Error ? e.message : e}`);
    }
} else {
    console.log(`   ⚠️  NOT FOUND: ${jsonPath}`);
    console.log(`   📌 Run: npm run process-questions`);
}

// Check 3: Run actual filtering tests
console.log('\n3️⃣  Filtering Tests:');
try {
    if (!fs.existsSync(jsonPath)) throw new Error('Questions file missing');
    
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const questions = data.questions || [];

    if (questions.length === 0) {
        console.log('   ❌ No questions loaded');
    } else {
        // Test 1: All questions
        console.log(`   ✅ All questions: ${questions.length}`);

        // Test 2: Unique words > 2
        const uniqueOver2 = questions.filter(q => q.analysis.uniqueWordCount > 2);
        console.log(`   ✅ Unique words > 2: ${uniqueOver2.length}`);

        // Test 3: Starts with "What"
        const startsWhat = questions.filter(q => 
            q.analysis.startsWithPhrase.toLowerCase().startsWith('what')
        );
        console.log(`   ✅ Starts with "What": ${startsWhat.length}`);

        // Test 4: Has rare words
        const withRare = questions.filter(q => q.analysis.rareWords.length > 0);
        console.log(`   ✅ Has rare words: ${withRare.length}`);

        // Test 5: Point value 20+
        const highValue = questions.filter(q => q.pointValue >= 20);
        console.log(`   ✅ Point value >= 20: ${highValue.length}`);

        // Test 6: Complexity > 60
        const complex = questions.filter(q => q.analysis.complexityScore > 60);
        console.log(`   ✅ Complexity > 60: ${complex.length}`);
    }
} catch (e) {
    console.log(`   ❌ Filtering Error: ${e instanceof Error ? e.message : e}`);
}

// Check 4: Verify React component can load
console.log('\n4️⃣  React Component (Astro File):');
const astroPath = './src/components/apps/practiceSetGenerator/PracticeSetGeneratorApp.astro';
if (fs.existsSync(astroPath)) {
    console.log(`   ✅ Found: ${astroPath}`);
    const content = fs.readFileSync(astroPath, 'utf-8');
    if (content.includes('readFileSync')) {
        console.log(`   ✅ Uses readFileSync to load questions`);
    }
} else {
    console.log(`   ❌ NOT FOUND: ${astroPath}`);
}

// Check 5: Summary & Next Steps
console.log('\n5️⃣  Troubleshooting Steps:');
console.log('\n   If filtering returns no results:');
console.log('   1. Ensure questions are generated:');
console.log('      npm run process-questions');
console.log('   2. Verify the file was created:');
console.log('      ls -lh src/data/generated/jbq-questions-analyzed.json');
console.log('   3. Restart dev server:');
console.log('      npm run dev');
console.log('   4. Check browser console for errors');
console.log('   5. Try opening a fresh browser tab to clear cache');

console.log('\n✅ Debug complete!\n');
