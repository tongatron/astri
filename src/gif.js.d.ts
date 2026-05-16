declare module 'gif.js' {
  interface AddFrameOptions {
    delay?: number;
    copy?: boolean;
  }
  interface GIFOptions {
    workers?: number;
    quality?: number;
    width?: number;
    height?: number;
    workerScript?: string;
    repeat?: number;
    background?: string;
    transparent?: string | null;
  }
  class GIF {
    constructor(options: GIFOptions);
    addFrame(
      element: HTMLCanvasElement | CanvasRenderingContext2D,
      options?: AddFrameOptions,
    ): void;
    render(): void;
    on(event: 'finished', cb: (blob: Blob) => void): void;
    on(event: 'progress', cb: (p: number) => void): void;
  }
  export default GIF;
}

declare module 'gif.js/dist/gif.worker.js?url' {
  const url: string;
  export default url;
}
