import { 
  IonContent, IonPage, IonButton, IonSpinner, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, useIonToast, IonIcon, IonTabBar, 
  IonTabButton, IonLabel, IonFooter, IonInput, IonBadge 
} from '@ionic/react';
import { homeOutline, personCircleOutline, locationOutline } from 'ionicons/icons'; 
import { useState, useEffect, useRef } from 'react';
import { useVibeEngine, MediaRecommendation } from '../hooks/useVibeEngine';
import { supabase } from '../supabaseClient'; 
import { Geolocation } from '@capacitor/geolocation'; // <-- Tambahan Plugin Native Capacitor

import Login from '../auth/Login';
import Register from '../auth/Register';
import ForgotPassword from '../auth/ForgotPassword';
import UpdatePassword from '../auth/UpdatePassword'; 
import Profile from './Profile';
import './Home.css';

const loadingPhrases = [
  "Wait a minute twin✌️",
  "Chill, the app’s waking up.",
  "The party has entered a cutscene. Predictably.",
  "Loading... we forgot where we put your data.",
  "Your inventory is 87% junk and 13% hope. Still loading..",
  "Contacting NASA for the data..",
  "Please wait, the filler arc is still being written..",
  "Please wait, the transformation sequence is taking forever...",
  "Loading... your quest log is being updated.",
  "One sec, the server tripped but it’s getting up."
];

const Home = () => {
  const { analyzeVibe, currentVibe, loading, error, animeRec, mangaRec, gameRec, sisaJatah } = useVibeEngine();
  const [presentToast] = useIonToast();
  
  const [session, setSession] = useState<any>(null);
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [initializing, setInitializing] = useState(true);
  
  // --- STATE PENANGKAP SINYAL RESET PASSWORD ---
  const [isRecovering, setIsRecovering] = useState(false);
  
  const [currentView, setCurrentView] = useState<'home' | 'profile'>('home'); 

  const [cityInput, setCityInput] = useState('Jakarta'); 
  const [isLocating, setIsLocating] = useState(false);
  const locationFetched = useRef(false); 

  const [loadingText, setLoadingText] = useState(loadingPhrases[0]);
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    // KUNCI UTAMA: Cek hash URL sebelum router Ionic macam-macam
    if (window.location.hash.includes('type=recovery') || window.location.href.includes('type=recovery')) {
      setIsRecovering(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      // Jika event recovery terdeteksi resmi oleh Supabase
      if (_event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
      }
      
      // Jangan paksa ke halaman login kalau lagi proses reset password
      if (_event === 'SIGNED_IN' && !window.location.hash.includes('type=recovery') && !isRecovering) {
        setAuthView('login');
      }
    });

    return () => subscription.unsubscribe();
  }, [isRecovering]);

  useEffect(() => {
    if (session && currentView === 'home' && !locationFetched.current) {
      locationFetched.current = true;
      detectLocation(true); 
    }
  }, [session, currentView]);

  useEffect(() => {
    if (sisaJatah === 1) {
      presentToast({ message: '⚠️ Warning: Only 1 gacha left', duration: 3500, color: 'warning', position: 'top' });
    }
  }, [sisaJatah]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0); 
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingText(loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)]);
      interval = setInterval(() => {
        setLoadingText(loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)]);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // --- LOGIKA LOKASI DIPERBARUI DENGAN CAPACITOR NATIVE ---
  const detectLocation = async (isSilent = false) => {
    setIsLocating(true);
    try {
      // 1. Cek & Minta Izin Pop-up secara Native ke HP
      const statusIzin = await Geolocation.checkPermissions();
      if (statusIzin.location !== 'granted') {
        const mintaIzin = await Geolocation.requestPermissions();
        if (mintaIzin.location !== 'granted') {
          if (!isSilent) presentToast({ message: 'GPS access denied. Cannot detect location.', duration: 3000, color: 'warning' });
          setIsLocating(false);
          return; // Berhenti eksekusi kalau ditolak
        }
      }

      // 2. Tarik Koordinat dari Satelit
      const koordinat = await Geolocation.getCurrentPosition();
      const lat = koordinat.coords.latitude;
      const lon = koordinat.coords.longitude;
      
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=id`);
      const data = await res.json();
      const cityName = data.city || data.locality || data.principalSubdivision || 'Jakarta';
      setCityInput(cityName);
      
      if (!isSilent) presentToast({ message: `Location detected: ${cityName}`, color: 'success', duration: 2000 });

    } catch (error: any) {
      if (!isSilent) presentToast({ message: `Failed to translate GPS coordinates.`, color: 'danger', duration: 2000 });
    } finally {
      setIsLocating(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const simpanKeShowcase = async (rec: MediaRecommendation) => {
    if (!session?.user?.id) return;
    try {
      const { data: existingItem, error: checkError } = await supabase.from('showcase_items').select('id').eq('user_id', session.user.id).eq('media_id', rec.id).eq('media_type', rec.type.toLowerCase());
      if (checkError) throw checkError;
      if (existingItem && existingItem.length > 0) {
        presentToast({ message: `Yooo! ${rec.title} is already in your Showcase.`, duration: 3000, color: 'warning', position: 'top' });
        return; 
      }
      const contextWithTags = `${currentVibe?.weatherId || 'unknown'} | ${rec.genreTags.join(', ')}`;
      const dataToInsert = { user_id: session.user.id, media_id: rec.id, title: rec.title, media_type: rec.type.toLowerCase(), image_url: rec.image, weather_context: contextWithTags };
      const { error: supabaseError } = await supabase.from('showcase_items').insert([dataToInsert]);
      if (supabaseError) throw supabaseError;
      presentToast({ message: `Successfully saved ${rec.title}!`, duration: 2500, color: 'success', position: 'top' });
    } catch (err: any) {
      presentToast({ message: `Failed to save: ${err.message}`, duration: 3500, color: 'danger', position: 'top' });
    }
  };

  const renderMediaCard = (rec: MediaRecommendation | null, delayMs: string) => {
    if (!rec) return null; 
    return (
      <IonCard style={{ minWidth: '280px', scrollSnapAlign: 'start', animationDelay: delayMs }}>
        <div>
          <img src={rec.image} alt={rec.title} style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
          <IonCardHeader style={{ paddingBottom: '10px' }}>
            <p style={{ color: '#00d2ff', fontWeight: 'bold', fontSize: '12px', margin: 0, textTransform: 'uppercase' }}>RECOMMENDED {rec.type}</p>
            <IonCardTitle style={{ color: 'white', fontSize: '18px', marginTop: '5px', marginBottom: '8px' }}>{rec.title}</IonCardTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {rec.genreTags.map((tag, idx) => ( <IonBadge key={idx} className="genre-badge">{tag}</IonBadge> ))}
            </div>
          </IonCardHeader>
          <IonCardContent style={{ paddingTop: '0' }}><p style={{ margin: 0 }}>⭐ Score: {rec.score}</p></IonCardContent>
        </div>
        <div style={{ padding: '0 15px 15px 15px' }}>
          <IonButton expand="block" color="tertiary" onClick={() => simpanKeShowcase(rec)}>Save to Showcase</IonButton>
        </div>
      </IonCard>
    );
  };

  if (initializing) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center animated-bg">
          <div style={{ marginTop: '50%' }}><IonSpinner name="crescent" color="primary" /></div>
        </IonContent>
      </IonPage>
    );
  }

  // --- KUNCI: BLOK HALAMAN LOGIN JIKA SEDANG RECOVERY ---
  if (isRecovering) {
    return <UpdatePassword onPasswordUpdated={() => {
      setIsRecovering(false);
      window.location.hash = ''; // Bersihkan URL agar tidak terjebak di layar ini
    }} />;
  }

  if (!session) {
    if (authView === 'login') return <Login onSwitchView={setAuthView} />;
    if (authView === 'register') return <Register onSwitchView={setAuthView} />;
    if (authView === 'forgot_password') return <ForgotPassword onSwitchView={setAuthView} />;
  }

  return (
    <IonPage>
      {currentView === 'home' ? (
        <IonContent className="animated-bg" fullscreen> 
          <div className="cyber-grid-bg"></div> 
          <div style={{ textAlign: 'center', marginTop: '40px', padding: '0 20px', position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#fff', textShadow: '0 0 15px rgba(0,210,255,0.4)', marginBottom: '5px' }}>Vibe Checker</h2>
            <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '30px' }}>Match your mood with local weather</p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
              <IonInput 
                value={cityInput}
                onIonInput={(e) => setCityInput(e.detail.value as string)}
                placeholder="Enter City..."
                className="modern-input"
                style={{ flex: 1, margin: 0, '--background': 'rgba(30, 30, 38, 0.6)' }}
                mode="md"
                fill="outline"
              />
              <IonButton onClick={() => detectLocation(false)} disabled={isLocating || loading} style={{ height: '56px', margin: 0, '--border-radius': '12px' }} color="tertiary">
                {isLocating ? <IonSpinner name="crescent" color="light" /> : <IonIcon icon={locationOutline} style={{ animation: 'float 3s infinite ease-in-out' }} />}
              </IonButton>
            </div>
            
            {sisaJatah === 1 && !loading && (
              <div style={{ marginBottom: '15px', color: '#ffcc00', fontWeight: 'bold', fontSize: '13px', animation: 'pulseGlow 2s infinite' }}>
                ⚠️ Warning: Only 1 gacha left today!
              </div>
            )}

            <IonButton expand="block" 
              style={{ '--background': sisaJatah === 0 ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%)', '--border-radius': '12px', height: '50px', fontWeight: 'bold', letterSpacing: '1px', boxShadow: sisaJatah === 0 ? 'none' : '0 5px 20px rgba(0,210,255,0.3)', color: sisaJatah === 0 ? '#888' : '#fff', border: sisaJatah === 0 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}
              onClick={() => analyzeVibe(cityInput)} disabled={loading || sisaJatah === 0 || !cityInput}
            >
              {loading ? <IonSpinner name="crescent" /> : sisaJatah === 0 ? `Resets in: ${countdown}` : `Analyze Vibe (Gacha Left: ${sisaJatah}/3)`}
            </IonButton>

            {loading && (
              <div className="rpg-dialog-box" style={{ animation: 'fadeInUp 0.3s ease' }}>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
                  <span style={{ color: '#aaa' }}>System:</span><br/>
                  <span style={{ color: '#fff' }}>{loadingText}</span>
                </p>
              </div>
            )}

            {error && <p style={{ color: '#ff4d4d', marginTop: '20px', fontWeight: 'bold', background: 'rgba(255,0,0,0.1)', padding: '10px', borderRadius: '8px' }}>{error}</p>}

            {!loading && currentVibe && (
              <div style={{ marginTop: '30px' }}>
                <IonCard style={{ margin: '0 0 25px 0', textAlign: 'center' }}>
                  <IonCardHeader style={{ paddingBottom: '0' }}>
                    <IonCardTitle style={{ color: '#00d2ff', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '2px' }}>{currentVibe.city}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <h1 className="temp-text" style={{ fontSize: '56px', margin: '5px 0 10px 0' }}>{currentVibe.temperature}°C</h1>
                    <p style={{ color: '#ddd', margin: '5px 0', fontSize: '15px' }}>Weather: <strong style={{ color: '#fff' }}>{currentVibe.weatherId.toUpperCase()}</strong></p>
                    <p style={{ color: '#ddd', margin: '0', fontSize: '15px' }}>Mood: <strong style={{ color: '#00d2ff' }}>{currentVibe.mood}</strong></p>
                  </IonCardContent>
                </IonCard>

                <div style={{ display: 'flex', overflowX: 'auto', padding: '10px 5px 20px 5px', scrollSnapType: 'x mandatory', gap: '15px', textAlign: 'left' }}>
                  {renderMediaCard(animeRec, '0.2s')}
                  {renderMediaCard(mangaRec, '0.4s')}
                  {renderMediaCard(gameRec, '0.6s')}
                </div>
              </div>
            )}
          </div>
        </IonContent>
      ) : (
        <Profile session={session} onLogout={handleLogout} />
      )}

      <IonFooter>
        <IonTabBar style={{ backgroundColor: '#121212', borderTop: '1px solid #333' }}>
          <IonTabButton tab="home" onClick={() => setCurrentView('home')} style={{ backgroundColor: 'transparent', color: currentView === 'home' ? '#00d2ff' : '#888' }}>
            <IonIcon icon={homeOutline} />
            <IonLabel>Vibe Checker</IonLabel>
          </IonTabButton>
          <IonTabButton tab="profile" onClick={() => setCurrentView('profile')} style={{ backgroundColor: 'transparent', color: currentView === 'profile' ? '#00d2ff' : '#888' }}>
            <IonIcon icon={personCircleOutline} />
            <IonLabel>Profile</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonFooter>
    </IonPage>
  );
};

export default Home;