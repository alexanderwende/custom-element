import { AttributeConverterBoolean, AttributeConverterNumber, AttributeConverterString, Changes, Component, component, css, listener, property } from '@partkit/component';
import { html } from 'lit-html';
import { dispatch } from '../event-manager';
import { IDGenerator } from '../id-generator';
import { TemplateFunction } from '../template-function';
import { DEFAULT_FOCUS_TRAP_CONFIG } from './focus-trap';
import { OverlayConfig, OVERLAY_CONFIG_FIELDS } from './overlay-config';

const ID_GENERATOR = new IDGenerator('partkit-overlay-');

@component<Overlay>({
    selector: 'ui-overlay',
    styles: [css`
    :host {
        display: block;
        position: absolute;
        box-sizing: border-box;
        border: 2px solid #bfbfbf;
        background-color: #fff;
        border-radius: 4px;
        will-change: transform;
    }
    :host([aria-hidden=true]) {
        display: none;
        will-change: auto;
    }
    `],
    template: () => html`
    <slot></slot>
    `,
})
export class Overlay extends Component {

    // TODO: clean this up
    private _config: Partial<OverlayConfig> = { ...DEFAULT_FOCUS_TRAP_CONFIG, trapFocus: true };

    protected _open = false;

    @property<Overlay>({
        converter: AttributeConverterBoolean,
        reflectProperty: 'reflectOpen'
    })
    get open (): boolean {

        return this._open;
    }

    set open (open: boolean) {

        if (open === this.open) return;

        // setting the open property of the overlay doesn't actually set anything, therefore requestUpdate won't see any changes
        // instead, we dispatch an event which acts as a command to open or close the overlay
        // we do this to allow the OverlayService and OverlayControllers to listen to these events and run their appropriate logic
        // in the same way, the OverlayService and OverlayController can dispatch this event and the overlay will behave as if its
        // open property would have been set, without re-emitting the same event
        // we will handle the actual property change in the handlers below and also call requestUpdate from there
        dispatch(this, open ? 'command-open' : 'command-close', {
            target: this,
            source: undefined,
        });
    }

    @property({
        converter: AttributeConverterNumber
    })
    tabindex = -1;

    @property({
        converter: AttributeConverterString
    })
    role!: string;

    template: TemplateFunction | undefined;

    context: Component | undefined;

    @property()
    controller!: string;

    @property()
    controllerType = 'default';

    @property()
    positionType = 'default';

    @property()
    origin = 'viewport';

    set config (config: Partial<OverlayConfig>) {

        this._config = { ...this._config, ...config };
    }

    get config (): Partial<OverlayConfig> {

        const config: Partial<OverlayConfig> = { ...this._config };

        OVERLAY_CONFIG_FIELDS.forEach(key => {

            if (this[key as keyof Overlay] !== undefined) {

                config[key] = this[key as keyof Overlay] as any;
            }
        });

        return config;
    }

    connectedCallback () {

        this.id = this.id || ID_GENERATOR.getNextID();
        this.role = this.getAttribute('role') || 'dialog';

        this.reflectOpen();

        super.connectedCallback();
    }

    updateCallback (changes: Changes, firstUpdate: boolean) {

        const config: Partial<OverlayConfig> = {};

        OVERLAY_CONFIG_FIELDS.forEach(key => {

            if (changes.has(key)) config[key] = (this as any)[key];
        });

        if (Object.keys(config).length > 0) {

            // TODO: when overlay gets created via overlay service, the config from outside should override overlay's defaults
            // this.overlayService.updateOverlayConfig(this, config);
        }
    }

    reflectOpen () {

        if (this.open) {

            this.setAttribute('open', '');
            this.setAttribute('aria-hidden', 'false');

        } else {

            this.removeAttribute('open');
            this.setAttribute('aria-hidden', 'true');
        }
    }

    @listener({
        event: 'command-open',
        options: { capture: true },
    })
    protected handleOpen (event: CustomEvent) {

        if (!this.open) {

            this._open = true;

            // TODO: we need to also make the property reflect!
            this.requestUpdate('open', false, true);
        }
    }

    @listener({
        event: 'command-close',
        options: { capture: true },
    })
    protected handleClose (event: CustomEvent) {

        if (this.open) {

            this._open = false;

            this.requestUpdate('open', true, false);
        }
    }

    // TODO: see if we actually need this...
    @listener({
        event: 'command-toggle',
        options: { capture: true },
    })
    protected handleToggle (event: CustomEvent) {

        if (this.open) {

            this.handleClose(event);

        } else {

            this.handleOpen(event);
        }
    }
}
