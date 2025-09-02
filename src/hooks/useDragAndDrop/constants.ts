export const DRAG_CONFIG = {
  LONG_PRESS_DELAY: 500,
  FEEDBACK_DELAY: 300,
  MOVE_THRESHOLD: 10,
  AUTO_SCROLL_INTERVAL: 16, // ~60fps
  TRANSITION_DURATION: 200,
  VIBRATION_DURATION: {
    START: 10,
    ZONE_CHANGE: 5,
    DROP: 20
  }
};

export const SCROLL_CONFIG = {
  HORIZONTAL: {
    ZONE_SIZE: 50,
    BASE_SPEED: 12
  },
  VERTICAL: {
    ZONE_SIZE_TOP: 80,
    ZONE_SIZE_BOTTOM: 80,
    BASE_SPEED: 15,
    SPEED_MULTIPLIER: 1.5,
    MIN_SPEED: 0.5
  }
};

export const MOBILE_CONFIG = {
  BREAKPOINT: 768,
  COLUMN_WIDTH: 248, // 240px width + 8px gap
  SNAP_TRANSITION_DELAY: 100,
  SNAP_RESET_DELAY: 300
};

export const DRAG_STYLES = {
  DRAGGING: {
    opacity: 0.4,
    transform: 'scale(0.98)',
    filter: 'blur(1px)',
    transition: 'opacity 0.2s ease-in-out, transform 0.2s ease-in-out, filter 0.2s ease-in-out'
  },
  NORMAL: {
    opacity: 1,
    transform: 'scale(1)',
    filter: 'none',
    transition: 'all 0.2s ease-in-out'
  },
  LONG_PRESS_FEEDBACK: {
    transform: 'scale(0.98)',
    transition: 'transform 0.2s ease'
  },
  CLONE: {
    position: 'fixed' as const,
    zIndex: '9999',
    pointerEvents: 'none' as const,
    opacity: '0.9',
    transition: 'none',
    left: '0',
    top: '0',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    willChange: 'transform',
    userSelect: 'none' as const,
    webkitUserSelect: 'none' as const,
    touchAction: 'none' as const,
    WebkitTouchCallout: 'none' as const,
    WebkitUserDrag: 'none' as const
  }
};