import React, { useState } from 'react';
import { generateMedicalReportPDF, MedicalReportData } from '../utils/generateMedicalReportPDF';

interface Props {
  data: MedicalReportData;
}

const DownloadMedicalReportButton: React.FC<Props> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = () => {
    setLoading(true);
    setError('');
    try {
      generateMedicalReportPDF(data);
    } catch (e) {
      console.error('Ошибка генерации PDF:', e);
      setError('Не удалось сформировать отчёт.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pdf-btn-wrap">
      <button
        className="pdf-download-btn"
        onClick={handleDownload}
        disabled={loading}
        aria-label="Скачать медицинскую карту в формате PDF"
        aria-busy={loading}
      >
        {loading ? (
          <>
            <span className="pdf-btn-spinner" aria-hidden="true" />
            Генерация...
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 16L7 11M12 16L17 11M12 16V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 20H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Скачать PDF
          </>
        )}
      </button>
      {error && <p className="pdf-btn-error" role="alert">{error}</p>}
    </div>
  );
};

export default DownloadMedicalReportButton;
