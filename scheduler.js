export const slots = Object.freeze({
  A: 'Tuesday, 10:00 AM',
  B: 'Wednesday, 2:00 PM',
});

const clarification = 'Please reply with “Book A” for Tuesday or “Book B” for Wednesday.';

export function createScheduler({ suggest = async () => null } = {}) {
  const events = new Map();
  const reservations = new Map();
  const calendar = new Map();

  async function handleReply({ candidate, text }) {
    const selection = /^book\s+([ab])[.!]?$/i.exec(text.trim());
    if (!selection) {
      let suggestedSlot;
      try {
        suggestedSlot = await suggest(text);
      } catch {
        return { status: 'clarify', message: clarification };
      }
      if (Object.hasOwn(slots, suggestedSlot)) {
        return {
          status: 'confirm',
          message: `Did you mean ${slots[suggestedSlot]}? Reply “Book ${suggestedSlot}” to confirm.`,
        };
      }
      return { status: 'clarify', message: clarification };
    }

    const slot = selection[1].toUpperCase();
    const prior = reservations.get(candidate);
    if (prior) {
      return { status: 'already_booked', message: `You already have ${slots[prior]}. Contact the recruiter to reschedule.` };
    }
    if (calendar.has(slot)) {
      return { status: 'unavailable', message: `That slot was taken. ${clarification}` };
    }

    calendar.set(slot, candidate);
    reservations.set(candidate, slot);
    return { status: 'booked', message: `Confirmed for ${slots[slot]}.` };
  }

  return {
    async receive(event) {
      const { id, candidate, text } = event;
      if (![id, candidate, text].every(value => typeof value === 'string' && value.trim())) {
        throw new TypeError('An event needs an ID, a candidate, and reply text.');
      }
      const fingerprint = JSON.stringify([candidate, text]);
      const previous = events.get(id);
      if (previous) {
        if (previous.fingerprint !== fingerprint) {
          throw new Error('This event ID was already used for a different reply.');
        }
        return { ...await previous.result, replay: true };
      }
      const result = handleReply({ candidate, text });
      events.set(id, { fingerprint, result });
      return { ...await result, replay: false };
    },
    bookings() {
      return Array.from(calendar, ([slot, candidate]) => ({ candidate, slot, time: slots[slot] }));
    },
  };
}
