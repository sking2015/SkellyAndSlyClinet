// Shared flags deliberately contain no room/UI imports.
export const invasionState = {
    phase: 'idle' as 'idle' | 'preparing' | 'battle' | 'settling',
    notoriety: 0,
    get pausedProduction() { return this.phase !== 'idle'; },
    get locked() { return this.phase === 'battle' || this.phase === 'settling'; },
    addAction() { if (this.phase === 'idle') this.notoriety = Math.min(100, this.notoriety + 10); },
};
