import { BskyAgent } from '@atproto/api';

export interface KonaneGameRecord {
    gameId: string;
    black: string; // DID
    white: string; // DID
    board: string[][];
    currentPlayer: 'black' | 'white';
    phase: string;
    winner: string | null;
    moveNumber: number;
    createdAt: string;
}

export class AtProtoGameService {
    public agent: BskyAgent;
    public userDid: string | null = null;
    public collection = 'app.konane.game';

    constructor() {
        this.agent = new BskyAgent({
            service: 'https://bsky.social'
        });
    }

    async login(handle: string, appPassword: string) {
        const response = await this.agent.login({
            identifier: handle,
            password: appPassword
        });
        if (response.success) {
            this.userDid = response.data.did;
            return response.data;
        }
        throw new Error('Login failed');
    }

    async saveGameState(record: KonaneGameRecord) {
        if (!this.userDid) throw new Error('Not logged in');

        // We use gameId + moveNumber as part of the rkey or just let it be random
        // Actually, using a random rkey is fine as long as we can query by gameId
        return await this.agent.api.com.atproto.repo.createRecord({
            repo: this.userDid,
            collection: this.collection,
            record: {
                ...record,
                $type: this.collection,
            }
        });
    }

    async getLatestGameState(gameId: string, playerDids: string[]): Promise<KonaneGameRecord | null> {
        let latestRecord: KonaneGameRecord | null = null;
        let maxMoveNumber = -1;

        for (const did of playerDids) {
            // listRecords for this collection
            // In a real app, we'd want to optimize this
            const response = await this.agent.api.com.atproto.repo.listRecords({
                repo: did,
                collection: this.collection,
            });

            for (const item of response.data.records) {
                const rec = item.value as any;
                if (rec.gameId === gameId && rec.moveNumber > maxMoveNumber) {
                    maxMoveNumber = rec.moveNumber;
                    latestRecord = rec as KonaneGameRecord;
                }
            }
        }

        return latestRecord;
    }

    async resolveHandle(handle: string) {
        const res = await this.agent.resolveHandle({ handle });
        return res.data.did;
    }
}
