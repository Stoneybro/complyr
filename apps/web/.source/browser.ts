// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"architecture.mdx": () => import("../content/docs/architecture.mdx?collection=docs"), "audit-model.mdx": () => import("../content/docs/audit-model.mdx?collection=docs"), "auditor-portal.mdx": () => import("../content/docs/auditor-portal.mdx?collection=docs"), "getting-started.mdx": () => import("../content/docs/getting-started.mdx?collection=docs"), "index.mdx": () => import("../content/docs/index.mdx?collection=docs"), "limitations-roadmap.mdx": () => import("../content/docs/limitations-roadmap.mdx?collection=docs"), "smart-contracts.mdx": () => import("../content/docs/smart-contracts.mdx?collection=docs"), }),
};
export default browserCollections;