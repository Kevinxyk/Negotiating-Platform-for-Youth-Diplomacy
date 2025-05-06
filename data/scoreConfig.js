// File: my-backend/data/scoreConfig.js
"use strict";

/**
 * Define scoring dimensions and default weights (sum to 1)
 */
const dimensions = [
  { id: 'strategy',      label: 'Strategy',       weight: 0.30 },
  { id: 'communication',  label: 'Communication',  weight: 0.25 },
  { id: 'innovation',     label: 'Innovation',     weight: 0.20 },
  { id: 'teamwork',       label: 'Teamwork',       weight: 0.15 },
  { id: 'materialUsage',  label: 'Material Usage', weight: 0.10 }
];

/**
 * Role-based weight multipliers
 */
const roleWeights = {
  judge: 1.0,
  sys:   1.0,
  admin: 1.0,
  host:  1.0
};

module.exports = { dimensions, roleWeights };