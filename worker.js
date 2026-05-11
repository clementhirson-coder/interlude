export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Clean URLs: /series/japan → serves series.html?s=japan
    const match = url.pathname.match(/^\/series\/(japan|lanzarote|elsewhere)\/?$/i);
    if (match) {
      const rewritten = new URL(request.url);
      rewritten.pathname = '/series.html';
      rewritten.searchParams.set('s', match[1].toLowerCase());
      return env.ASSETS.fetch(new Request(rewritten.toString(), request));
    }

    return env.ASSETS.fetch(request);
  }
};
