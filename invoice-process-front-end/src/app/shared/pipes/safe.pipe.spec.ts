import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { SafePipe } from './safe.pipe';

describe('SafePipe', () => {
  let pipe: SafePipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = new SafePipe(sanitizer);
  });

  it('debe crearse', () => {
    expect(pipe).toBeTruthy();
  });

  it('sanitiza html eliminando scripts peligrosos', () => {
    const result = pipe.transform('<b>ok</b><script>alert(1)</script>', 'html') as string;
    expect(result).toContain('<b>ok</b>');
    expect(result).not.toContain('<script>');
  });

  it('confía en resourceUrl (para iframes/PDF embebidos)', () => {
    const result = pipe.transform('https://espe.edu.ec/factura.pdf', 'resourceUrl');
    expect(result).toBeTruthy();
  });

  it('lanza error ante un tipo inválido', () => {
    expect(() => pipe.transform('x', 'pdf' as any)).toThrowError(/Invalid safe type/);
  });
});
