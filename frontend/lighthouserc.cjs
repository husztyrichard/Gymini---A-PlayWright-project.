module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: ['/'],
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--no-sandbox --headless=new --disable-gpu',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', {minScore: 0.6}],
        'categories:accessibility': ['error', {minScore: 0.9}],
        'categories:best-practices': ['error', {minScore: 0.85}],
        'categories:seo': ['error', {minScore: 0.85}],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
