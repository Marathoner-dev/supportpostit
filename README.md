# 너의 수능을 응원해! 🎓

친구들이 응원 메시지를 남길 수 있는 온라인 롤링페이퍼 서비스입니다.

## ✨ 주요 기능

- **화이트보드 페이지 생성**: 각 사용자는 고유한 URL(`/board/:id`)을 가집니다
- **응원글 작성**: 닉네임과 응원 문구를 입력하여 포스트잇 형태로 추가
- **포스트잇 랜덤 배치**: 자연스럽게 흩뿌려진 형태로 배치되며 랜덤 회전 효과 적용
- **클릭 시 확대 모달**: 포스트잇 클릭 시 확대되어 응원 문구를 자세히 확인
- **Firebase Firestore 연동**: 실시간 데이터 동기화
- **반응형 UI**: 모바일부터 데스크탑까지 완벽 대응

## 🚀 시작하기

### 1. 저장소 클론 및 의존성 설치

```bash
npm install
```

### 2. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Firestore Database 활성화 (테스트 모드 또는 프로덕션 모드)
3. `.env.example` 파일을 `.env`로 복사하고 Firebase 설정 값 입력:

```bash
cp .env.example .env
```

`.env` 파일에 Firebase 설정 정보를 입력하세요:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 3. 개발 서버 실행

```bash
npm start
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 📦 기술 스택

- **React** - UI 라이브러리
- **React Router** - 라우팅
- **Firebase Firestore** - 실시간 데이터베이스
- **Tailwind CSS** - 스타일링
- **Framer Motion** - 애니메이션
- **UUID** - 고유 ID 생성

## 🏗️ 프로젝트 구조

```
suportwall/
├── public/
│   └── index.html
├── src/
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── PostIt.jsx       # 포스트잇 컴포넌트
│   │   ├── PostItModal.jsx  # 포스트잇 확대 모달
│   │   ├── AddPostForm.jsx  # 응원 메시지 작성 폼
│   │   └── Modal.jsx        # 기본 모달 컴포넌트
│   ├── pages/               # 페이지 컴포넌트
│   │   ├── Home.jsx         # 홈 페이지 (보드 생성)
│   │   └── BoardView.jsx    # 보드 보기 페이지
│   ├── config/              # 설정 파일
│   │   └── firebase.js      # Firebase 초기화
│   ├── utils/               # 유틸리티 함수
│   │   ├── constants.js     # 상수 정의
│   │   └── helpers.js       # 헬퍼 함수
│   ├── App.jsx              # 메인 앱 컴포넌트
│   ├── App.css
│   ├── index.js             # 엔트리 포인트
│   └── index.css            # 전역 스타일
├── .env.example             # 환경 변수 예시
├── vercel.json              # Vercel 배포 설정
└── package.json
```

## 🚢 배포

### Vercel 배포

1. [Vercel](https://vercel.com)에 프로젝트 연결
2. 환경 변수 설정 (Vercel 대시보드에서 `.env` 파일의 값들을 추가)
3. 자동 배포 완료!

### Firebase Hosting 배포

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## 📝 Firestore 데이터 구조

```
boards/
  {boardId}/
    owner: string
    theme: string
    ddayTarget: string (YYYY-MM-DD)
    createdAt: timestamp
    notes/
      {noteId}/
        nickname: string
        message: string
        x: number (퍼센트)
        y: number (퍼센트)
        rotation: number (도)
        color: string (HEX)
        createdAt: timestamp
```

## 🎨 커스터마이징

### 포스트잇 색상 변경

`src/utils/constants.js` 파일의 `POSTIT_COLORS` 배열을 수정하세요.

### 테마 추가

`src/utils/constants.js` 파일의 `THEMES` 객체에 새 테마를 추가하세요.

## 📄 라이선스

MIT
