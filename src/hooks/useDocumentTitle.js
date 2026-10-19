import { useEffect } from 'react';

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | AirPulse` : 'AirPulse – Hiểu giá vé trước khi bay';
  }, [title]);
}
