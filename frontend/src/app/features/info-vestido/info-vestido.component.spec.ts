import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoVestidoComponent } from './info-vestido.component';

describe('InfoVestidoComponent', () => {
  let component: InfoVestidoComponent;
  let fixture: ComponentFixture<InfoVestidoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoVestidoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfoVestidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
