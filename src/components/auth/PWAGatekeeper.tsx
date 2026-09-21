import React, { useEffect, useState } from 'react';

export const PWAGatekeeper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [bypassDev, setBypassDev] = useState<boolean>(() => {
    return sessionStorage.getItem('homie_dev_gatekeeper_bypass') === 'true';
  });

  useEffect(() => {
    // Check standalone mode
    const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
    const navStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const standalone = standaloneMedia || navStandalone;
    setIsStandalone(standalone);

    // Check user agent
    const ua = navigator.userAgent;
    const mobile = /Android|iPhone|iPad|iPod/i.test(ua);
    const ios = /iPhone|iPad|iPod/i.test(ua);
    setIsMobile(mobile);
    setIsIOS(ios);
  }, []);

  if (isStandalone || bypassDev) {
    return <>{children}</>;
  }

  const currentUrl = window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBypass = () => {
    sessionStorage.setItem('homie_dev_gatekeeper_bypass', 'true');
    setBypassDev(true);
  };

  // 1. Desktop mode
  if (!isMobile) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentUrl)}`;

    return (
      <div className="min-h-screen bg-canvas text-text-main flex flex-col items-center justify-center p-6 text-center">
        <img
          src="/logo.svg"
          alt="Homie Home Logo"
          className="w-18 h-18 rounded-2xl shadow-lg mb-6 object-cover"
        />
        <h1 className="text-xl font-bold tracking-tight mb-2">Homie Home</h1>
        <p className="text-xs text-text-muted mb-6">แอพจัดการบ้านสำหรับมือถือเท่านั้น</p>

        <div className="p-4 bg-white rounded-2xl shadow-sm border border-surface-muted inline-block mb-4">
          <img src={qrUrl} alt="QR Code" className="w-44 h-44 mx-auto rounded-lg" />
        </div>

        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-surface-muted text-text-secondary mb-6">
          สแกนเพื่อเปิดบนมือถือ
        </span>

        <button
          onClick={handleBypass}
          className="text-xs text-text-muted underline hover:text-brand-primary transition-colors"
        >
          [ทดสอบบนเดสก์ท็อป]
        </button>
      </div>
    );
  }

  // 2. Mobile non-standalone
  return (
    <div className="min-h-screen bg-canvas text-text-main flex flex-col items-center justify-center p-6 text-center">
      <img
        src="/logo.svg"
        alt="Homie Home Logo"
        className="w-16 h-16 rounded-2xl shadow mb-4 object-cover"
      />
      <h1 className="text-lg font-bold mb-2">ติดตั้ง Homie Home</h1>


      {isIOS ? (
        <div className="space-y-4 max-w-xs">
          <p className="text-xs text-text-muted">แตะปุ่มแชร์แล้วเลือก "เพิ่มไปยังหน้าจอโฮม"</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 px-4 rounded-xl bg-brand-primary text-white font-medium text-xs active:scale-95 transition-transform"
            >
              {copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}
            </button>
            <span className="text-[11px] text-text-secondary">
              เปิดใน Safari เพื่อติดตั้ง
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-w-xs">
          <p className="text-xs text-text-muted">แตะเมนูของเบราว์เซอร์แล้วเลือก "ติดตั้งแอพ"</p>
          <button
            onClick={handleBypass}
            className="w-full py-2.5 px-4 rounded-xl bg-brand-primary text-white font-medium text-xs active:scale-95 transition-transform"
          >
            เข้าใช้งาน
          </button>
        </div>
      )}

      <button
        onClick={handleBypass}
        className="mt-8 text-xs text-text-muted underline hover:text-brand-primary"
      >
        [ข้ามขั้นตอนชั่วคราว]
      </button>
    </div>
  );
};
