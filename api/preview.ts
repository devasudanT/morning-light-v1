type RequestLike = {
  query?: Record<string, string | string[] | undefined>;
  headers?: Record<string, string | string[] | undefined>;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  setHeader: (name: string, value: string) => void;
  send: (body: string) => void;
};

const DEFAULT_TITLE = 'Morning Light';
const DEFAULT_DESCRIPTION = 'Daily devotion from Morning Light.';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const toOrigin = (req: RequestLike): string => {
  const protoHeader = req.headers?.['x-forwarded-proto'];
  const hostHeader = req.headers?.host;
  const protocol = Array.isArray(protoHeader) ? protoHeader[0] : (protoHeader || 'https');
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  return host ? `${protocol}://${host}` : 'https://example.com';
};

const toSingle = (value: string | string[] | undefined): string => {
  if (!value) return '';
  return Array.isArray(value) ? value[0] || '' : value;
};

const toAbsoluteUrl = (url: string | undefined, origin: string): string => {
  if (!url) return '';
  try {
    return new URL(url, origin).href;
  } catch {
    return '';
  }
};

const parseSlug = (slug: string): { filename: string; appPath: string } | null => {
  const normalized = slug.replace(/^\/+|\/+$/g, '');
  const match = normalized.match(/^(\d{2})-(\d{2})-(\d{4})-(EN|TA)$/i);
  if (!match) return null;
  const [, day, month, year, lang] = match;
  const language = lang.toUpperCase();
  return {
    filename: `${day}-${month}-${year}-${language}.json`,
    appPath: `/${day}-${month}-${year}-${language}`,
  };
};

const renderHtml = (params: {
  title: string;
  description: string;
  imageUrl: string;
  targetUrl: string;
}) => {
  const title = escapeHtml(params.title || DEFAULT_TITLE);
  const description = escapeHtml(params.description || DEFAULT_DESCRIPTION);
  const imageUrl = escapeHtml(params.imageUrl || '');
  const targetUrl = escapeHtml(params.targetUrl);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Morning Light" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${targetUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <meta http-equiv="refresh" content="0;url=${targetUrl}" />
    <link rel="canonical" href="${targetUrl}" />
    <script>window.location.replace(${JSON.stringify(params.targetUrl)});</script>
  </head>
  <body>
    <p>Redirecting to <a href="${targetUrl}">${targetUrl}</a>...</p>
  </body>
</html>`;
};

export default async function handler(req: RequestLike, res: ResponseLike) {
  const slug = toSingle(req.query?.slug);
  const parsed = parseSlug(slug);
  const origin = toOrigin(req);

  if (!parsed) {
    const fallbackUrl = `${origin}/`;
    res.status(400);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(
      renderHtml({
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        imageUrl: '',
        targetUrl: fallbackUrl,
      })
    );
    return;
  }

  const targetUrl = `${origin}${parsed.appPath}`;
  const dataUrl = `https://raw.githubusercontent.com/devasudanT/morning-light-devotions-data/main/data/${parsed.filename}`;

  let title = DEFAULT_TITLE;
  let description = DEFAULT_DESCRIPTION;
  let imageUrl = '';

  try {
    const response = await fetch(dataUrl);
    if (response.ok) {
      const devotion = (await response.json()) as Array<Record<string, unknown>>;
      const meta = devotion.find(item => item?.type === 'meta');
      if (meta) {
        if (typeof meta.title === 'string' && meta.title.trim()) {
          title = meta.title;
        }
        if (typeof meta.subtitle === 'string' && meta.subtitle.trim()) {
          description = meta.subtitle;
        }
        if (typeof meta.imageUrl === 'string') {
          imageUrl = toAbsoluteUrl(meta.imageUrl, origin);
        }
      }
    }
  } catch {
    // Keep defaults when metadata source is unavailable.
  }

  res.status(200);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=86400');
  res.send(
    renderHtml({
      title,
      description,
      imageUrl,
      targetUrl,
    })
  );
}
