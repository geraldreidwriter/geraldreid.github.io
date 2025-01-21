const fs = require('fs');
const path = require('path');
const marked = require('marked');

// Keep track of poems and stories
const contentIndex = { poetry: [], stories: [] };

// Function to extract metadata from Markdown
const extractMetadata = (content) => {
  const metadata = {};
  const metadataMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (metadataMatch) {
    const metadataContent = metadataMatch[1];
    metadataContent.split('\n').forEach((line) => {
      const [key, value] = line.split(':').map((s) => s.trim());
      metadata[key] = value;
    });
  }
  return { metadata, markdown: content.replace(/^---\n[\s\S]*?\n---\n/, '') };
};

// Function to determine output folder and file path
const getOutputPath = (type, title) => {
  const folder = type === 'poetry' ? './poetry/' : './stories/';
  const fileName = title.toLowerCase().replace(/\s+/g, '-') + '.html';
  return `${folder}${fileName}`;
};

// Function to generate HTML for individual content
const generatePageFromMarkdown = (markdownFilePath) => {
  const markdownContent = fs.readFileSync(markdownFilePath, 'utf8');
  const { metadata, markdown } = extractMetadata(markdownContent);

  console.log(`Processing file: ${markdownFilePath}`);
  console.log('Parsed Metadata:', metadata);

  if (!metadata.type || !metadata.title) {
    console.error(`Error in file "${markdownFilePath}": Missing required metadata (type or title). Skipping.`);
    return;
  }

  if (!contentIndex[metadata.type]) {
    contentIndex[metadata.type] = [];
  }

  const formattedDate = metadata.date
    ? new Date(metadata.date).toLocaleDateString('en-US', { year: '2-digit', month: 'numeric', day: 'numeric' })
    : 'Unknown Date';

  contentIndex[metadata.type].push({
    title: metadata.title,
    url: getOutputPath(metadata.type, metadata.title).replace('./', '/'),
    date: formattedDate,
  });

  const bodyContent = marked.parse(markdown);
  const outputPath = getOutputPath(metadata.type, metadata.title);

  const template = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/styles.css">
  <link rel="stylesheet" href="/${metadata.type}.css">
  <title>${metadata.title} - Gerald Reid</title>
</head>
<body>
  <header>
    <div class="header-container">
      <a href="/" class="header-logo">
        <img src="/images/logo.svg" alt="Gerald Reid - Writer" class="logo-img" />
      </a>
      <nav class="nav-menu">
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/poetry/poetry-archive.html">Poetry</a></li>
          <li><a href="/stories/story-archive.html">Stories</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main>
    <article class="${metadata.type}">
      <h1>${metadata.title}</h1>
      <p class="${metadata.type}-meta">Published on ${formattedDate}</p>
      <div class="${metadata.type}-body">
        ${bodyContent}
      </div>
    </article>
  </main>

  <footer>
    <div class="footer-container">
      <p class="footer-text">© 2025 Gerald Reid</p>
      <div class="footer-social">
        <a href="https://medium.com/" aria-label="Medium" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-medium"></i></a>
        <a href="https://instagram.com/" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-instagram"></i></a>
      </div>
    </div>
  </footer>
</body>
</html>
  `;

  fs.writeFileSync(outputPath, template);
  console.log(`Generated: ${outputPath}`);
};

// Function to recursively find .md files in a directory
const findMarkdownFiles = (dir) => {
  const files = fs.readdirSync(dir);
  let markdownFiles = [];
  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      markdownFiles = markdownFiles.concat(findMarkdownFiles(fullPath)); // Recurse into subdirectory
    } else if (fullPath.endsWith('.md')) {
      markdownFiles.push(fullPath); // Add Markdown file
    }
  });
  return markdownFiles;
};

// Function to generate index pages
const generateIndexPage = (type, items) => {
  const title = type === 'poetry' ? 'Poetry Archive' : 'Story Archive';
  const fileName = type === 'poetry' ? 'poetry-archive.html' : 'story-archive.html';
  const outputPath = `./${type}/${fileName}`;

  const listItems = items.map(
    (item) => `<li><a href="${item.url}">${item.title}</a> <span class="meta-date">(${item.date})</span></li>`
  ).join('\n');

  const content = items.length
    ? `<ul>${listItems}</ul>`
    : '<p>No content available yet. Check back soon!</p>';

  const template = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="/styles.css">
  <title>${title} - Gerald Reid</title>
</head>
<body>
  <header>
    <div class="header-container">
      <a href="/" class="header-logo">
        <img src="/images/logo.svg" alt="Gerald Reid - Writer" class="logo-img" />
      </a>
      <nav class="nav-menu">
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/poetry/poetry-archive.html">Poetry</a></li>
          <li><a href="/stories/story-archive.html">Stories</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main>
    <section class="${type}-index">
      <h1>${title}</h1>
      ${content}
    </section>
  </main>

  <footer>
    <div class="footer-container">
      <p class="footer-text">© 2025 Gerald Reid</p>
      <div class="footer-social">
        <a href="https://medium.com/" aria-label="Medium" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-medium"></i></a>
        <a href="https://instagram.com/" aria-label="Instagram" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-instagram"></i></a>
      </div>
    </div>
  </footer>
</body>
</html>
  `;

  fs.writeFileSync(outputPath, template);
  console.log(`Generated: ${outputPath}`);
};

// Function to generate sitemap
const generateSitemap = (contentIndex) => {
  const baseUrl = 'https://geraldreidwriter.github.io';
  const urls = Object.values(contentIndex)
    .flat()
    .map((item) => `
  <url>
    <loc>${baseUrl}${item.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>
  `).join('\n');

  const sitemapTemplate = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
  `;

  fs.writeFileSync('./sitemap.xml', sitemapTemplate.trim());
  console.log('Generated: ./sitemap.xml');
};

// Main function to process all .md files and generate pages
const main = () => {
  const markdownFiles = findMarkdownFiles('./content');
  markdownFiles.forEach((file) => generatePageFromMarkdown(file));

  generateIndexPage('poetry', contentIndex.poetry);
  generateIndexPage('stories', contentIndex.stories);

  generateSitemap(contentIndex);
};

main();