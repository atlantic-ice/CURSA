import React, { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';

export default function MemeWidget() {
  const [meme, setMeme] = useState(null);
  const [loading, setLoading] = useState(false);

  // Minimal, enforced settings per user request:
  const COMPACT_WIDTH = 360;
  const COMPACT_HEIGHT = 640;
  const russianOnly = true; // enforce Russian preference silently

  // helper to detect Cyrillic characters
  const hasCyrillic = (s) => /[А-Яа-яЁё]/.test(String(s || ''));

  const fetchMemeFromApiWithCyrillic = async (maxAttempts = 4) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const res = await fetch('https://meme-api.com/gimme');
        if (!res.ok) continue;
        const data = await res.json();
        if (hasCyrillic(data.title) || hasCyrillic(data.author)) return data;
        if (i === 0 && !russianOnly) return data; // if not enforcing, accept first
      } catch (e) {
        // ignore and retry
      }
    }
    return null;
  };

  const fetchMeme = async () => {
    setLoading(true);
    try {
      // 1) Try backend RSS proxy (Pinterest board RSS)
      try {
        const res = await fetch('/api/document/memes/random');
        if (res.ok) {
          const data = await res.json();
          if (data && data.url) {
            setMeme({ url: data.url, title: 'мем', postLink: data.postLink || '#', author: data.author || '' });
            return;
          }
        }
      } catch (e) {
        // ignore and fallback
      }

      // If backend RSS proxy returns a meme, use it (this is the preferred source).
      // Otherwise fallback to the public meme API (with optional Cyrillic preference).
      // Note: we intentionally do NOT use local `pinterest.json` to avoid showing test images.
      if (russianOnly) {
        // try backend first
        // (backend call attempted above; if it failed to return, fall through to meme-api with Cyrillic preference)
        try {
          // another attempt at backend in case of transient error
          const res2 = await fetch('/api/document/memes/random');
          if (res2.ok) {
            const data2 = await res2.json();
            if (data2 && data2.url) {
              setMeme({ url: data2.url, title: 'мем', postLink: data2.postLink || '#', author: data2.author || '' });
              return;
            }
          }
        } catch (e) {
          // ignore
        }
        const data = await fetchMemeFromApiWithCyrillic(6);
        if (data) setMeme({ url: data.url, title: 'мем', postLink: data.postLink || '#', author: data.author || '' });
        else setMeme(null);
      } else {
        const res = await fetch('https://meme-api.com/gimme');
        if (res.ok) {
          const data = await res.json();
          setMeme({ url: data.url, title: 'мем', postLink: data.postLink || '#', author: data.author || '' });
        } else setMeme(null);
      }
    } catch (err) {
      console.error('Failed to fetch meme', err);
      setMeme(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchMeme(); }, []);

  // Clicking the image fetches the next meme
  const onClickImage = () => {
    if (!loading) fetchMeme();
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {loading && <CircularProgress color="inherit" sx={{ position: 'absolute' }} />}

      {meme ? (
        <Box sx={{ width: COMPACT_WIDTH, height: COMPACT_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box onClick={onClickImage} sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.18)',
            borderRadius: 2,
            p: 1,
            cursor: 'pointer',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)'
          }}>
            <img
              src={meme.url}
              alt={meme.title || 'мем'}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'cover', borderRadius: 6, outline: '2px solid rgba(255,255,255,0.04)' }}
            />
          </Box>
        </Box>
      ) : (
        <Box sx={{ color: 'rgba(255,255,255,0.6)' }} />
      )}
    </Box>
  );
}
