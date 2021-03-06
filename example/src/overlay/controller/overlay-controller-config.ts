import { FocusTrapConfig, DEFAULT_FOCUS_TRAP_CONFIG } from '../../focus/focus-trap';

export type OverlayControllerConfig = FocusTrapConfig & {
    autoFocus: boolean;
    trapFocus: boolean;
    restoreFocus: boolean;
    closeOnEscape: boolean;
    closeOnFocusLoss: boolean;
};

// TODO: move to default-overlay-controller
export const DEFAULT_OVERLAY_CONTROLLER_CONFIG: OverlayControllerConfig = {
    ...DEFAULT_FOCUS_TRAP_CONFIG,
    autoFocus: true,
    trapFocus: true,
    restoreFocus: true,
    closeOnEscape: true,
    closeOnFocusLoss: true,
};
