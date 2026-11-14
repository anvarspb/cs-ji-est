import defaultHLTV from 'hltv';
// Bundler resolution accepts this. NodeNext rejects this as a CJS namespace.
// The native Node ESM runtime also has no getMatches on this wrapper.
const method=defaultHLTV.getMatches;
void method;
// Compile-only: never execute.
