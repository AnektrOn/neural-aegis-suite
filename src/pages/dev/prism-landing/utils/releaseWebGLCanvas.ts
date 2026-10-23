/** Libère le contexte WebGL du canvas (complément à `WebGLRenderer.dispose()`). */
export function releaseWebGLCanvas(canvas: HTMLCanvasElement): void {
  const lose = (gl: WebGLRenderingContext | WebGL2RenderingContext | null) => {
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  };
  lose(canvas.getContext("webgl2"));
  lose(canvas.getContext("webgl"));
}
