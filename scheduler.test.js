import assert from 'node:assert/strict';
import test from 'node:test';
import { ollamaSuggester } from './ollama.js';
import { createScheduler } from './scheduler.js';

const booking = { id: 'evt-1', candidate: 'Alex Rivera', text: 'Book A' };

test('an ambiguous reply asks for clarification without booking', async () => {
  const scheduler = createScheduler();
  const result = await scheduler.receive({ ...booking, text: 'Either day might work.' });
  assert.equal(result.status, 'clarify');
  assert.deepEqual(scheduler.bookings(), []);
});

test('duplicate concurrent deliveries return the same outcome and one booking', async () => {
  const scheduler = createScheduler();
  const [first, duplicate] = await Promise.all([scheduler.receive(booking), scheduler.receive(booking)]);
  assert.equal(first.status, 'booked');
  assert.deepEqual(duplicate, { ...first, replay: true });
  assert.equal(scheduler.bookings().length, 1);
  await assert.rejects(scheduler.receive({ ...booking, text: 'Book B' }), /different reply/);
});

test('competing bookings cannot reserve the same slot', async () => {
  const scheduler = createScheduler();
  const results = await Promise.all([
    scheduler.receive(booking),
    scheduler.receive({ ...booking, id: 'evt-2', candidate: 'Jordan Lee' }),
  ]);
  assert.deepEqual(results.map(({ status }) => status), ['booked', 'unavailable']);
  assert.equal(scheduler.bookings().length, 1);
});

test('a new event cannot create a second booking for the same candidate', async () => {
  const scheduler = createScheduler();
  await scheduler.receive(booking);
  const result = await scheduler.receive({ ...booking, id: 'evt-2', text: 'Book B' });
  assert.equal(result.status, 'already_booked');
  assert.equal(scheduler.bookings().length, 1);
});

test('a model suggestion requires explicit confirmation', async () => {
  const suggest = ollamaSuggester('test-model', async (_url, options) => {
    const request = JSON.parse(options.body);
    assert.equal(request.messages[1].content, 'Tuesday at ten works for me.');
    assert.deepEqual(request.format.properties.slot.enum, ['A', 'B', null]);
    return new Response(JSON.stringify({ message: { content: '{"slot":"A"}' } }));
  });
  const scheduler = createScheduler({ suggest });
  const result = await scheduler.receive({ ...booking, id: 'evt-0', text: 'Tuesday at ten works for me.' });
  assert.equal(result.status, 'confirm');
  assert.deepEqual(scheduler.bookings(), []);
  assert.equal((await scheduler.receive(booking)).status, 'booked');
});

test('invalid model output and provider failure both fall back to clarification', async () => {
  for (const response of [
    new Response(JSON.stringify({ message: { content: '{"slot":"C"}' } })),
    new Response(null, { status: 503 }),
    new Response(JSON.stringify({ message: { content: 'invalid JSON' } })),
  ]) {
    const scheduler = createScheduler({ suggest: ollamaSuggester('test-model', async () => response) });
    const result = await scheduler.receive({ ...booking, text: 'Tuesday at ten works for me.' });
    assert.equal(result.status, 'clarify');
    assert.deepEqual(scheduler.bookings(), []);
  }
});
