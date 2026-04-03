# PHASE 2 DEVELOPMENT PLAN - Frontend Quality & TypeScript Migration

## 📋 Overview

Phase 2 фокусируется на улучшении качества фронтенда и подготовке к production-ready статусу:

1. **TypeScript Миграция** - типизировать все компоненты
2. **Design System Unification** - consistency во всех страницах
3. **Animations & Performance** - smooth UX, быстрая загрузка
4. **Accessibility** - WCAG compliance
5. **Error Handling** - graceful error recovery
6. **WebSocket & Real-time** - real-time validation progress

---

## 🎯 Detailed Tasks

### Task 1: TypeScript Types Infrastructure ✅ DONE

- [x] Create comprehensive types file (src/types/index.ts)
- [x] Define all domain entities (User, Document, ValidationResult, etc.)
- [x] Define all context types
- [x] Define all API response types
- [x] Define all component props types
- [x] Define custom hook return types

**Files:**

- `frontend/src/types/index.ts` (250+ types)

**Next:** Start migrating components

---

### Task 2: Migrate Auth Components to TypeScript

- [ ] Migrate App.tsx components (currently App.js)
- [ ] Create auth-specific types
- [ ] Update AuthContext to use strong types
- [ ] Add type-safe login/register forms
- [ ] Migrate Login/Register/OAuth components

**Files to migrate:**

- src/pages/LoginPage.js → LoginPage.tsx
- src/pages/RegisterPage.js → RegisterPage.tsx
- src/pages/OAuthPage.js → OAuthPage.tsx
- src/components/Auth/\* components

**Acceptance Criteria:**

- ✅ No `any` types
- ✅ All imports type-safe
- ✅ TypeScript strict mode
- ✅ Props fully typed
- ✅ All tests pass

---

### Task 3: Migrate Core Pages to TypeScript

- [ ] Migrate UploadPage (largest, most critical)
- [ ] Migrate ReportPage
- [ ] Migrate DashboardPage
- [ ] Migrate HistoryPage
- [ ] Migrate ProfilesPage

**Files to migrate:**

- src/pages/UploadPage.js → UploadPage.tsx
- src/pages/ReportPage.js → ReportPage.tsx
- src/pages/DashboardPage.js → DashboardPage.tsx
- src/pages/HistoryPage.js → HistoryPage.tsx
- src/pages/ProfilesPage.js → ProfilesPage.tsx

**Key Changes:**

```typescript
// Before
export default function UploadPage() {
  const theme = useTheme();
  const { addToHistory } = useContext(CheckHistoryContext);
  // ...
}

// After
import { FC } from "react";
import { UploadPageProps } from "../types";

const UploadPage: FC<UploadPageProps> = ({ className }) => {
  const theme = useTheme();
  const { addToHistory } = useContext(CheckHistoryContext);
  // ...
};

export default UploadPage;
```

---

### Task 4: Create Typed Custom Hooks

- [ ] useApiCall - typed API requests
- [ ] useForm - typed form handling
- [ ] useLocalStorage - typed local storage
- [ ] useDebounce - typed debounce
- [ ] useWindowSize - typed window size
- [ ] useDocumentValidation - validation logic

**Location:** `frontend/src/hooks/` (create .ts files)

**Example:**

```typescript
// useForm.ts
import { useState, useCallback } from "react";
import { UseFormReturn } from "../types";

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void>,
): UseFormReturn<T> {
  // Implementation
}
```

---

### Task 5: Create Typed API Client

- [ ] Create typed api/index.ts with request/response types
- [ ] Type all endpoints (documents, validation, profiles)
- [ ] Add request/response interceptors
- [ ] Error handling with typed errors
- [ ] Request/response logging

**Location:** `frontend/src/api/client.ts`

```typescript
import { Document, ValidationResult, ApiResponse } from "../types";

export const apiClient = {
  documents: {
    upload: (
      file: File,
      profileId: string,
    ): Promise<ApiResponse<Document>> => {},
    get: (id: string): Promise<ApiResponse<Document>> => {},
    list: (): Promise<ApiResponse<Document[]>> => {},
  },
  validation: {
    validate: (id: string): Promise<ApiResponse<ValidationResult>> => {},
  },
};
```

---

### Task 6: Unified Design System

- [ ] Ensure all pages use usePageStyles hook
- [ ] Consistent color tokens across app
- [ ] Consistent spacing/typography
- [ ] Consistent component styling
- [ ] Create shared component library

**Verification:**

```bash
# Search for inline styles that should use tokens
grep -r "isDark ? " src/ | wc -l  # Should be minimal
```

---

### Task 7: Animation & Loading States

- [ ] Add Skeleton loading for all data loading
- [ ] Smooth page transitions with Framer Motion
- [ ] Confetti animation on success (validation completes with 0 errors)
- [ ] Loading spinners during API calls
- [ ] Smooth list animations

**Components to enhance:**

- UploadPage: drag-drop animation
- ReportPage: issue list animations (stagger)
- DashboardPage: stat card animations
- All pages: skeleton loading during data fetch

**Libraries:**

- ✅ framer-motion (already installed)
- ✅ react-hot-toast (already installed)
- Optional: react-confetti for success

---

### Task 8: Accessibility (WCAG 2.1 AA)

- [ ] Add ARIA labels to all interactive elements
- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] Focus indicators on all buttons
- [ ] Label all form inputs
- [ ] Test with screen reader
- [ ] Contrast ratio check (WCAG AA: 4.5:1)

**Tools:**

- Axe DevTools browser extension
- WAVE accessibility tool
- eslint-plugin-jsx-a11y (npm install)

**Example:**

```typescript
<button
  aria-label="Upload document"
  role="button"
  tabIndex={0}
>
  Upload
</button>
```

---

### Task 9: Error Handling & Recovery

- [ ] Handle API errors gracefully
- [ ] Show user-friendly error messages
- [ ] Retry logic for failed requests
- [ ] Error boundaries for component crashes
- [ ] Network error detection

**Components:**

- Create ErrorBoundary.tsx
- Create useErrorHandler hook
- Create error recovery UI

---

### Task 10: WebSocket & Real-time Updates

- [ ] Connect WebSocket to validation progress
- [ ] Show real-time validation progress bar
- [ ] Handle connection reconnection
- [ ] Display progress stages (parsing → validating → correcting)
- [ ] Real-time issue count updates

---

## 📊 Migration Priority

### High Priority (Week 1)

1. ✅ Create comprehensive types
2. [ ] Migrate UploadPage (most used)
3. [ ] Migrate ReportPage (critical flow)
4. [ ] Create typed API client
5. [ ] Fix auth system typing

### Medium Priority (Week 2)

6. [ ] Create typed custom hooks
7. [ ] Migrate DashboardPage
8. [ ] Add skeleton loading
9. [ ] Unify design system
10. [ ] Add accessibility support

### Lower Priority (Week 3)

11. [ ] Migrate all other pages
12. [ ] WebSocket real-time
13. [ ] Error boundaries
14. [ ] Animation enhancements
15. [ ] Performance optimization

---

## 🚀 Migration Strategy

### Step-by-Step Process

1. **Create types** → Done ✅
2. **Create typed API client**
3. **Create typed hooks**
4. **Migrate component by component:**
   - Rename .js → .tsx
   - Add imports from types
   - Type all props
   - Type all state (useState<Type>)
   - Type all contexts
   - Fix TypeScript errors

5. **Test:**
   - Visual regression test
   - Functionality test
   - TypeScript compilation
   - Unit tests

### Example: Migrate UploadPage

```typescript
// frontend/src/pages/UploadPage.tsx
import React, { FC, useContext, useState } from 'react';
import { UploadPageProps, Document, UploadProgress } from '../types';
import usePageStyles from '../hooks/usePageStyles';
import { AuthContext, CheckHistoryContext } from '../App';

const UploadPage: FC<UploadPageProps> = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
    status: 'pending'
  });

  const { user } = useContext(AuthContext);
  const { addToHistory } = useContext(CheckHistoryContext);
  const { textPrimary, surface } = usePageStyles();

  const handleUpload = async (file: File): Promise<void> => {
    // Typed implementation
  };

  return (
    <div style={{ color: textPrimary, backgroundColor: surface }}>
      {/* Content */}
    </div>
  );
};

export default UploadPage;
```

---

## ✅ Quality Checklist

Before marking component as complete:

- [ ] TypeScript strict mode compiles
- [ ] No `any` types used
- [ ] All props typed
- [ ] All state typed
- [ ] All hooks typed
- [ ] Component tests pass
- [ ] Visual appearance unchanged
- [ ] Accessibility check passed
- [ ] Performance check (`React.memo` where needed)
- [ ] Documentation updated

---

## 📈 Expected Outcomes

### Code Quality

- ✅ Type safety 100%
- ✅ Better IDE autocomplete
- ✅ Self-documenting code
- ✅ Easier refactoring
- ✅ Fewer runtime errors

### User Experience

- ✅ Faster load times
- ✅ Smooth animations
- ✅ Better error messages
- ✅ Accessible for all users
- ✅ Real-time feedback

### Developer Experience

- ✅ Easier debugging
- ✅ Better code organization
- ✅ Stronger conventions
- ✅ Easier onboarding
- ✅ More maintainable code

---

## 🔗 Related Documentation

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Material-UI TypeScript](https://mui.com/material-ui/guides/typescript/)
- [Web Accessibility (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 📝 Checklist for Phase 2 Completion

- [ ] All components migrated to TypeScript
- [ ] Type safety: 100%
- [ ] Test coverage: 70%+
- [ ] Accessibility: WCAG 2.1 AA compliant
- [ ] Performance: Lighthouse score 90+
- [ ] All animations smooth (60 FPS)
- [ ] Error handling: Graceful degradation
- [ ] WebSocket: Real-time updates working
- [ ] Documentation: Complete and updated

---

_Generated: March 6, 2026_
_Phase 2: Frontend Quality & TypeScript Migration_
