# Striae Component Guide

## Component Architecture Overview

Striae's frontend is built using React components organized in a modular structure. This guide covers the major components, their purposes, and how they interact within the application.

## Component Directory Structure

```text
app/components/
├── actions/           # Data manipulation components
├── auth/             # Authentication components
├── button/           # Reusable button components
├── canvas/           # Main canvas for image annotation
├── colors/           # Color picker components
├── footer/           # Footer and modal components
├── icon/             # Icon system
├── mobile/           # Mobile-specific components
├── notice/           # Notification and modal components
├── sidebar/          # Sidebar navigation and controls
├── theme-provider/   # Theme management
├── toast/            # Toast notification system
├── toolbar/          # Main toolbar components
├── turnstile/        # CAPTCHA components
└── user/             # User management components
```

## Core Components

### 1. Authentication Components

#### AuthPassword (`app/components/auth/auth-password.tsx`)

**Purpose**: Initial access control before main authentication

**Features**:

- Password-based access gate
- Session storage for access state
- Clean, focused interface

**Usage**:

```tsx
<AuthPassword onAccessGranted={handleAccessGranted} />
```

#### MFAEnrollment (`app/components/auth/mfa-enrollment.tsx`)

**Purpose**: Multi-factor authentication setup

**Features**:

- Phone number verification
- SMS code validation
- Firebase MFA integration
- reCAPTCHA verification

**Key Props**:

- `user: User` - Firebase user object
- `onSuccess: () => void` - Success callback
- `onError: (message: string) => void` - Error callback
- `mandatory: boolean` - Whether MFA is required

#### MFAVerification (`app/components/auth/mfa-verification.tsx`)

**Purpose**: MFA challenge during login

**Features**:

- Multi-factor resolver handling
- SMS code input and validation
- Error handling and retry logic

### 2. Canvas System

#### Canvas (`app/components/canvas/canvas.tsx`)

**Purpose**: Main image display and annotation interface

**Features**:

- High-resolution image rendering
- Annotation overlay display
- Loading states and error handling

**Key Props**:

```typescript
interface CanvasProps {
  imageUrl?: string;
  filename?: string;
  company?: string;
  firstName?: string;
  error?: string;
  activeAnnotations?: Set<string>;
  annotationData?: AnnotationData | null;
}
```

**State Management**:

- Image loading states
- Error handling for network issues
- Flash effects for user feedback (subclass characteristics)

**Key Methods**:

- Image load error detection
- Annotation overlay rendering
- User interaction handling

### 3. Sidebar System

#### SidebarContainer (`app/components/sidebar/sidebar-container.tsx`)

**Purpose**: Main sidebar wrapper with footer integration

**Features**:

- Sidebar component orchestration
- Footer modal management
- Keyboard event handling (Escape key)
- Patreon widget integration

**Key Props**:

```typescript
interface SidebarContainerProps {
  user: User;
  onImageSelect: (file: FileData) => void;
  imageId?: string;
  onCaseChange: (caseNumber: string) => void;
  currentCase: string;
  files: FileData[];
  // ... additional props for state management
}
```

#### Sidebar (`app/components/sidebar/sidebar.tsx`)

**Purpose**: Core sidebar functionality

**Features**:

- Case management interface
- File upload and selection
- Image management controls

### 4. Action Components

#### Image Management (`app/components/actions/image-manage.tsx`)

**Purpose**: Image upload and retrieval operations

**Key Functions**:

```typescript
export const uploadImage = async (
  file: File, 
  caseNumber: string, 
  apiKey: string
): Promise<UploadResult>

export const getImageUrl = async (
  imageId: string, 
  apiKey: string
): Promise<string>

export const deleteImage = async (
  imageId: string, 
  apiKey: string
): Promise<void>
```

#### PDF Generation (`app/components/actions/generate-pdf.tsx`)

**Purpose**: PDF report generation

**Features**:

- Dynamic PDF creation
- Annotation integration
- Custom formatting
- Error handling and progress feedback

**Key Function**:

```typescript
export const generatePDF = async (
  imageUrl: string,
  caseNumber: string,
  annotationData: AnnotationData | null,
  activeAnnotations: Set<string>,
  firstName?: string
): Promise<{ success: boolean; message: string }>
```

#### Notes Management (`app/components/actions/notes-manage.tsx`)

**Purpose**: Annotation and notes data management

**Features**:

- CRUD operations for annotation data
- Data validation and sanitization
- Error handling for API operations

### 5. UI Components

#### Button System (`app/components/button/`)

**Purpose**: Reusable button components

**Components**:

- `Button` - Standard button with variants
- `IconButton` - Button with icon integration
- `LoadingButton` - Button with loading states

#### Icon System (`app/components/icon/icon.tsx`)

**Purpose**: Centralized icon management

**Features**:

- SVG icon system
- Consistent sizing and styling
- Type-safe icon names

**Usage**:

```tsx
<Icon icon="eye" />
<Icon icon="eye-off" />
<Icon icon="upload" />
```

#### Toast System (`app/components/toast/toast.tsx`)

**Purpose**: User feedback and notifications

**Features**:

- Success and error message display
- Auto-dismiss functionality
- Customizable styling

**Props**:

```typescript
interface ToastProps {
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
  onClose: () => void;
}
```

### 6. User Management Components

#### UserProfile (`app/components/user/user-profile.tsx`)

**Purpose**: User information display and management

**Features**:

- User data display
- Profile editing capabilities
- Case assignment management

#### InactivityWarning (`app/components/user/inactivity-warning.tsx`)

**Purpose**: Session timeout management

**Features**:

- Inactivity detection
- Warning countdown display
- Session extension handling

## Component State Management

### Local State Patterns

Most components use React's built-in state management:

```typescript
// Typical state structure
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | undefined>();
const [data, setData] = useState<DataType | null>(null);
```

### Context Usage

#### AuthContext (`app/contexts/auth.context.tsx`)

**Purpose**: Global authentication state

**Provided Values**:

- Current user information
- Authentication status
- Login/logout functions

### Custom Hooks

#### useEmailSyncToKV (`app/hooks/useEmailSyncToKV.ts`)

**Purpose**: Synchronize user email with KV storage

**Features**:

- Automatic email sync on auth state change
- Error handling for sync failures
- Retry logic for failed operations

#### useInactivityTimeout (`app/hooks/useInactivityTimeout.ts`)

**Purpose**: Session inactivity management

**Features**:

- Configurable timeout periods
- Activity detection
- Automatic logout on timeout

## Component Communication Patterns

### Props Down, Events Up

Components follow React's unidirectional data flow:

```typescript
// Parent component
const [selectedImage, setSelectedImage] = useState<string>();

// Child component receives data and callbacks
<ImageSelector 
  images={images}
  onImageSelect={setSelectedImage}
/>
```

### Event Handling

Components use callback props for communication:

```typescript
interface ComponentProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  onDataChange: (data: DataType) => void;
}
```

## Styling Approach

### CSS Modules

Components use CSS Modules for scoped styling:

```typescript
// Component file
import styles from './component.module.css';

// Usage
<div className={styles.container}>
  <button className={styles.primaryButton}>
    Click me
  </button>
</div>
```

### Style Conventions

- **BEM-like naming**: `styles.componentName__elementName--modifier`
- **CSS Custom Properties**: For theming and consistency
- **Intuitive Design**: Clean, simple, user-friendly interfaces
- **Accessibility**: ARIA labels and semantic HTML

## Performance Considerations

### Component Lifecycle

Components are designed for efficient mounting and unmounting:

```typescript
useEffect(() => {
  // Setup
  const cleanup = setupComponent();
  
  // Cleanup
  return cleanup;
}, [dependencies]);
```

## Accessibility Features

### Built-in Accessibility

- **Semantic HTML**: Proper element usage
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Proper focus handling
- **Color Contrast**: WCAG compliance

## Development Guidelines

### Component Creation Checklist

1. ✅ Create component directory
2. ✅ Implement TypeScript interfaces
3. ✅ Add CSS Module styling
4. ✅ Include error handling
5. ✅ Add loading states
6. ✅ Implement accessibility features
7. ✅ Add documentation

### Best Practices

- **Single Responsibility**: Each component has one clear purpose
- **Type Safety**: Full TypeScript coverage
- **Error Boundaries**: Graceful error handling
- **Performance**: Optimized for large datasets
- **Maintainability**: Clear, documented code
