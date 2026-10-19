import { Link } from 'react-router-dom';
import { MapPinOff } from 'lucide-react';
import { EmptyState } from '../components/common/States.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

export default function NotFound() {
  useDocumentTitle('Không tìm thấy trang');
  return (
    <div className="container subpage">
      <EmptyState
        icon={MapPinOff}
        title="Trang này không có trên bản đồ"
        action={
          <>
            <Link className="btn btn-primary btn-sm" to="/">
              Về trang chủ
            </Link>
            <Link className="btn btn-quiet btn-sm" to="/flights">
              Tìm chuyến bay
            </Link>
          </>
        }
      >
        <p>Đường dẫn có thể đã thay đổi hoặc gõ nhầm.</p>
      </EmptyState>
    </div>
  );
}
