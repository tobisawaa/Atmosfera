import { useState, useEffect } from 'react';

interface VibeResult {
  mood: string;
  weatherId: string;
  animeGenreId: number;
  mangaGenreId: number;
  gameGenreSlug: string;
}

interface CurrentVibe extends VibeResult {
  city: string;
  temperature: number;
}

export interface MediaRecommendation {
  id: number | string;
  title: string;
  image: string;
  score: number;
  type: string;
  synopsis?: string;
  genreTags: string[]; 
}

const getRandomGenre = <T,>(genres: T[]): T => {
  return genres[Math.floor(Math.random() * genres.length)];
};

const determineVibe = (weatherCondition: string): VibeResult => {
  const condition = weatherCondition.toLowerCase();
  
  if (['rain', 'thunderstorm', 'drizzle'].includes(condition)) {
    return {
      mood: 'Calming & Reflective',
      weatherId: condition,
      animeGenreId: getRandomGenre([7, 8, 14, 37, 40, 41, 81]), 
      mangaGenreId: getRandomGenre([7, 8, 14, 37, 40, 41, 81]),
      gameGenreSlug: getRandomGenre(['adventure', 'indie', 'puzzle', 'board-games']),
    };
  } else if (['clear', 'sunny'].includes(condition)) {
    return {
      mood: 'Energic & Upbeat',
      weatherId: condition,
      animeGenreId: getRandomGenre([1, 2, 4, 27, 30, 10, 62]), 
      mangaGenreId: getRandomGenre([1, 2, 4, 27, 30, 10, 62]),
      gameGenreSlug: getRandomGenre(['action', 'sports', 'racing', 'fighting', 'shooter']),
    };
  } else {
    return {
      mood: 'Relaxed & Calm',
      weatherId: 'clouds',
      animeGenreId: getRandomGenre([10, 22, 36, 24, 63, 8]), 
      mangaGenreId: getRandomGenre([10, 22, 36, 24, 63, 8]),
      gameGenreSlug: getRandomGenre(['simulation', 'casual', 'strategy', 'role-playing-games-rpg']),
    };
  }
};

export const useVibeEngine = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [currentVibe, setCurrentVibe] = useState<CurrentVibe | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [animeRec, setAnimeRec] = useState<MediaRecommendation | null>(null);
  const [mangaRec, setMangaRec] = useState<MediaRecommendation | null>(null);
  const [gameRec, setGameRec] = useState<MediaRecommendation | null>(null);

  // --- PRODUCTION MODE AKTIF (LIMIT 3 HARI) ---
  const [sisaJatah, setSisaJatah] = useState<number>(3);

  useEffect(() => {
    const today = new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
    const stored = localStorage.getItem('atmosfera_limit');

    if (stored) {
      const parsedData = JSON.parse(stored);
      if (parsedData.date === today) {
        setSisaJatah(3 - parsedData.count);
      } else {
        localStorage.setItem('atmosfera_limit', JSON.stringify({ date: today, count: 0 }));
        setSisaJatah(3);
      }
    } else {
      localStorage.setItem('atmosfera_limit', JSON.stringify({ date: today, count: 0 }));
      setSisaJatah(3);
    }
  }, []);

  const analyzeVibe = async (city: string = 'Jakarta'): Promise<void> => {
    setLoading(true);
    setError(null);
    setAnimeRec(null);
    setMangaRec(null);
    setGameRec(null);

    const today = new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
    const storedStr = localStorage.getItem('atmosfera_limit');
    let stored = storedStr ? JSON.parse(storedStr) : { date: today, count: 0 };

    if (stored.date !== today) { stored = { date: today, count: 0 }; }

    if (stored.count >= 3) {
      setError('You’ve reached your vibe check limit for today. Come back tomorrow for more recommendations!');
      setLoading(false);
      return; 
    }
    
    try {
      const weatherRes = await fetch(`https://cuacadanaktivitasharian.my.id/api/weather_public.php?city=${city}`);
      if (!weatherRes.ok) throw new Error('Weather data didn’t make it through.');
      
      const rawJson = await weatherRes.json();
      const targetData = rawJson.data ? rawJson.data : rawJson;

      if (!targetData.weather || !targetData.weather[0]) throw new Error('Weather data ghosted us.');

      const weatherMain = targetData.weather[0].main;
      const temperature = targetData.main && targetData.main.temp ? Math.round(targetData.main.temp) : 0;
      const cityName = targetData.name ? targetData.name : city;
      
      const vibeResult = determineVibe(weatherMain);
      setCurrentVibe({ city: cityName, temperature: temperature, ...vibeResult });

      const rawgApiKey = import.meta.env.VITE_RAWG_API_KEY;

      // --- LOGIKA BALANCE (POPULAR vs NICHE) ---
      const randomPageAnime = Math.floor(Math.random() * 4) + 1;
      const randomPageManga = Math.floor(Math.random() * 4) + 1;
      const randomPageGame = Math.floor(Math.random() * 4) + 1;

      const [animeResponse, mangaResponse, gameResponse] = await Promise.all([
        fetch(`https://api.jikan.moe/v4/anime?genres=${vibeResult.animeGenreId}&order_by=popularity&page=${randomPageAnime}&limit=25`),
        fetch(`https://api.jikan.moe/v4/manga?genres=${vibeResult.mangaGenreId}&order_by=popularity&page=${randomPageManga}&limit=25`),
        fetch(`https://api.rawg.io/api/games?genres=${vibeResult.gameGenreSlug}&ordering=-added&page=${randomPageGame}&page_size=25&key=${rawgApiKey}`)
      ]);

      const animeData = await animeResponse.json();
      const mangaData = await mangaResponse.json();
      const gameData = await gameResponse.json();

      const getRandomItem = (array: any[]) => {
        if (!array || array.length === 0) return null;
        return array[Math.floor(Math.random() * array.length)];
      };

      const randomAnime = getRandomItem(animeData.data);
      const randomManga = getRandomItem(mangaData.data);
      const randomGame = getRandomItem(gameData.results);

      if (randomAnime) {
        const aTags = randomAnime.genres ? randomAnime.genres.map((g: any) => g.name).slice(0, 2) : [];
        setAnimeRec({
          id: randomAnime.mal_id, title: randomAnime.title, image: randomAnime.images.jpg.large_image_url,
          score: randomAnime.score, type: 'Anime', genreTags: aTags
        });
      }

      if (randomManga) {
        const mTags = randomManga.genres ? randomManga.genres.map((g: any) => g.name).slice(0, 2) : [];
        setMangaRec({
          id: randomManga.mal_id, title: randomManga.title, image: randomManga.images.jpg.large_image_url,
          score: randomManga.score, type: 'Manga', genreTags: mTags
        });
      }

      if (randomGame) {
        const gTags = randomGame.genres ? randomGame.genres.map((g: any) => g.name).slice(0, 2) : [];
        setGameRec({
          id: randomGame.id, title: randomGame.name, image: randomGame.background_image,
          score: randomGame.rating, type: 'Game', genreTags: gTags
        });
      }

      // --- LOGIKA PENGURANGAN JATAH ---
      stored.count += 1;
      localStorage.setItem('atmosfera_limit', JSON.stringify(stored));
      setSisaJatah(3 - stored.count);

    } catch (err: any) {
      console.error("Terjadi Kesalahan:", err);
      setError(err.message || 'There was a hiccup while checking the vibe. Try again later!');
    } finally {
      setLoading(false);
    }
  };

  return { analyzeVibe, currentVibe, loading, error, animeRec, mangaRec, gameRec, sisaJatah };
};