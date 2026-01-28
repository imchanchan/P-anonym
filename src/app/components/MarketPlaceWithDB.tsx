import { useState, useEffect } from 'react';
import { Plus, Heart, Send, Package, Trash2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { supabase, isUsingSupabase, type MarketItem, type MarketItemImage } from '@/lib/supabase';
import { toast } from 'sonner';

// Mock data for when Supabase is not configured
const MOCK_ITEMS: (MarketItem & { isLiked: boolean; timeAgo: string; images: MarketItemImage[] })[] = [
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
    images: [],
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
    images: [],
  },
];

export function MarketPlaceWithDB() {
  const [items, setItems] = useState<(MarketItem & { isLiked: boolean; timeAgo: string; images: MarketItemImage[] })[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category: '도서',
    type: 'free' as 'sell' | 'free',
    price: '',
  });
  const [newItemImages, setNewItemImages] = useState<File[]>([]);

  const categories = ['도서', '전자기기', '문구', '생활용품', '기타'];
  const maxImages = 5;
  const maxImageSize = 5 * 1024 * 1024;

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
        .select('*, market_item_images ( id, market_item_id, url, path, sort_order, created_at )')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const itemsWithMeta = (data || []).map((item: MarketItem & { market_item_images?: MarketItemImage[] }) => ({
        ...item,
        isLiked: false,
        timeAgo: getTimeAgo(item.created_at),
        images: (item.market_item_images || []).sort((a, b) => a.sort_order - b.sort_order),
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
      if (newItemImages.length > maxImages) {
        toast.error(`사진은 최대 ${maxImages}장까지 업로드할 수 있습니다`);
        return;
      }

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

          let uploadedImages: MarketItemImage[] = [];
          if (newItemImages.length > 0) {
            const imageInserts: Omit<MarketItemImage, 'id' | 'created_at'>[] = [];

            for (let i = 0; i < newItemImages.length; i += 1) {
              const file = newItemImages[i];
              if (file.size > maxImageSize) {
                throw new Error(`5MB 초과 이미지가 있습니다: ${file.name}`);
              }

              const fileExt = file.name.split('.').pop() || 'jpg';
              const filePath = `market_items/${data.id}/${Date.now()}-${i}.${fileExt}`;
              const { error: uploadError } = await supabase.storage
                .from('market-item-images')
                .upload(filePath, file, { upsert: false });

              if (uploadError) throw uploadError;

              const { data: publicData } = supabase.storage
                .from('market-item-images')
                .getPublicUrl(filePath);

              imageInserts.push({
                market_item_id: data.id,
                url: publicData.publicUrl,
                path: filePath,
                sort_order: i,
              });
            }

            const { data: imagesData, error: imagesError } = await supabase
              .from('market_item_images')
              .insert(imageInserts)
              .select();

            if (imagesError) throw imagesError;

            uploadedImages = imagesData as MarketItemImage[];
          }

          const newItemWithMeta = {
            ...data,
            isLiked: false,
            timeAgo: '방금',
            images: uploadedImages,
          };

          setItems([newItemWithMeta, ...items]);
          setNewItem({
            title: '',
            description: '',
            category: '도서',
            type: 'free',
            price: '',
          });
          setNewItemImages([]);
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
          images: [],
        };
        
        setItems([mockItem, ...items]);
        setNewItem({
          title: '',
          description: '',
          category: '도서',
          type: 'free',
          price: '',
        });
        setNewItemImages([]);
        setIsDialogOpen(false);
        toast.success('물품이 등록되었습니다 (데모 모드)');
      }
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (isUsingSupabase && supabase) {
      try {
        const item = items.find(currentItem => currentItem.id === itemId);
        if (item && item.images.length > 0) {
          const paths = item.images.map(image => image.path);
          const { error: storageError } = await supabase.storage
            .from('market-item-images')
            .remove(paths);

          if (storageError) throw storageError;

          await supabase
            .from('market_item_images')
            .delete()
            .eq('market_item_id', itemId);
        }

        const { error } = await supabase
          .from('market_items')
          .delete()
          .eq('id', itemId);

        if (error) throw error;

        setItems(items.filter(item => item.id !== itemId));
        toast.success('물품이 삭제되었습니다');
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error('물품 삭제에 실패했습니다');
      }
    } else {
      setItems(items.filter(item => item.id !== itemId));
      toast.success('물품이 삭제되었습니다 (데모 모드)');
    }
  };

  const handleImageChange = (files: FileList | null) => {
    if (!files) return;
    const picked = Array.from(files);
    const next = [...newItemImages, ...picked].slice(0, maxImages);
    setNewItemImages(next);
  };

  const handleRemoveImage = (index: number) => {
    setNewItemImages(newItemImages.filter((_, i) => i !== index));
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
        {item.images.length > 0 && (
          <div className={`grid gap-2 ${item.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {item.images.slice(0, 5).map((image) => (
              <img
                key={image.id}
                src={image.url}
                alt={item.title}
                className="w-full h-36 object-cover rounded-md"
                loading="lazy"
              />
            ))}
          </div>
        )}
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
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1">
              <Send size={14} />
              익명 메시지
            </Button>
            <button
              onClick={() => handleDeleteItem(item.id)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
              삭제
            </button>
          </div>
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
            <div>
              <label className="text-sm font-medium mb-2 block">사진 (최대 {maxImages}장)</label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleImageChange(e.target.files)}
              />
              {newItemImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {newItemImages.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-20 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 text-[10px] bg-white/90 rounded px-1 text-gray-700"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
