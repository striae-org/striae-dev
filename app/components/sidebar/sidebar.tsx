import { User } from 'firebase/auth';
import { useState } from 'react';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
import { SignOut } from '~/components/actions/signout';
import styles from './sidebar.module.css';
import { json } from '@remix-run/cloudflare';
import paths from '~/config.json';
import type { CloudflareContext, CustomLoaderArgs } from '~/types/actions';
 
  interface CaseData {
  uid: string;
  caseNumber: string;
  createdAt: string;
}
  interface FileData {
  name: string;
  size: number;
  lastModified: string;
  type: string;
}

interface LoaderData {
  cases: CaseData[];
  files?: FileData[];
}

interface SidebarProps {
  user: User;  
}

interface ActionData {
  success?: boolean;
  error?: string;
  files?: FileData[];
}

const WORKER_URL = paths.data_worker_url;

export const loader = async ({ context, user }: CustomLoaderArgs) => {
  if (!user) {
    return json<LoaderData>({ cases: [] });
  }

  try {
    const response = await fetch(`${WORKER_URL}/${user.uid}/cases.json`, {
      method: 'GET',
      headers: {        
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': context.cloudflare.env.R2_KEY_SECRET
      }
    });

    if (!response.ok) {
      // Handle 404 separately as it's an expected case for new users
      if (response.status === 404) {
        return json<LoaderData>({ cases: [] });
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const cases: CaseData[] = await response.json();
    
    // Ensure cases is an array and sort by creation date
    const sortedCases = (Array.isArray(cases) ? cases : [])
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return json<LoaderData>({ cases: sortedCases });
  } catch (error) {
    console.error('Error loading cases:', error);
    return json<LoaderData>({ cases: [] });
  }
};

export const action = async ({ request, context }: { request: Request; context: CloudflareContext }) => {
  const formData = await request.formData();
  const intent = formData.get('intent');
  const uid = formData.get('uid') as string;
  const caseNumber = formData.get('caseNumber') as string;

  // Handle case deletion
  if (intent === 'delete') {
    try {
      // First get existing cases
      const getCases = await fetch(`${WORKER_URL}/${uid}/cases.json`, {
        headers: {
          'X-Custom-Auth-Key': context.cloudflare.env.R2_KEY_SECRET
        }
      });
      
      const existingCases: CaseData[] = await getCases.json() || [];
      const updatedCases = existingCases.filter(c => c.caseNumber !== caseNumber);

      // Update cases.json without the deleted case
      const response = await fetch(`${WORKER_URL}/${uid}/cases.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Auth-Key': context.cloudflare.env.R2_KEY_SECRET
        },
        body: JSON.stringify(updatedCases)
      });

      if (!response.ok) throw new Error('Failed to delete case');
      return json({ success: true });
    } catch (error) {
      return json({ error: 'Failed to delete case' }, { status: 500 });
    }
  }

  // Create new case
  try {
    // First get existing cases
    const getCases = await fetch(`${WORKER_URL}/${uid}/cases.json`, {
      headers: {
        'X-Custom-Auth-Key': context.cloudflare.env.R2_KEY_SECRET
      }
    });
    
    const existingCases: CaseData[] = await getCases.json() || [];
    
    // Check if case already exists
    if (existingCases.some(c => c.caseNumber === caseNumber)) {
      return json({ error: 'Case number already exists' }, { status: 400 });
    }

    // Add new case
    const newCase: CaseData = {
      uid,
      caseNumber,
      createdAt: new Date().toISOString()
    };

    const updatedCases = [...existingCases, newCase].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const response = await fetch(`${WORKER_URL}/${uid}/cases.json`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': context.cloudflare.env.R2_KEY_SECRET
      },
      body: JSON.stringify(updatedCases)
    });

    if (!response.ok) throw new Error('Failed to create case');
    return json({ success: true });
  } catch (error) {
    return json({ error: 'Failed to create case' }, { status: 500 });
  }
};

export const Sidebar = ({ user }: SidebarProps) => {
  const actionData = useActionData<ActionData>();
  const { cases, files } = useLoaderData<typeof loader>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const EmptyState = ({ message }: { message: string }) => (
    <div className={styles.emptyState}>
      <p>{message}</p>
    </div>
  );

  return (
    <div className={styles.sidebar}>
      <div className={styles.userInfo}>
        <h3 className={styles.title}>
          {user.displayName ? `${user.displayName}'s` : "User's"} Striae
          </h3>
        <SignOut />
      </div>

      <Form 
        method="put" 
        className={styles.caseForm}
        onSubmit={() => setIsCreating(true)}
      >
        <input type="hidden" name="actionType" value="sidebar" />
        <input type="hidden" name="uid" value={user.uid} />
        <input
          required
          name="caseNumber"
          type="text"
          placeholder="Enter case number"
          disabled={isCreating}
        />
        <button type="submit" disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Create Case'}
        </button>
      </Form>

      {actionData?.error && (
        <div className={styles.error}>{actionData.error}</div>
      )}

      <div className={styles.caseList}>
        <h4>Cases</h4>
        {!cases?.length ? (
          <EmptyState message="No cases available" />
        ) : (
          cases.map((caseItem) => (
            <div key={caseItem.caseNumber} className={styles.caseItem}>
              <span>{caseItem.caseNumber}</span>
              <Form 
                method="put" 
                style={{ display: 'inline' }}
                onSubmit={() => setIsDeleting(true)}
              >
                <input type="hidden" name="actionType" value="sidebar" />
                <input type="hidden" name="intent" value="delete" />
                <input type="hidden" name="uid" value={user.uid} />
                <input type="hidden" name="caseNumber" value={caseItem.caseNumber} />
                <button 
                  type="submit"
                  disabled={isDeleting}
                  onClick={(e) => {
                    if (!confirm('Delete this case?')) {
                      e.preventDefault();
                    }
                  }}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </Form>
            </div>
          ))
        )}
      </div>

      <div className={styles.fileList}>
        <h4>Files</h4>
        {!files?.length ? (
          <EmptyState message="No files available" />
        ) : (
          files.map((file) => (
            <div key={file.name} className={styles.fileItem}>
              <span>{file.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};