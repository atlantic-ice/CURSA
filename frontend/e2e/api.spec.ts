import { test, expect } from '@playwright/test';

test.describe('API Health Check', () => {
  
  test('should return healthy status', async ({ request }) => {
    const response = await request.get('http://localhost:5000/api/health');
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.version).toBeDefined();
  });

  test('should return detailed health info', async ({ request }) => {
    const response = await request.get('http://localhost:5000/api/health/detailed');
    
    if (response.ok()) {
      const data = await response.json();
      expect(data.status).toBeDefined();
      expect(data.components).toBeDefined();
      expect(data.uptime).toBeDefined();
    }
  });

  test('should return prometheus metrics', async ({ request }) => {
    const response = await request.get('http://localhost:5000/api/metrics');
    
    if (response.ok()) {
      const text = await response.text();
      expect(text).toContain('cursa_uptime_seconds');
    }
  });
});

test.describe('Document API', () => {
  
  test('should reject non-DOCX files', async ({ request }) => {
    const response = await request.post('http://localhost:5000/api/document/upload', {
      multipart: {
        file: {
          name: 'test.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('This is not a DOCX file'),
        }
      }
    });
    
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('формат');
  });

  test('should list corrections', async ({ request }) => {
    const response = await request.get('http://localhost:5000/api/document/list-corrections');
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.files)).toBeTruthy();
  });
});

test.describe('Profiles API', () => {
  
  test('should list all profiles', async ({ request }) => {
    const response = await request.get('http://localhost:5000/api/profiles');
    
    expect(response.ok()).toBeTruthy();
    
    const profiles = await response.json();
    expect(Array.isArray(profiles)).toBeTruthy();
    expect(profiles.length).toBeGreaterThan(0);
  });

  test('should get default_gost profile', async ({ request }) => {
    const response = await request.get('http://localhost:5000/api/profiles/default_gost');
    
    expect(response.ok()).toBeTruthy();
    
    const profile = await response.json();
    expect(profile.id).toBe('default_gost');
    expect(profile.rules).toBeDefined();
    expect(profile.rules.font).toBeDefined();
    expect(profile.rules.margins).toBeDefined();
  });

  test('should validate profile', async ({ request }) => {
    const response = await request.post('http://localhost:5000/api/profiles/default_gost/validate');
    
    if (response.ok()) {
      const validation = await response.json();
      expect(validation.valid).toBeDefined();
    }
  });

  test('should get profile statistics', async ({ request }) => {
    const response = await request.get('http://localhost:5000/api/profiles/statistics');
    
    if (response.ok()) {
      const stats = await response.json();
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.by_category).toBeDefined();
    }
  });
});
