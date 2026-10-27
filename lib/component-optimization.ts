/**
 * Component Memoization Helpers
 * Utilities to help optimize React component rendering
 */

import React, { memo, useMemo, useCallback, PropsWithChildren, Ref } from 'react';

/**
 * Create a memoized component with custom comparison
 * Useful for components that receive complex props
 */
export function createMemoComponent<P extends object>(
  Component: React.FC<P>,
  arePropsEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return memo(Component, arePropsEqual);
}

/**
 * Deep comparison hook for complex objects
 * Use with useMemo or useCallback deps
 */
export function useDeepMemo<T>(value: T): T {
  const ref = React.useRef<T>(value);
  const signalRef = React.useRef<number>(0);

  if (!isDeepEqual(value, ref.current)) {
    ref.current = value;
    signalRef.current += 1;
  }

  return useMemo(() => ref.current, [signalRef.current]);
}

/**
 * Custom comparison function for shallow props
 * Use for components with primitive props
 */
export function shallowPropsEqual<P extends object>(
  prevProps: P,
  nextProps: P
): boolean {
  const keys = Object.keys(prevProps) as (keyof P)[];

  if (keys.length !== Object.keys(nextProps).length) {
    return false;
  }

  for (const key of keys) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Custom comparison function for props with arrays/objects
 * Performs deep comparison
 */
export function deepPropsEqual<P extends object>(
  prevProps: P,
  nextProps: P
): boolean {
  return isDeepEqual(prevProps, nextProps);
}

/**
 * Deep equality check helper
 */
function isDeepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (obj1 == null || obj2 == null) return false;

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!isDeepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

/**
 * Custom hook for memoized callbacks with deep deps comparison
 */
export function useDeepCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const depsRef = React.useRef<React.DependencyList>(deps);
  const callbackRef = React.useRef<T>(callback);

  // Check if dependencies have changed with deep comparison
  const hasDepsChanged =
    depsRef.current.length !== deps.length ||
    !isDeepEqual(depsRef.current, deps);

  if (hasDepsChanged) {
    depsRef.current = deps;
    callbackRef.current = callback;
  }

  return useCallback(callbackRef.current, [depsRef.current]);
}

/**
 * Memoized selector hook - only triggers re-render if selected value changes
 */
export function useSelector<T, R>(
  selector: (value: T) => R,
  compare: (prev: R, next: R) => boolean = (a, b) => a === b
): R | undefined {
  const [value, setValue] = React.useState<R | undefined>(undefined);

  const memoizedSelector = useCallback(selector, []);

  React.useEffect(() => {
    const result = memoizedSelector(undefined as any);
    setValue((prev) => {
      if (prev === undefined) return result;
      return compare(prev, result) ? prev : result;
    });
  }, [memoizedSelector]);

  return value;
}

/**
 * Context consumer with selector - prevents unnecessary re-renders
 */
export function useContextSelector<ContextValue, Selected>(
  context: React.Context<ContextValue>,
  selector: (value: ContextValue) => Selected,
  comparison = (a: Selected, b: Selected) => a === b
): Selected {
  const contextValue = React.useContext(context);
  const selectedValue = useMemo(
    () => selector(contextValue),
    [contextValue, selector]
  );

  const prevValue = React.useRef<Selected>(selectedValue);

  React.useEffect(() => {
    if (!comparison(prevValue.current, selectedValue)) {
      prevValue.current = selectedValue;
    }
  }, [selectedValue, comparison]);

  return prevValue.current;
}

/**
 * HOC for lazy rendering - useful for heavy components below viewport
 */
export function withLazyRender<P extends object>(
  Component: React.FC<P>,
  threshold = '100px'
) {
  return function LazyRendered(props: P) {
    const ref = React.useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
      if (!ref.current) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        },
        { rootMargin: threshold }
      );

      observer.observe(ref.current);

      return () => observer.disconnect();
    }, [threshold]);

    return React.createElement(
      'div',
      { ref },
      isVisible ? React.createElement(Component, props) : null
    );
  };
}
