import React, { useEffect, useState } from 'react';

export const PWAGatekeeper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  // On mobile, if not installed yet, prompt on every visit (session-based bypass)
  const [bypassSession, setBypassSession] = useState<boolean>(() => {
    return sessionStorage.getItem('homie_mobile_pwa_dismissed') === 'true';
  });

  useEffect(() => {
    // 1. Check standalone PWA mode across all browsers and OS
    const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
    const fullscreenMedia = window.matchMedia('(display-mode: fullscreen)').matches;
    const minimalUiMedia = window.matchMedia('(display-mode: minimal-ui)').matches;
    const navStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const androidAppReferrer = document.referrer.includes('android-app://');
    const standalone = standaloneMedia || fullscreenMedia || minimalUiMedia || navStandalone || androidAppReferrer;
    setIsStandalone(standalone);

    // 2. Check mobile/tablet platform accurately (including iPadOS)
    const ua = navigator.userAgent;
    const isTouchMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    const iosDevice = /iPhone|iPad|iPod/i.test(ua) || isTouchMac;
    const mobileDevice = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || isTouchMac;

    setIsMobile(mobileDevice);
    setIsIOS(iosDevice);
  }, []);

  // Rule 1: Desktop always accesses directly
  if (!isMobile) {
    return <>{children}</>;
  }

  // Rule 2: If mobile is already added to home (standalone) or user entered for this session
  if (isStandalone || bypassSession) {
    return <>{children}</>;
  }

  const currentUrl = window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnterApp = () => {
    // Dismiss only for this session; next visit will notify again as requested
    sessionStorage.setItem('homie_mobile_pwa_dismissed', 'true');
    setBypassSession(true);
  };

  // Mobile non-standalone view (Prompt every visit until added to home screen)
  return (
    <div className="min-h-screen bg-canvas text-text-main flex flex-col items-center justify-center p-6 text-center">
      <img
        src="/logo.svg"
        alt="Homie Home Logo"
        className="w-18 h-18 rounded-3xl shadow-lg mb-5 object-cover"
      />
      <h1 className="text-xl font-bold mb-1">เพิ่ม Homie Home ไปยังหน้าจอโฮม</h1>
      <p className="text-xs text-text-muted mb-6 max-w-xs leading-relaxed">
        เพื่อประสบการณ์ที่ดีที่สุด รับการแจ้งเตือนงานและการเงินในบ้านแบบเรียลไทม์
      </p>

      {isIOS ? (
        <div className="space-y-4 max-w-xs w-full">
          <div className="p-4 rounded-2xl bg-surface border border-surface-muted text-left space-y-2 text-xs text-text-secondary shadow-xs">
            <div className="flex items-center gap-2 font-bold text-text-main">
              <span>📱</span> วิธีติดตั้งบน iOS (Safari)
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] leading-normal text-text-muted">
              <li>แตะปุ่มแชร์ <strong>(Share / ไอคอนสี่เหลี่ยมลูกศรชี้ขึ้น)</strong></li>
              <li>เลื่อนลงแล้วเลือก <strong>"เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)</strong></li>
              <li>แตะ <strong>"เพิ่ม" (Add)</strong> มุมบนขวา</li>
            </ol>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 px-4 rounded-xl border border-surface-muted bg-surface hover:bg-surface-subtle font-semibold text-xs active:scale-95 transition"
            >
              {copied ? '✓ คัดลอกลิงก์แล้ว' : 'คัดลอกลิงก์เพื่อเปิดใน Safari'}
            </button>
            <button
              onClick={handleEnterApp}
              className="w-full py-3 px-4 rounded-xl bg-brand-primary text-white font-bold text-xs shadow-sm active:scale-95 transition"
            >
              เข้าใช้งานในเบราว์เซอร์ต่อไป
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-w-xs w-full">
          <div className="p-4 rounded-2xl bg-surface border border-surface-muted text-left space-y-2 text-xs text-text-secondary shadow-xs">
            <div className="flex items-center gap-2 font-bold text-text-main">
              <span>🤖</span> วิธีติดตั้งบน Android
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] leading-normal text-text-muted">
              <li>แตะเมนูของเบราว์เซอร์ <strong>(จุดสามจุด ⋮ มุมบนขวา)</strong></li>
              <li>เลือก <strong>"ติดตั้งแอพ" หรือ "เพิ่มลงในหน้าจอหลัก"</strong></li>
              <li>กดยืนยันการติดตั้ง</li>
            </ol>
          </div>

          <button
            onClick={handleEnterApp}
            className="w-full py-3 px-4 rounded-xl bg-brand-primary text-white font-bold text-xs shadow-sm active:scale-95 transition"
          >
            เข้าใช้งานในเบราว์เซอร์ต่อไป
          </button>
        </div>
      )}
    </div>
  );
};
