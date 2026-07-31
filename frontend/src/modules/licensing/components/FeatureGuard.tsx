import React, { ReactNode } from 'react';
import { useLicence } from '../hooks/useLicence';
import { Lock } from 'lucide-react';

interface FeatureGuardProps {
  feature?: string;
  numericFeature?: string;
  requestedCount?: number;
  fallback?: ReactNode;
  showFallbackMessage?: boolean;
  children: ReactNode;
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  feature,
  numericFeature,
  requestedCount,
  fallback,
  showFallbackMessage = false,
  children
}) => {
  const { features, valid } = useLicence();

  if (!valid) {
    return null;
  }

  let isAllowed = true;

  if (feature) {
    isAllowed = Boolean(features[feature]);
  }

  if (isAllowed && numericFeature && requestedCount !== undefined) {
    const limit = features[numericFeature];
    if (typeof limit === 'number' && requestedCount > limit) {
      isAllowed = false;
    }
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showFallbackMessage) {
    return (
      <div className="glass-panel" style={{
        padding: '1.5rem',
        textAlign: 'center',
        border: '1px dashed var(--border-color)',
        borderRadius: '12px',
        margin: '1rem 0'
      }}>
        <Lock size={32} color="var(--accent-amber)" style={{ marginBottom: '0.5rem' }} />
        <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Feature Locked</h4>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {feature ? `The '${feature}' feature is not included in your active licence tier.` : 'You have reached the maximum allowed limit for this feature.'}
        </p>
      </div>
    );
  }

  return null;
};
