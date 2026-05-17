'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useLocale, useTranslation } from '@/lib/locale-context';
import { DashboardIcon } from './AppIcons';
import { LocaleMenu } from '@/components/common/LocaleMenu';
import { clearAuthCookie } from '@/lib/auth';

const sidebarItems = [
  { key: 'dashboard' },
  { key: 'team' },
  { key: 'settings', route: 'settings' },
  { key: 'horses' },
  { key: 'health' },
  { key: 'nutrition' },
  { key: 'performance' },
  { key: 'reproduction', route: 'reproduction' },
  { key: 'expenses' },
  { key: 'reports', route: 'reports' },
  { key: 'contacts' },
  { key: 'news' },
  { key: 'evaluations', route: 'calendar' },
  { key: 'database', route: 'database' },
];

interface SidebarItemProps {
  item: (typeof sidebarItems)[0];
  isActive: boolean;
  href: string;
  collapsed?: boolean;
}

function SidebarItem({ item, isActive, href, collapsed = false }: SidebarItemProps) {
  const { t } = useTranslation();
  const { direction } = useLocale();
  const iconClassName = `h-5 w-5 flex-shrink-0 ${isActive ? 'text-[#4b2f1a]' : 'text-[#2b2330]'}`;
  const label = t(`sidebar.${item.key}`);

  const renderIcon = () => {
    switch (item.key) {
      case 'dashboard':
        return isActive ? (
          <img src="/sidebar/dashboard-active.svg" alt="" className="h-5 w-5 flex-shrink-0" />
        ) : (
          <DashboardIcon className={iconClassName} />
        );
      case 'team':
        return (
          <img
            src={isActive ? '/svgs/manage-members-foucs.svg' : '/svgs/manage-members.svg'}
            alt=""
            className="h-5 w-5 flex-shrink-0"
          />
        );
      case 'horses':
        return (
          <img
            src={isActive ? '/svgs/horse-active.svg' : '/sidebar/horse.svg'}
            alt=""
            className="h-5 w-5 flex-shrink-0"
          />
        );
      case 'health':
        return (
          <img
            src={isActive ? '/health/active-tab.svg' : '/health/tab.svg'}
            alt=""
            className="h-5 w-5 flex-shrink-0"
          />
        );
      case 'nutrition':
        return (
          <img
            src={isActive ? '/nutrition/acitve.svg' : '/nutrition/not-active.svg'}
            alt=""
            className="h-5 w-5 flex-shrink-0"
          />
        );
      case 'performance':
        return (
          <img
            src={isActive ? '/sidebar/%D8%A7%D9%84%D8%A3%D8%AF%D8%A7%D8%A1-active.svg' : '/sidebar/%D8%A7%D9%84%D8%A3%D8%AF%D8%A7%D8%A1.svg'}
            alt=""
            className="h-5 w-5 flex-shrink-0"
          />
        );
      case 'settings':
        return (
          <img
            src={isActive ? '/sidebar/%D8%A7%D9%84%D8%A5%D8%B9%D8%AF%D8%A7%D8%AF%D8%A7%D8%AA%20%D8%A7%D9%84%D8%A3%D8%B3%D8%A7%D8%B3%D9%8A%D8%A9-active.svg' : '/sidebar/%D8%A7%D9%84%D8%A5%D8%B9%D8%AF%D8%A7%D8%AF%D8%A7%D8%AA%20%D8%A7%D9%84%D8%A3%D8%B3%D8%A7%D8%B3%D9%8A%D8%A9.svg'}
            alt=""
            className="h-5 w-5 flex-shrink-0"
          />
        );
      case 'expenses':
        return (
          <img
            src="/sidebar/%D8%A7%D9%84%D9%85%D8%B5%D8%B1%D9%88%D9%81%D8%A7%D8%AA.svg"
            alt=""
            className="h-5 w-5 flex-shrink-0"
          />
        );
      case 'reports':
        return (
          <img
            src="/sidebar/%D8%A7%D9%84%D8%AA%D9%82%D8%A7%D8%B1%D9%8A%D8%B1.svg"
            alt=""
            className="h-5 w-5 flex-shrink-0"
          />
        );
      case 'contacts':
        return (
          <img
            src="/sidebar/%D8%AC%D9%87%D8%A7%D8%AA%20%D8%A7%D9%84%D8%A5%D8%AA%D8%B5%D8%A7%D9%84.svg"
            alt=""
            className="h-5 w-5 flex-shrink-0"
          />
        );
      case 'news':
        return (
          <img
            src="/sidebar/%D8%A7%D9%84%D8%A3%D8%AE%D8%A8%D8%A7%D8%B1.svg"
            alt=""
            className="h-5 w-5 flex-shrink-0"
          />
        );
      case 'evaluations':
        return (
          <img
            src="/sidebar/%D8%A7%D9%84%D8%AA%D9%82%D9%88%D9%8A%D9%85%20%D9%88%20%D8%A7%D9%84%D8%A3%D8%AD%D8%AF%D8%A7%D8%AB.svg"
            alt=""
            className="h-5 w-5 flex-shrink-0"
          />
        );
      case 'reproduction':
        return (
          <img
            src={isActive ? '/sidebar/%D8%A7%D9%84%D8%AA%D9%86%D8%A7%D8%B3%D9%84%D9%8A%D8%A7%D8%AA-active.svg' : '/sidebar/%D8%A7%D9%84%D8%AA%D9%86%D8%A7%D8%B3%D9%84%D9%8A%D8%A7%D8%AA.svg'}
            alt=""
            className="h-5 w-5 flex-shrink-0"
          />
        );
      case 'database':
        return (
          <img
            src="/sidebar/%D9%82%D8%A7%D8%B9%D8%AF%D8%A9%20%D8%A7%D9%84%D8%A8%D9%8A%D8%A7%D9%86%D8%A7%D8%AA.svg"
            alt=""
            className="h-5 w-5 flex-shrink-0"
          />
        );
      default:
        return <DashboardIcon className={iconClassName} />;
    }
  };

  return (
    <Link href={href} className="block" title={collapsed ? label : undefined}>
      <div
        className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-300 ${collapsed ? 'md:justify-center md:gap-0 md:px-0' : ''} ${direction === 'rtl'
          ? 'flex-row-reverse justify-end text-right'
          : 'flex-row justify-start text-left'
          } ${isActive
            ? 'bg-[#f5efbb] text-[#241a17] shadow-[0_10px_24px_rgba(107,77,41,0.08)]'
            : 'text-[#2b2330] hover:bg-[#f8efe7]'
          }`}
      >
        {direction !== 'rtl' && <span>{renderIcon()}</span>}
        <span
          className={`overflow-hidden whitespace-nowrap text-[0.82rem] font-semibold leading-tight transition-all duration-300 ${
            collapsed ? 'md:max-w-0 md:opacity-0' : 'md:max-w-[12rem] md:opacity-100'
          }`}
        >
          {label}
        </span>
        {direction === 'rtl' && <span>{renderIcon()}</span>}
      </div>
    </Link>
  );
}

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ open = true, onClose, collapsed = false, onCollapsedChange }: SidebarProps) {
  const { locale, direction } = useLocale();
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const isRTL = direction === 'rtl';
  const ToggleIcon = isRTL
    ? collapsed
      ? ChevronLeft
      : ChevronRight
    : collapsed
      ? ChevronRight
      : ChevronLeft;

  const handleLogout = () => {
    clearAuthCookie();
    onClose?.();
    router.replace(`/${locale}/login`);
  };

  return (
    <aside
      className={`fixed z-50 flex h-full w-[17rem] flex-col overflow-y-auto rounded-none bg-white px-4 py-5 shadow-[0_20px_40px_rgba(96,56,23,0.08)] transition-all duration-300 ease-in-out
        md:top-8 md:z-20 md:h-[calc(100vh-4rem)] ${collapsed ? 'md:w-[5.5rem] md:px-3' : 'md:w-[17.5rem] md:px-5'} md:rounded-[28px] md:py-6 md:translate-x-0
        ${isRTL
          ? `top-0 right-0 md:right-10 ${open ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`
          : `top-0 left-0 md:left-10 ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`
        }`}
    >
      <div className={`mb-6 flex items-center gap-3 md:mb-8 ${collapsed ? 'md:flex-col md:justify-center md:gap-2' : 'justify-between'}`}>
        <Link href={`/${locale}/dashboard`}>
          <img
            src={collapsed ? '/brand/icon.png' : '/brand/logo.png'}
            alt="StudManager"
            className={`h-10 w-auto cursor-pointer object-contain transition-all duration-300 sm:h-12 ${
              collapsed ? 'md:h-10' : 'md:h-16'
            }`}
          />
        </Link>
        <button
          type="button"
          onClick={() => onCollapsedChange?.(!collapsed)}
          className="hidden h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#eadfd6] bg-[#fbf8f4] text-[#4b2f1a] shadow-sm transition hover:bg-[#f8efe7] md:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ToggleIcon className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1">
        {sidebarItems.map((item) => {
          const route = item.route || item.key;
          const href = `/${locale}/${route}`;
          const isActive = pathname.startsWith(href);
          return (
            <div key={item.key} onClick={onClose}>
              <SidebarItem item={item} isActive={isActive} href={href} collapsed={collapsed} />
            </div>
          );
        })}

        <div className="mt-6 border-t border-gray-100 pt-6">
          <button
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[#8d3a2a] transition-all duration-300 hover:bg-[#fff1ea] ${
              direction === 'rtl' ? 'flex-row-reverse justify-end text-right' : 'flex-row justify-start text-left'
            } ${
              collapsed ? 'md:justify-center md:gap-0 md:px-0' : ''
            }`}
            title={collapsed ? t('common.logout') : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span
              className={`overflow-hidden whitespace-nowrap text-[0.82rem] font-semibold leading-tight transition-all duration-300 ${
                collapsed ? 'md:max-w-0 md:opacity-0' : 'md:max-w-[12rem] md:opacity-100'
              }`}
            >
              {t('common.logout')}
            </span>
          </button>
        </div>

        <div className="md:hidden mt-4 flex justify-center border-t border-gray-100 pt-6">
          <LocaleMenu variant="mobile" />
        </div>
      </nav>
    </aside>
  );
}
