export function SiteFooter() {
  return (
    <footer className="border-t border-border py-8">
      <div className="container-app grid gap-6 text-sm text-zinc-400 md:grid-cols-3">
        <div>
          <p className="font-bold text-white">SPORTPRINT LMS</p>
          <p className="mt-2">
            Nền tảng đào tạo kỹ thuật in ấn, thiết kế file in và kinh doanh đồ
            thể thao.
          </p>
        </div>
        <div>
          <p className="font-semibold text-white">Liên hệ</p>
          <p className="mt-2">Hotline: 0988 888 888</p>
          <p>Email: support@sportprint.vn</p>
        </div>
        <div>
          <p className="font-semibold text-white">Địa chỉ xưởng</p>
          <p className="mt-2">KCN Tân Bình, TP.HCM</p>
          <p className="text-xs">© 2026 SportPrint. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
