import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TempDataViewerComponent } from './temp-data-viewer.component';

describe('TempDataViewerComponent', () => {
  let component: TempDataViewerComponent;
  let fixture: ComponentFixture<TempDataViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TempDataViewerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TempDataViewerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
