export const INCOMING_REQUESTS = [
  {
    id: 'in1',
    name: 'Green House',
    initials: 'GH',
    kwh: 2.5,
    when: '20 Aug 2026 • 2:35 PM',
    status: 'Pending',
    message: 'Need additional energy for evening household usage.',
  },
  { id: 'in2', name: 'Hilltop Villa', initials: 'HV', kwh: 4.5, when: '20 Aug 2026 • 11:10 AM', status: 'Pending', message: '' },
  {
    id: 'in3',
    name: 'Maple Court',
    initials: 'MC',
    kwh: 1.8,
    when: '19 Aug 2026 • 6:40 PM',
    status: 'Completed',
    message: 'Topping up before the weekend.',
  },
  { id: 'in4', name: 'Eco House', initials: 'EH', kwh: 3.0, when: '18 Aug 2026 • 9:05 AM', status: 'Rejected', message: '' },
];

export default INCOMING_REQUESTS;
