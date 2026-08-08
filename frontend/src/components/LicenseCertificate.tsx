import React, { useRef } from 'react';
import AplosLogo from './AplosLogo';
import { Printer, X } from 'lucide-react';

export interface LicenseCertificateProps {
  customer?: string;
  product?: string;
  type?: string;
  activations?: string;
  productKey?: string;
  created?: string;
  expiry?: string;
  validity?: string;
  onClose?: () => void;
}

export default function LicenseCertificate({
  customer = 'Vipin Kushwaha',
  product = 'Smart Factory Monitoring System',
  type = 'Enterprise',
  activations = '5 Users',
  productKey = 'APL-2026-XYZ-1234-5678',
  created = '01-Aug-2026',
  expiry = '01-Aug-2027',
  validity = '1 Year',
  onClose,
}: LicenseCertificateProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=900,height=750');
    if (!printWindow) {
      alert('Please allow popups to download/print the certificate');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>License Certificate - ${productKey}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              background: #f3f3f3;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              font-family: Georgia, serif;
              box-sizing: border-box;
            }
            @media print {
              body {
                background: none;
                padding: 0;
                min-height: auto;
              }
              @page {
                size: landscape;
                margin: 10mm;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const styles: { [key: string]: React.CSSProperties } = {
    pageContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '15px',
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      overflowY: 'auto',
    },
    topActions: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      maxWidth: '820px',
      marginBottom: '12px',
      padding: '8px 16px',
      background: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
    actionBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      fontSize: '13px',
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: '#4f46e5',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 2px 6px rgba(79, 70, 229, 0.3)',
    },
    closeBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '6px',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      background: '#ffffff',
      color: '#64748b',
      cursor: 'pointer',
    },
    container: {
      width: '820px',
      minHeight: '620px',
      background: '#fff',
      border: '12px solid #c9a66b',
      padding: '30px',
      textAlign: 'center',
      fontFamily: "Georgia, 'Times New Roman', serif",
      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
      boxSizing: 'border-box',
    },
    title: {
      fontSize: '34px',
      color: '#c9a66b',
      fontWeight: 'bold',
      margin: '15px 0 10px',
      letterSpacing: '1px',
    },
    subtitle: {
      fontSize: '15px',
      marginBottom: '10px',
      color: '#334155',
    },
    customer: {
      fontSize: '26px',
      borderBottom: '2px solid #1e293b',
      width: '420px',
      margin: '12px auto 16px',
      fontStyle: 'italic',
      fontWeight: 600,
      color: '#0f172a',
      paddingBottom: '4px',
    },
    table: {
      width: '80%',
      margin: '18px auto',
      borderCollapse: 'collapse',
    },
    td: {
      border: '1px solid #cbd5e1',
      padding: '9px 14px',
      fontSize: '14px',
      textAlign: 'left',
      color: '#1e293b',
    },
    label: {
      fontWeight: 'bold',
      width: '40%',
      background: '#f8fafc',
      color: '#475569',
    },
    keyBox: {
      marginTop: '12px',
      padding: '10px 14px',
      border: '2px dashed #c9a66b',
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: '17px',
      letterSpacing: '2px',
      background: '#fff8e6',
      color: '#78350f',
      fontWeight: 'bold',
      borderRadius: '6px',
      wordBreak: 'break-all',
    },
    footer: {
      marginTop: '20px',
      fontSize: '13px',
      color: '#64748b',
      lineHeight: '1.5',
    },
  };

  return (
    <div style={styles.pageContainer}>
      {/* Action Bar */}
      <div style={styles.topActions}>
        <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>
          Official Software License Certificate
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button style={styles.actionBtn} onClick={handlePrint}>
            <Printer size={16} /> Print / Save as PDF
          </button>
          {onClose && (
            <button style={styles.closeBtn} onClick={onClose} title="Close Certificate View">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Printable Certificate Frame */}
      <div ref={printRef} style={styles.container}>
        {/* Logo */}
        <AplosLogo />

        {/* Title */}
        <div style={styles.title}>Product License Certificate</div>

        <div style={styles.subtitle}>
          This certificate confirms that the following license has been issued to
        </div>

        {/* Customer */}
        <div style={styles.customer}>{customer}</div>

        {/* Product Key Highlight */}
        <div style={styles.keyBox}>
          <strong>Product Key:</strong> {productKey}
        </div>

        {/* Details */}
        <table style={styles.table}>
          <tbody>
            <tr>
              <td style={{ ...styles.td, ...styles.label }}>Product</td>
              <td style={styles.td}>{product}</td>
            </tr>
            <tr>
              <td style={{ ...styles.td, ...styles.label }}>Type</td>
              <td style={styles.td}>{type}</td>
            </tr>
            <tr>
              <td style={{ ...styles.td, ...styles.label }}>Activations</td>
              <td style={styles.td}>{activations}</td>
            </tr>
            <tr>
              <td style={{ ...styles.td, ...styles.label }}>Created Date</td>
              <td style={styles.td}>{created}</td>
            </tr>
            <tr>
              <td style={{ ...styles.td, ...styles.label }}>Expiry Date</td>
              <td style={styles.td}>{expiry}</td>
            </tr>
            <tr>
              <td style={{ ...styles.td, ...styles.label }}>Validity</td>
              <td style={styles.td}>{validity}</td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div style={styles.footer}>
          Issued by <b>Aplos Logix Pvt. Ltd.</b>
          <br />
          This license is valid as per company terms and conditions.
        </div>
      </div>
    </div>
  );
}
