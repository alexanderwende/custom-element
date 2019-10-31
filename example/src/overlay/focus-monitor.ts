import { Behavior } from "../behavior";

export interface FocusChangeEventDetail {
    type: 'focusin' | 'focusout';
    event: FocusEvent;
}

export type FocusChangeEvent = CustomEvent<FocusChangeEventDetail>;

export class FocusMonitor extends Behavior {

    hasFocus = false;

    attach (element: HTMLElement) {

        super.attach(element);

        this.listen(this.element!, 'focusin', event => this.handleFocusIn(event as FocusEvent));
        this.listen(this.element!, 'focusout', event => this.handleFocusOut(event as FocusEvent));
    }

    protected handleFocusIn (event: FocusEvent) {

        if (!this.hasFocus) {

            this.hasFocus = true;

            this.dispatch<FocusChangeEventDetail>('focus-changed', { type: 'focusin', event: event });
        }
    }

    protected handleFocusOut (event: FocusEvent) {

        // if the relatedTarget (the element which will receive the focus next) is within the monitored element,
        // we can ignore this event; it will eventually be handled as focusin event of the relatedTarget
        if (this.element! === event.relatedTarget || this.element!.contains(event.relatedTarget as Node)) return;

        if (this.hasFocus) {

            this.hasFocus = false;

            this.dispatch<FocusChangeEventDetail>('focus-changed', { type: 'focusout', event: event });
        }
    }
}