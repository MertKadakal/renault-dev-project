import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have title signal with frontend value', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    // title bir Signal olduğu için değerini okumak üzere fonksiyon gibi çağırıyoruz: app['title']()
    expect(app['title']()).toEqual('frontend');
  });
});