import { useState, useEffect } from 'react';
import { ArrowLeft, Send, Shield } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { ScrollArea } from '@/app/components/ui/scroll-area';

interface Message {
  id: string;
  content: string;
  sender: 'me' | 'other';
  timestamp: string;
}

interface Conversation {
  id: string;
  nickname: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  messages: Message[];
}

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    nickname: '익명의 사원A',
    lastMessage: '네, 내일 점심시간에 만나요!',
    timestamp: '10분 전',
    unread: true,
    messages: [
      {
        id: '1',
        content: '안녕하세요! 리액트 책 아직 나눔 가능한가요?',
        sender: 'me',
        timestamp: '오후 2:30',
      },
      {
        id: '2',
        content: '네 가능합니다! 언제 받아가실 수 있나요?',
        sender: 'other',
        timestamp: '오후 2:35',
      },
      {
        id: '3',
        content: '내일 점심시간에 괜찮을까요?',
        sender: 'me',
        timestamp: '오후 2:37',
      },
      {
        id: '4',
        content: '네, 내일 점심시간에 만나요!',
        sender: 'other',
        timestamp: '오후 2:40',
      },
    ],
  },
  {
    id: '2',
    nickname: '익명의 사원B',
    lastMessage: '가격은 얼마인가요?',
    timestamp: '1시간 전',
    unread: true,
    messages: [
      {
        id: '1',
        content: '키보드 아직 판매 중이신가요?',
        sender: 'other',
        timestamp: '오후 1:15',
      },
      {
        id: '2',
        content: '네 아직 있습니다!',
        sender: 'me',
        timestamp: '오후 1:20',
      },
      {
        id: '3',
        content: '가격은 얼마인가요?',
        sender: 'other',
        timestamp: '오후 1:22',
      },
    ],
  },
  {
    id: '3',
    nickname: '익명의 사원C',
    lastMessage: '감사합니다!',
    timestamp: '어제',
    unread: false,
    messages: [
      {
        id: '1',
        content: '회의록 작성 팁 정말 도움됐어요!',
        sender: 'other',
        timestamp: '어제',
      },
      {
        id: '2',
        content: '도움이 되었다니 다행이에요 ^^',
        sender: 'me',
        timestamp: '어제',
      },
      {
        id: '3',
        content: '감사합니다!',
        sender: 'other',
        timestamp: '어제',
      },
    ],
  },
];

interface MessagesProps {
  onUnreadChange: (count: number) => void;
}

export function Messages({ onUnreadChange }: MessagesProps) {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const unreadCount = conversations.filter(conv => conv.unread).length;
    onUnreadChange(unreadCount);
  }, [conversations, onUnreadChange]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Mark as read
    setConversations(conversations.map(conv => 
      conv.id === conversation.id ? { ...conv, unread: false } : conv
    ));
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      const message: Message = {
        id: Date.now().toString(),
        content: newMessage,
        sender: 'me',
        timestamp: '방금',
      };
      
      setConversations(conversations.map(conv => {
        if (conv.id === selectedConversation.id) {
          return {
            ...conv,
            messages: [...conv.messages, message],
            lastMessage: newMessage,
            timestamp: '방금',
          };
        }
        return conv;
      }));

      setSelectedConversation({
        ...selectedConversation,
        messages: [...selectedConversation.messages, message],
      });

      setNewMessage('');
    }
  };

  if (selectedConversation) {
    return (
      <div className="space-y-4">
        {/* Chat Header */}
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedConversation(null)}
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="flex-1">
              <h3 className="font-semibold">{selectedConversation.nickname}</h3>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Shield size={12} />
                <span>익명 대화</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Messages */}
        <Card className="p-4">
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {selectedConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === 'me' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender === 'me'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <span
                      className={`text-xs mt-1 block ${
                        message.sender === 'me'
                          ? 'text-purple-200'
                          : 'text-gray-500'
                      }`}
                    >
                      {message.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Input */}
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="익명 메시지를 입력하세요..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send size={18} />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-600 bg-purple-50 p-3 rounded-lg">
        <Shield size={16} />
        <span>모든 대화는 익명으로 진행됩니다</span>
      </div>

      {/* Conversations List */}
      <div className="space-y-2">
        {conversations.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">아직 메시지가 없습니다</p>
          </Card>
        ) : (
          conversations.map((conversation) => (
            <Card
              key={conversation.id}
              className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
                conversation.unread ? 'bg-purple-50' : ''
              }`}
              onClick={() => handleSelectConversation(conversation)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{conversation.nickname}</h3>
                    {conversation.unread && (
                      <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {conversation.lastMessage}
                  </p>
                </div>
                <span className="text-xs text-gray-500 ml-2">
                  {conversation.timestamp}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
