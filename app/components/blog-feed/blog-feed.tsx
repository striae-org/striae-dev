import { useState, useEffect } from 'react';
import styles from './blog-feed.module.css';
import sanitizeHtml from 'sanitize-html';

interface BlogPost {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

export const BlogFeed = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogFeed = async () => {
      try {
        // Use RSS2JSON service for reliable RSS feed fetching
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent('https://blog.striae.org/rss.xml')}&count=3`);
        const data = await response.json() as { status: string; items: any[] };
        
        // Check if RSS2JSON returned success
        if (data.status !== 'ok') {
          throw new Error('RSS2JSON service returned error status');
        }
        
        // Map RSS2JSON items directly (no XML parsing needed)
        const blogPosts: BlogPost[] = data.items.map(item => {
          return {
            title: item.title?.trim() || '',
            link: item.link?.trim() || '',
            description: truncateDescription(item.description?.trim() || ''),
            pubDate: formatDate(item.pubDate || '')
          };
        });
        
        setPosts(blogPosts);
      } catch (err) {
        console.error('Error fetching blog feed:', err);
        setError('Unable to load blog posts');
      } finally {
        setLoading(false);
      }
    };

    fetchBlogFeed();
  }, []);

  const truncateDescription = (text: string): string => {
    // Remove HTML tags and dangerous scripts using sanitize-html
    const cleanText = sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }).trim();
    
    // If the text is 150 characters or less, return it as-is
    if (cleanText.length <= 150) {
      return cleanText;
    }
    
    // Truncate to 150 characters
    let truncated = cleanText.substring(0, 150);
    
    // Find the last space to avoid cutting off words
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    // If we found a space and it's not too close to the beginning, cut there
    if (lastSpaceIndex > 100) { // Ensure we don't go too short
      truncated = truncated.substring(0, lastSpaceIndex);
    }
    
    return truncated + '…';
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className={styles.blogSection}>
        <h2 className={styles.blogTitle}>News and Announcements</h2>
        <div className={styles.loading}>Loading latest posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.blogSection}>
        <h2 className={styles.blogTitle}>News and Announcements</h2>
        <div className={styles.error}>
          <p>{error}</p>
          <a 
            href="https://blog.striae.org" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.blogLink}
          >
            Visit the blog →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.blogSection}>
      <h2 className={styles.blogTitle}>News and Announcements</h2>
      <div className={styles.blogContent}>
        {posts.map((post, index) => (
          <article key={index} className={styles.blogPost}>
            <h3 className={styles.postTitle}>
              <a 
                href={post.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.titleLink}
              >
                {post.title}
              </a>
            </h3>
            <p className={styles.postDate}>{post.pubDate}</p>
            <p className={styles.postDescription}>{post.description}</p>
            <a 
              href={post.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.readMoreLink}
            >
              Read more →
            </a>
          </article>
        ))}
        <div className={styles.blogFooter}>
          <a 
            href="https://blog.striae.org" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.allPostsLink}
          >
            View all posts →
          </a>
        </div>
      </div>
    </div>
  );
};