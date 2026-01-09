"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const MIN_FONT = 16;
const MAX_FONT = 28;
const DEFAULT_FONT = 19;
const STORAGE_KEY = "txt-book-font-size";

function clampFont(value: number) {
  return Math.min(MAX_FONT, Math.max(MIN_FONT, value));
}

export default function Reader({ text }: { text: string }) {
  const [fontSize, setFontSize] = useState(DEFAULT_FONT);
  const [pages, setPages] = useState<string[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const pageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  const normalized = useMemo(() => {
    return text.replace(/\r\n/g, "\n").trim();
  }, [text]);

  const paragraphs = useMemo(() => {
    return normalized.split(/\n{2,}/).map((para) => para.trim());
  }, [normalized]);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const parsed = Number.parseInt(saved, 10);
    if (!Number.isNaN(parsed)) {
      setFontSize(clampFont(parsed));
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(fontSize));
  }, [fontSize]);

  const computePages = useCallback(() => {
    const container = contentRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const height = container.clientHeight;
    const width = container.clientWidth;
    if (height === 0 || width === 0) return;

    measure.style.width = `${width}px`;
    measure.style.fontSize = `${fontSize}px`;
    measure.style.lineHeight = "1.9";
    measure.style.letterSpacing = "0.01em";

    const nextPages: string[] = [];
    let current = "";

    for (const para of paragraphs) {
      const next = current ? `${current}\n\n${para}` : para;
      measure.textContent = next;

      if (measure.scrollHeight > height && current) {
        nextPages.push(current);
        current = para;
      } else {
        current = next;
      }
    }

    if (current) {
      nextPages.push(current);
    }

    if (nextPages.length === 0) {
      nextPages.push("");
    }

    setPages(nextPages);
    setPageIndex((prev) => Math.min(prev, Math.max(0, nextPages.length - 1)));
  }, [fontSize, paragraphs]);

  useLayoutEffect(() => {
    computePages();
  }, [computePages]);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => computePages());
    observer.observe(container);

    return () => observer.disconnect();
  }, [computePages]);

  const handleDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (pages.length < 2) return;
    const container = pageRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;

    if (x < rect.width / 2) {
      setPageIndex((prev) => Math.max(0, prev - 1));
    } else {
      setPageIndex((prev) => Math.min(pages.length - 1, prev + 1));
    }
  };

  const currentPage = pages[pageIndex] ?? "";

  return (
    <main className="reader-shell">
      <div className="reader-card">
        <header className="reader-top">
          <div className="reader-brand">
            <span className="reader-title">Txt Book</span>
            <span className="reader-subtitle">Double-click left or right to turn the page.</span>
          </div>
          <div className="reader-controls">
            <button
              className="reader-button"
              onClick={() => setFontSize((size) => clampFont(size - 1))}
              aria-label="Decrease font size"
              disabled={fontSize <= MIN_FONT}
            >
              A-
            </button>
            <span className="reader-size">{fontSize}px</span>
            <button
              className="reader-button"
              onClick={() => setFontSize((size) => clampFont(size + 1))}
              aria-label="Increase font size"
              disabled={fontSize >= MAX_FONT}
            >
              A+
            </button>
          </div>
        </header>

        <section
          className="reader-page"
          ref={pageRef}
          onDoubleClick={handleDoubleClick}
        >
          <div ref={contentRef} className="reader-content">
            <div
              key={pageIndex}
              className="reader-text"
              style={{ fontSize }}
            >
              {currentPage || "Loading..."}
            </div>
          </div>
          <div className="reader-footer">
            <span className="reader-hint">Dbl click left/right</span>
            <span className="reader-page-count">
              {pages.length === 0 ? "-" : `${pageIndex + 1} / ${pages.length}`}
            </span>
          </div>
        </section>

        <div ref={measureRef} className="reader-measure" aria-hidden="true" />
      </div>
    </main>
  );
}
