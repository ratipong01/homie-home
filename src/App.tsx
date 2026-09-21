import { useState } from 'react';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HouseProvider, useHouse } from './context/HouseContext';
import { PWAGatekeeper } from './components/auth/PWAGatekeeper';
import { LoginPage } from './pages/LoginPage';
import { TasksPage } from './pages/TasksPage';
import { FinancePage } from './pages/FinancePage';
import { DashboardPage } from './pages/DashboardPage';
import { MembersPage } from './pages/MembersPage';
import { HouseHeader } from './components/layout/HouseHeader';
import { CartoonIcon } from './components/common/CartoonIcon';

type TabType = 'tasks' | 'finance' | 'dashboard' | 'members';

function AppShell() {
  const { token, isSessionUnlocked, isLoading: isAuthLoading } = useAuth();
  const { houses, activeHouse, selectHouse, createHouse } = useHouse();

  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isFinanceSettleOpen, setIsFinanceSettleOpen] = useState(false);
  const [isMemberActionSheetOpen, setIsMemberActionSheetOpen] = useState(false);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas text-xs text-text-muted">
        กำลังโหลด...
      </div>
    );
  }

  if (!token || !isSessionUnlocked) {
    return <LoginPage />;
  }

  const handleCenterClick = () => {
    if (activeTab === 'tasks') {
      setIsCreateTaskOpen(true);
    } else if (activeTab === 'finance') {
      setIsFinanceSettleOpen(true);
    } else if (activeTab === 'dashboard') {
      setActiveTab('tasks');
      setIsCreateTaskOpen(true);
    } else if (activeTab === 'members') {
      setIsMemberActionSheetOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-text-main flex flex-col justify-between max-w-md mx-auto relative border-x border-surface-subtle">
      {/* Top House Switcher */}
      <HouseHeader
        houses={houses}
        activeHouse={activeHouse}
        onSelectHouse={selectHouse}
        onCreateHouse={async (name) => {
          await createHouse(name);
        }}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Single Page Dynamic View */}
      <main className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'tasks' && (
          <TasksPage
            activeHouse={activeHouse}
            isCreateOpen={isCreateTaskOpen}
            onCloseCreate={() => setIsCreateTaskOpen(false)}
          />
        )}
        {activeTab === 'finance' && (
          <FinancePage
            activeHouse={activeHouse}
            isSettleOpen={isFinanceSettleOpen}
            onCloseSettle={() => setIsFinanceSettleOpen(false)}
          />
        )}
        {activeTab === 'dashboard' && (
          <DashboardPage
            activeHouse={activeHouse}
            onNavigateToCreateWithDate={(_d) => {
              setActiveTab('tasks');
              setIsCreateTaskOpen(true);
            }}
          />
        )}
        {activeTab === 'members' && (
          <MembersPage
            activeHouse={activeHouse}
            isActionSheetOpen={isMemberActionSheetOpen}
            onCloseActionSheet={() => setIsMemberActionSheetOpen(false)}
          />
        )}
      </main>

      {/* Liquid Glass Bottom Nav (iOS Floating Style, Zero Layout Shift) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none pb-[calc(env(safe-area-inset-bottom,8px)+10px)] px-4 max-w-md mx-auto">
        <nav
          className="pointer-events-auto w-full bg-white/75 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(249,115,22,0.15),0_2px_8px_rgba(0,0,0,0.06)] rounded-[32px] px-2 py-2 flex items-center justify-between"
          style={{
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          }}
        >
          {/* Tab: Tasks */}
          <button
            type="button"
            onClick={() => setActiveTab('tasks')}
            className={`w-[60px] h-[52px] rounded-2xl flex flex-col items-center justify-center gap-0.5 select-none transition-all duration-200 active:scale-95 ${
              activeTab === 'tasks'
                ? 'bg-orange-500/15 text-brand-primary'
                : 'text-text-muted/70 hover:text-text-main hover:bg-black/5'
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <CartoonIcon name="tasks" size={22} />
            </div>
            <span
              className={`text-[10px] leading-tight tracking-tight ${
                activeTab === 'tasks' ? 'font-black text-brand-primary' : 'font-medium'
              }`}
            >
              รายการ
            </span>
          </button>

          {/* Tab: Finance */}
          <button
            type="button"
            onClick={() => setActiveTab('finance')}
            className={`w-[60px] h-[52px] rounded-2xl flex flex-col items-center justify-center gap-0.5 select-none transition-all duration-200 active:scale-95 ${
              activeTab === 'finance'
                ? 'bg-orange-500/15 text-brand-primary'
                : 'text-text-muted/70 hover:text-text-main hover:bg-black/5'
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <CartoonIcon name="finance" size={22} />
            </div>
            <span
              className={`text-[10px] leading-tight tracking-tight ${
                activeTab === 'finance' ? 'font-black text-brand-primary' : 'font-medium'
              }`}
            >
              การเงิน
            </span>
          </button>

          {/* Center Action Button (Liquid Pill with Glow) */}
          <div className="w-[60px] h-[52px] flex items-center justify-center shrink-0">
            <button
              type="button"
              onClick={handleCenterClick}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-primary via-orange-500 to-amber-400 text-white flex items-center justify-center shadow-[0_4px_16px_rgba(249,115,22,0.4)] active:scale-90 transition-transform duration-150 p-2 border-2 border-white/80"
              title={
                activeTab === 'tasks'
                  ? 'เพิ่มรายการ'
                  : activeTab === 'finance'
                  ? 'เคลียร์หนี้'
                  : activeTab === 'dashboard'
                  ? 'เพิ่มนัดหมาย'
                  : 'เพิ่ม / เชิญ'
              }
            >
              {activeTab === 'finance' ? (
                <CartoonIcon name="settle" size={24} />
              ) : activeTab === 'dashboard' ? (
                <CartoonIcon name="calendar" size={24} />
              ) : (
                <CartoonIcon name="plus" size={26} />
              )}
            </button>
          </div>

          {/* Tab: Dashboard */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`w-[60px] h-[52px] rounded-2xl flex flex-col items-center justify-center gap-0.5 select-none transition-all duration-200 active:scale-95 ${
              activeTab === 'dashboard'
                ? 'bg-orange-500/15 text-brand-primary'
                : 'text-text-muted/70 hover:text-text-main hover:bg-black/5'
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <CartoonIcon name="dashboard" size={22} />
            </div>
            <span
              className={`text-[10px] leading-tight tracking-tight ${
                activeTab === 'dashboard' ? 'font-black text-brand-primary' : 'font-medium'
              }`}
            >
              แดชบอร์ด
            </span>
          </button>

          {/* Tab: Members */}
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`w-[60px] h-[52px] rounded-2xl flex flex-col items-center justify-center gap-0.5 select-none transition-all duration-200 active:scale-95 ${
              activeTab === 'members'
                ? 'bg-orange-500/15 text-brand-primary'
                : 'text-text-muted/70 hover:text-text-main hover:bg-black/5'
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center shrink-0">
              <CartoonIcon name="members" size={22} />
            </div>
            <span
              className={`text-[10px] leading-tight tracking-tight ${
                activeTab === 'members' ? 'font-black text-brand-primary' : 'font-medium'
              }`}
            >
              สมาชิก
            </span>
          </button>
        </nav>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <HouseProvider>
          <PWAGatekeeper>
            <AppShell />
          </PWAGatekeeper>
        </HouseProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
