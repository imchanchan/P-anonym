import { useState } from 'react';
import { Plus, Heart, Send, Package } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';

interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'sell' | 'free';
  price?: string;
  status: 'available' | 'reserved' | 'completed';
  likes: number;
  isLiked: boolean;
  timeAgo: string;
}

const INITIAL_ITEMS: Item[] = [
  {
    id: '1',
    title: '리액트 교재 나눔',
    description: '\"리액트를 다루는 기술\" 책 나눔합니다. 상태 좋습니다.',
    category: '도서',
    type: 'free',
    status: 'available',
    likes: 8,
    isLiked: false,
    timeAgo: '10분 전',
  },
  {
    id: '2',
    title: '기계식 키보드 판매',
    description: '체리 청축 기계식 키보드입니다. 거의 새것이에요.',
    category: '전자기기',
    type: 'sell',
    price: '50,000원',
    status: 'available',
    likes: 15,
    isLiked: true,
    timeAgo: '45분 전',
  },
  {
    id: '3',
    title: 'IT 기술 서적 5권 나눔',
    description: '자바스크립트, 파이썬 관련 책들입니다. 한꺼번에 가져가실 분!',
    category: '도서',
    type: 'free',
    status: 'reserved',
    likes: 23,
    isLiked: false,
    timeAgo: '1시간 전',
  },
  {
    id: '4',
    title: '무선마우스 저렴하게 판매',
    description: '로지텍 무선마우스 사용감 적어요.',
    category: '전자기기',
    type: 'sell',
    price: '15,000원',
    status: 'available',
    likes: 5,
    isLiked: false,
    timeAgo: '2시간 전',
  },
];

export function MarketPlace() {
  const [items, setItems] = useState<Item[]>(INITIAL_ITEMS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category: '도서',
    type: 'free' as 'sell' | 'free',
    price: '',
  });

  const categories = ['도서', '전자기기', '문구', '생활용품', '기타'];

  const handleLike = (itemId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          likes: item.isLiked ? item.likes - 1 : item.likes + 1,
          isLiked: !item.isLiked,
        };
      }
      return item;
    }));
  };

  const handleCreateItem = () => {
    if (newItem.title.trim() && newItem.description.trim()) {
      const item: Item = {
        id: Date.now().toString(),
        title: newItem.title,
        description: newItem.description,
        category: newItem.category,
        type: newItem.type,
        price: newItem.type === 'sell' ? newItem.price : undefined,
        status: 'available',
        likes: 0,
        isLiked: false,
        timeAgo: '방금',
      };
      setItems([item, ...items]);
      setNewItem({
        title: '',
        description: '',
        category: '도서',
        type: 'free',
        price: '',
      });
      setIsDialogOpen(false);
    }
  };

  const filteredItems = (type: 'all' | 'sell' | 'free') => {
    if (type === 'all') return items;
    return items.filter(item => item.type === type);
  };

  const ItemCard = ({ item }: { item: Item }) => (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant={item.type === 'free' ? 'default' : 'secondary'}
                className={item.type === 'free' ? 'bg-green-500' : ''}
              >
                {item.type === 'free' ? '나눔' : '판매'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {item.category}
              </Badge>
              {item.status !== 'available' && (
                <Badge variant="secondary" className="text-xs bg-gray-200">
                  {item.status === 'reserved' ? '예약중' : '거래완료'}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
            {item.price && (
              <p className="text-purple-600 font-bold mb-2">{item.price}</p>
            )}
            <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleLike(item.id)}
              className={`flex items-center gap-1 text-sm transition-colors ${
                item.isLiked
                  ? 'text-red-500'
                  : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart size={16} fill={item.isLiked ? 'currentColor' : 'none'} />
              <span>{item.likes}</span>
            </button>
            <span className="text-xs text-gray-500">{item.timeAgo}</span>
          </div>
          <Button size="sm" variant="outline" className="gap-1">
            <Send size={14} />
            익명 메시지
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Create Item Button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
            <Plus size={20} className="mr-2" />
            거래/나눔 등록하기
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>거래/나눔 등록</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">구분</label>
              <Tabs value={newItem.type} onValueChange={(value) => setNewItem({ ...newItem, type: value as 'sell' | 'free' })}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="free">나눔</TabsTrigger>
                  <TabsTrigger value="sell">판매</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">카테고리</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <Badge
                    key={cat}
                    variant={newItem.category === cat ? 'default' : 'outline'}
                    className={`cursor-pointer ${
                      newItem.category === cat
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setNewItem({ ...newItem, category: cat })}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">제목</label>
              <Input
                placeholder="물품 제목을 입력하세요"
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              />
            </div>
            {newItem.type === 'sell' && (
              <div>
                <label className="text-sm font-medium mb-2 block">가격</label>
                <Input
                  placeholder="예) 10,000원"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">설명</label>
              <Textarea
                placeholder="물품에 대한 설명을 입력하세요"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-green-50 p-3 rounded-lg">
              <Package size={14} />
              <span>익명으로 거래됩니다. 메시지를 통해 거래 방법을 협의하세요.</span>
            </div>
            <Button 
              onClick={handleCreateItem}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              등록하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Items Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="free">나눔</TabsTrigger>
          <TabsTrigger value="sell">판매</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-3 mt-4">
          {filteredItems('all').map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </TabsContent>
        <TabsContent value="free" className="space-y-3 mt-4">
          {filteredItems('free').map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </TabsContent>
        <TabsContent value="sell" className="space-y-3 mt-4">
          {filteredItems('sell').map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
