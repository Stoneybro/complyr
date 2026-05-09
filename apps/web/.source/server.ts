// @ts-nocheck
import { default as __fd_glob_5 } from "../content/docs/meta.json?collection=meta"
import * as __fd_glob_4 from "../content/docs/zama-fhe-implementation.mdx?collection=docs"
import * as __fd_glob_3 from "../content/docs/limitations-roadmap.mdx?collection=docs"
import * as __fd_glob_2 from "../content/docs/index.mdx?collection=docs"
import * as __fd_glob_1 from "../content/docs/how-complyr-works.mdx?collection=docs"
import * as __fd_glob_0 from "../content/docs/architecture.mdx?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.doc("docs", "content/docs", {"architecture.mdx": __fd_glob_0, "how-complyr-works.mdx": __fd_glob_1, "index.mdx": __fd_glob_2, "limitations-roadmap.mdx": __fd_glob_3, "zama-fhe-implementation.mdx": __fd_glob_4, });

export const meta = await create.meta("meta", "content/docs", {"meta.json": __fd_glob_5, });