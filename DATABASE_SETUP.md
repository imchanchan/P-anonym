# 문고리 데이터베이스 설정 가이드

이 문서는 Supabase 데이터베이스를 설정하는 방법을 안내합니다.

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속하여 로그인
2. "New Project" 버튼 클릭
3. 프로젝트 이름, 데이터베이스 비밀번호 설정
4. Region 선택 (Northeast Asia (Seoul) 추천)

## 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가:

```dd
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Supabase 대시보드의 Settings > API에서 URL과 anon key를 확인할 수 있습니다.

## 3. 데이터베이스 테이블 생성

Supabase SQL Editor에서 다음 SQL을 실행:

### Posts 테이블 (익명 게시판)

```sql
create table posts (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  category text not null,
  likes integer default 0,
  comments integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) 활성화
alter table posts enable row level security;

-- 모든 사용자가 읽기 가능
create policy "Posts are viewable by everyone"
  on posts for select
  using (true);

-- 모든 사용자가 생성 가능 (익명)
create policy "Posts are insertable by everyone"
  on posts for insert
  with check (true);

-- 좋아요 업데이트 가능
create policy "Posts are updatable by everyone"
  on posts for update
  using (true);

-- 인덱스 추가
create index posts_created_at_idx on posts(created_at desc);
create index posts_category_idx on posts(category);
```

### Market Items 테이블 (문고리 당근)

```sql
create table market_items (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  category text not null,
  type text not null check (type in ('sell', 'free')),
  price text,
  status text default 'available' check (status in ('available', 'reserved', 'completed')),
  likes integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) 활성화
alter table market_items enable row level security;

-- 모든 사용자가 읽기 가능
create policy "Market items are viewable by everyone"
  on market_items for select
  using (true);

-- 모든 사용자가 생성 가능 (익명)
create policy "Market items are insertable by everyone"
  on market_items for insert
  with check (true);

-- 모든 사용자가 업데이트 가능
create policy "Market items are updatable by everyone"
  on market_items for update
  using (true);

-- 인덱스 추가
create index market_items_created_at_idx on market_items(created_at desc);
create index market_items_type_idx on market_items(type);
create index market_items_status_idx on market_items(status);
```

### Conversations 테이블 (메시지)

```sql
create table conversations (
  id uuid default uuid_generate_v4() primary key,
  nickname text not null,
  last_message text,
  unread boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) 활성화
alter table conversations enable row level security;

-- 모든 사용자가 접근 가능
create policy "Conversations are viewable by everyone"
  on conversations for select
  using (true);

create policy "Conversations are insertable by everyone"
  on conversations for insert
  with check (true);

create policy "Conversations are updatable by everyone"
  on conversations for update
  using (true);
```

### Messages 테이블

```sql
create table messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references conversations(id) on delete cascade,
  content text not null,
  sender_type text not null check (sender_type in ('me', 'other')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) 활성화
alter table messages enable row level security;

-- 모든 사용자가 접근 가능
create policy "Messages are viewable by everyone"
  on messages for select
  using (true);

create policy "Messages are insertable by everyone"
  on messages for insert
  with check (true);

-- 인덱스 추가
create index messages_conversation_id_idx on messages(conversation_id);
create index messages_created_at_idx on messages(created_at);
```

## 4. 완전한 익명성 보장

이 설정은 다음과 같은 익명성을 보장합니다:

1. **사용자 인증 불필요**: Row Level Security 정책에서 `using (true)`를 사용하여 누구나 접근 가능
2. **작성자 정보 미저장**: 테이블에 user_id 컬럼이 없어 작성자를 추적 불가
3. **관리자도 확인 불가**: 데이터베이스 레벨에서 작성자 정보가 저장되지 않음

## 5. 선택사항: 샘플 데이터 추가

```sql
-- 샘플 게시글
insert into posts (content, category, likes, comments) values
  ('신입인데 회의록 작성할 때 꿀팁 있나요?', '질문', 12, 8),
  ('점심시간에 다들 뭐 하시나요?', '잡담', 24, 15);

-- 샘플 거래 물품
insert into market_items (title, description, category, type, price, status, likes) values
  ('리액트 교재 나눔', '리액트를 다루는 기술 책 나눔합니다', '도서', 'free', null, 'available', 8),
  ('기계식 키보드 판매', '체리 청축 기계식 키보드입니다', '전자기기', 'sell', '50,000원', 'available', 15);
```

## 6. 실시간 구독 (선택사항)

실시간으로 새 게시글이나 메시지를 받으려면 Supabase Realtime을 사용할 수 있습니다.

```typescript
// 예시: 새 게시글 실시간 구독
supabase
  .channel('posts')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, payload => {
    console.log('New post:', payload.new)
  })
  .subscribe()
```

## 주의사항

⚠️ 이 설정은 완전한 익명성을 보장하지만, 다음을 고려해야 합니다:

- 스팸이나 악의적인 콘텐츠에 대한 대응이 어려움
- 개인 간 분쟁 발생 시 중재가 어려움
- 실제 프로덕션 환경에서는 추가 보안 조치 고려 필요
