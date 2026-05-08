// @ts-nocheck
import { default as __fd_glob_12 } from "../content/docs/meta.json?collection=meta"
import * as __fd_glob_11 from "../content/docs/zama-fhe-implementation.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/smart-contracts.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/reviewer-access-model.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/payment-lifecycle.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/limitations-roadmap.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/indexer-activity-model.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/index.mdx?collection=docs"
import * as __fd_glob_4 from "../content/docs/getting-started.mdx?collection=docs"
import * as __fd_glob_3 from "../content/docs/deployment-integrations.mdx?collection=docs"
import * as __fd_glob_2 from "../content/docs/auditor-portal.mdx?collection=docs"
import * as __fd_glob_1 from "../content/docs/audit-model.mdx?collection=docs"
import * as __fd_glob_0 from "../content/docs/architecture.mdx?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.doc("docs", "content/docs", {"architecture.mdx": __fd_glob_0, "audit-model.mdx": __fd_glob_1, "auditor-portal.mdx": __fd_glob_2, "deployment-integrations.mdx": __fd_glob_3, "getting-started.mdx": __fd_glob_4, "index.mdx": __fd_glob_5, "indexer-activity-model.mdx": __fd_glob_6, "limitations-roadmap.mdx": __fd_glob_7, "payment-lifecycle.mdx": __fd_glob_8, "reviewer-access-model.mdx": __fd_glob_9, "smart-contracts.mdx": __fd_glob_10, "zama-fhe-implementation.mdx": __fd_glob_11, });

export const meta = await create.meta("meta", "content/docs", {"meta.json": __fd_glob_12, });