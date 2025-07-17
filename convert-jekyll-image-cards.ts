import path from "path";
import fs from 'fs';

const filePath = process.argv[2];

let content = fs.readFileSync(filePath, 'utf8');

// Regex to match a full image-card block (url, html, include)
const blockRegex = /{%\s*capture\s+image_url\s*%}([\s\S]*?){%\s*endcapture\s*%}\s*{%\s*capture\s+image_html\s*%}([\s\S]*?){%\s*endcapture\s*%}\s*{%\s*capture\s+image_html\s*%}{{\s*image_html\s*\|\s*markdownify\s*}}\s*{%\s*endcapture\s*%}\s*{%\s*include\s+image-card\.html\s+link=image_url\s+alt="([^"]*)"\s+html=image_html\s*%}/g;

// Regex to match a block with only html and alt (no image_url)
const htmlOnlyBlockRegex = /{%\s*capture\s+image_html\s*%}([\s\S]*?){%\s*endcapture\s*%}\s*{%\s*capture\s+image_html\s*%}{{\s*image_html\s*\|\s*markdownify\s*}}\s*{%\s*endcapture\s*%}\s*{%\s*include\s+image-card\.html\s+alt="([^"]*)"\s+html=image_html\s*%}/g;

// Helper to extract the image path from `{% link ... %}`
function extractImagePath(jekyllLink: string) {
  const match = jekyllLink.match(/{%\s*link\s+([^\s%]+)\s*%}/);
  if (match) {
    // Ensure leading slash for Astro static assets
    const newImagePath: string = '/' + match[1].replace(/^\/+/, '');
    const sourcePath = `..${newImagePath}`;
    const destinationPath = `./public${newImagePath}`;
    fs.copyFileSync(sourcePath, destinationPath);

    return newImagePath;
  }
  return '';
}

// Replace blocks with image_url, image_html, alt
content = content.replace(blockRegex, (match, urlBlock, htmlBlock, alt) => {
  const imagePath = extractImagePath(urlBlock.trim());
  return `<TeamRosterCard\n  source="${imagePath}"\n  alt="${alt}">\n${htmlBlock.trim()}\n</TeamRosterCard>`;
});

console.log(content);

// Replace blocks with only html and alt (no image_url)
content = content.replace(htmlOnlyBlockRegex, (match, htmlBlock, alt) => {
  return `<TeamRosterCard alt="${alt}">\n${htmlBlock.trim()}\n</TeamRosterCard>`;
});

// Remove any remaining orphaned `{% capture image_html %}...{% endcapture %}` blocks
content = content.replace(/{%\s*capture\s+image_html\s*%}([\s\S]*?){%\s*endcapture\s*%}/g, '');

// Remove any remaining orphaned `{% capture image_url %}...{% endcapture %}` blocks
content = content.replace(/{%\s*capture\s+image_url\s*%}([\s\S]*?){%\s*endcapture\s*%}/g, '');

// Remove any remaining `{% capture ... %}` or `{% endcapture %}` lines
content = content.replace(/{%\s*capture[^\n]*%}\n?/g, '');
content = content.replace(/{%\s*endcapture\s*%}\n?/g, '');

// Remove any remaining `{% include image-card.html ... %}` lines
content = content.replace(/{%\s*include\s+image-card\.html[^\n]*%}\n?/g, '');

// fs.writeFileSync(filePath, content, 'utf8');
console.log(`Converted file written to ${filePath}`);