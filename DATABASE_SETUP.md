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

Supabase SQL Editor에서 `supabase/schema.sql` 내용을 그대로 실행하세요.

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
