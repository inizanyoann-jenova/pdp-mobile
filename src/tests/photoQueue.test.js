import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  addToPhotoQueue,
  getPendingUploads,
  removeFromQueue,
  countPendingUploads,
  clearPhotoQueue,
} from '../utils/photoQueue';

beforeEach(async () => {
  await clearPhotoQueue();
});

describe('photoQueue', () => {
  it('addToPhotoQueue returns an id and stores the entry', async () => {
    const blob = new Blob(['fake-image'], { type: 'image/jpeg' });
    const id = await addToPhotoQueue({ planId: 'plan-1', blob, fileName: 'test.jpg' });
    expect(typeof id).toBe('string');
    expect(id.startsWith('pq_')).toBe(true);
    const all = await getPendingUploads();
    expect(all).toHaveLength(1);
    expect(all[0].planId).toBe('plan-1');
    // Blob should exist and have the correct properties
    expect(all[0].blob).toBeDefined();
    expect(all[0].fileName).toBe('test.jpg');
  });

  it('removeFromQueue deletes an entry', async () => {
    const blob = new Blob(['x'], { type: 'image/jpeg' });
    const id = await addToPhotoQueue({ planId: 'plan-2', blob, fileName: 'a.jpg' });
    await removeFromQueue(id);
    expect(await countPendingUploads()).toBe(0);
  });

  it('countPendingUploads reflects queue length', async () => {
    const blob = new Blob(['x'], { type: 'image/jpeg' });
    await addToPhotoQueue({ planId: 'p', blob, fileName: 'a.jpg' });
    await addToPhotoQueue({ planId: 'p', blob, fileName: 'b.jpg' });
    expect(await countPendingUploads()).toBe(2);
  });
});
