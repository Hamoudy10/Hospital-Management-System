// ============================================
// QRCode Type Declarations
// ============================================

declare module 'qrcode' {
  export interface QRCodeOptions {
    version?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    maskPattern?: number;
    toSJISFunc?: (codePoint: number) => number;
  }

  export interface QRCodeToDataURLOptions extends QRCodeOptions {
    type?: 'image/png' | 'image/jpeg' | 'image/webp';
    quality?: number;
    margin?: number;
    scale?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export interface QRCodeToStringOptions extends QRCodeOptions {
    type?: 'utf8' | 'svg' | 'terminal';
    margin?: number;
    scale?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export interface QRCodeToFileOptions extends QRCodeOptions {
    type?: 'png' | 'svg' | 'utf8';
    margin?: number;
    scale?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export interface QRCodeToBufferOptions extends QRCodeOptions {
    type?: 'png';
    margin?: number;
    scale?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export interface QRCodeSegment {
    data: string | Buffer;
    mode?: 'numeric' | 'alphanumeric' | 'kanji' | 'byte';
  }

  export function toDataURL(
    text: string | QRCodeSegment[],
    options?: QRCodeToDataURLOptions
  ): Promise<string>;

  export function toDataURL(
    canvasElement: HTMLCanvasElement,
    text: string | QRCodeSegment[],
    options?: QRCodeToDataURLOptions
  ): Promise<string>;

  export function toString(
    text: string | QRCodeSegment[],
    options?: QRCodeToStringOptions
  ): Promise<string>;

  export function toFile(
    path: string,
    text: string | QRCodeSegment[],
    options?: QRCodeToFileOptions
  ): Promise<void>;

  export function toBuffer(
    text: string | QRCodeSegment[],
    options?: QRCodeToBufferOptions
  ): Promise<Buffer>;

  export function toCanvas(
    canvasElement: HTMLCanvasElement,
    text: string | QRCodeSegment[],
    options?: QRCodeToDataURLOptions
  ): Promise<void>;

  export function create(
    text: string | QRCodeSegment[],
    options?: QRCodeOptions
  ): {
    modules: {
      size: number;
      data: Uint8Array;
      reservedBit: Uint8Array;
    };
    version: number;
    errorCorrectionLevel: {
      bit: number;
    };
    maskPattern: number;
    segments: QRCodeSegment[];
  };

  const QRCode: {
    toDataURL: typeof toDataURL;
    toString: typeof toString;
    toFile: typeof toFile;
    toBuffer: typeof toBuffer;
    toCanvas: typeof toCanvas;
    create: typeof create;
  };

  export default QRCode;
}