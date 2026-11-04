import type { IRoom, IResources } from './BaseDef';
export type Attributes = Record<'HP'|'MP'|'ATK'|'DEF'|'INT'|'MDF'|'SPD'|'LCA', number>;
export interface BattleUnit {
    unit_instance_id: string; config_id: number; side: 'own'|'enemy';
    kind: 'soldier'|'lord'|'enemy_hero'; troop_type: 1|2|3|null;
    source_room_index: number|null; alive: boolean; life_no: number;
}
export interface BattleState {
    battle_id: string; encounter_id: string; status: 'active'|'won'|'lost';
    started_at: number; expires_at: number; last_event_seq: number;
    units: BattleUnit[]; events: Array<{ event_id: string; seq: number }>;
}
export interface PlayerState {
    player_level: number; config_version: string; resources: IResources;
    rooms: Array<IRoom & { production_updated_at: number }>;
    monsters: Array<{ monster_id: number; level: number }>;
    troops: Record<'soldier'|'archer'|'mage', { level: number; capacity: number; available: number }>;
    items: Array<{ item_id: number; count: number }>;
    feed: { model_id: number; mutation_level: number; mutation_type: number; mutation_points: number;
        beast_points: number; abyss_points: number; legion_points: number; flesh_points: number; attributes: Attributes };
    progress: { current_stage_id: number }; active_battle: BattleState|null;
}
export interface ProtocolResponse<R = any> {
    protocol_version: 1; code: string; message: string; request_id: string;
    server_time: number; state_version: number; data: { state: PlayerState; result: R }|null;
}
export interface PendingRequest {
    request_id: string; player_id: string; action: string; data: string; state_version: number;
}
export interface LootSettlement {
    loot_id: string; resources: { coin: number; food: number; soul: number };
    items: Array<{ item_id: number; count: number }>;
}
export interface FeedResult {
    feed_attribute_changes: Attributes;
    mutations: Array<{ from_level: number; to_level: number; mutation_type: number;
        model_id: number; attribute_changes: Attributes }>;
}
export function newRequestId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const n = Math.floor(Math.random() * 16);
        return (c === 'x' ? n : (n & 3) | 8).toString(16);
    });
}
export function actionRoute(action: string): string {
    if (action === 'state-sync') return '/api/state';
    for (const group of ['room', 'troop', 'monster', 'feed', 'battle']) {
        if (action.startsWith(group + '-')) return '/api/' + group;
    }
    throw new Error(`Unknown protocol action: ${action}`);
}
