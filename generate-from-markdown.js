const fs = require('fs');
const marked = require('marked');

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

// Function to determine output folder based on type
const getOutputPath = (type, title) => {
  const folder = type === 'poetry' ? './poetry/' : './stories/';
  const fileName = title.toLowerCase().replace(/\s+/g, '-') + '.html';
  return `${folder}${fileName}`;
};

// Function to generate HTML from Markdown
const generatePageFromMarkdown = (markdownFilePath) => {
  // Read the Markdown file
  const markdownContent = fs.readFileSync(markdownFilePath, 'utf8');

  // Extract metadata and Markdown content
  const { metadata, markdown } = extractMetadata(markdownContent);

  // Validate required metadata fields
  if (!metadata.type || !metadata.title) {
    console.error(`Error: Missing required metadata (type or title) in ${markdownFilePath}`);
    return;
  }

  // Convert Markdown to HTML
  const bodyContent = marked.parse(markdown);

  // Determine output path
  const outputPath = getOutputPath(metadata.type, metadata.title);

  // HTML template
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
          <li><a href="/poetry">Poetry</a></li>
          <li><a href="/stories">Stories</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main>
    <article class="${metadata.type}">
      <h1>${metadata.title}</h1>
      <p class="${metadata.type}-meta">Published on ${metadata.date || 'Unknown Date'}</p>
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

  // Write the final HTML file
  fs.writeFileSync(outputPath, template);
  console.log(`Generated: ${outputPath}`);
};

// Example usage: Generate multiple pages
generatePageFromMarkdown('./content/poetry/my-poem.md');
generatePageFromMarkdown('./content/stories/my-story.md');