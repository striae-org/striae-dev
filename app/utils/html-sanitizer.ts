/**
 * HTML Sanitization Utility
 * 
 * Provides secure HTML escaping for user-generated content
 * embedded in email templates and other HTML contexts.
 * 
 * @module html-sanitizer
 */

/**
 * Escapes HTML special characters to prevent injection attacks
 * 
 * Converts characters that have special meaning in HTML into their
 * HTML entity equivalents to ensure they are rendered as text rather
 * than interpreted as markup.
 * 
 * @param text - Raw user input that may contain HTML characters
 * @returns Safely escaped string suitable for embedding in HTML
 * 
 * @example
 * ```typescript
 * escapeHtml('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 * 
 * escapeHtml('John & Jane <test@example.com>')
 * // Returns: 'John &amp; Jane &lt;test@example.com&gt;'
 * ```
 */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Escapes multiple string values for safe HTML embedding
 * 
 * Convenience function for escaping an object of string values.
 * Useful when preparing multiple user inputs for email templates.
 * 
 * @param values - Object containing string values to escape
 * @returns New object with all string values HTML-escaped
 * 
 * @example
 * ```typescript
 * const userInput = {
 *   name: '<script>alert("xss")</script>',
 *   email: 'test@example.com',
 *   company: 'ACME & Co.'
 * };
 * 
 * const safe = escapeHtmlObject(userInput);
 * // Returns: {
 * //   name: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
 * //   email: 'test@example.com',
 * //   company: 'ACME &amp; Co.'
 * // }
 * ```
 */
export function escapeHtmlObject<T extends Record<string, any>>(
  values: T
): T {
  const escaped = {} as T;
  
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'string') {
      escaped[key as keyof T] = escapeHtml(value) as T[keyof T];
    } else {
      escaped[key as keyof T] = value;
    }
  }
  
  return escaped;
}
