import { TestBed } from '@angular/core/testing';

import { AbonoService } from './abono.service';

describe('AbonoService', () => {
  let service: AbonoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AbonoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
