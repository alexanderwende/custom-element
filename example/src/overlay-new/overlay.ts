import { AttributeConverterBoolean, Changes, Component, component, css, listener, property, PropertyChangeEvent, AttributeConverterNumber, AttributeConverterString } from '@partkit/component';
import { html } from 'lit-html';
import { BehaviorFactory } from '../behavior/behavior-factory';
import { EventManager } from '../events';
import { IDGenerator } from '../id-generator';
import { MixinRole } from '../mixins/role';
import { PositionConfig, PositionController, Position } from '../position';
import { PositionControllerFactory } from '../position/position-controller-factory';
import { DEFAULT_OVERLAY_CONFIG, OverlayConfig } from './overlay-config';
import { OverlayTrigger, OverlayTriggerConfig, OverlayTriggerFactory } from './trigger';
import { replaceWith, insertAfter } from '../dom';

const ALREADY_INITIALIZED_ERROR = () => new Error('Cannot initialize Overlay. Overlay has already been initialized.');

const ALREADY_REGISTERED_ERROR = (overlay: Overlay) => new Error(`Overlay has already been registered: ${ overlay.id }.`);

const NOT_REGISTERED_ERROR = (overlay: Overlay) => new Error(`Overlay is not registered: ${ overlay.id }.`);

const THROW_UNREGISTERED_OVERLAY = (overlay: Overlay) => {

    if (!(overlay.constructor as typeof Overlay).isOverlayRegistered(overlay)) {

        throw NOT_REGISTERED_ERROR(overlay);
    }
}

const ID_GENERATOR = new IDGenerator('partkit-overlay-');

export interface OverlayInit {
    overlayTriggerFactory: BehaviorFactory<OverlayTrigger, OverlayTriggerConfig>;
    positionControllerFactory: BehaviorFactory<PositionController, PositionConfig>;
    overlayRoot: HTMLElement;
}

export interface OverlaySettings {
    // TODO: check if we need to store config...
    config: Partial<OverlayConfig>;
    events: EventManager;
    positionController?: PositionController;
    overlayTrigger?: OverlayTrigger;
}

@component({
    selector: 'ui-overlay',
    styles: [css`
    :host {
        display: block;
        position: fixed;
        box-sizing: border-box;
        border: 2px solid #bfbfbf;
        background-color: #fff;
        border-radius: 4px;
    }
    :host([aria-hidden=true]) {
        display: none;
    }
    `],
    template: () => html`
    <slot></slot>
    `,
})
export class Overlay extends MixinRole(Component, 'dialog') {

    /** @internal */
    protected static _initialized = false;

    /** @internal */
    protected static _overlayTriggerFactory: BehaviorFactory<OverlayTrigger, OverlayTriggerConfig> = new OverlayTriggerFactory();

    /** @internal */
    protected static _positionControllerFactory: BehaviorFactory<PositionController, PositionConfig> = new PositionControllerFactory();

    /** @internal */
    protected static _overlayRoot: HTMLElement = document.body;

    protected static registeredOverlays = new Map<Overlay, OverlaySettings>();

    protected static activeOverlays = new Set<Overlay>();

    static get overlayTriggerFactory (): BehaviorFactory<OverlayTrigger, OverlayTriggerConfig> {

        return this._overlayTriggerFactory;
    }

    static get positionControllerFactory (): BehaviorFactory<PositionController, PositionConfig> {

        return this._positionControllerFactory;
    }

    static get overlayRoot (): HTMLElement {

        return this._overlayRoot;
    }

    static get isInitialized (): boolean {

        return this._initialized;
    }

    static initialize (config: Partial<OverlayInit>) {

        if (this.isInitialized) throw ALREADY_INITIALIZED_ERROR();

        this._overlayTriggerFactory = config.overlayTriggerFactory || this._overlayTriggerFactory;
        this._positionControllerFactory = config.positionControllerFactory || this._positionControllerFactory;
        this._overlayRoot = config.overlayRoot || this._overlayRoot;

        this._initialized = true;
    }

    static isOverlayRegistered (overlay: Overlay): boolean {

        return this.registeredOverlays.has(overlay);
    }

    /**
    * An overlay is considered focused, if either itself or any of its descendant nodes has focus.
    */
    static isOverlayFocused (overlay: Overlay): boolean {

        THROW_UNREGISTERED_OVERLAY(overlay);

        const activeElement = document.activeElement;

        return overlay === activeElement || overlay.contains(activeElement);
    }

    /**
     * An overlay is considered active if it is either focused or has a descendant overlay which is focused.
     */
    static isOverlayActive (overlay: Overlay): boolean {

        THROW_UNREGISTERED_OVERLAY(overlay);

        let isFound = false;
        let isActive = false;

        if (overlay.config.stacked && overlay.open) {

            for (let current of this.activeOverlays) {

                isFound = isFound || current === overlay;

                isActive = isFound && this.isOverlayFocused(current);

                if (isActive) break;
            }
        }

        return isActive;
    }

    /**
     * Get the parent overlay of an active overlay
     *
     * @description
     * If an overlay is stacked, its parent overlay is the one from which it was opened.
     * This parent overlay will be in the activeOverlays stack just before this one.
     */
    static getParentOverlay (overlay: Overlay): Overlay | undefined {

        THROW_UNREGISTERED_OVERLAY(overlay);

        if (overlay.config.stacked && overlay.open) {

            // we start with parent being undefined
            // if the first active overlay in the set matches the specified overlay
            // then indeed the overlay has no parent (the first active overlay is the root)
            let parent: Overlay | undefined = undefined;

            // go through the active overlays
            for (let current of this.activeOverlays) {

                // if we have reached the specified active overlay
                // we can return the parent of that overlay (it's the active overlay in the set just before this one)
                if (current === overlay) return parent;

                // if we haven't found the specified overlay yet, we set
                // the current overlay as potential parent and move on
                parent = current;
            }
        }
    }

    /**
    * Create a new overlay
    */
    static createOverlay (config: Partial<OverlayConfig>): Overlay {

        const overlay = document.createElement(Overlay.selector) as Overlay;

        overlay.config = { ...DEFAULT_OVERLAY_CONFIG, ...config } as OverlayConfig;

        return overlay;
    }

    static disposeOverlay (overlay: Overlay) {

        overlay.parentElement?.removeChild(overlay);
    }

    /**
     * The overlay's configurtion
     *
     * @remarks
     * Initially _config only contains a partial OverlayConfig, but once the overlay instance has been
     * registered, _config will be a full OverlayConfig. This is to allow the BehaviorFactories for
     * position and trigger to apply their default configuration, based on the behavior type which is
     * created by the factories.
     *
     * @internal
     * */
    protected _config: OverlayConfig = { ...DEFAULT_OVERLAY_CONFIG } as OverlayConfig;

    protected marker?: Comment;

    protected isReattaching = false;

    @property({
        converter: AttributeConverterNumber
    })
    tabindex = -1;

    @property({ converter: AttributeConverterBoolean })
    open = false;

    @property({ attribute: false })
    set config (value: OverlayConfig) {

        console.log('set config: ', value);
        this._config = Object.assign(this._config, value);
    }

    get config (): OverlayConfig {

        return this._config;
    }

    @property({ attribute: false })
    set origin (value: Position | HTMLElement | 'viewport') {

        console.log('set origin: ', value);
        this.config.origin = value;
    }
    get origin (): Position | HTMLElement | 'viewport' {

        // TODO: fix typings for origin (remove CSSSelector)
        return this.config.origin as Position | HTMLElement | 'viewport';
    }

    @property({ converter: AttributeConverterString })
    set positionType (value: string) {

        console.log('set positionType: ', value);
        this.config.positionType = value;
    }
    get positionType (): string {

        return this.config.positionType;
    }

    @property({ attribute: false })
    set trigger (value: HTMLElement | undefined) {

        console.log('set trigger: ', value);
        this.config.trigger = value;
    }
    get trigger (): HTMLElement | undefined {

        return this.config.trigger;
    }

    @property({ converter: AttributeConverterString })
    set triggerType (value: string) {

        console.log('set triggerType: ', value);
        this.config.triggerType = value;
    }
    get triggerType (): string {

        return this.config.triggerType;
    }

    get static (): typeof Overlay {

        return this.constructor as typeof Overlay;
    }

    connectedCallback () {

        if (this.isReattaching) return;

        super.connectedCallback();

        this.id = this.id || ID_GENERATOR.getNextID();

        this.register();
    }

    disconnectedCallback () {

        if (this.isReattaching) return;

        this.unregister();

        super.disconnectedCallback();
    }

    updateCallback (changes: Changes, firstUpdate: boolean) {

        if (firstUpdate) {

            this.setAttribute('aria-hidden', `${ !this.open }`);

            this.static.registeredOverlays.get(this)?.overlayTrigger?.attach(this.config.trigger);

        } else {

            console.log('Overlay.updateCallback()... config: ', this.config);

            if (changes.has('open')) {

                this.setAttribute('aria-hidden', `${ !this.open }`);

                this.notifyProperty('open', changes.get('open'), this.open);
            }

            if (changes.has('trigger') || changes.has('origin') || changes.has('triggerType') || changes.has('positionType')) {

                this.configure();
            }
        }
    }

    /**
     * Handle the overlay's open-changed event
     *
     * @remarks
     * Property changes are dispatched during the update cycle of the component, so they run in
     * an animationFrame callback. We can therefore run code in these handlers, which runs inside
     * an animationFrame, like updating the position of the overlay without scheduling it.
     *
     * @param event
     */
    @listener({ event: 'open-changed', options: { capture: true } })
    protected handleOpenChanged (event: PropertyChangeEvent<boolean>) {

        console.log('Overlay.handleOpenChange()...', event.detail.current);

        const overlayRoot = this.static.overlayRoot;

        this.isReattaching = true;

        if (event.detail.current === true) {

            this.marker = document.createComment(this.id);

            replaceWith(this.marker, this);

            overlayRoot.appendChild(this);

            this.static.registeredOverlays.get(this)?.positionController?.attach(this);
            this.static.registeredOverlays.get(this)?.positionController?.update();

        } else {

            replaceWith(this, this.marker!);

            this.marker = undefined;

            this.static.registeredOverlays.get(this)?.positionController?.detach();
        }

        this.isReattaching = false;
    }

    protected register () {

        if (this.static.isOverlayRegistered(this)) throw ALREADY_REGISTERED_ERROR(this);

        console.log('Overly.register()... config: ', this.config);

        const settings: OverlaySettings = {
            config: this.config,
            events: new EventManager(),
            overlayTrigger: this.static.overlayTriggerFactory.create(this.config.triggerType, this.config, this),
            positionController: this.static.positionControllerFactory.create(this.config.positionType, this.config),
        };

        this.static.registeredOverlays.set(this, settings);
    }

    protected unregister () {

        if (!this.static.isOverlayRegistered(this)) throw NOT_REGISTERED_ERROR(this);

        const settings = this.static.registeredOverlays.get(this)!;

        settings.overlayTrigger?.detach();
        settings.positionController?.detach();

        settings.overlayTrigger = undefined;
        settings.positionController = undefined;

        this.static.registeredOverlays.delete(this);
    }

    protected configure (config: Partial<OverlayConfig> = {}) {

        console.log('Overlay.configure()...');

        const settings = this.static.registeredOverlays.get(this)!;

        this.config = config as OverlayConfig;

        settings.overlayTrigger?.detach();
        settings.positionController?.detach();

        settings.overlayTrigger = this.static.overlayTriggerFactory.create(this.config.triggerType, this.config, this);
        settings.positionController = this.static.positionControllerFactory.create(this.config.positionType, this.config);

        settings.overlayTrigger.attach(this.config.trigger);

        console.log(this.config);
    }
}