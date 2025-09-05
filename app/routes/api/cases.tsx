import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { getUserApiKey } from '~/utils/auth';
import { sessionStorage } from '~/services/session';
import paths from '~/config/config.json';

const USER_WORKER_URL = paths.user_worker_url;

interface UserData {
  cases: Array<{
    createdAt: string;
    caseNumber: string;
  }>;
  updatedAt: string;
  [key: string]: unknown;
}

// Server-side loader function - runs on Cloudflare Pages
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Get session data for authentication
    const session = await sessionStorage.getSession(
      request.headers.get("Cookie")
    );
    
    const userId = session.get("userId");
    if (!userId) {
      return json({ error: 'Unauthorized - please log in' }, { status: 401 });
    }

    // Verify the requested UID matches the authenticated user
    const url = new URL(request.url);
    const requestedUid = url.searchParams.get('uid');
    
    if (!requestedUid || requestedUid !== userId) {
      return json({ error: 'Forbidden - cannot access other user data' }, { status: 403 });
    }

    // Get API key server-side (never exposed to browser)
    const apiKey = await getUserApiKey();
    
    // Make the API call server-side
    const response = await fetch(`${USER_WORKER_URL}/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Auth-Key': apiKey
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch user data:', response.status);
      return json({ cases: [] });
    }

    const userData: UserData = await response.json();
    
    if (!userData?.cases) {
      return json({ cases: [] });
    }

    // Return only the case numbers (no sensitive data)
    const caseNumbers = userData.cases.map(c => c.caseNumber);
    
    return json({ 
      cases: sortCaseNumbers(caseNumbers),
      success: true 
    });
    
  } catch (error) {
    console.error('Error in cases API:', error);
    return json({ 
      error: 'Internal server error',
      cases: [] 
    }, { status: 500 });
  }
}

// Helper function to sort case numbers
function sortCaseNumbers(cases: string[]): string[] {
  return cases.sort((a, b) => {
    // Extract all numbers and letters
    const getComponents = (str: string) => {
      const numbers = str.match(/\d+/g)?.map(Number) || [];
      const letters = str.match(/[A-Za-z]+/g)?.join('') || '';
      return { numbers, letters };
    };

    const aComponents = getComponents(a);
    const bComponents = getComponents(b);

    // Compare numbers first
    const maxLength = Math.max(aComponents.numbers.length, bComponents.numbers.length);
    for (let i = 0; i < maxLength; i++) {
      const aNum = aComponents.numbers[i] || 0;
      const bNum = bComponents.numbers[i] || 0;
      if (aNum !== bNum) return aNum - bNum;
    }

    // If all numbers match, compare letters
    return aComponents.letters.localeCompare(bComponents.letters);
  });
}
