const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(__dirname, '..', 'public', 'blog-posts', 'hashnode');
const MANIFEST_PATH = path.join(__dirname, '..', 'public', 'blog-posts', 'manifest.json');

function parseFrontmatter(content) {
  // Handle both Unix and Windows line endings
  const normalizedContent = content.replace(/\r\n/g, '\n');
  const frontmatterMatch = normalizedContent.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    throw new Error('No frontmatter found');
  }
  
  const frontmatterText = frontmatterMatch[1];
  const lines = frontmatterText.split('\n');
  const result = {};
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      result[key] = value;
    }
  }
  
  return result;
}

function extractDescription(content, frontmatter) {
  // Use seoDescription if available
  if (frontmatter.seoDescription) {
    return frontmatter.seoDescription;
  }
  
  // Extract from content - handle both Unix and Windows line endings
  const normalizedContent = content.replace(/\r\n/g, '\n');
  const bodyContent = normalizedContent.split('---').slice(2).join('---').trim();
  
  // Remove markdown syntax and get first paragraph
  const cleanText = bodyContent
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/\[.*?\]\(.*?\)/g, '') // Remove links
    .replace(/#{1,6}\s/g, '') // Remove headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/`(.*?)`/g, '$1') // Remove code
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();
  
  // Get first meaningful sentence or paragraph
  const sentences = cleanText.split('.').filter(s => s.trim().length > 20);
  if (sentences.length > 0) {
    let description = sentences[0] + '.';
    
    // If it's too short, add another sentence
    if (description.length < 100 && sentences.length > 1) {
      description += ' ' + sentences[1] + '.';
    }
    
    return description;
  }
  
  return cleanText.substring(0, 200) + '...';
}

function generateManifest() {
  try {
    const files = fs.readdirSync(BLOG_DIR).filter(file => file.endsWith('.md'));
    const posts = [];
    
    for (const file of files) {
      try {
        const filePath = path.join(BLOG_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const frontmatter = parseFrontmatter(content);
        
        posts.push({
          filename: file,
          title: frontmatter.title,
          datePublished: frontmatter.datePublished,
          cuid: frontmatter.cuid,
          slug: frontmatter.slug,
          tags: frontmatter.tags,
          description: extractDescription(content, frontmatter),
          link: `https://blog.striae.org/${frontmatter.slug}`
        });
      } catch (err) {
        console.error(`Error processing ${file}:`, err.message);
      }
    }
    
    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.datePublished) - new Date(a.datePublished));
    
    // Write manifest
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(posts, null, 2));
    console.log(`Generated manifest with ${posts.length} blog posts`);
    
    // Log the latest 3 posts for verification
    console.log('Latest 3 posts:');
    posts.slice(0, 3).forEach(post => {
      console.log(`- ${post.title} (${new Date(post.datePublished).toDateString()})`);
    });
    
  } catch (err) {
    console.error('Error generating manifest:', err);
    process.exit(1);
  }
}

generateManifest();