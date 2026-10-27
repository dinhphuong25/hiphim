export interface PipData {
  videoUrl: string;
  movieName: string;
  movieSlug: string;
  poster?: string;
  currentTime: number;
}

type Listener = (data: PipData | null) => void;

let _state: PipData | null = null;
const _listeners = new Set<Listener>();

export const pipStore = {
  get: () => _state,

  set: (data: PipData | null) => {
    _state = data;
    _listeners.forEach((fn) => fn(data));
  },

  subscribe: (fn: Listener) => {
    _listeners.add(fn);
    fn(_state); // emit current state immediately on subscribe
    return () => { _listeners.delete(fn); };
  },
};

