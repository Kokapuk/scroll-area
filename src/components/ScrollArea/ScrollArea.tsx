import classNames from 'classnames';
import { debounce } from 'debounce';
import { HTMLAttributes, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import styles from './ScrollArea.module.scss';

interface Props {
  children: ReactNode;
}

const maxShadowOpacitySensitivity = 50;

const ScrollArea = ({ children, ...props }: Props & HTMLAttributes<HTMLDivElement>) => {
  const scrollArea = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const verticalTrack = useRef<HTMLButtonElement>(null);
  const horizontalTrack = useRef<HTMLButtonElement>(null);
  const verticalThumb = useRef<HTMLDivElement>(null);
  const horizontalThumb = useRef<HTMLDivElement>(null);
  const [verticalThumbSize, setVerticalThumbSize] = useState(100);
  const [horizontalThumbSize, setHorizontalThumbSize] = useState(100);
  const [verticalThumbOffset, setVerticalThumbOffset] = useState(0);
  const [horizontalThumbOffset, setHorizontalThumbOffset] = useState(0);

  // Desktop Only
  const [isVerticalBarActive, setVerticalBarActive] = useState(false);
  const [isHorizontalBarActive, setHorizontalBarActive] = useState(false);

  const [topShadowOpacity, setTopShadowOpacity] = useState(0);
  const [bottomShadowOpacity, setBottomShadowOpacity] = useState(0);

  // Mobile only
  const [showScroll, setShowScroll] = useState(false);

  const updateThumbSize = () => {
    if (!scrollArea.current || !content.current) {
      return;
    }

    setVerticalThumbSize(scrollArea.current.clientHeight / content.current.clientHeight);
    setHorizontalThumbSize(scrollArea.current.clientWidth / scrollArea.current.scrollWidth);
  };

  const updateThumbOffset = () => {
    if (verticalTrack.current && verticalThumb.current && scrollArea.current && content.current) {
      setVerticalThumbOffset(
        (verticalTrack.current.clientHeight - verticalThumb.current.clientHeight) *
          (scrollArea.current.scrollTop / (content.current.clientHeight - scrollArea.current.clientHeight))
      );
    }

    if (horizontalTrack.current && horizontalThumb.current && scrollArea.current) {
      setHorizontalThumbOffset(
        (horizontalTrack.current.clientWidth - horizontalThumb.current.clientWidth) *
          (scrollArea.current.scrollLeft / (scrollArea.current.scrollWidth - scrollArea.current.clientWidth))
      );
    }
  };

  const hideScroll = debounce(() => {
    setShowScroll(false);
  }, 1750);

  const memoizedHideScroll = useCallback(hideScroll, []);

  const revealScroll = () => {
    setShowScroll(true);
    memoizedHideScroll();
  };

  const updateShadows = () => {
    if (scrollArea.current) {
      if (scrollArea.current.scrollTop > maxShadowOpacitySensitivity) {
        setTopShadowOpacity(1);
      } else {
        setTopShadowOpacity(scrollArea.current.scrollTop / maxShadowOpacitySensitivity);
      }
    }

    if (scrollArea.current && content.current) {
      const scrollBottom = content.current.clientHeight - scrollArea.current.clientHeight - scrollArea.current.scrollTop;

      if (scrollBottom > maxShadowOpacitySensitivity) {
        setBottomShadowOpacity(1);
      } else {
        setBottomShadowOpacity(scrollBottom / maxShadowOpacitySensitivity);
      }
    }
  };

  const handleScroll = () => {
    revealScroll();
    updateThumbOffset();
    updateShadows();
  };

  const scrollVerticallyToCursor = (cursorPos: number) => {
    if (!scrollArea.current || !content.current || !verticalTrack.current) {
      return;
    }

    scrollArea.current.scrollTop =
      ((cursorPos - verticalTrack.current.getBoundingClientRect().y) / verticalTrack.current.clientHeight) *
        content.current.clientHeight -
      verticalTrack.current.clientHeight / 2;
  };

  const scrollHorizontallyToCursor = (cursorPos: number) => {
    if (!scrollArea.current || !horizontalTrack.current) {
      return;
    }

    scrollArea.current!.scrollLeft =
      ((cursorPos - horizontalTrack.current!.getBoundingClientRect().x) / horizontalTrack.current!.clientWidth) *
        scrollArea.current!.scrollWidth -
      horizontalTrack.current!.clientWidth / 2;
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isVerticalBarActive) {
        if (verticalTrack.current && verticalTrack.current.getBoundingClientRect().bottom < event.y) {
          return;
        }

        if (verticalTrack.current && verticalTrack.current.getBoundingClientRect().top > event.y) {
          return;
        }

        scrollVerticallyToCursor(event.clientY);
      }

      if (isHorizontalBarActive) {
        if (horizontalTrack.current && horizontalTrack.current.getBoundingClientRect().right < event.x) {
          return;
        }

        if (horizontalTrack.current && horizontalTrack.current.getBoundingClientRect().left > event.x) {
          return;
        }

        scrollHorizontallyToCursor(event.clientX);
      }
    };

    const handleMouseUp = () => {
      setVerticalBarActive(false);
      setHorizontalBarActive(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isHorizontalBarActive, isVerticalBarActive]);

  useEffect(() => {
    const handleResize = () => {
      updateThumbSize();
      updateThumbOffset();
      updateShadows();
      revealScroll();
    };

    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(content.current!);

    return () => resizeObserver.disconnect();
  }, []);

  const handleVerticalBarMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    scrollVerticallyToCursor(event.clientY);
    setVerticalBarActive(true);
  };

  const handleHorizontalBarMouseDown = (event: React.MouseEvent<HTMLButtonElement>) => {
    scrollHorizontallyToCursor(event.clientX);
    setHorizontalBarActive(true);
  };

  return (
    <div
      {...props}
      className={classNames(
        styles.container,
        props.className,
        verticalThumbSize < 1 && styles.verticalScrollVisible,
        horizontalThumbSize < 1 && styles.horizontalScrollVisible
      )}
    >
      {verticalThumbSize < 1 && (
        <button
          onMouseDown={handleVerticalBarMouseDown}
          ref={verticalTrack}
          className={classNames(
            styles.track,
            styles.vertical,
            showScroll && styles.showScroll,
            horizontalThumbSize < 1 && styles.horizontalScrollVisible
          )}
        >
          <span
            ref={verticalThumb}
            style={{ height: `${verticalThumbSize * 100}%`, marginTop: `${verticalThumbOffset}px` }}
            className={classNames(styles.thumb, styles.vertical)}
          />
        </button>
      )}
      {horizontalThumbSize < 1 && (
        <button
          onMouseDown={handleHorizontalBarMouseDown}
          ref={horizontalTrack}
          className={classNames(
            styles.track,
            styles.horizontal,
            showScroll && styles.showScroll,
            verticalThumbSize < 1 && styles.verticalScrollVisible
          )}
        >
          <span
            ref={horizontalThumb}
            style={{ width: `${horizontalThumbSize * 100}%`, marginLeft: `${horizontalThumbOffset}px` }}
            className={classNames(styles.thumb, styles.horizontal)}
          />
        </button>
      )}
      <div style={{ opacity: topShadowOpacity }} className={classNames(styles.shadow, styles.top)} />
      <div
        style={{ opacity: bottomShadowOpacity }}
        className={classNames(styles.shadow, styles.bottom, horizontalThumbSize < 1 && styles.horizontalScrollVisible)}
      />
      <div ref={scrollArea} onScroll={handleScroll} className={styles.scrollArea}>
        <div ref={content}>{children}</div>
      </div>
    </div>
  );
};

export default ScrollArea;
