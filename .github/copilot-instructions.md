# Striae - AI Coding Agent Instructions

## Project Overview
Striae is a cloud-native forensic annotation application for firearms examination, built on Remix + Cloudflare infrastructure with a microservices architecture using Cloudflare Workers.

## Architecture & Service Boundaries
- **Frontend**: Remix app (`app/`) deployed to Cloudflare Pages
- **Backend**: 6 specialized Cloudflare Workers in `workers/` directory:
  - `user-worker`: User management and authentication validation
  - `image-worker`: Image upload/processing via Cloudflare Images
  - `pdf-worker`: PDF generation using Puppeteer
  - `data-worker`: Case and annotation data management (R2 storage)
  - `keys-worker`: API key management and authentication
  - `turnstile-worker`: CAPTCHA and bot protection
- **Data Layer**: Cloudflare KV (user data), R2 (case data), Images (file storage), Firebase Auth (identity)

## Development Workflow & Commands

### Core Development Commands
```bash
npm run dev          # Start local dev with Firebase emulators
npm run build        # Build for production
npm run deploy:all   # Deploy everything (use scripts/deploy-all.sh)
npm run emulators    # Firebase auth emulator only
```

### Worker-Specific Deployment
```bash
npm run deploy-workers:data      # Deploy specific worker
npm run deploy-workers:secrets   # Deploy environment variables
```

### Configuration Management
- Main config: `app/config/config.json` (worker URLs, auth keys)
- Firebase config: `app/config/firebase.ts`
- Worker configs: `workers/*/wrangler.jsonc` (not .toml!)
- Example configs in `config-example/` - copy and customize

## Code Patterns & Conventions

### Component Architecture
- **Location**: All components in `app/components/[feature]/`
- **Structure**: Each component has its own directory with `.tsx` and `.module.css`
- **Patterns**: 
  - Use TypeScript interfaces for props
  - CSS Modules for styling (not Tailwind for components)
  - Export component as named export, not default

Example component structure:
```tsx
// app/components/toolbar/toolbar.tsx
interface ToolbarProps {
  onToolSelect?: (toolId: ToolId, active: boolean) => void;
}

export const Toolbar = ({ onToolSelect }: ToolbarProps) => {
  // Component logic
};
```

### Mobile Responsiveness Policy
- **Desktop-First Application**: Striae is designed exclusively for desktop environments
- **Limited Mobile Support**: Only the home route (`app/routes/home/`) and marketing pages should include mobile responsive CSS classes
- **No Mobile Classes in App Components**: Components in `app/components/` should NOT include mobile responsive styles or media queries
- **Rationale**: The forensic annotation workflow requires precise cursor control, large screens, and desktop-specific interactions that are not suitable for mobile devices
- **Media Query Usage**: 
  - ✅ **Allowed**: `app/routes/home/`, `app/routes/auth/`, public-facing pages
  - ❌ **Forbidden**: All components in `app/components/`, application workflow pages
  - ❌ **Never Use**: Mobile-first responsive patterns in core application features

### Global CSS & Component Styling
- **Global Button Effects**: Enhanced hover effects are globally applied via `app/styles/root.module.css`
  - All buttons automatically get `transform: translateY(-1px)` on hover
  - Enhanced shadows using `box-shadow: 0 2px 6px color-mix(...)`
  - Opt-out available with `data-no-enhance` attribute
  - **Never duplicate**: Avoid adding `translateY(-1px)` in individual component CSS
- **CSS Modules Pattern**: Use `color-mix(in lab, var(--color) 85%, var(--black))` for hover darkening effects
- **Transitions**: Always use design system timing: `var(--durationS)` with `var(--bezierFastoutSlowin)`

### Text Truncation Standards
- **Character-based truncation**: Use 150 characters as standard limit for descriptions
- **Word boundary preservation**: Always find last space within limit to avoid cutting words
- **Ellipsis character**: Use `…` (Unicode U+2026) instead of `...` for better rendering
- **Implementation pattern**:
  ```typescript
  const truncated = text.substring(0, 150);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 100) truncated = truncated.substring(0, lastSpace);
  return truncated + '…';
  ```

### Mobile Detection & Device Targeting
- **Desktop-only enforcement**: Mobile warning triggers at `max-width: 1024px` to include tablets
- **Multi-method detection**: Combine screen size + user agent detection for comprehensive coverage
- **Target devices**: Discourage phones (0-768px) AND tablets (768px-1024px)
- **User agent patterns**: Check for `/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini|tablet/i`

### Route Organization
- **Pattern**: Feature-based routing in `app/routes/[feature]/`
- **Index routes**: Use `_index.tsx` for route entry points
- **Route imports**: Import components from feature directories, not direct files
```tsx
// app/routes/_index.tsx
import Home, { meta } from './home/home';
export { meta };
export default function App() {
  return <Home />;
}
```

### State Management
- **Auth**: React Context (`app/contexts/auth.context.tsx`) with Firebase Auth
- **Local State**: useState/useEffect with custom hooks in `app/hooks/`

### API Communication
- **Worker URLs**: Defined in `app/config/config.json`
- **CORS**: All workers have strict CORS to `https://www.striae.org`
- **Auth**: Workers use key-based auth + Firebase token validation
- **Error Handling**: Structured error responses with types

### Centralized Utility Patterns
- **Always Use Centralized Functions**: Never make direct API calls to workers - use utility functions instead
- **Data Operations** (`app/utils/data-operations.ts`):
  ```tsx
  // ✅ CORRECT: Use centralized functions
  import { getCaseData, updateCaseData, duplicateCaseData } from '~/utils/data-operations';
  const caseData = await getCaseData(user, caseNumber);
  await updateCaseData(user, caseNumber, updatedData);
  
  // ❌ WRONG: Direct worker API calls
  const response = await fetch(`${DATA_WORKER_URL}/${user.uid}/${caseNumber}/data.json`);
  ```
- **Permission Management** (`app/utils/permissions.ts`):
  ```tsx
  // ✅ CORRECT: Use centralized permission functions
  import { canModifyCase, canAccessCase, getUserData, updateUserData } from '~/utils/permissions';
  const accessResult = await canModifyCase(user, caseNumber);
  const userData = await getUserData(user);
  
  // ❌ WRONG: Direct user worker calls or permission bypassing
  const response = await fetch(`${USER_WORKER_URL}/${user.uid}`);
  ```
- **Audit Service** (`app/services/audit.service.ts`):
  ```tsx
  // ✅ CORRECT: Always audit security-sensitive operations
  import { auditService } from '~/services/audit.service';
  await auditService.logCaseCreation(user, caseNumber, caseName);
  await auditService.markEmailVerificationSuccessful(user, reason);
  ```
- **Benefits of Centralized Utilities**:
  - Automatic API key management and session validation
  - Consistent error handling and logging
  - Built-in permission validation (no accidental bypasses)
  - Easier testing and maintenance
  - Single source of truth for business logic

### Development Best Practices
- **CSS Redundancy**: When adding global styles, remove redundant component-level styles to avoid duplication
- **Button Hover Effects**: Never add `transform: translateY(-1px)` to individual components - handled globally
- **Mobile Query Cleanup**: When removing mobile responsiveness, check for leftover disabled button states
- **Type Centralization**: Import types from `~/types` barrel exports, not direct file paths
- **Component Export Pattern**: Use named exports, not default exports for components
- **Centralized Function Creation**: When creating new data operations, always:
  - Add to appropriate utility module (`data-operations.ts`, `permissions.ts`, etc.)
  - Include proper error handling and logging
  - Implement permission validation by default
  - Document parameters and return types
  - Follow existing naming conventions (`getCaseData`, `updateUserData`, etc.)
- **Utility Function Updates**: When modifying centralized functions:
  - Check all call sites for impact
  - Maintain backward compatibility when possible
  - Update TypeScript interfaces if data structures change
  - Add audit logging for new security-sensitive operations

### Security & Access Control Patterns
- **NEVER Bypass Access Validation**: Avoid using `{ validateAccess: false }` without explicit security justification
- **Permission-First Design**: Always check user permissions before performing data operations
- **Case Access Control**:
  ```tsx
  // ✅ CORRECT: Check permissions before case operations
  const accessResult = await canModifyCase(user, caseNumber);
  if (!accessResult.allowed) {
    throw new Error(`Access denied: ${accessResult.reason}`);
  }
  await updateCaseData(user, caseNumber, caseData);
  
  // ❌ WRONG: Bypassing access validation
  await updateCaseData(user, caseNumber, caseData, { validateAccess: false });
  ```
- **Audit Trail Integration**: All security-sensitive operations should log audit events
- **Case Duplication Security**: Always validate destination case permissions during duplication operations

### TypeScript Type Safety Standards
- **No `any` Casting**: Use proper interfaces and type guards instead of `any` type assertions
- **Proper Interface Design**: Create dedicated interfaces instead of repeated inline type intersections
- **Type Guard Pattern**: Use type guard functions for safe property checking
  ```tsx
  // ✅ CORRECT: Type guard for read-only cases
  const isReadOnlyCaseData = (caseData: CaseData): caseData is ReadOnlyCaseData => {
    return 'isReadOnly' in caseData && typeof (caseData as ReadOnlyCaseData).isReadOnly === 'boolean';
  };
  
  // ❌ WRONG: Using any casting
  return !!(caseData as any).isReadOnly;
  ```
- **Extended User Data**: Use `ExtendedUserData` interface instead of `UserData & { readOnlyCases?: ReadOnlyCaseMetadata[] }`
- **Interface Hierarchy**: Extend base interfaces rather than duplicating properties

### Audit & Compliance Patterns
- **Retroactive Audit Events**: When one action implies the success of a prerequisite, log both events
  ```tsx
  // Example: MFA enrollment implies successful email verification
  await auditService.logMfaEnrollment(user, phoneNumber, 'sms', 'success');
  await auditService.markEmailVerificationSuccessful(user, 'MFA enrollment completed');
  ```
- **Comprehensive Logging**: All user actions should be audited with proper context and metadata
- **Error Handling**: Continue operations even if audit logging fails, but log audit failures for monitoring

### CSS Architecture
- **Design System First**: Always use CSS custom properties from design system
- **Theme Token Verification**: ALWAYS verify color tokens exist in `app/components/theme-provider/theme.ts` before using them
  - ✅ Available: `--primary`, `--accent`, `--success`, `--error`, `--errorLight`, `--warning`, `--background`, `--backgroundLight`, `--text`, `--textTitle`, `--textBody`, `--textLight`
  - ❌ DO NOT USE: `--green`, `--red`, `--blue`, `--yellow`, `--orange`, `--purple`, `--gray` (these don't exist)
  - Check both `light` and `dark` theme objects to ensure token exists in both
- **Color Mixing**: Use `color-mix(in lab, ...)` for dynamic color variations
- **Hover States**: Global button effects + component-specific color/background changes only
- **Responsive Patterns**: `@media (max-width: 1024px)` for mobile/tablet detection
- **Shadow Conventions**: Use `color-mix(in lab, var(--color) 30%, transparent)` for shadows

## Critical Integration Patterns

### Firebase Auth Integration
```tsx
// Always use the auth context
import { AuthContext } from '~/contexts/auth.context';
const { user, setUser } = useContext(AuthContext);
```

### Worker Communication Example
```tsx
// Standard pattern for calling workers
const response = await fetch(`${config.user_worker_url}/api/user`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`,
  },
  body: JSON.stringify(userData)
});
```

### PDF Generation Pattern
- PDF worker uses Puppeteer to render HTML templates
- Canvas component exports data via `activeAnnotations` and `annotationData`
- PDF worker receives structured data and generates formatted documents

## Security Requirements
- **Authentication**: Firebase Auth required for all protected routes
- **Worker Auth**: Dual auth (Firebase token + API key from `keys-worker`)
- **CORS**: Strictly configured to production domain
- **Email Validation**: Free email domain filtering via `free-email-domains`
- **Access Control Enforcement**: 
  - All data operations must validate user permissions
  - Case creation/modification requires proper ownership validation
  - Read-only cases have separate access patterns via `ExtendedUserData`
  - Never bypass access validation without documented security justification
- **Permission Validation Patterns**:
  - Use `canModifyCase()` for write operations
  - Use `canAccessCase()` for read operations  
  - Use `canCreateCase()` before case creation
  - Always validate session with `validateUserSession()`
- **Audit Requirements**: Security-sensitive operations must generate audit events

## Testing & Quality
- **Linting**: ESLint with TypeScript rules
- **Type Checking**: `npm run typecheck` before commits
- **Worker Testing**: Vitest setup in each worker directory
- **Development**: Use emulators for Firebase Auth during development
- **Type Safety Standards**:
  - Eliminate `any` type casting in favor of proper interfaces
  - Create reusable type definitions for repeated patterns
  - Use type guards for runtime type validation
  - Prefer interface extension over intersection types
- **Security Testing**: Validate all access control patterns work correctly
- **Code Quality**: No repeated inline type definitions - use proper interfaces

## Deployment & Infrastructure
- **Pages**: Frontend deploys to Cloudflare Pages via `wrangler pages deploy`
- **Workers**: Each worker deploys independently with own `wrangler.jsonc`
- **Secrets**: Managed via `scripts/deploy-env.sh` and `scripts/deploy-pages-secrets.sh`
- **Environment**: Use `scripts/deploy-all.sh` for complete deployment

## Documentation References
- Architecture details: `guides/ARCHITECTURE.md`
- Development workflow: `guides/DEVELOPMENT_PROTOCOL.md`
- Component patterns: `guides/COMPONENT_GUIDE.md`
- Full API reference: `guides/API_REFERENCE.md`

## Key Type Definitions
- **ExtendedUserData**: `app/types/user.ts` - User data with read-only cases
- **ReadOnlyCaseData**: `app/types/case.ts` - Case data with read-only flag
- **UserProfileAuditDetails**: `app/types/audit.ts` - Audit details with retroactive fields
- **PermissionResult**: `app/utils/permissions.ts` - Standard permission check result
- **DataOperationOptions**: `app/utils/data-operations.ts` - Options for data operations

## Utility Modules Reference

### Data Operations (`app/utils/data-operations.ts`)
**Core Functions**:
- `getCaseData(user, caseNumber, options?)` - Get case with access validation
- `updateCaseData(user, caseNumber, data, options?)` - Update case with permissions
- `deleteCaseData(user, caseNumber)` - Delete case with audit logging
- `duplicateCaseData(user, fromCase, toCase)` - Duplicate with security validation
- `getFileAnnotations(user, caseNumber, fileId)` - Get file annotations safely

**Key Features**: Automatic API key management, session validation, permission checks, structured error handling

### Permission Management (`app/utils/permissions.ts`)
**Core Functions**:
- `getUserData(user)` - Get user data with caching
- `updateUserData(user, updates)` - Update with session validation
- `canModifyCase(user, caseNumber)` - Check write permissions
- `canAccessCase(user, caseNumber)` - Check read permissions  
- `canCreateCase(user)` - Validate case creation limits
- `validateUserSession(user)` - Session and token validation
- `getUserReadOnlyCases(user)` - Get read-only cases safely

**Key Features**: Built-in access control, session validation, consistent error responses, ExtendedUserData handling

### Audit Service (`app/services/audit.service.ts`)
**Core Functions**:
- `logCaseCreation(user, caseNumber, caseName)` - Case creation events
- `logMfaEnrollment(user, phone, method, result)` - MFA events
- `markEmailVerificationSuccessful(user, reason)` - Retroactive verification
- `logSecurityViolation(user, incident, severity)` - Security events
- `logUserLogin(user, sessionId, method)` - Authentication events

**Key Features**: Comprehensive audit trails, retroactive event logging, security incident tracking, performance metrics

## Key File Locations
- Canvas logic: `app/components/canvas/canvas.tsx`
- Main layout: `app/root.tsx`
- Auth setup: `app/services/firebase.ts`
- Worker examples: `workers/pdf-worker/src/pdf-worker.js`
- Deployment scripts: `scripts/deploy-*.sh`
- Permission utilities: `app/utils/permissions.ts`
- Data operations: `app/utils/data-operations.ts`
- Audit service: `app/services/audit.service.ts`
- Type definitions: `app/types/` (barrel exports via `index.ts`)

## Version Update Protocol
- Update the `version` field in `package.json`.
- Create a new release notes file for the version, similar in style to previous release notes, located in public/release-notes.
- Update the sitemap with the new release notes path.
- Add an entry to the changelog in .github/README.md
- Make sure all version references are updated consistently (SECURITY, Project Overview, etc.).
- Run npm install
- Run npm run build