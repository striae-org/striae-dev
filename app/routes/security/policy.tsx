/* eslint-disable react/no-unescaped-entities */
import { baseMeta } from '~/utils/meta';
import { Link } from '@remix-run/react';
import styles from './policy.module.css';

export const meta = () => {
  return baseMeta({
    title: 'Security Policy - Striae',
    description: 'Security policy and vulnerability disclosure guidelines for Striae',
  });
};

export const Policy = () => {
  return (
    <div className={styles.container}>
      <Link to="/" className={styles.logoLink}>
  <div className={styles.logo} />
</Link>
      <div className={styles.content}>
        <h1>Security Policy</h1>
        
        <section>
          <h2>Reporting Security Issues</h2>
          <p>We take the security of Striae seriously. If you believe you have found a security vulnerability, please report it to us responsibly.</p>
          <p />
          <p>Please email security findings to: <Link to="mailto:info@striae.org">info@striae.org</Link></p>
        </section>

        <section>
          <h2>Expectations</h2>
          <ul>
            <li>We will respond to your report within 48 hours</li>
            <li>We will keep you updated as we investigate</li>
            <li>We will not take legal action against researchers acting in good faith</li>
          </ul>
        </section>

        <section>
          <h2>Scope</h2>
          <p>This policy applies to all Striae properties including:</p>
          <ul>
            <li>https://www.striae.org</li>
            <li>All Striae subdomains</li>
            <li>Striae web application</li>
          </ul>
        </section>

        <section>
          <h2>Out of Scope</h2>
          <ul>
            <li>DoS/DDoS attacks</li>
            <li>Spam or social engineering</li>
            <li>Physical security attacks</li>
          </ul>
        </section>
      </div>
    </div>
  );
}