const { test } = require('node:test');
const assert = require('node:assert/strict');
const { coalesce } = require('../utils/coalesce');

// A controllable async fn: each call waits until release() is called.
function gated() {
  let calls = 0;
  const releases = [];
  const fn = () => {
    calls += 1;
    return new Promise((resolve) => releases.push(resolve));
  };
  const release = async () => {
    releases.shift()();
    await new Promise((r) => setImmediate(r));
  };
  return { fn, release, calls: () => calls };
}

test('a single request runs fn once', async () => {
  const g = gated();
  const request = coalesce(g.fn);
  const done = request();
  await g.release();
  await done;
  assert.equal(g.calls(), 1);
});

test('requests during a run collapse into exactly one rerun', async () => {
  const g = gated();
  const request = coalesce(g.fn);
  const first = request();
  const second = request();
  const third = request();
  assert.equal(g.calls(), 1);
  assert.equal(second, first);
  assert.equal(third, first);

  await g.release();
  assert.equal(g.calls(), 2);
  await g.release();
  await first;
  assert.equal(g.calls(), 2);
});

test('a request after the run finishes starts a fresh run', async () => {
  const g = gated();
  const request = coalesce(g.fn);
  const first = request();
  await g.release();
  await first;
  const second = request();
  assert.notEqual(second, first);
  await g.release();
  await second;
  assert.equal(g.calls(), 2);
});

test('a failing run rejects and does not block later requests', async () => {
  let calls = 0;
  const request = coalesce(async () => {
    calls += 1;
    if (calls === 1) throw new Error('boom');
  });
  await assert.rejects(request(), /boom/);
  await request();
  assert.equal(calls, 2);
});
