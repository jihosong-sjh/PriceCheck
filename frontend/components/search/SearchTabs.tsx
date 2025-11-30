'use client';

interface SearchTabsProps {
  activeTab: 'search' | 'ai';
  onTabChange: (tab: 'search' | 'ai') => void;
}

export default function SearchTabs({ activeTab, onTabChange }: SearchTabsProps) {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
      <button
        type="button"
        onClick={() => onTabChange('search')}
        className={`flex-1 py-3 px-4 text-center font-medium transition-colors relative
          ${
            activeTab === 'search'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
      >
        <div className="flex items-center justify-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span>직접 검색</span>
        </div>
        {activeTab === 'search' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
        )}
      </button>

      <button
        type="button"
        onClick={() => onTabChange('ai')}
        className={`flex-1 py-3 px-4 text-center font-medium transition-colors relative
          ${
            activeTab === 'ai'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
      >
        <div className="flex items-center justify-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>AI 사진 인식</span>
        </div>
        {activeTab === 'ai' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
        )}
      </button>
    </div>
  );
}
