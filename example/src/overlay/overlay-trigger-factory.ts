import { OverlayTrigger, TooltipOverlayTrigger } from './overlay-trigger';
import { Overlay } from './overlay';

export interface OverlayTriggerMap {
    [key: string]: { new(...args: any[]): OverlayTrigger };
}

export const DEFAULT_OVERLAY_TRIGGERS: OverlayTriggerMap = {
    default: OverlayTrigger,
    tooltip: TooltipOverlayTrigger,
};

export class OverlayTriggerFactory {

    constructor (protected triggers: OverlayTriggerMap = DEFAULT_OVERLAY_TRIGGERS) { }

    createOverlayTrigger (type: string, overlay: Overlay): OverlayTrigger {

        return this.triggers[type] ? new this.triggers[type](overlay) : new OverlayTrigger(overlay);
    }
}
