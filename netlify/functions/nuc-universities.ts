import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  try {
    const sources = [
      ['federal','https://www.nuc.edu.ng/nigerian-univerisities/federal-univeristies/'],
      ['state','https://www.nuc.edu.ng/nigerian-univerisities/state-univerisity/'],
      ['private','https://www.nuc.edu.ng/nigerian-univerisities/private-univeristies/']
    ] as const;
    const institutions: {name:string;ownership:string}[] = [];
    for (const [ownership,url] of sources) {
      const response = await fetch(url, { headers: { 'user-agent':'Finalyzed-National-Institution-Sync/1.0' } });
      if (!response.ok) throw new Error('NUC source unavailable: '+response.status);
      const html = await response.text();
      const rows = [...html.matchAll(/<tr[^>]*>\s*<td[^>]*>\s*\d+\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/gi)];
      for (const match of rows) {
        const name = match[1].replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
        if (name && !/^(FEDERAL|STATE|PRIVATE) UNIVERSITIES$/i.test(name)) institutions.push({name,ownership});
      }
    }
    const unique = [...new Map(institutions.map(x=>[x.name.toLowerCase(),x])).values()].sort((a,b)=>a.name.localeCompare(b.name));
    return { statusCode: 200, headers: {'content-type':'application/json','cache-control':'public,max-age=86400'}, body: JSON.stringify({source:'National Universities Commission',count:unique.length,institutions:unique}) };
  } catch (error) {
    return { statusCode: 502, body: JSON.stringify({ error: error instanceof Error ? error.message : 'Unable to sync NUC institutions.' }) };
  }
};