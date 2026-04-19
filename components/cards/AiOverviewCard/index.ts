// Named export is the memoised default — consumers get the optimised
// component by default while the source file keeps the unmemoised
// implementation reachable (`AiOverviewCard` name) for testing.
export { default as AiOverviewCard } from './AiOverviewCard';
