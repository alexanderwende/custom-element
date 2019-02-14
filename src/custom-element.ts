import { render, TemplateResult } from 'lit-html';
import { ListenerDeclaration } from './decorators/listener';
import { AttributeReflector, createEventName, isAttributeReflector, isPropertyChangeDetector, isPropertyKey, isPropertyNotifier, isPropertyReflector, PropertyDeclaration, PropertyNotifier, PropertyReflector } from "./decorators/property-declaration";

const ATTRIBUTE_REFLECTOR_ERROR = (attributeReflector: PropertyKey | Function) => new Error(`Error executing attribute reflector ${ String(attributeReflector) }.`);
const PROPERTY_REFLECTOR_ERROR = (propertyReflector: PropertyKey | Function) => new Error(`Error executing property reflector ${ String(propertyReflector) }.`);
const PROPERTY_NOTIFIER_ERROR = (propertyNotifier: PropertyKey | Function) => new Error(`Error executing property notifier ${ String(propertyNotifier) }.`);
const CHANGE_DETECTOR_ERROR = (changeDetector: PropertyKey | Function) => new Error(`Error executing property change detector ${ String(changeDetector) }.`);

/**
 * Extends the static {@link ListenerDeclaration} to include the bound listener
 * for a custom element instance.
 */
interface InstanceListenerDeclaration extends ListenerDeclaration {

    /**
     * The bound listener will be stored here, so it can be removed it later
     */
    listener: EventListener;

    /**
     * The event target will always be resolved to an actual {@link EventTarget}
     */
    target: EventTarget;
}

/**
 * The custom element base class
 */
export abstract class CustomElement extends HTMLElement {

    /**
     * The custom element's selector
     *
     * @remarks
     * Will be overridden by the {@link customElement} decorator's selector option, if provided.
     * Otherwise the decorator will use this property to define the custom element.
     */
    static selector: string;

    /**
     * Use Shadow DOM
     *
     * @remarks
     * Will be set by the {@link customElement} decorator's shadow option (defaults to `true`).
     */
    static shadow: boolean;

    /**
     * A map of attribute names and their respective property keys
     *
     * @internal
     * @private
     */
    static attributes: Map<string, PropertyKey> = new Map();

    /**
     * A map of property keys and their respective property declarations
     *
     * @internal
     * @private
     */
    static properties: Map<PropertyKey, PropertyDeclaration> = new Map();

    /**
     * A map of property keys and their respective listener declarations
     *
     * @internal
     * @private
     */
    static listeners: Map<PropertyKey, ListenerDeclaration> = new Map();

    /**
     * Override to specify attributes which should be observed, but don't have an associated property
     *
     * @remark
     * For properties which are decorated with the {@link property} decorator, an observed attribute
     * is automatically created and does not need to be specified here. Fot attributes that don't
     * have an associated property, return the attribute names in this getter. Changes to these
     * attributes can be handled in the {@link attributeChangedCallback} method.
     *
     * When extending custom elements, make sure to return the super class's observedAttributes
     * if you override this getter (except if you don't want to inherit observed attributes):
     *
     * ```typescript
     * @customElement({
     *      selector: 'my-element'
     * })
     * class MyElement extends MyBaseElement {
     *
     *      static get observedAttributes (): string[] {
     *
     *          return [...super.observedAttributes, 'my-additional-attribute'];
     *      }
     * }
     * ```
     */
    static get observedAttributes (): string[] {

        return [];
    }

    protected _renderRoot: Element | DocumentFragment;

    protected _updateRequest: Promise<boolean> = Promise.resolve(true);

    protected _changedProperties: Map<PropertyKey, any> = new Map();

    protected _reflectingProperties: Map<PropertyKey, any> = new Map();

    protected _notifyingProperties: Map<PropertyKey, any> = new Map();

    protected _listenerDeclarations: InstanceListenerDeclaration[] = [];

    protected _isConnected = false;

    protected _isReflecting = false;

    protected _hasUpdated = false;

    protected _hasRequestedUpdate = false;

    /**
     * Returns `true` if the custom element's {@link connectedCallback} was executed.
     */
    get isConnected (): boolean {

        return this._isConnected;
    }

    constructor () {

        super();

        this._renderRoot = this.createRenderRoot();
    }

    /**
     * Invoked each time the custom element is moved to a new document
     *
     * @remarks
     * https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#Using_the_lifecycle_callbacks
     */
    adoptedCallback () {

        this._notifyLifecycle('adopted');
    }

    /**
     * Invoked each time the custom element is appended into a document-connected element
     *
     * @remarks
     * https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#Using_the_lifecycle_callbacks
     */
    connectedCallback () {

        this._isConnected = true;

        this._listen();

        this.requestUpdate();

        this._notifyLifecycle('connected');
    }

    /**
     * Invoked each time the custom element is disconnected from the document's DOM
     *
     * @remarks
     * https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#Using_the_lifecycle_callbacks
     */
    disconnectedCallback () {

        this._isConnected = false;

        this._unlisten();

        this._notifyLifecycle('disconnected');
    }

    /**
     * Invoked each time one of the custom element's attributes is added, removed, or changed
     *
     * @remarks
     * Which attributes to notice change for is specified in {@link observedAttributes}.
     * https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#Using_the_lifecycle_callbacks
     *
     * For decorated properties with an associated attribute, this is handled automatically.
     *
     * This method can be overridden to customize the handling of attribute changes. When overriding
     * this method, a super-call should be included, to ensure attribute changes for decorated properties
     * are processed correctly.
     *
     * ```typescript
     * @customElement({
     *      selector: 'my-element'
     * })
     * class MyElement extends CustomElement {
     *
     *      attributeChangedCallback (attribute: string, oldValue: any, newValue: any) {
     *
     *          super.attributeChangedCallback(attribute, oldValue, newValue);
     *
     *          // do custom handling...
     *      }
     * }
     * ```
     *
     * @param attribute The name of the changed attribute
     * @param oldValue  The old value of the attribute
     * @param newValue  The new value of the attribute
     */
    attributeChangedCallback (attribute: string, oldValue: string | null, newValue: string | null) {

        if (this._isReflecting) return;

        if (oldValue !== newValue) this.reflectAttribute(attribute, oldValue, newValue);
    }

    /**
     * Invoked each time the custom element updates
     *
     * @remarks
     * The updateCallback is invoked synchronously from the {@link update} method and therefore happens directly after
     * rendering, property reflection and property change events inside a {@link requestAnimationFrame}. It is safe to
     * use this callback to set additional attributes or styles on the rendered component that can't be achieved through
     * template bindings or reflection.
     *
     * @param changedProperties A map of properties that changed in the update, containg the property key and the old value
     * @param firstUpdate       A boolean indicating if this was the first update
     */
    updateCallback (changedProperties: Map<PropertyKey, any>, firstUpdate: boolean) {

        this._notifyLifecycle('update', { firstUpdate });
    }

    /**
     * Creates the custom element's render root
     *
     * @remarks
     * The render root is where the {@link render} method will attach its DOM output.
     * When using the custom element with shadow mode, it will be a shadow root,
     * otherwise it will be the custom element itself.
     *
     * TODO: Can slots be used without shadow DOM?
     */
    protected createRenderRoot (): Element | DocumentFragment {

        return (this.constructor as typeof CustomElement).shadow ?
            this.attachShadow({ mode: 'open' }) :
            this;
    }

    /**
     * Returns the template of the custom element
     *
     * @remarks
     * Override this method to provide a template for your custom element. The method must
     * return a {@link lit-html#TemplateResult} which is created using lit-html's
     * {@link lit-html#html | `html`} or {@link lit-html#svg | `svg`} template methods.
     *
     * Return nothing if your component does not need to render a template.
     *
     * ```typescript
     * import { html } from 'lit-html';
     *
     * @customElement({
     *      selector: 'my-element'
     * })
     * class MyElement extends CustomElement {
     *
     *       myProperty = 'Hello';
     *
     *      template () {
     *
     *          html`<h1>${this.myProperty} World!</h1>`;
     *      }
     * }
     * ```
     */
    protected template (): TemplateResult | void { }

    /**
     * Renders the custom element's template to its {@link _renderRoot}
     *
     * @remarks
     * Uses lit-html's {@link lit-html#render} method to render a {@link lit-html#TemplateResult}.
     */
    protected render () {

        const template = this.template();

        if (template) render(template, this._renderRoot, { eventContext: this });
    }

    /**
     * Watch property changes occurring in the executor and raise custom events
     *
     * @remarks
     * Property changes should trigger custom events when they are caused by internal state changes,
     * but not if they are caused by a consumer of the custom element API directly, e.g.:
     *
     * ```typescript
     * document.querySelector('my-custom-element').customProperty = true;
     * ```.
     *
     * This means, we cannot automate this process through property setters, as we can't be sure who
     * invoked the setter - internal calls or external calls.
     *
     * One option is to manually raise the event, which can become tedious and forces us to use string-
     * based event names or property names, which are difficult to refactor, e.g.:
     *
     * ```typescript
     * this.customProperty = true;
     * // if we refactor the property name, we can easily miss the notify call
     * this.notify('customProperty');
     * ```
     *
     * A more convenient way is to execute the internal changes in a wrapper which can detect the changed
     * properties and will automatically raise the required events. This eliminates the need to manually
     * raise events and refactoring does no longer affect the process.
     *
     * ```typescript
     * this.watch(() => {
     *
     *      this.customProperty = true;
     *      // we can add more property modifications to notify in here
     * });
     * ```
     *
     * @param executor A function that performs the changes which should be notified
     */
    protected watch (executor: () => void) {

        // back up current changed properties
        const previousChanges = new Map(this._changedProperties);

        // execute the changes
        executor();

        // add all new or updated changed properties to the notifying properties
        for (const [propertyKey, oldValue] of this._changedProperties) {

            if (!previousChanges.has(propertyKey) || this.hasChanged(propertyKey, previousChanges.get(propertyKey), oldValue)) {

                this._notifyingProperties.set(propertyKey, oldValue);
            }
        }
    }

    /**
     * Request an update of the custom element
     *
     * @remarks
     * This method is called automatically when the value of a decorated property or its associated
     * attribute changes. If you need the custom element to update based on a state change that is
     * not covered by a decorated property, call this method without any arguments.
     *
     * @param propertyKey   The name of the changed property that requests the update
     * @param oldValue      The old property value
     * @param newValue      the new property value
     * @returns             A Promise which is resolved when the update is completed
     */
    protected requestUpdate (propertyKey?: PropertyKey, oldValue?: any, newValue?: any): Promise<boolean> {

        if (propertyKey) {

            if (!this.hasChanged(propertyKey, oldValue, newValue)) return this._updateRequest;

            // store changed property for batch processing
            this._changedProperties.set(propertyKey, oldValue);

            // if we are in reflecting state, an attribute is reflecting to this property and we
            // can skip reflecting the property back to the attribute
            // property changes need to be tracked however and {@link render} must be called after
            // the attribute change is reflected to this property
            if (!this._isReflecting) this._reflectingProperties.set(propertyKey, oldValue);
        }

        if (!this._hasRequestedUpdate) {

            // enqueue update request if none was enqueued already
            this._enqueueUpdate();
        }

        return this._updateRequest;
    }

    /**
     * Updates the custom element after an update was requested with {@link requestUpdate}
     *
     * @remarks
     * This method renders the template, reflects changed properties to attributes and
     * dispatches change events for properties which are marked for notification.
     */
    protected update () {

        this.render();

        // reflect all properties marked for reflection
        this._reflectingProperties.forEach((oldValue: any, propertyKey: PropertyKey) => {

            this.reflectProperty(propertyKey, oldValue, this[propertyKey as keyof CustomElement]);
        });

        // notify all properties marked for notification
        this._notifyingProperties.forEach((oldValue, propertyKey) => {

            this.notifyProperty(propertyKey, oldValue, this[propertyKey as keyof CustomElement]);
        });

        this.updateCallback(this._changedProperties, !this._hasUpdated);

        this._hasUpdated = true;
    }

    /**
     * Check if a property changed
     *
     * @remarks
     * This method resolves the {@link PropertyChangeDetector} for the property and returns its result.
     * If none is defined (the property declaration's observe option is `false`) it returns false.
     * It catches any error in custom {@link PropertyChangeDetector}s and throws a more helpful one.
     *
     * @param propertyKey   The key of the property to check
     * @param oldValue      The old property value
     * @param newValue      The new property value
     * @returns             `true` if the property changed, `false` otherwise
     */
    protected hasChanged (propertyKey: PropertyKey, oldValue: any, newValue: any): boolean {

        const propertyDeclaration = this._getPropertyDeclaration(propertyKey);

        // observe is either `false` or a {@link PropertyChangeDetector}
        if (propertyDeclaration && isPropertyChangeDetector(propertyDeclaration.observe)) {

            try {
                return propertyDeclaration.observe.call(null, oldValue, newValue);

            } catch (error) {

                throw CHANGE_DETECTOR_ERROR(propertyDeclaration.observe);
            }
        }

        return false;
    }

    /**
     * Reflect an attribute value to its associated property
     *
     * @remarks
     * This method checks, if any custom {@link AttributeReflector} has been defined for the
     * associated property and invokes the appropriate reflector. If not, it will use the default
     * reflector {@link _reflectAttribute}.
     *
     * It catches any error in custom {@link AttributeReflector}s and throws a more helpful one.
     *
     * @param attributeName The propert key of the property to reflect
     * @param oldValue      The old property value
     * @param newValue      The new property value
     */
    protected reflectAttribute (attributeName: string, oldValue: string | null, newValue: string | null) {

        const constructor = this.constructor as typeof CustomElement;

        const propertyKey = constructor.attributes.get(attributeName);

        // ignore user-defined observed attributes
        // TODO: test this
        if (!propertyKey) {

            console.log(`observed attribute "${ attributeName }" not found... ignoring...`);

            return;
        }

        const propertyDeclaration = this._getPropertyDeclaration(propertyKey)!;

        // don't reflect if {@link propertyDeclaration.reflectAttribute} is false
        if (propertyDeclaration.reflectAttribute) {

            this._isReflecting = true;

            if (isAttributeReflector(propertyDeclaration.reflectAttribute)) {

                try {
                    propertyDeclaration.reflectAttribute.call(this, attributeName, oldValue, newValue);

                } catch (error) {

                    throw ATTRIBUTE_REFLECTOR_ERROR(propertyDeclaration.reflectAttribute);
                }

            } else if (isPropertyKey(propertyDeclaration.reflectAttribute)) {

                try {
                    (this[propertyDeclaration.reflectAttribute] as AttributeReflector)(attributeName, oldValue, newValue);

                } catch (error) {

                    throw ATTRIBUTE_REFLECTOR_ERROR(propertyDeclaration.reflectAttribute);
                }

            } else {

                this._reflectAttribute(attributeName, oldValue, newValue);
            }

            this._isReflecting = false;
        }
    }

    /**
     * Reflect a property value to its associated attribute
     *
     * @remarks
     * This method checks, if any custom {@link PropertyReflector} has been defined for the
     * property and invokes the appropriate reflector. If not, it will use the default
     * reflector {@link _reflectProperty}.
     *
     * It catches any error in custom {@link PropertyReflector}s and throws a more helpful one.
     *
     * @param propertyKey   The propert key of the property to reflect
     * @param oldValue      The old property value
     * @param newValue      The new property value
     */
    protected reflectProperty (propertyKey: PropertyKey, oldValue: any, newValue: any) {

        const propertyDeclaration = this._getPropertyDeclaration(propertyKey);

        // don't reflect if {@link propertyDeclaration.reflectProperty} is false
        if (propertyDeclaration && propertyDeclaration.reflectProperty) {

            // attributeChangedCallback is called synchronously, we can catch the state there
            this._isReflecting = true;

            if (isPropertyReflector(propertyDeclaration.reflectProperty)) {

                try {
                    propertyDeclaration.reflectProperty.call(this, propertyKey, oldValue, newValue);

                } catch (error) {

                    throw PROPERTY_REFLECTOR_ERROR(propertyDeclaration.reflectProperty);
                }

            } else if (isPropertyKey(propertyDeclaration.reflectProperty)) {

                try {
                    (this[propertyDeclaration.reflectProperty] as PropertyReflector)(propertyKey, oldValue, newValue);

                } catch (error) {

                    throw PROPERTY_REFLECTOR_ERROR(propertyDeclaration.reflectProperty);
                }

            } else {

                this._reflectProperty(propertyKey, oldValue, newValue);
            }

            this._isReflecting = false;
        }
    }

    /**
     * Raise an event for a property change
     *
     * @remarks
     * This method checks, if any custom {@link PropertyNotifier} has been defined for the
     * property and invokes the appropriate notifier. If not, it will use the default
     * notifier {@link _notifyProperty}.
     *
     * It catches any error in custom {@link PropertyReflector}s and throws a more helpful one.
     *
     * @param propertyKey   The propert key of the property to raise an event for
     * @param oldValue      The old property value
     * @param newValue      The new property value
     */
    protected notifyProperty (propertyKey: PropertyKey, oldValue: any, newValue: any) {

        const propertyDeclaration = this._getPropertyDeclaration(propertyKey);

        if (propertyDeclaration && propertyDeclaration.notify) {

            if (isPropertyNotifier(propertyDeclaration.notify)) {

                try {
                    propertyDeclaration.notify.call(this, propertyKey, oldValue, newValue);

                } catch (error) {

                    throw PROPERTY_NOTIFIER_ERROR(propertyDeclaration.notify.toString());
                }

            } else if (isPropertyKey(propertyDeclaration.notify)) {

                try {
                    (this[propertyDeclaration.notify] as PropertyNotifier)(propertyKey, oldValue, newValue);

                } catch (error) {

                    throw PROPERTY_NOTIFIER_ERROR(propertyDeclaration.notify);
                }

            } else {

                this._notifyProperty(propertyKey, oldValue, newValue);
            }
        }
    }

    /**
     * The default attribute reflector
     *
     * @remarks
     * If no {@link AttributeReflector} is defined in the {@link PropertyDeclaration} this
     * method is used to reflect the attribute value to its associated property.
     *
     * @param attributeName The name of the attribute to reflect
     * @param oldValue      The old attribute value
     * @param newValue      The new attribute value
     *
     * @internal
     * @private
     */
    protected _reflectAttribute (attributeName: string, oldValue: string | null, newValue: string | null) {

        const constructor = this.constructor as typeof CustomElement;

        const propertyKey = constructor.attributes.get(attributeName)!;

        const propertyDeclaration = this._getPropertyDeclaration(propertyKey)!;

        const propertyValue = propertyDeclaration.converter.fromAttribute(newValue);

        this[propertyKey as keyof this] = propertyValue;
    }

    /**
     * The default property reflector
     *
     * @remarks
     * If no {@link PropertyReflector} is defined in the {@link PropertyDeclaration} this
     * method is used to reflect the property value to its associated attribute.
     *
     * @param propertyKey   The property key of the property to reflect
     * @param oldValue      The old property value
     * @param newValue      The new property value
     *
     * @internal
     * @private
     */
    protected _reflectProperty (propertyKey: PropertyKey, oldValue: any, newValue: any) {

        // this function is only called for properties which have a declaration
        const propertyDeclaration = this._getPropertyDeclaration(propertyKey)!;

        // if the default reflector is used, we need to check if an attribute for this property exists
        // if not, we won't reflect
        if (!propertyDeclaration.attribute) return;

        // if attribute is truthy, it's a string
        const attributeName = propertyDeclaration.attribute as string;

        // resolve the attribute value
        const attributeValue = propertyDeclaration.converter.toAttribute(newValue);

        // undefined means don't change
        if (attributeValue === undefined) {

            return;
        }
        // null means remove the attribute
        else if (attributeValue === null) {

            this.removeAttribute(attributeName);

        } else {

            this.setAttribute(attributeName, attributeValue);
        }
    }

    /**
     * Dispatch a property-changed event
     *
     * @param propertyKey
     * @param oldValue
     * @param newValue
     */
    protected _notifyProperty (propertyKey: PropertyKey, oldValue: any, newValue: any): void {

        const eventName = createEventName(propertyKey, '', 'changed');

        this.dispatchEvent(new CustomEvent(eventName, {
            composed: true,
            detail: {
                property: propertyKey,
                previous: oldValue,
                current: newValue
            }
        }));
    }

    /**
     * Dispatch a lifecycle event
     *
     * @param lifecycle The lifecycle for which to raise the event
     * @param detail    Optional event details
     */
    protected _notifyLifecycle (lifecycle: string, detail?: object) {

        const eventName = createEventName(lifecycle, 'on');

        const eventInit = {
            composed: true,
            ...(detail ? { detail: detail } : {})
        };

        this.dispatchEvent(new CustomEvent(eventName, eventInit));
    }

    /**
     * Bind custom element listeners.
     *
     * @internal
     * @private
     */
    protected _listen () {

        (this.constructor as typeof CustomElement).listeners.forEach((declaration, listener) => {

            const instanceDeclaration: InstanceListenerDeclaration = {

                // copy the class's static listener declaration into an instance listener declaration
                event: declaration.event,
                options: declaration.options,

                // bind the components listener method to the component instance and store it in the instance declaration
                listener: (this[listener as keyof this] as unknown as EventListener).bind(this),

                // determine the event target and store it in the instance declaration
                target: (declaration.target) ?
                    (typeof declaration.target === 'function') ?
                        declaration.target() :
                        declaration.target :
                    this
            };

            // add the bound event listener to the target
            instanceDeclaration.target.addEventListener(instanceDeclaration.event as string, instanceDeclaration.listener, instanceDeclaration.options);

            // save the instance listener declaration on the component instance
            this._listenerDeclarations.push(instanceDeclaration);
        });
    }

    /**
     * Unbind custom element listeners.
     *
     * @internal
     * @private
     */
    protected _unlisten () {

        this._listenerDeclarations.forEach((declaration) => {

            declaration.target.removeEventListener(declaration.event as string, declaration.listener, declaration.options);
        });
    }

    /**
     * Schedule the update of the custom element
     *
     * @remarks
     * Schedules the update of the custom element just before the next frame
     * and cleans up the custom elements state afterwards.
     */
    protected _scheduleUpdate (): Promise<void> {

        return new Promise(resolve => {

            // schedule the update via requestAnimationFrame to avoid multiple redraws per frame
            requestAnimationFrame(() => {

                this.update();

                this._changedProperties = new Map();

                this._reflectingProperties = new Map();

                this._notifyingProperties = new Map();

                // mark custom element as updated after the update to prevent infinte loops in the update process
                // N.B.: any property changes during the update will be ignored
                this._hasRequestedUpdate = false;

                resolve();
            });
        });
    }

    /**
     * Enqueue a request for an asynchronous update
     */
    private async _enqueueUpdate () {

        let resolve: (result: boolean) => void;

        const previousRequest = this._updateRequest;

        // mark the custom element as having requested an update, the {@link _requestUpdate} method
        // will not enqueue a further request for update if one is scheduled
        this._hasRequestedUpdate = true;

        this._updateRequest = new Promise<boolean>(res => resolve = res);

        // wait for the previous update to resolve
        // `await` is asynchronous and will return execution to the {@link requestUpdate} method
        // and essentially allows us to batch multiple synchronous property changes, before the
        // execution can resume here
        await previousRequest;

        const result = this._scheduleUpdate();

        // the actual update is scheduled asynchronously as well
        await result;

        // resolve the new {@link _updateRequest} after the result of the current update resolves
        resolve!(!this._hasRequestedUpdate);
    }

    /**
     * Gets the {@link PropertyDeclaration} for a decorated property
     *
     * @param propertyKey The property key for which to retrieve the declaration
     *
     * @internal
     * @private
     */
    private _getPropertyDeclaration (propertyKey: PropertyKey): PropertyDeclaration | undefined {

        return (this.constructor as typeof CustomElement).properties.get(propertyKey);
    }
}
