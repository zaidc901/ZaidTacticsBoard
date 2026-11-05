import assert from 'node:assert/strict';
import { test } from 'node:test';

const memory = new Map<string, string>();
globalThis.sessionStorage = {
  getItem: key => memory.get(key) ?? null,
  setItem: (key, value) => { memory.set(key, value); },
  removeItem: key => { memory.delete(key); },
  clear: () => memory.clear(),
  key: index => [...memory.keys()][index] ?? null,
  get length() { return memory.size; },
};
const { useTacticsStore } = await import('../src/store/tacticsStore');
const initialProject = structuredClone(useTacticsStore.getState().project);

test('a new studio session starts with the light board palette', () => {
  assert.equal(initialProject.settings.theme, 'portfolio-light');
  assert.equal(initialProject.settings.backgroundColor, '#edf7ef');
  assert.equal(initialProject.settings.grassColor, '#69a873');
});

test('refresh and legacy migration preserve a saved theme and custom pitch colors', async () => {
  for (const version of [11, 12]) {
    for (const theme of ['portfolio-light', 'dark'] as const) {
      const project = structuredClone(initialProject);
      Object.assign(project.settings, { theme, grassColor: '#123456', lineColor: '#eeeeee', backgroundColor: '#654321' });
      memory.set('tactical-studio-session-v5', JSON.stringify({ version, state: { project } }));
      await useTacticsStore.persist.rehydrate();
      const restored = useTacticsStore.getState().project;
      assert.deepEqual(restored.settings, project.settings);
      assert.deepEqual(restored.teams, project.teams);
      assert.deepEqual(restored.scenes, project.scenes);
    }
  }
});

test('legacy pitch colors can update without turning a light theme dark', async () => {
  const project = structuredClone(initialProject);
  Object.assign(project.settings, { grassColor: '#315f43', lineColor: '#dbeafe' });
  memory.set('tactical-studio-session-v5', JSON.stringify({ version: 11, state: { project } }));
  await useTacticsStore.persist.rehydrate();
  const restored = useTacticsStore.getState().project.settings;
  assert.equal(restored.theme, 'portfolio-light');
  assert.equal(restored.grassColor, '#69a873');
});
