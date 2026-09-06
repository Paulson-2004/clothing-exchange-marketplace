// Backward-compatible alias for the safe development seeder.
// Keep the historical npm run seed:demo command from bypassing the
// development-database safety checks in seedDev.js.
require('./seedDev');
