import { useEffect, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";

const getBoardIdFromPath = (segments) => {
  if (segments.length === 0) {
    return null;
  }

  if (segments[0] === "board") {
    return segments[1] ?? null;
  }

  if (segments[0] === "home" || segments[0] === "login") {
    return null;
  }

  return segments[0];
};

const getBoardIdFromSearch = (searchParams) => {
  const candidates = ["id", "boardId", "board", "b", "board_id"];
  for (const key of candidates) {
    const value = searchParams.get(key);
    if (value) {
      return value;
    }
  }
  return null;
};

const normalizeHashPath = (hash) => {
  if (!hash) return null;
  const trimmed = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) {
    return trimmed;
  }
  return `/${trimmed}`;
};

const RouteNormalizer = () => {
  const location = useLocation();

  const targetPath = useMemo(() => {
    const hashPath = normalizeHashPath(location.hash);
    if (hashPath) {
      return hashPath;
    }
    return null;
  }, [location.hash]);

  const boardId = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    const idFromPath = getBoardIdFromPath(segments);
    if (idFromPath) {
      return idFromPath;
    }

    const searchParams = new URLSearchParams(location.search);
    const idFromSearch = getBoardIdFromSearch(searchParams);
    if (idFromSearch) {
      return idFromSearch;
    }

    if (targetPath) {
      const targetSegments = targetPath.split("/").filter(Boolean);
      return getBoardIdFromPath(targetSegments);
    }

    return null;
  }, [location.pathname, location.search, targetPath]);

  const remainingSearch = useMemo(() => {
    const params = new URLSearchParams(location.search);
    ["id", "boardId", "board", "b", "board_id"].forEach((key) => {
      if (params.has(key)) {
        params.delete(key);
      }
    });
    return params.toString();
  }, [location.search]);

  useEffect(() => {
    if (boardId) {
      document.title = `${boardId} | 응원 보드`;
    }
  }, [boardId]);

  if (targetPath && targetPath !== location.pathname) {
    const destination = remainingSearch ? `${targetPath}?${remainingSearch}` : targetPath;
    return <Navigate to={destination} replace />;
  }

  if (boardId) {
    const destination = remainingSearch
      ? `/board/${boardId}?${remainingSearch}`
      : `/board/${boardId}`;
    return <Navigate to={destination} replace />;
  }

  return <Navigate to="/" replace />;
};

export default RouteNormalizer;

