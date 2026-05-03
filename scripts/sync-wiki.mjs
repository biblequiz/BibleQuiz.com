#!/usr/bin/env node

/**
 * Wiki Sync Script
 * 
 * Clones the GitHub Wiki repository and converts markdown files to MDX format
 * compatible with Astro Starlight. Also copies images to the public directory.
 * 
 * Usage: node scripts/sync-wiki.mjs
 * 
 * Environment variables:
 *   WIKI_REPO_URL - URL to clone the wiki repo (default: derived from GITHUB_REPOSITORY)
 *   GITHUB_REPOSITORY - Repository in format "owner/repo" (set by GitHub Actions)
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync, copyFileSync, statSync } from 'fs';
import { join, basename, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Configuration
const WIKI_CONTENT_DIR = join(ROOT_DIR, 'src/content/docs/wiki');
const WIKI_ASSETS_DIR = join(ROOT_DIR, 'public/assets/wiki');
const TEMP_WIKI_DIR = join(ROOT_DIR, '.wiki-temp');
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']);
const MAX_IMAGE_SIZE_MB = 10; // Skip images larger than this

/**
 * Get the wiki repository URL
 */
function getWikiRepoUrl() {
    if (process.env.WIKI_REPO_URL) {
        return process.env.WIKI_REPO_URL;
    }
    
    const repo = process.env.GITHUB_REPOSITORY;
    if (repo) {
        return `https://github.com/${repo}.wiki.git`;
    }
    
    // Try to get from git remote
    try {
        const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
        // Convert https://github.com/owner/repo.git to https://github.com/owner/repo.wiki.git
        if (remoteUrl.includes('github.com')) {
            return remoteUrl.replace(/\.git$/, '') + '.wiki.git';
        }
    } catch {
        // Ignore errors
    }
    
    throw new Error('Cannot determine wiki repo URL. Set WIKI_REPO_URL or GITHUB_REPOSITORY environment variable.');
}

/**
 * Clone or update the wiki repository
 */
function cloneWikiRepo(wikiUrl) {
    console.log(`Cloning wiki from: ${wikiUrl}`);
    
    // Remove existing temp directory
    if (existsSync(TEMP_WIKI_DIR)) {
        rmSync(TEMP_WIKI_DIR, { recursive: true });
    }
    
    try {
        execSync(`git clone --depth 1 "${wikiUrl}" "${TEMP_WIKI_DIR}"`, {
            stdio: 'inherit',
            timeout: 60000 // 1 minute timeout
        });
    } catch (error) {
        console.log('Wiki repository not found or empty. This is normal for new wikis.');
        console.log('Please create at least one wiki page at: https://github.com/' + 
            (process.env.GITHUB_REPOSITORY || 'your-org/your-repo') + '/wiki');
        return false;
    }
    
    return true;
}

/**
 * Convert a wiki page name to a URL-friendly slug
 */
function toSlug(name) {
    return name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Extract title from markdown content
 */
function extractTitle(content, filename) {
    // Try to find first # heading
    const match = content.match(/^#\s+(.+)$/m);
    if (match) {
        return match[1].trim();
    }
    
    // Fall back to filename
    return filename
        .replace(/\.md$/, '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Convert wiki-style links to standard markdown links
 * [[Page Name]] -> [Page Name](/wiki/page-name)
 * [[Page Name|Display Text]] -> [Display Text](/wiki/page-name)
 */
function convertWikiLinks(content) {
    return content.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, pageName, displayText) => {
        const slug = toSlug(pageName);
        const text = displayText || pageName;
        return `[${text}](/wiki/${slug})`;
    });
}

/**
 * Convert image references to use the wiki assets directory
 */
function convertImagePaths(content) {
    // Match markdown image syntax: ![alt](path)
    return content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, path) => {
        // Skip external URLs
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return match;
        }
        
        // Skip absolute paths that aren't wiki-relative
        if (path.startsWith('/') && !path.startsWith('/wiki/')) {
            return match;
        }
        
        // Convert relative path to wiki assets path
        const filename = basename(path);
        const newPath = `/assets/wiki/${filename}`;
        return `![${alt}](${newPath})`;
    });
}

/**
 * Generate MDX frontmatter
 */
function generateFrontmatter(title, originalFilename) {
    const editPath = originalFilename.replace(/\.md$/, '');
    
    return `---
title: "${title.replace(/"/g, '\\"')}"
editUrl: https://github.com/${process.env.GITHUB_REPOSITORY || 'biblequiz/BibleQuiz.com'}/wiki/${editPath}/_edit
---

`;
}

/**
 * Process a single markdown file
 */
function processMarkdownFile(filepath, filename) {
    console.log(`Processing: ${filename}`);
    
    let content = readFileSync(filepath, 'utf-8');
    
    // Extract title before modifying content
    const title = extractTitle(content, filename);
    
    // Remove the first heading if it matches the title (avoid duplication)
    content = content.replace(/^#\s+.+\n+/, '');
    
    // Convert wiki-style links
    content = convertWikiLinks(content);
    
    // Convert image paths
    content = convertImagePaths(content);
    
    // Generate frontmatter
    const frontmatter = generateFrontmatter(title, filename);
    
    // Determine output filename
    let outputFilename;
    if (filename.toLowerCase() === 'home.md') {
        outputFilename = 'index.mdx';
    } else {
        outputFilename = toSlug(filename.replace(/\.md$/, '')) + '.mdx';
    }
    
    return {
        filename: outputFilename,
        content: frontmatter + content
    };
}

/**
 * Copy image files from wiki to public directory
 */
function copyImages(wikiDir) {
    const imagesCopied = [];
    
    function processDirectory(dir, relativePath = '') {
        if (!existsSync(dir)) return;
        
        const entries = readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = join(dir, entry.name);
            const relPath = relativePath ? join(relativePath, entry.name) : entry.name;
            
            if (entry.isDirectory()) {
                // Skip .git directory
                if (entry.name === '.git') continue;
                processDirectory(fullPath, relPath);
            } else if (entry.isFile()) {
                const ext = extname(entry.name).toLowerCase();
                if (IMAGE_EXTENSIONS.has(ext)) {
                    // Check file size
                    const stats = statSync(fullPath);
                    const sizeMB = stats.size / (1024 * 1024);
                    
                    if (sizeMB > MAX_IMAGE_SIZE_MB) {
                        console.log(`  Skipping large image (${sizeMB.toFixed(2)}MB): ${entry.name}`);
                        continue;
                    }
                    
                    // Copy to assets directory (flatten structure)
                    const destPath = join(WIKI_ASSETS_DIR, entry.name);
                    
                    // Ensure destination directory exists
                    mkdirSync(dirname(destPath), { recursive: true });
                    
                    copyFileSync(fullPath, destPath);
                    imagesCopied.push(entry.name);
                    console.log(`  Copied image: ${entry.name}`);
                }
            }
        }
    }
    
    processDirectory(wikiDir);
    return imagesCopied;
}

/**
 * Clean up old wiki content that no longer exists in the wiki
 */
function cleanupOldContent(currentFiles, currentImages) {
    // Clean up old MDX files
    if (existsSync(WIKI_CONTENT_DIR)) {
        const existingFiles = readdirSync(WIKI_CONTENT_DIR);
        for (const file of existingFiles) {
            if (file.endsWith('.mdx') && !currentFiles.includes(file)) {
                const filepath = join(WIKI_CONTENT_DIR, file);
                rmSync(filepath);
                console.log(`  Removed old file: ${file}`);
            }
        }
    }
    
    // Clean up old images
    if (existsSync(WIKI_ASSETS_DIR)) {
        const existingImages = readdirSync(WIKI_ASSETS_DIR);
        for (const image of existingImages) {
            if (image !== '.gitkeep' && !currentImages.includes(image)) {
                const filepath = join(WIKI_ASSETS_DIR, image);
                if (statSync(filepath).isFile()) {
                    rmSync(filepath);
                    console.log(`  Removed old image: ${image}`);
                }
            }
        }
    }
}

/**
 * Main sync function
 */
async function syncWiki() {
    console.log('=== Wiki Sync Started ===\n');
    
    // Get wiki URL
    let wikiUrl;
    try {
        wikiUrl = getWikiRepoUrl();
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
    
    // Clone wiki
    const cloned = cloneWikiRepo(wikiUrl);
    if (!cloned) {
        console.log('\nNo wiki content to sync.');
        process.exit(0);
    }
    
    // Ensure output directories exist
    mkdirSync(WIKI_CONTENT_DIR, { recursive: true });
    mkdirSync(WIKI_ASSETS_DIR, { recursive: true });
    
    // Process markdown files
    console.log('\nProcessing markdown files...');
    const processedFiles = [];
    const entries = readdirSync(TEMP_WIKI_DIR);
    
    for (const entry of entries) {
        if (entry.endsWith('.md')) {
            const filepath = join(TEMP_WIKI_DIR, entry);
            const result = processMarkdownFile(filepath, entry);
            
            const outputPath = join(WIKI_CONTENT_DIR, result.filename);
            writeFileSync(outputPath, result.content);
            processedFiles.push(result.filename);
        }
    }
    
    // Copy images
    console.log('\nCopying images...');
    const copiedImages = copyImages(TEMP_WIKI_DIR);
    
    // Clean up old content
    console.log('\nCleaning up old content...');
    cleanupOldContent(processedFiles, copiedImages);
    
    // Clean up temp directory
    rmSync(TEMP_WIKI_DIR, { recursive: true });
    
    // Summary
    console.log('\n=== Wiki Sync Complete ===');
    console.log(`  Processed ${processedFiles.length} page(s)`);
    console.log(`  Copied ${copiedImages.length} image(s)`);
    
    // Check for changes
    try {
        const status = execSync('git status --porcelain src/content/docs/wiki public/assets/wiki', {
            encoding: 'utf-8',
            cwd: ROOT_DIR
        }).trim();
        
        if (status) {
            console.log('\nChanges detected:');
            console.log(status);
            return true;
        } else {
            console.log('\nNo changes detected.');
            return false;
        }
    } catch {
        // git status failed, assume changes
        return true;
    }
}

// Run the sync
syncWiki().catch(error => {
    console.error('Sync failed:', error);
    process.exit(1);
});