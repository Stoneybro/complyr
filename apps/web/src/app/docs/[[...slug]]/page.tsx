import { source } from '@/lib/source';
import { DocsPage, DocsBody, DocsDescription, DocsTitle } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import fs from 'fs';
import path from 'path';
import { CopyDocButton } from '@/components/ui/copy-doc-button';

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const data = page.data as any;
  const MDX = data.body;

  let rawContent = "";
  try {
    const slugPath = params.slug ? params.slug.join('/') : 'index';
    let filePath = path.join(process.cwd(), 'content/docs', slugPath + '.mdx');
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), 'apps/web/content/docs', slugPath + '.mdx');
    }
    if (fs.existsSync(filePath)) {
      rawContent = fs.readFileSync(filePath, 'utf-8');
    }
  } catch (e) {
    console.error("Failed to read raw MDX:", e);
  }

  return (
    <DocsPage toc={data.toc} full={data.full}>
      <div>
        <CopyDocButton content={rawContent} />
        <DocsTitle>{data.title}</DocsTitle>
        <DocsDescription>{data.description}</DocsDescription>
        <DocsBody>
          <MDX components={{ ...defaultMdxComponents }} />
        </DocsBody>
      </div>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: (page.data as any).title,
    description: (page.data as any).description,
  };
}
