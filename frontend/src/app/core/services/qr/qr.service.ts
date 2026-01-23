import { Injectable } from '@angular/core';
import { BrowserQRCodeSvgWriter } from '@zxing/library';

@Injectable({
  providedIn: 'root'
})
export class QrService {

  generateAndDownload(
    url: string,
    title: string,
    options?: {
      size?: number;
      padding?: number;
      titleHeight?: number
    }
  ): void {
    const size = options?.size ?? 300;
    const padding = options?.padding ?? 40;
    const titleHeight = options?.titleHeight ?? 40;

    const writer = new BrowserQRCodeSvgWriter();
    const qrSvg = writer.write(url, size, size);

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(qrSvg);

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      canvas.width = size + padding * 2;
      canvas.height = size + padding * 2 + titleHeight;
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(title, canvas.width / 2, 28);

      ctx.drawImage(img, padding, padding + titleHeight, size, size);

      const safeTitle = title
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${safeTitle}.png`;
      link.click();

      URL.revokeObjectURL(svgUrl);
    };

    img.src = svgUrl;

  }

}
