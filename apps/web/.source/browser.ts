// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"architecture.mdx": () => import("../content/docs/architecture.mdx?collection=docs"), "audit-model.mdx": () => import("../content/docs/audit-model.mdx?collection=docs"), "auditor-portal.mdx": () => import("../content/docs/auditor-portal.mdx?collection=docs"), "deployment-integrations.mdx": () => import("../content/docs/deployment-integrations.mdx?collection=docs"), "getting-started.mdx": () => import("../content/docs/getting-started.mdx?collection=docs"), "index.mdx": () => import("../content/docs/index.mdx?collection=docs"), "indexer-activity-model.mdx": () => import("../content/docs/indexer-activity-model.mdx?collection=docs"), "limitations-roadmap.mdx": () => import("../content/docs/limitations-roadmap.mdx?collection=docs"), "payment-lifecycle.mdx": () => import("../content/docs/payment-lifecycle.mdx?collection=docs"), "reviewer-access-model.mdx": () => import("../content/docs/reviewer-access-model.mdx?collection=docs"), "smart-contracts.mdx": () => import("../content/docs/smart-contracts.mdx?collection=docs"), "zama-fhe-implementation.mdx": () => import("../content/docs/zama-fhe-implementation.mdx?collection=docs"), }),
};
export default browserCollections;