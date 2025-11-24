import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

type Position = {
    x: number;
    y: number;
};

export type UseDraggableFloatingActionOptions = {
    storageKey: string;
    defaultPosition?: Position;
};

export const useDraggableFloatingAction = (options: UseDraggableFloatingActionOptions) => {
    const containerRef = ref<HTMLElement | null>(null);
    const elementRef = ref<HTMLElement | null>(null);

    const position = ref<Position | null>(null);
    const dragOffset = ref<Position>({ x: 0, y: 0 });
    const isDragging = ref(false);
    const suppressNextClick = ref(false);
    const hadMovementDuringDrag = ref(false);

    const clampPosition = (candidate: Position): Position => {
        const containerRect = containerRef.value?.getBoundingClientRect();
        const elementRect = elementRef.value?.getBoundingClientRect();

        if (!containerRect || !elementRect) {
            return candidate;
        }

        const maxX = Math.max(containerRect.width - elementRect.width, 0);
        const maxY = Math.max(containerRect.height - elementRect.height, 0);

        return {
            x: Math.min(Math.max(candidate.x, 0), maxX),
            y: Math.min(Math.max(candidate.y, 0), maxY),
        };
    };

    const persistPosition = () => {
        if (typeof window === 'undefined' || !position.value) {
            return;
        }

        localStorage.setItem(options.storageKey, JSON.stringify(position.value));
    };

    const applyInitialPosition = () => {
        if (options.defaultPosition) {
            position.value = clampPosition(options.defaultPosition);
            return;
        }

        const containerRect = containerRef.value?.getBoundingClientRect();
        const elementRect = elementRef.value?.getBoundingClientRect();

        if (!containerRect || !elementRect) {
            return;
        }

        const relative: Position = {
            x: elementRect.left - containerRect.left,
            y: elementRect.top - containerRect.top,
        };

        position.value = clampPosition(relative);
    };

    const restorePosition = async () => {
        await nextTick();

        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem(options.storageKey);

                if (saved) {
                    const parsed: Position = JSON.parse(saved);
                    position.value = clampPosition(parsed);
                    return;
                }
            } catch {
                // ignore malformed storage values
            }
        }

        applyInitialPosition();
    };

    const updatePositionFromPointer = (event: PointerEvent) => {
        const containerRect = containerRef.value?.getBoundingClientRect();

        if (!containerRect) {
            return;
        }

        const next: Position = {
            x: event.clientX - containerRect.left - dragOffset.value.x,
            y: event.clientY - containerRect.top - dragOffset.value.y,
        };

        position.value = clampPosition(next);
    };

    const handlePointerDown = (event: PointerEvent) => {
        if (!elementRef.value) {
            return;
        }

        isDragging.value = true;
        hadMovementDuringDrag.value = false;

        const rect = elementRef.value.getBoundingClientRect();

        dragOffset.value = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        };

        elementRef.value.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
        if (!isDragging.value) {
            return;
        }

        event.preventDefault();
        hadMovementDuringDrag.value = true;
        updatePositionFromPointer(event);
    };

    const handlePointerUp = (event: PointerEvent) => {
        if (!isDragging.value) {
            return;
        }

        isDragging.value = false;
        elementRef.value?.releasePointerCapture(event.pointerId);

        const shouldPersist = hadMovementDuringDrag.value;
        suppressNextClick.value = shouldPersist;
        hadMovementDuringDrag.value = false;

        if (shouldPersist) {
            persistPosition();
        }
    };

    const allowClick = () => {
        if (suppressNextClick.value) {
            suppressNextClick.value = false;
            return false;
        }

        return true;
    };

    const syncPositionWithBounds = () => {
        if (!position.value) {
            return;
        }

        position.value = clampPosition(position.value);
        persistPosition();
    };

    onMounted(async () => {
        await restorePosition();
        window.addEventListener('resize', syncPositionWithBounds);
    });

    onBeforeUnmount(() => {
        window.removeEventListener('resize', syncPositionWithBounds);
    });

    const style = computed(() => {
        if (!position.value) {
            return {};
        }

        return {
            top: `${position.value.y}px`,
            left: `${position.value.x}px`,
            bottom: 'auto',
            right: 'auto',
        };
    });

    return {
        containerRef,
        elementRef,
        style,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        allowClick,
        restorePosition,
        syncPositionWithBounds,
    };
};

