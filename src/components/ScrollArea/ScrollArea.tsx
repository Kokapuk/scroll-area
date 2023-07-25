import classNames from 'classnames';
import { HTMLAttributes, ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import styles from './ScrollArea.module.scss';
import { debounce } from 'debounce';

interface Props {
  children: ReactNode;
}

const ScrollArea = ({ children, ...props }: Props & HTMLAttributes<HTMLDivElement>) => {
  const scrollArea = useRef<HTMLDivElement>(null);
  const verticalTrack = useRef<HTMLButtonElement>(null);
  const horizontalTrack = useRef<HTMLButtonElement>(null);
  const verticalThumb = useRef<HTMLDivElement>(null);
  const horizontalThumb = useRef<HTMLDivElement>(null);
  const [verticalThumbSize, setVerticalThumbSize] = useState(100);
  const [horizontalThumbSize, setHorizontalThumbSize] = useState(100);
  const [verticalThumbOffset, setVerticalThumbOffset] = useState(0);
  const [horizontalThumbOffset, setHorizontalThumbOffset] = useState(0);
  const [isVerticalBarActive, setVerticalBarActive] = useState(false);
  const [isHorizontalBarActive, setHorizontalScrollActive] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [isScrolling, setScrolling] = useState(false);

  const updateThumbSize = () => {
    if (!scrollArea.current) {
      return;
    }

    setVerticalThumbSize(scrollArea.current.clientHeight / scrollArea.current.scrollHeight);
    setHorizontalThumbSize(scrollArea.current.clientWidth / scrollArea.current.scrollWidth);
  };

  const updateThumbOffset = () => {
    if (verticalTrack.current && verticalThumb.current && scrollArea.current) {
      setVerticalThumbOffset(
        (verticalTrack.current.clientHeight - verticalThumb.current.clientHeight) *
          (scrollArea.current.scrollTop / (scrollArea.current.scrollHeight - scrollArea.current.clientHeight))
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
    setScrolling(false);
  }, 1500);

  const memoizedHideScroll = useCallback(hideScroll, []);

  const updateScrolling = () => {
    setScrolling(true);
    memoizedHideScroll();
  };

  const handleScroll = () => {
    updateScrolling();
    updateThumbOffset();
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!lastMousePosition) {
        return setLastMousePosition({ x: 0, y: 0 });
      }

      if (isVerticalBarActive && scrollArea.current && verticalTrack.current) {
        if (verticalTrack.current && verticalTrack.current.getBoundingClientRect().bottom < event.y) {
          return;
        }

        if (verticalTrack.current && verticalTrack.current.getBoundingClientRect().top > event.y) {
          return;
        }
        scrollArea.current.scrollTop +=
          (event.y - lastMousePosition.y) * (scrollArea.current.scrollHeight / verticalTrack.current.clientHeight);
      }

      if (isHorizontalBarActive && scrollArea.current && horizontalTrack.current) {
        if (horizontalTrack.current && horizontalTrack.current.getBoundingClientRect().right < event.x) {
          return;
        }

        if (horizontalTrack.current && horizontalTrack.current.getBoundingClientRect().left > event.x) {
          return;
        }

        scrollArea.current.scrollLeft +=
          (event.x - lastMousePosition.x) * (scrollArea.current.scrollWidth / horizontalTrack.current.clientWidth);
      }

      setLastMousePosition({ x: event.x, y: event.y });
    };

    const handleMouseUp = () => {
      setVerticalBarActive(false);
      setHorizontalScrollActive(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isHorizontalBarActive, isVerticalBarActive, lastMousePosition]);

  useLayoutEffect(() => {
    const handleResize = () => {
      updateThumbSize();
      updateThumbOffset();
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [scrollArea.current?.scrollHeight, scrollArea.current?.scrollWidth]);

  return (
    <div
      {...props}
      className={classNames(
        styles.container,
        props.className,
        verticalThumbSize < 1 && styles.container_verticalScrollVisible,
        horizontalThumbSize < 1 && styles.container_horizontalScrollVisible
      )}
    >
      {verticalThumbSize < 1 && (
        <button
          onMouseDown={() => setVerticalBarActive(true)}
          ref={verticalTrack}
          className={classNames(styles.track, styles.track_vertical, isScrolling && styles.track_scrolling)}
        >
          <div
            ref={verticalThumb}
            style={{ height: `${verticalThumbSize * 100}%`, marginTop: `${verticalThumbOffset}px` }}
            className={classNames(styles.track__thumb, styles.track__thumb_vertical)}
          />
        </button>
      )}
      {horizontalThumbSize < 1 && (
        <button
          onMouseDown={() => setHorizontalScrollActive(true)}
          ref={horizontalTrack}
          className={classNames(styles.track, styles.track_horizontal, isScrolling && styles.track_scrolling)}
        >
          <div
            ref={horizontalThumb}
            style={{ width: `${horizontalThumbSize * 100}%`, marginLeft: `${horizontalThumbOffset}px` }}
            className={classNames(styles.track__thumb, styles.track__thumb_horizontal)}
          />
        </button>
      )}
      <div className={styles.shadow} />
      <div ref={scrollArea} onScroll={handleScroll} className={styles.scrollArea}>
        {children}
      </div>
    </div>
  );
};

export default ScrollArea;
