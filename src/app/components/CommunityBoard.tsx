import { useState } from 'react';
import { Plus, ThumbsUp, MessageCircle, Clock } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Badge } from '@/app/components/ui/badge';

interface Post {
  id: string;
  content: string;
  category: string;
  likes: number;
  comments: number;
  timeAgo: string;
  isLiked: boolean;
}

const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    content: '신입인데 회의록 작성할 때 꿀팁 있나요? 매번 놓치는 부분이 많아서요 ㅠㅠ',
    category: '질문',
    likes: 12,
    comments: 8,
    timeAgo: '5분 전',
    isLiked: false,
  },
  {
    id: '2',
    content: '점심시간에 다들 뭐 하시나요? 저는 항상 혼자 밥먹고 산책하는데 외로워요...',
    category: '잡담',
    likes: 24,
    comments: 15,
    timeAgo: '32분 전',
    isLiked: false,
  },
  {
    id: '3',
    content: '개발팀 분위기 어떤가요? 이직 고민중인데 내부 의견 듣고 싶습니다.',
    category: '고민',
    likes: 45,
    comments: 23,
    timeAgo: '1시간 전',
    isLiked: true,
  },
  {
    id: '4',
    content: '주차장 만차인데 다들 어디에 주차하시나요?? 근처 공영주차장 추천 부탁드립니다',
    category: '질문',
    likes: 8,
    comments: 12,
    timeAgo: '2시간 전',
    isLiked: false,
  },
];

export function CommunityBoard() {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('질문');

  const categories = ['질문', '잡담', '고민', '정보', '기타'];

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          isLiked: !post.isLiked,
        };
      }
      return post;
    }));
  };

  const handleCreatePost = () => {
    if (newPost.trim()) {
      const post: Post = {
        id: Date.now().toString(),
        content: newPost,
        category: selectedCategory,
        likes: 0,
        comments: 0,
        timeAgo: '방금',
        isLiked: false,
      };
      setPosts([post, ...posts]);
      setNewPost('');
      setIsDialogOpen(false);
    }
  };

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

      {/* Posts List */}
      <div className="space-y-3">
        {posts.map((post) => (
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
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
