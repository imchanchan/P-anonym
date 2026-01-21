import { useState, useEffect } from 'react';
import { Plus, Heart, Send, Package } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { supabase, isUsingSupabase, type MarketItem } from '@/lib/supabase';
import { toast } from 'sonner';

// Mock data for when Supabase is not configured
const MOCK_ITEMS: (MarketItem & { isLiked: boolean; timeAgo: string })[] = [
  {
    id: '1',
    title: '리액트 교재 나눔',
    description: '"리액트를 다루는 기술" 책 나눔합니다. 상태 좋습니다.',
    category: '도서',
    type: 'free',
    status: 'available',
    likes: 8,
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
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
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isLiked: true,
    timeAgo: '45분 전',
  },
];

export function MarketPlaceWithDB() {
  const [items, setItems] = useState<(MarketItem & { isLiked: boolean; timeAgo: string })[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category: '도서',
    type: 'free' as 'sell' | 'free',
    price: '',
  });

  const categories = ['도서', '전자기기', '문구', '생활용품', '기타'];

  useEffect(() => {
    if (isUsingSupabase) {
      fetchItems();
    } else {
      setItems(MOCK_ITEMS);
      setLoading(false);
    }
  }, []);

  const fetchItems = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('market_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const itemsWithMeta = (data || []).map(item => ({
        ...item,
        isLiked: false,
        timeAgo: getTimeAgo(item.created_at),
      }));

      setItems(itemsWithMeta);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('물품 목록을 불러오는데 실패했습니다');
      // Fallback to mock data
      setItems(MOCK_ITEMS);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (itemId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const newLikes = item.isLiked ? item.likes - 1 : item.likes + 1;
        const newIsLiked = !item.isLiked;
        
        // Update in Supabase if configured
        if (isUsingSupabase && supabase) {
          supabase
            .from('market_items')
            .update({ likes: newLikes })
            .eq('id', itemId)
            .then();
        }

        return { ...item, likes: newLikes, isLiked: newIsLiked };
      }
      return item;
    }));
  };

  const handleCreateItem = async () => {
    if (newItem.title.trim() && newItem.description.trim()) {
      if (isUsingSupabase && supabase) {
        // Use Supabase
        try {
          const { data, error } = await supabase
            .from('market_items')
            .insert([
              {
                title: newItem.title,
                description: newItem.description,
                category: newItem.category,
                type: newItem.type,
                price: newItem.type === 'sell' ? newItem.price : null,
                status: 'available',
                likes: 0,
              }
            ])
            .select()
            .single();

          if (error) throw error;

          const newItemWithMeta = {
            ...data,
            isLiked: false,
            timeAgo: '방금',
          };

          setItems([newItemWithMeta, ...items]);
          setNewItem({
            title: '',
            description: '',
            category: '도서',
            type: 'free',
            price: '',
          });
          setIsDialogOpen(false);
          toast.success('물품이 등록되었습니다');
        } catch (error) {
          console.error('Error creating item:', error);
          toast.error('물품 등록에 실패했습니다');
        }
      } else {
        // Use mock/local storage
        const mockItem = {
          id: Date.now().toString(),
          title: newItem.title,
          description: newItem.description,
          category: newItem.category,
          type: newItem.type,
          price: newItem.type === 'sell' ? newItem.price : undefined,
          status: 'available' as const,
          likes: 0,
          created_at: new Date().toISOString(),
          isLiked: false,
          timeAgo: '방금',
        };
        
        setItems([mockItem, ...items]);
        setNewItem({
          title: '',
          description: '',
          category: '도서',
          type: 'free',
          price: '',
        });
        setIsDialogOpen(false);
        toast.success('물품이 등록되었습니다 (데모 모드)');
      }
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diff = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diff < 60) return '방금';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return `${Math.floor(diff / 86400)}일 전`;
  };

  const filteredItems = (type: 'all' | 'sell' | 'free') => {
    if (type === 'all') return items;
    return items.filter(item => item.type === type);
  };

  const ItemCard = ({ item }: { item: typeof items[0] }) => (
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

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
          {filteredItems('all').length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              아직 등록된 물품이 없습니다
            </Card>
          ) : (
            filteredItems('all').map(item => <ItemCard key={item.id} item={item} />)
          )}
        </TabsContent>
        <TabsContent value="free" className="space-y-3 mt-4">
          {filteredItems('free').length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              나눔 물품이 없습니다
            </Card>
          ) : (
            filteredItems('free').map(item => <ItemCard key={item.id} item={item} />)
          )}
        </TabsContent>
        <TabsContent value="sell" className="space-y-3 mt-4">
          {filteredItems('sell').length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              판매 물품이 없습니다
            </Card>
          ) : (
            filteredItems('sell').map(item => <ItemCard key={item.id} item={item} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}