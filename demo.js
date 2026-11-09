import { ollamaSuggester } from './ollama.js';
import { createScheduler } from './scheduler.js';

const model = process.env.OLLAMA_MODEL;
const scheduler = createScheduler(model ? { suggest: ollamaSuggester(model) } : {});
const booking = { id: 'evt-003', candidate: 'Alex Rivera', text: 'Book A' };
const events = [
  { id: 'evt-001', candidate: 'Alex Rivera', text: 'Either day might work.' },
  ...(model ? [{ id: 'evt-002', candidate: 'Alex Rivera', text: 'Tuesday at ten works for me.' }] : []),
  booking,
  booking,
  { id: 'evt-004', candidate: 'Jordan Lee', text: 'Book A' },
];

for (const event of events) {
  const result = await scheduler.receive(event);
  console.log(`${event.candidate}: ${event.text}`);
  console.log(`[${result.status}${result.replay ? ', replay' : ''}] ${result.message}\n`);
}

console.table(scheduler.bookings());
