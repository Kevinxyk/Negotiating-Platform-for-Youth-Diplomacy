// File: my-backend/data/timezones.js
"use strict";

// List of common time zones with UTC offsets and representative cities/countries
const timezones = [
  { offset: -12, label: 'UTC-12:00', countries: ['Baker Island (US)'] },
  { offset: -11, label: 'UTC-11:00', countries: ['Niue', 'American Samoa'] },
  { offset: -10, label: 'UTC-10:00', countries: ['Hawaii (US)', 'French Polynesia'] },
  { offset: -9,  label: 'UTC-09:00', countries: ['Alaska (US)'] },
  { offset: -8,  label: 'UTC-08:00', countries: ['Pacific Time (US/CA)', 'Pitcairn Islands'] },
  { offset: -7,  label: 'UTC-07:00', countries: ['Mountain Time (US/CA)', 'Arizona'] },
  { offset: -6,  label: 'UTC-06:00', countries: ['Central Time (US/CA)', 'Mexico City'] },
  { offset: -5,  label: 'UTC-05:00', countries: ['Eastern Time (US/CA)', 'Bogota', 'Lima'] },
  { offset: -4,  label: 'UTC-04:00', countries: ['Atlantic Time (CA)', 'Santiago'] },
  { offset: -3,  label: 'UTC-03:00', countries: ['Buenos Aires', 'Brasília'] },
  { offset: -2,  label: 'UTC-02:00', countries: ['South Georgia & South Sandwich Islands'] },
  { offset: -1,  label: 'UTC-01:00', countries: ['Azores (PT)', 'Cape Verde'] },
  { offset:  0,  label: 'UTC+00:00', countries: ['London (UK)', 'Reykjavik'] },
  { offset:  1,  label: 'UTC+01:00', countries: ['Paris', 'Berlin', 'Madrid'] },
  { offset:  2,  label: 'UTC+02:00', countries: ['Athens', 'Cairo', 'Johannesburg'] },
  { offset:  3,  label: 'UTC+03:00', countries: ['Moscow', 'Riyadh', 'Nairobi'] },
  { offset:  4,  label: 'UTC+04:00', countries: ['Dubai', 'Baku'] },
  { offset:  5,  label: 'UTC+05:00', countries: ['Karachi', 'Tashkent'] },
  { offset:  5.5,label: 'UTC+05:30', countries: ['Mumbai', 'New Delhi'] },
  { offset:  6,  label: 'UTC+06:00', countries: ['Dhaka', 'Almaty'] },
  { offset:  7,  label: 'UTC+07:00', countries: ['Bangkok', 'Jakarta'] },
  { offset:  8,  label: 'UTC+08:00', countries: ['Beijing', 'Singapore', 'Perth'] },
  { offset:  9,  label: 'UTC+09:00', countries: ['Tokyo', 'Seoul'] },
  { offset:  9.5,label: 'UTC+09:30', countries: ['Adelaide', 'Darwin'] },
  { offset: 10,  label: 'UTC+10:00', countries: ['Sydney', 'Vladivostok'] },
  { offset: 11,  label: 'UTC+11:00', countries: ['Magadan', 'Honiara'] },
  { offset: 12,  label: 'UTC+12:00', countries: ['Auckland', 'Fiji'] },
  { offset: 13,  label: 'UTC+13:00', countries: ['Nuku\'alofa', 'Phoenix Islands'] },
  { offset: 14,  label: 'UTC+14:00', countries: ['Kiritimati'] }
];

module.exports = { timezones };
