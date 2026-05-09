import { source } from './apps/web/src/lib/source';
const page = source.getPage(['how-complyr-works']);
console.log(page?.file);
