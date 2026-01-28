import { useState, useEffect } from 'react';
import { Plus, ThumbsUp, MessageCircle, Clock, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Badge } from '@/app/components/ui/badge';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { supabase, isUsingSupabase, type Post } from '@/lib/supabase';
import { toast } from 'sonner';

// Mock data for when Supabase is not configured
const MOCK_POSTS: (Post & { isLiked: boolean; timeAgo: string })[] = [
  {
    id: '1',
    content: '신입인데 회의록 작성할 때 꿀팁 있나요? 매번 놓치는 부분이 많아서요 ㅠㅠ',
    category: '질문',
    likes: 12,
    comments: 8,
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    isLiked: false,
    timeAgo: '5분 전',
  },
  {
    id: '2',
    content: '점심시간에 다들 뭐 하시나요? 저는 항상 혼자 밥먹고 산책하는데 외로워요...',
    category: '잡담',
    likes: 24,
    comments: 15,
    created_at: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    isLiked: false,
    timeAgo: '32분 전',
  },
  {
    id: '3',
    content: '개발팀 분위기 어떤가요? 이직 고민중인데 내부 의견 듣고 싶습니다.',
    category: '고민',
    likes: 45,
    comments: 23,
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    isLiked: true,
    timeAgo: '1시간 전',
  },
];

export function CommunityBoardWithDB() {
  const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';
  const [posts, setPosts] = useState<(Post & { isLiked: boolean; timeAgo: string })[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('질문');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingCategory, setEditingCategory] = useState('질문');
  const [loading, setLoading] = useState(true);

  const categories = ['질문', '잡담', '고민', '정보', '기타'];

  // Fetch posts from Supabase or use mock data
  useEffect(() => {
    if (isUsingSupabase) {
      fetchPosts();
    } else {
      setPosts(MOCK_POSTS);
      setLoading(false);
    }
  }, []);

  const fetchPosts = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const postsWithMeta = (data || []).map(post => ({
        ...post,
        isLiked: false, // 익명이므로 좋아요 상태는 로컬로 관리
        timeAgo: getTimeAgo(post.created_at),
      }));

      setPosts(postsWithMeta);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('게시글을 불러오는데 실패했습니다');
      // Fallback to mock data on error
      setPosts(MOCK_POSTS);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    // Update local state
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const newLikes = post.isLiked ? post.likes - 1 : post.likes + 1;
        const newIsLiked = !post.isLiked;
        
        // Update in Supabase if configured
        if (isUsingSupabase && supabase) {
          supabase
            .from('posts')
            .update({ likes: newLikes })
            .eq('id', postId)
            .then();
        }

        return { ...post, likes: newLikes, isLiked: newIsLiked };
      }
      return post;
    }));
  };

  const handleCreatePost = async () => {
    if (newPost.trim()) {
      if (isUsingSupabase && supabase) {
        // Use Supabase
        try {
          const { data, error } = await supabase
            .from('posts')
            .insert([
              {
                content: newPost,
                category: selectedCategory,
                likes: 0,
                comments: 0,
              }
            ])
            .select()
            .single();

          if (error) throw error;

          const newPostWithMeta = {
            ...data,
            isLiked: false,
            timeAgo: '방금',
          };

          setPosts([newPostWithMeta, ...posts]);
          setNewPost('');
          setIsDialogOpen(false);
          toast.success('게시글이 등록되었습니다');
        } catch (error) {
          console.error('Error creating post:', error);
          toast.error('게시글 등록에 실패했습니다');
        }
      } else {
        // Use mock/local storage
        const mockPost = {
          id: Date.now().toString(),
          content: newPost,
          category: selectedCategory,
          likes: 0,
          comments: 0,
          created_at: new Date().toISOString(),
          isLiked: false,
          timeAgo: '방금',
        };
        
        setPosts([mockPost, ...posts]);
        setNewPost('');
        setIsDialogOpen(false);
        toast.success(isDemo ? '게시글이 등록되었습니다 (데모 모드)' : '게시글이 등록되었습니다');
      }
    }
  };

  const openEdit = (post: Post & { isLiked: boolean; timeAgo: string }) => {
    setEditingPostId(post.id);
    setEditingContent(post.content);
    setEditingCategory(post.category);
    setIsEditOpen(true);
  };

  const handleUpdatePost = async () => {
    if (!editingPostId || !editingContent.trim()) return;

    if (isUsingSupabase && supabase) {
      try {
        const { data, error } = await supabase
          .from('posts')
          .update({ content: editingContent, category: editingCategory })
          .eq('id', editingPostId)
          .select()
          .single();

        if (error) throw error;

        setPosts(posts.map(post => {
          if (post.id === editingPostId) {
            return {
              ...post,
              content: data.content,
              category: data.category,
              created_at: data.created_at,
            };
          }
          return post;
        }));

        setIsEditOpen(false);
        setEditingPostId(null);
        toast.success('게시글이 수정되었습니다');
      } catch (error) {
        console.error('Error updating post:', error);
        toast.error('게시글 수정에 실패했습니다');
      }
    } else {
      setPosts(posts.map(post => {
        if (post.id === editingPostId) {
          return {
            ...post,
            content: editingContent,
            category: editingCategory,
          };
        }
        return post;
      }));
      setIsEditOpen(false);
      setEditingPostId(null);
      toast.success('게시글이 수정되었습니다 (데모 모드)');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (isUsingSupabase && supabase) {
      try {
        const { error } = await supabase
          .from('posts')
          .delete()
          .eq('id', postId);

        if (error) throw error;

        setPosts(posts.filter(post => post.id !== postId));
        toast.success('게시글이 삭제되었습니다');
      } catch (error) {
        console.error('Error deleting post:', error);
        toast.error('게시글 삭제에 실패했습니다');
      }
    } else {
      setPosts(posts.filter(post => post.id !== postId));
      toast.success('게시글이 삭제되었습니다 (데모 모드)');
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create Post Button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
            <Plus size={20} className="mr-2" />
            익명으로 글 작성하기
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>익명 글 작성</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">카테고리</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <Badge
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    className={`cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">내용</label>
              <Textarea
                placeholder="익명으로 자유롭게 작성하세요..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-purple-50 p-3 rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>완전한 익명이 보장됩니다. 관리자도 작성자를 알 수 없습니다.</span>
            </div>
            <Button 
              onClick={handleCreatePost}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              익명으로 게시하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>익명 글 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">카테고리</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <Badge
                    key={cat}
                    variant={editingCategory === cat ? 'default' : 'outline'}
                    className={`cursor-pointer ${
                      editingCategory === cat
                        ? 'bg-purple-600 hover:bg-purple-700'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setEditingCategory(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">내용</label>
              <Textarea
                placeholder="익명으로 자유롭게 작성하세요..."
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
            <Button 
              onClick={handleUpdatePost}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              수정하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Posts List */}
      <div className="space-y-3">
        {posts.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            아직 게시글이 없습니다. 첫 번째 글을 작성해보세요!
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {post.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={12} />
                    <span>{post.timeAgo}</span>
                  </div>
                </div>
                <p className="text-gray-800 leading-relaxed">{post.content}</p>
                <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1 text-sm transition-colors ${
                      post.isLiked
                        ? 'text-purple-600'
                        : 'text-gray-500 hover:text-purple-600'
                    }`}
                  >
                    <ThumbsUp size={16} fill={post.isLiked ? 'currentColor' : 'none'} />
                    <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 transition-colors">
                    <MessageCircle size={16} />
                    <span>{post.comments}</span>
                  </button>
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => openEdit(post)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600 transition-colors"
                    >
                      <Pencil size={14} />
                      수정
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
