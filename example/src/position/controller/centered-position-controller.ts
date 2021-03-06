import { DEFAULT_POSITION, Position } from '../position';
import { DEFAULT_POSITION_CONFIG, PositionConfig } from '../position-config';
import { PositionController } from '../position-controller';

export const CENTERED_POSITION_CONFIG: PositionConfig = {
    ...DEFAULT_POSITION_CONFIG,
};

export class CenteredPositionController extends PositionController {

    /**
     * We override the getPosition method to always return the {@link DEFAULT_POSITION}
     *
     * We actually don't care about the position, because we are going to use viewport relative
     * CSS units to position the element. After the first calculation of the position, it's
     * never going to change and applyPosition will only be called once. This makes this
     * position controller really cheap.
     */
    protected getPosition (): Position {

        return DEFAULT_POSITION;
    }

    /**
     * We override the applyPosition method to center the element relative to the viewport
     * dimensions and its own size. This style has to be applied only once and is responsive
     * by default.
     */
    protected applyPosition (position: Position) {

        if (!this.hasAttached) return;

        this.element!.style.top = '50vh';
        this.element!.style.left = '50vw';
        this.element!.style.right = '';
        this.element!.style.bottom = '';

        this.element!.style.transform = `translate(-50%, -50%)`;
    }
}
