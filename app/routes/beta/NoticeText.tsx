import { Link } from '@remix-run/react';

export default function NoticeText() {
  return (
    <>
      <h2>Striae Beta Program Notice</h2>
      <p>We&apos;re excited to invite you to participate in the Striae Beta Program! As part of this exclusive program, you&apos;ll get early access to new features and updates, and help us ensure the best possible experience for all users.</p>
      <p>Please understand that Striae is still in early development. After requesting an invite, you&apos;ll receive a Beta Tester Interest Form to complete by Q2 2025. If selected, you&apos;ll then receive an email with instructions on how to access the beta version of the app.</p>
      <p>Due to the sensitive nature of the data you may use with Striae, please refer to our <Link to="/terms#storage">Data Storage Addendum</Link> in the Terms & Conditions to understand how we handle and store your data within Striae.</p>
      <h2>Important Details</h2>
      <ul>
        <li><p><strong>Beta Spot Not Guaranteed:</strong> Due to limited availability, participation in the beta program is not guaranteed. We&apos;ll do our best to accommodate as many participants as possible.</p></li>
        <li><p><strong>Feedback Required:</strong> To continue enjoying free access to Striae upon the official release, we ask that all beta users complete our feedback surveys during the beta testing period. Your feedback is invaluable in helping us improve the app and deliver the best possible experience. If insufficient feedback is received within the deadlines, you may continue to enjoy free access during the beta testing period only.</p></li>
      </ul>
      <h2>What to Expect</h2>
      <ul>
        <li>Early access to new features and updates</li>
        <li>Opportunities to provide direct feedback and influence the app&apos;s development</li>
        <li>Potential bugs or issues, as the app is still being tested and refined</li>
      </ul>
      <p>By joining the beta program, you&apos;ll be part of shaping the future of Striae. We appreciate your help and look forward to your valuable insights!</p>
    </>
  );
}