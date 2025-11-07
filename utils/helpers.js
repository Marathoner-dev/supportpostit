import { ROTATION_RANGE, POSTIT_COLORS } from './constants';

// D-Day 계산 함수
export function computeDDay(targetISO) {
  if (!targetISO) return null;
  const today = new Date();
  const target = new Date(targetISO + "T00:00:00");
  const diff = Math.ceil((target - new Date(today.toDateString())) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "D-Day!";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

// 두 사각형이 겹치는지 확인하는 함수
function checkRectOverlap(rect1, rect2) {
  return !(
    rect1.right < rect2.left ||
    rect1.left > rect2.right ||
    rect1.bottom < rect2.top ||
    rect1.top > rect2.bottom
  );
}

// 회전된 사각형의 바운딩 박스 계산
function getRotatedBounds(centerX, centerY, width, height, rotation) {
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  
  const rotatedWidth = width * cos + height * sin;
  const rotatedHeight = width * sin + height * cos;
  
  return {
    left: centerX - rotatedWidth / 2,
    right: centerX + rotatedWidth / 2,
    top: centerY - rotatedHeight / 2,
    bottom: centerY + rotatedHeight / 2,
    width: rotatedWidth,
    height: rotatedHeight
  };
}

// 메시지 길이에 따른 포스트잇 크기 계산
export function calculatePostItSize(messageLength = 0) {
  const baseWidth = 120;
  const baseHeight = 100;
  const charWidth = 8; // 글자당 예상 너비
  const lineHeight = 20; // 줄당 높이
  const maxWidth = 250; // 최대 너비
  const padding = 24; // 좌우 패딩
  
  // 메시지 길이에 따른 너비 계산
  const textWidth = Math.min(messageLength * charWidth, maxWidth - padding);
  const calculatedWidth = Math.max(baseWidth, textWidth + padding);
  
  // 메시지 길이에 따른 높이 계산 (줄바꿈 고려)
  const charsPerLine = Math.floor((calculatedWidth - padding) / charWidth);
  const lines = charsPerLine > 0 ? Math.ceil(messageLength / charsPerLine) : 1;
  const calculatedHeight = Math.max(baseHeight, lines * lineHeight + 60); // 60은 닉네임과 패딩
  
  return {
    width: Math.min(calculatedWidth, maxWidth),
    height: calculatedHeight
  };
}

// 페이지 기반 순차 배치: 포스트잇을 겹치지 않게 순차적으로 배치하고 페이지 번호 반환
export function generateRandomPosition(existingPosts = [], boardWidth = 1400, boardHeight = 800, newMessageLength = 0, pageNumber = 0) {
  const basePadding = 30; // 기본 여백
  const minGap = 15; // 최소 간격
  const postsPerPage = 20; // 페이지당 포스트잇 개수
  
  // 새 포스트잇 크기 계산
  const newPostItSize = calculatePostItSize(newMessageLength);
  const newPostItWidth = newPostItSize.width;
  const newPostItHeight = newPostItSize.height;
  
  // 현재 페이지의 포스트잇들만 필터링
  // createdAt 순서로 정렬된 상태에서 페이지 계산
  const sortedPosts = [...existingPosts].sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
    return aTime - bTime;
  });
  
  const currentPagePosts = sortedPosts.filter((post, index) => {
    // post.page가 있으면 그것을 사용, 없으면 index 기반으로 계산
    const postPage = post.page !== undefined ? post.page : Math.floor(index / postsPerPage);
    return postPage === pageNumber;
  });
  
  // 현재 페이지에 포스트잇이 없으면 시작 위치에 배치
  if (currentPagePosts.length === 0) {
    const x = basePadding + newPostItWidth / 2;
    const y = basePadding + newPostItHeight / 2;
    return {
      x: (x / boardWidth) * 100,
      y: (y / boardHeight) * 100,
      page: pageNumber,
      needsExpansion: false
    };
  }
  
  // 현재 페이지의 포스트잇들을 픽셀 단위로 변환
  // PostIt 컴포넌트는 left/top을 사용하므로 왼쪽 상단 모서리 기준으로 변환
  const postsWithPixels = currentPagePosts.map(post => {
    const messageLength = post.message ? post.message.length : 0;
    const postSize = calculatePostItSize(messageLength);
    // post.x, post.y는 퍼센트 단위의 중심점이므로 왼쪽 상단 모서리로 변환
    const centerX = (post.x / 100) * boardWidth;
    const centerY = (post.y / 100) * boardHeight;
    const pixelX = centerX - postSize.width / 2; // 왼쪽 모서리
    const pixelY = centerY - postSize.height / 2; // 상단 모서리
    
    return {
      ...post,
      pixelX,
      pixelY,
      width: postSize.width,
      height: postSize.height
    };
  });
  
  // 행 단위로 그룹화 (비슷한 y 좌표끼리)
  const rowTolerance = newPostItHeight + minGap;
  const rows = [];
  
  for (const post of postsWithPixels) {
    let foundRow = false;
    for (const row of rows) {
      if (Math.abs(row[0].pixelY - post.pixelY) < rowTolerance) {
        row.push(post);
        foundRow = true;
        break;
      }
    }
    if (!foundRow) {
      rows.push([post]);
    }
  }
  
  // 각 행을 x 좌표로 정렬
  rows.forEach(row => {
    row.sort((a, b) => a.pixelX - b.pixelX);
  });
  
  // 행들을 y 좌표로 정렬
  rows.sort((a, b) => a[0].pixelY - b[0].pixelY);
  
  // 겹침 체크 함수
  const isOverlapping = (left, top, width, height) => {
    const newRight = left + width;
    const newBottom = top + height;
    
    for (const post of postsWithPixels) {
      const postRight = post.pixelX + post.width;
      const postBottom = post.pixelY + post.height;
      
      // 겹침 확인: 두 사각형이 겹치는지 체크
      if (!(newRight + minGap < post.pixelX - minGap || 
            left - minGap > postRight + minGap ||
            newBottom + minGap < post.pixelY - minGap ||
            top - minGap > postBottom + minGap)) {
        return true; // 겹침 발생
      }
    }
    return false; // 겹치지 않음
  };
  
  // 다음 위치 찾기: 모든 행을 순회하면서 겹치지 않는 위치 찾기
  let nextLeft = basePadding;
  let nextTop = basePadding;
  let found = false;
  
  // 기존 행들을 순회하면서 빈 공간 찾기
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    const rowY = row[0].pixelY;
    
    // 현재 행에서 오른쪽으로 이동하면서 빈 공간 찾기
    for (let i = 0; i < row.length; i++) {
      const currentPost = row[i];
      const tryLeft = currentPost.pixelX + currentPost.width + minGap;
      const tryTop = rowY;
      
      // 경계 체크
      if (tryLeft + newPostItWidth > boardWidth - basePadding) {
        break; // 이 행에서는 더 이상 공간 없음
      }
      
      // 겹침 체크
      if (!isOverlapping(tryLeft, tryTop, newPostItWidth, newPostItHeight)) {
        nextLeft = tryLeft;
        nextTop = tryTop;
        found = true;
        break;
      }
    }
    
    if (found) break;
    
    // 현재 행의 마지막 포스트잇 다음 위치 시도
    const lastPostInRow = row[row.length - 1];
    const tryLeft = lastPostInRow.pixelX + lastPostInRow.width + minGap;
    const tryTop = rowY;
    
    if (tryLeft + newPostItWidth <= boardWidth - basePadding) {
      if (!isOverlapping(tryLeft, tryTop, newPostItWidth, newPostItHeight)) {
        nextLeft = tryLeft;
        nextTop = tryTop;
        found = true;
        break;
      }
    }
  }
  
  // 기존 행에서 빈 공간을 찾지 못했으면 새 행에 배치
  if (!found && rows.length > 0) {
    const lastRow = rows[rows.length - 1];
    const lastPost = lastRow[lastRow.length - 1];
    nextLeft = basePadding;
    nextTop = lastPost.pixelY + lastPost.height + minGap;
  }
  
  // 현재 페이지에 공간이 있는지 확인 (왼쪽 상단 모서리 기준)
  // 보드 경계를 넘지 않도록 체크
  const maxLeft = boardWidth - basePadding - newPostItWidth;
  const maxTop = boardHeight - basePadding - newPostItHeight;
  
  // 경계 내로 제한
  nextLeft = Math.max(basePadding, Math.min(nextLeft, maxLeft));
  nextTop = Math.max(basePadding, Math.min(nextTop, maxTop));
  
  const fitsInPage = (nextLeft + newPostItWidth <= boardWidth - basePadding) && 
                     (nextTop + newPostItHeight <= boardHeight - basePadding);
  
  if (fitsInPage) {
    // 최종 겹침 체크
    if (!isOverlapping(nextLeft, nextTop, newPostItWidth, newPostItHeight)) {
      // 중심점으로 변환하여 반환 (보드 경계 내에 있는지 최종 확인)
      const centerX = nextLeft + newPostItWidth / 2;
      const centerY = nextTop + newPostItHeight / 2;
      
      // 중심점이 보드 경계 내에 있는지 확인
      const centerXPercent = (centerX / boardWidth) * 100;
      const centerYPercent = (centerY / boardHeight) * 100;
      
      // 포스트잇이 보드 밖으로 나가지 않도록 경계 체크
      const halfWidthPercent = (newPostItWidth / 2 / boardWidth) * 100;
      const halfHeightPercent = (newPostItHeight / 2 / boardHeight) * 100;
      
      // 경계를 넘지 않도록 조정
      const finalX = Math.max(halfWidthPercent, Math.min(centerXPercent, 100 - halfWidthPercent));
      const finalY = Math.max(halfHeightPercent, Math.min(centerYPercent, 100 - halfHeightPercent));
      
      return {
        x: finalX,
        y: finalY,
        page: pageNumber,
        needsExpansion: false
      };
    }
  }
  
  // 현재 페이지에서 빈 공간을 더 철저히 찾기
  // 모든 가능한 위치를 체크 (그리드 방식)
  const stepSize = 20; // 탐색 단위
  for (let y = basePadding; y + newPostItHeight <= boardHeight - basePadding; y += stepSize) {
    for (let x = basePadding; x + newPostItWidth <= boardWidth - basePadding; x += stepSize) {
      if (!isOverlapping(x, y, newPostItWidth, newPostItHeight)) {
        // 중심점으로 변환
        const centerX = x + newPostItWidth / 2;
        const centerY = y + newPostItHeight / 2;
        const centerXPercent = (centerX / boardWidth) * 100;
        const centerYPercent = (centerY / boardHeight) * 100;
        
        // 경계 체크
        const halfWidthPercent = (newPostItWidth / 2 / boardWidth) * 100;
        const halfHeightPercent = (newPostItHeight / 2 / boardHeight) * 100;
        const finalX = Math.max(halfWidthPercent, Math.min(centerXPercent, 100 - halfWidthPercent));
        const finalY = Math.max(halfHeightPercent, Math.min(centerYPercent, 100 - halfHeightPercent));
        
        return {
          x: finalX,
          y: finalY,
          page: pageNumber,
          needsExpansion: false
        };
      }
    }
  }
  
  // 정말로 현재 페이지에 공간이 없으면 다음 페이지로
  const nextPage = pageNumber + 1;
  const centerX = basePadding + newPostItWidth / 2;
  const centerY = basePadding + newPostItHeight / 2;
  
  // 다음 페이지에서도 경계 체크
  const centerXPercent = (centerX / boardWidth) * 100;
  const centerYPercent = (centerY / boardHeight) * 100;
  const halfWidthPercent = (newPostItWidth / 2 / boardWidth) * 100;
  const halfHeightPercent = (newPostItHeight / 2 / boardHeight) * 100;
  const finalX = Math.max(halfWidthPercent, Math.min(centerXPercent, 100 - halfWidthPercent));
  const finalY = Math.max(halfHeightPercent, Math.min(centerYPercent, 100 - halfHeightPercent));
  
  return {
    x: finalX,
    y: finalY,
    page: nextPage,
    needsExpansion: false
  };
}

// 랜덤 회전 각도 생성
export function generateRandomRotation() {
  return Math.floor(Math.random() * (ROTATION_RANGE.max - ROTATION_RANGE.min + 1)) + ROTATION_RANGE.min;
}

// 랜덤 색상 선택
export function getRandomColor() {
  return POSTIT_COLORS[Math.floor(Math.random() * POSTIT_COLORS.length)];
}

