import { fetchNearbyPlaces, mapGeoapifyCategoryToApp, GEOAPIFY_CATEGORY_MAP } from '@/utils/geoapify';

/**
 * Note: `babel-preset-expo` inlines `process.env.EXPO_PUBLIC_*` at transpile
 * time, so these tests don't try to mutate the key at runtime. Instead they
 * mock `global.fetch` and assert on the URL shape + response parsing.
 */

describe('mapGeoapifyCategoryToApp', () => {
  it('maps catering categories to Food (2)', () => {
    expect(mapGeoapifyCategoryToApp(['catering.restaurant'])).toBe(2);
    expect(mapGeoapifyCategoryToApp(['catering'])).toBe(2);
  });

  it('maps accommodation to Accommodation (4)', () => {
    expect(mapGeoapifyCategoryToApp(['accommodation.hotel'])).toBe(4);
  });

  it('maps public_transport to Transport (3)', () => {
    expect(mapGeoapifyCategoryToApp(['public_transport.train'])).toBe(3);
  });

  it('maps commercial to Shopping (5)', () => {
    expect(mapGeoapifyCategoryToApp(['commercial.supermarket'])).toBe(5);
  });

  it('maps tourism/leisure/heritage to Sightseeing (1)', () => {
    expect(mapGeoapifyCategoryToApp(['tourism.sights'])).toBe(1);
    expect(mapGeoapifyCategoryToApp(['leisure.park'])).toBe(1);
  });

  it('falls back to Sightseeing (1) for unknown categories', () => {
    expect(mapGeoapifyCategoryToApp(['unknown.thing'])).toBe(1);
    expect(mapGeoapifyCategoryToApp([])).toBe(1);
  });
});

describe('GEOAPIFY_CATEGORY_MAP', () => {
  it('covers all 5 seeded app categories', () => {
    [1, 2, 3, 4, 5].forEach((id) => {
      expect(GEOAPIFY_CATEGORY_MAP[id]).toBeDefined();
      expect(typeof GEOAPIFY_CATEGORY_MAP[id]).toBe('string');
      expect(GEOAPIFY_CATEGORY_MAP[id].length).toBeGreaterThan(0);
    });
  });
});

describe('fetchNearbyPlaces', () => {
  const ORIGINAL_FETCH = global.fetch;
  const ORIGINAL_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;

  beforeAll(() => {
    process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY = 'test-key';
  });

  afterAll(() => {
    if (ORIGINAL_KEY === undefined) delete process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;
    else process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY = ORIGINAL_KEY;
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    jest.restoreAllMocks();
  });

  it('builds a circle filter URL with category + apiKey params', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ features: [] }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await fetchNearbyPlaces({ lat: 41.9, lon: 12.5, categoryIds: [1] });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('https://api.geoapify.com/v2/places');
    expect(url).toContain('apiKey=');
    // circle filter uses lon,lat ordering + default 3000m radius
    expect(url).toContain(encodeURIComponent('circle:12.5,41.9,3000'));
    // Category 1 expands to the sightseeing categories
    expect(url).toContain(encodeURIComponent('tourism.sights'));
  });

  it('defaults to all 5 category strings when categoryIds is empty', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ features: [] }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await fetchNearbyPlaces({ lat: 0, lon: 0, categoryIds: [] });

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain(encodeURIComponent('catering'));
    expect(url).toContain(encodeURIComponent('accommodation'));
    expect(url).toContain(encodeURIComponent('commercial'));
  });

  it('parses features into normalised Place objects with mapped categoryId', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            properties: {
              place_id: 'abc',
              name: 'Pizzeria Romana',
              categories: ['catering.restaurant', 'catering'],
              lat: 41.91,
              lon: 12.48,
              address_line2: 'Via Example 1, Rome',
            },
          },
          {
            // Missing lat/lon → filtered out
            properties: { place_id: 'skip', name: 'Bad', categories: [] },
          },
        ],
      }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const places = await fetchNearbyPlaces({ lat: 41.9, lon: 12.5, categoryIds: [2] });

    expect(places).toHaveLength(1);
    expect(places[0]).toMatchObject({
      id: 'abc',
      name: 'Pizzeria Romana',
      lat: 41.91,
      lon: 12.48,
      address: 'Via Example 1, Rome',
      categoryId: 2, // catering → Food
    });
  });

  it('throws with status on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 429 }) as unknown as typeof fetch;
    await expect(
      fetchNearbyPlaces({ lat: 41.9, lon: 12.5, categoryIds: [1] }),
    ).rejects.toThrow('Geoapify request failed (429)');
  });
});
