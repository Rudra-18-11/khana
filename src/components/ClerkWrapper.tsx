import React from 'react';
import { ClerkProvider } from '@clerk/clerk-expo';
import { CLERK_PUBLISHABLE_KEY, isClerkConfigured, tokenCache } from '../services/clerk';

interface ClerkWrapperProps {
  children: React.ReactNode;
}

export const ClerkWrapper: React.FC<ClerkWrapperProps> = ({ children }) => {
  if (isClerkConfigured) {
    return (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
        {children}
      </ClerkProvider>
    );
  }

  // Safe fallback if user has not yet configured EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env
  return <>{children}</>;
};
