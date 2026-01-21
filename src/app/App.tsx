import { useState } from 'react';
import { CommunityBoardWithDB } from '@/app/components/CommunityBoardWithDB';
import { MarketPlaceWithDB } from '@/app/components/MarketPlaceWithDB';
import { Messages } from '@/app/components/Messages';
import { Home, MessageSquare, ShoppingBag } from 'lucide-react';
import { Toaster } from '@/app/components/ui/sonner';

type TabType = 'community' | 'market' | 'messages';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('community');
  const [unreadMessages, setUnreadMessages] = useState(3);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">문</span>
              </div>
              <div>
                <h1 className="font-bold text-xl">문고리</h1>
                <p className="text-xs text-gray-500">T3Q 익명 커뮤니티</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">익명 보장</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {activeTab === 'community' && <CommunityBoardWithDB />}
        {activeTab === 'market' && <MarketPlaceWithDB />}
        {activeTab === 'messages' && <Messages onUnreadChange={setUnreadMessages} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-around">
            <button
              onClick={() => setActiveTab('community')}
              className={`flex flex-col items-center gap-1 py-3 px-6 transition-colors ${
                activeTab === 'community'
                  ? 'text-purple-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Home size={24} />
              <span className="text-xs">익명게시판</span>
            </button>
            <button
              onClick={() => setActiveTab('market')}
              className={`flex flex-col items-center gap-1 py-3 px-6 transition-colors ${
                activeTab === 'market'
                  ? 'text-purple-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <ShoppingBag size={24} />
              <span className="text-xs">문고리 당근</span>
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex flex-col items-center gap-1 py-3 px-6 transition-colors relative ${
                activeTab === 'messages'
                  ? 'text-purple-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <MessageSquare size={24} />
              <span className="text-xs">메시지</span>
              {unreadMessages > 0 && (
                <span className="absolute top-2 right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>
      
      <Toaster />
    </div>
  );
}