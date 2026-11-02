'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const menuGroups = [
    {
      items: [
        { name: '대시보드', href: '/dashboard', color: 'bg-blue-500' },
        { name: '발주 목록', href: '/orders', color: 'bg-purple-500' },
        { name: '플레이스', href: '/places', color: 'bg-fuchsia-500' },
        { name: '퀴즈/주차장', href: '/quizzes', color: 'bg-violet-500' },
        { name: '수행 목록', href: '/executions', color: 'bg-teal-500' },
        { name: '문의 목록', href: '/reports', color: 'bg-orange-500' },
        { name: '공지사항', href: '/notices', color: 'bg-rose-500' },
        { name: '회원관리', href: '/users', color: 'bg-indigo-500' },
        { name: '대리점 관리', href: '/agencies', color: 'bg-sky-500' },
        { name: '건수 원장', href: '/balance-events', color: 'bg-cyan-500' },
        { name: '플랫폼 단가', href: '/order-prices', color: 'bg-lime-500' },
        { name: '대리점 정산', href: '/order-settlement', color: 'bg-green-600' },
        { name: 'FAQ 관리', href: '/faq', color: 'bg-emerald-500' },
        { name: 'PC방 관리', href: '/pcbangs', color: 'bg-amber-500' },
        { name: 'PC방 통계', href: '/pcbang-stats', color: 'bg-yellow-500' },
        { name: 'PC방 정산', href: '/pcbang-settlement', color: 'bg-stone-500' },
      ]
    },
  ];

  const allMenuItems = menuGroups.flatMap(group => group.items);


  return (
    <>
      {/* 데스크톱 사이드바 (왼쪽) */}
      <aside className="hidden lg:block w-64 shrink-0 bg-gray-50 min-h-screen border-r border-gray-200">
        <div className="p-4">
          <nav className="space-y-4">
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                <div className="space-y-2">
                  {group.items.map((item) => {
                    const isActive = pathname.startsWith(item.href.split('?')[0]);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
                {groupIndex < menuGroups.length - 1 && (
                  <div className="my-4 border-t border-gray-300"></div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* 모바일 하단 네비게이션 */}
      <aside className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="px-2 py-1.5">
          <nav className="grid grid-cols-4 gap-1">
            {allMenuItems.map((item) => {
              const isActive = pathname.startsWith(item.href.split('?')[0]);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-center px-1 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-center leading-tight truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}