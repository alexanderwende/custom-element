import { PositionStrategy, PositionController } from '../position-strategy';
import { PositionConfig, DEFAULT_POSITION_CONFIG } from '../position-config';
import { Position } from '../position';

export const DEFAULT_POSITION_CONFIG_CONNECTED: PositionConfig = {
    ...DEFAULT_POSITION_CONFIG,
    alignment: {
        origin: {
            horizontal: 'start',
            vertical: 'end'
        },
        target: {
            horizontal: 'start',
            vertical: 'start'
        },
        offset: {
            horizontal: 0,
            vertical: 0,
        },
    }
};

export class ConnectedPositionStrategy extends PositionStrategy {

    protected updateListener: EventListener;

    constructor (public target: HTMLElement, config?: Partial<PositionConfig>) {

        super(target, { ...DEFAULT_POSITION_CONFIG_CONNECTED, ...config });

        this.updateListener = () => this.update();

        window.addEventListener('resize', this.updateListener);
        document.addEventListener('scroll', this.updateListener, true);
    }

    destroy () {

        window.removeEventListener('resize', this.updateListener);
        document.removeEventListener('scroll', this.updateListener, true);

        super.destroy();
    }

    /**
     * We override the applyPosition method, so we can use a CSS transform to position the element.
     *
     * This can result in better performance.
     */
    protected applyPosition (position: Position) {

        this.target.style.top = '';
        this.target.style.left = '';
        this.target.style.right = '';
        this.target.style.bottom = '';

        this.target.style.transform = `translate(${ this.parseStyle(position.x) }, ${ this.parseStyle(position.y) })`;
    }
}

export class ConnectedPositionController extends PositionController {

    attach (element: HTMLElement): boolean {

        if (!super.attach(element)) return false;

        this.listen(window, 'resize', () => this.update(), true);
        this.listen(document, 'scroll', () => this.update(), true);

        return true;
    }

    /**
     * We override the applyPosition method, so we can use a CSS transform to position the element.
     *
     * This can result in better performance.
     */
    protected applyPosition (position: Position) {

        if (!this.hasAttached) return;

        this.element!.style.top = '';
        this.element!.style.left = '';
        this.element!.style.right = '';
        this.element!.style.bottom = '';

        // this.element!.style.transform = `translate(${ this.parseStyle(position.x) }, ${ this.parseStyle(position.y) })`;
    }
}
