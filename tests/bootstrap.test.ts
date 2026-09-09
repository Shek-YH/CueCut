describe('bootstrap toolchain', () => {
  it('provides a browser-like test environment', () => {
    expect(typeof window).toBe('object');
    expect(document.documentElement).toBeTruthy();
  });
});

