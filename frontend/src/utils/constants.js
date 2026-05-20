export const DAY_TYPES = [
  { v: 'regular', l: 'Regular workday', cls: 'type-regular' },
  { v: 'rest_day', l: 'Rest day (worked)', cls: 'type-rest' },
  { v: 'special', l: 'Special holiday', cls: 'type-special' },
  { v: 'special_rest', l: 'Special on Rest', cls: 'type-special' },
  { v: 'legal', l: 'Legal holiday', cls: 'type-legal' },
  { v: 'legal_rest', l: 'Legal on Rest', cls: 'type-legal' },
  { v: 'absent', l: 'Absent / unpaid leave', cls: 'type-absent' },
]

export const STATUS_OPTIONS = ['', 'WFH', 'Leave', 'Sick', 'Holiday']

export const SIMPLE_CATEGORIES = [
  { key: 'reg',           label: 'Regular work',          mult: 1.00,   unit: 'hrs' },
  { key: 'rest',          label: 'Rest day (worked)',      mult: 1.30,   unit: 'hrs' },
  { key: 'special',       label: 'Special holiday',        mult: 1.30,   unit: 'hrs' },
  { key: 'specialRest',   label: 'Special holiday (rest)', mult: 1.50,   unit: 'hrs' },
  { key: 'legal',         label: 'Legal holiday (worked)', mult: 2.00,   unit: 'hrs' },
  { key: 'legalRest',     label: 'Legal holiday (rest)',   mult: 2.60,   unit: 'hrs' },
  { key: 'legalUnworked', label: 'Legal holiday (unworked)',mult: 1.00,  unit: 'days', hoursPerUnit: 8 },
]
