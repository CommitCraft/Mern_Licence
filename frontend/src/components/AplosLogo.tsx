import React from 'react';

export interface AplosLogoProps {
  light?: boolean;
  showTagline?: boolean;
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Reusable Aplos wordmark.
 * Use `light` when the logo is placed on a dark background.
 */
export default function AplosLogo({
  light = false,
  showTagline = true,
  text = 'APLÓS',
  size = 'md',
  className = '',
}: AplosLogoProps) {
  const getFontSize = () => {
    if (size === 'sm') return 'clamp(14px, 1.6vw, 20px)';
    if (size === 'lg') return 'clamp(24px, 2.8vw, 34px)';
    return 'clamp(18px, 2.2vw, 26px)';
  };

  const fontSize = getFontSize();

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      lineHeight: 1,
    },
    logoText: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      whiteSpace: 'nowrap',
    },
    brace: {
      fontSize: fontSize,
      fontWeight: 800,
      color: '#1d9bf0',
      lineHeight: 1,
    },
    aplos: {
      fontSize: fontSize,
      fontFamily: "Georgia, 'Times New Roman', serif",
      fontWeight: 700,
      color: '#ff8c1bff',
      letterSpacing: '2px',
      lineHeight: 1,
      padding: '0 3px',
    },
    tagline: {
      fontSize: size === 'sm' ? '8px' : 'clamp(7px, 0.9vw, 11px)',
      fontWeight: 400,
      color: light ? '#ffffff' : '#17365d',
      margin: '4px 0 0',
      letterSpacing: '0.02em',
      opacity: light ? 0.9 : 0.8,
    },
  };

  return (
    <div style={styles.container} className={className}>
      <div style={styles.logoText}>
        <span style={styles.brace}>{"{"}</span>
        <span style={styles.aplos}>{text}</span>
        <span style={styles.brace}>{"}"}</span>
      </div>
      {showTagline ? <p style={styles.tagline}>Let’s keep it simple.</p> : null}
    </div>
  );
}
