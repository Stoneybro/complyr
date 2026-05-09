// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"architecture.mdx": () => import("../content/docs/architecture.mdx?collection=docs"), "how-complyr-works.mdx": () => import("../content/docs/how-complyr-works.mdx?collection=docs"), "index.mdx": () => import("../content/docs/index.mdx?collection=docs"), "limitations-roadmap.mdx": () => import("../content/docs/limitations-roadmap.mdx?collection=docs"), "zama-fhe-implementation.mdx": () => import("../content/docs/zama-fhe-implementation.mdx?collection=docs"), }),
};
export default browserCollections;