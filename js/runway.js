// SheetFlow Cashflow Runway Simulator
function calculateRunway(cash, burn) { return burn > 0 ? (cash / burn).toFixed(1) : 'Infinite'; }
