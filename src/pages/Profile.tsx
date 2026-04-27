import { useState, useEffect, useRef } from 'react';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, 
  IonButton, IonIcon, useIonToast, IonSpinner, IonBadge,
  IonModal, IonButtons, IonAvatar, IonSegment, IonSegmentButton, IonLabel,
  IonInput, useIonAlert
} from '@ionic/react';
import { trashOutline, closeOutline, settingsOutline, logOutOutline, cameraOutline, checkmarkOutline, businessOutline, playCircleOutline, globeOutline } from 'ionicons/icons';
import { supabase } from '../supabaseClient';
import '../auth/Auth.css'; 
import './Home.css'; 

interface ShowcaseItem {
  id: string;
  media_id: number;
  title: string;
  media_type: string;
  image_url: string;
  weather_context: string;
}

interface ProfileProps {
  session: any;
  onLogout: () => void;
}

interface MediaDetails {
  text: string;
  creator: string;
  url: string;
}

const Profile: React.FC<ProfileProps> = ({ session, onLogout }) => {
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert(); 

  const [selectedItem, setSelectedItem] = useState<ShowcaseItem | null>(null);
  const [itemDetails, setItemDetails] = useState<MediaDetails | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  const [filter, setFilter] = useState('all');

  const [showSettings, setShowSettings] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  
  const DEFAULT_AVATAR = 'https://ionicframework.com/docs/img/demos/avatar.svg';
  const [displayUsername, setDisplayUsername] = useState('User');
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(DEFAULT_AVATAR);
  
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchShowcase = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('showcase_items').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      presentToast({ message: 'Failed to load showcase.', duration: 3000, color: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchShowcase(); 
    const loadInitialProfile = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.user_metadata) {
        setDisplayUsername(data.user.user_metadata.username || 'User');
        setCurrentAvatarUrl(data.user.user_metadata.avatar_url || DEFAULT_AVATAR);
        setNewUsername(data.user.user_metadata.username || 'User');
      }
    };
    loadInitialProfile();
  }, []); 

  const openDetailModal = async (item: ShowcaseItem) => {
    setSelectedItem(item);
    setItemDetails(null); 
    setIsFetchingDetails(true); 
    
    let detailsObj: MediaDetails = { text: "Description not available.", creator: "", url: "" };

    try {
      if (item.media_type === 'anime') {
        const res = await fetch(`https://api.jikan.moe/v4/anime/${item.media_id}`);
        const { data } = await res.json();
        detailsObj.text = data?.synopsis || detailsObj.text;
        detailsObj.creator = data?.studios?.[0]?.name || "Unknown Studio";
        detailsObj.url = data?.trailer?.url || "";
      } else if (item.media_type === 'manga') {
        const res = await fetch(`https://api.jikan.moe/v4/manga/${item.media_id}`);
        const { data } = await res.json();
        detailsObj.text = data?.synopsis || detailsObj.text;
        detailsObj.creator = data?.authors?.[0]?.name || "Unknown Author";
        detailsObj.url = data?.url || ""; 
      } else if (item.media_type === 'game') {
        const rawgApiKey = import.meta.env.VITE_RAWG_API_KEY || 'YOUR_RAWG_API_KEY_HERE';
        const res = await fetch(`https://api.rawg.io/api/games/${item.media_id}?key=${rawgApiKey}`);
        const data = await res.json();
        detailsObj.text = data?.description_raw || detailsObj.text;
        detailsObj.creator = data?.developers?.[0]?.name || "Unknown Developer";
        detailsObj.url = data?.website || data?.metacritic_url || "";
      }
      setItemDetails(detailsObj);
    } catch (err) {
      detailsObj.text = "Failed to load API data details.";
      setItemDetails(detailsObj);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const hapusItem = async (id: string, title: string) => {
    try {
      const { error } = await supabase.from('showcase_items').delete().eq('id', id);
      if (error) throw error;
      setItems(items.filter(item => item.id !== id));
      presentToast({ message: `${title} removed from showcase.`, duration: 2000, color: 'medium' });
    } catch (error: any) {
      presentToast({ message: `Failed to delete: ${error.message}`, duration: 3000, color: 'danger' });
    }
  };

  const confirmDelete = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation(); 
    presentAlert({
      header: 'Delete Item',
      subHeader: title, 
      message: 'Are you sure you want to remove this from your showcase?',
      cssClass: 'cyber-alert-box', 
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'alert-button-cancel',
        },
        {
          text: 'Delete',
          role: 'destructive', 
          cssClass: 'alert-button-confirm',
          handler: () => {
            hapusItem(id, title);
          },
        },
      ],
    });
  };

  const handleUpdateProfile = async () => {
    if (!session?.user?.id) return;
    setIsUploading(true);
    let finalAvatarUrl = currentAvatarUrl;

    try {
      if (profileFile) {
        const fileExt = profileFile.name.split('.').pop();
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`; 
        
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, profileFile, { upsert: true });
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        finalAvatarUrl = `${publicUrl}?t=${Date.now()}`;
      } 
      else if (newUsername !== displayUsername && currentAvatarUrl.includes('ui-avatars.com')) {
          finalAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(newUsername)}&background=random&color=fff`;
      }

      const { data, error: updateError } = await supabase.auth.updateUser({
        data: { username: newUsername, avatar_url: finalAvatarUrl }
      });
      if (updateError) throw updateError;
      
      await supabase.auth.refreshSession();
      
      const savedMetadata = data.user.user_metadata;
      setDisplayUsername(savedMetadata.username);
      setCurrentAvatarUrl(savedMetadata.avatar_url);
      setNewUsername(savedMetadata.username);

      presentToast({ message: 'Profile updated successfully!', duration: 2000, color: 'success' });
      setProfileFile(null);
      setProfilePreview(null);
      setShowSettings(false);
    } catch (err: any) {
      presentToast({ message: `Failed to update: ${err.message}`, duration: 3000, color: 'danger' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (event: any) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setProfileFile(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const closeSettingsModal = () => {
    setShowSettings(false);
    setProfilePreview(null); 
    setProfileFile(null);
    setNewUsername(displayUsername); 
  };

  const totalItems = items.length;
  const totalAnime = items.filter(i => i.media_type === 'anime').length;
  const totalManga = items.filter(i => i.media_type === 'manga').length;
  const totalGame = items.filter(i => i.media_type === 'game').length;
  const filteredItems = filter === 'all' ? items : items.filter(i => i.media_type === filter);

  const getBadgeColor = (type: string) => {
    if (type === 'anime') return 'primary';
    if (type === 'manga') return 'success';
    return 'tertiary'; 
  };

  return (
    <>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': 'transparent' }}>
          <IonTitle style={{ fontWeight: 'bold' }}>Profile</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowSettings(true)} style={{ color: '#00d2ff' }}>
              <IonIcon icon={settingsOutline} size="large" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="animated-bg ion-padding" fullscreen>
        <div className="cyber-grid-bg"></div> 
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          
          <div style={{ 
            padding: '30px 20px', 
            background: 'rgba(30, 30, 38, 0.4)', 
            backdropFilter: 'blur(8px)', /* Opt: Blur diturunkan dari 12px ke 8px */
            WebkitBackdropFilter: 'blur(8px)', 
            borderBottom: '1px solid rgba(255,255,255,0.08)', 
            borderRadius: '25px', 
            marginBottom: '25px',
            boxShadow: '0 5px 20px rgba(0,0,0,0.2)', /* Opt: Shadow diperingan */
            textAlign: 'center' 
          }}>
            <IonAvatar style={{ width: '90px', height: '90px', margin: '0 auto 15px', border: '2px solid rgba(0, 210, 255, 0.5)' }}>
              {/* Opt: Tambah loading lazy pada avatar */}
              <img src={currentAvatarUrl} alt="Profile" loading="lazy" onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }} />
            </IonAvatar>
            
            <h2 style={{ margin: '0 0 25px 0', color: '#fff', fontSize: '24px', fontWeight: 'bold', textShadow: '0 0 10px rgba(0,210,255,0.3)' }}>
              {displayUsername}
            </h2>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '15px', 
              background: 'rgba(0, 0, 0, 0.3)', 
              padding: '15px 10px', 
              borderRadius: '15px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{ textAlign: 'center', flex: 1 }}><strong style={{ color: '#00d2ff', fontSize: '22px' }}>{totalItems}</strong><br/><span style={{ fontSize: '11px', color: '#888', fontWeight: 'bold' }}>TOTAL</span></div>
              <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
              <div style={{ textAlign: 'center', flex: 1 }}><strong style={{ color: '#3880ff', fontSize: '22px' }}>{totalAnime}</strong><br/><span style={{ fontSize: '11px', color: '#888', fontWeight: 'bold' }}>ANIME</span></div>
              <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
              <div style={{ textAlign: 'center', flex: 1 }}><strong style={{ color: '#2dd36f', fontSize: '22px' }}>{totalManga}</strong><br/><span style={{ fontSize: '11px', color: '#888', fontWeight: 'bold' }}>MANGA</span></div>
              <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>
              <div style={{ textAlign: 'center', flex: 1 }}><strong style={{ color: '#5260ff', fontSize: '22px' }}>{totalGame}</strong><br/><span style={{ fontSize: '11px', color: '#888', fontWeight: 'bold' }}>GAME</span></div>
            </div>
          </div>

          <div style={{ padding: '0 5px 15px 5px' }}>
            <IonSegment value={filter} onIonChange={e => setFilter(e.detail.value as string)} style={{ '--background': 'rgba(255,255,255,0.05)' }}>
              <IonSegmentButton value="all" style={{ '--color-checked': '#00d2ff' }}><IonLabel>All</IonLabel></IonSegmentButton>
              <IonSegmentButton value="anime" style={{ '--color-checked': '#3880ff' }}><IonLabel>Anime</IonLabel></IonSegmentButton>
              <IonSegmentButton value="manga" style={{ '--color-checked': '#2dd36f' }}><IonLabel>Manga</IonLabel></IonSegmentButton>
              <IonSegmentButton value="game" style={{ '--color-checked': '#5260ff' }}><IonLabel>Game</IonLabel></IonSegmentButton>
            </IonSegment>
          </div>

          <div>
            {loading ? (
              <div style={{ textAlign: 'center', marginTop: '30px' }}><IonSpinner name="crescent" color="primary" /></div>
            ) : filteredItems.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '40px', color: '#666' }}>
                <IonIcon icon={trashOutline} style={{ fontSize: '40px', color: '#444', marginBottom: '10px' }} />
                <p>No collection in this category yet.</p>
              </div>
            ) : (
              <IonGrid className="ion-no-padding">
                <IonRow>
                  {filteredItems.map((item) => {
                    const ctxParts = item.weather_context.split(' | ');
                    const weatherTxt = ctxParts[0];
                    const tagsTxt = ctxParts.length > 1 && ctxParts[1] ? ctxParts[1].split(', ') : [];

                    return (
                      <IonCol size="12" sizeMd="6" key={item.id} style={{ padding: '8px' }}>
                        <IonCard button={true} onClick={() => openDetailModal(item)} style={{ margin: '0' }}>
                          <div style={{ position: 'relative' }}>
                            {/* Opt: Tambah loading lazy pada list image */}
                            <img src={item.image_url} alt={item.title} loading="lazy" style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
                            <IonBadge color={getBadgeColor(item.media_type)} style={{ position: 'absolute', top: '12px', left: '12px', textTransform: 'uppercase', padding: '6px 10px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>{item.media_type}</IonBadge>
                          </div>
                          <IonCardHeader style={{ paddingBottom: '0' }}>
                            <IonCardTitle style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>{item.title}</IonCardTitle>
                            
                            {tagsTxt.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '8px' }}>
                                {tagsTxt.map((tag, idx) => (
                                  <IonBadge key={idx} className="genre-badge">{tag}</IonBadge>
                                ))}
                              </div>
                            )}

                            <p style={{ fontSize: '12px', color: '#00d2ff', margin: 0 }}>Saved when: {weatherTxt}</p>
                          </IonCardHeader>
                          <div style={{ padding: '10px 15px', textAlign: 'right' }}>
                            <IonButton fill="clear" color="danger" onClick={(e) => confirmDelete(e, item.id, item.title)}>
                              <IonIcon icon={trashOutline} slot="start" /> Delete
                            </IonButton>
                          </div>
                        </IonCard>
                      </IonCol>
                    );
                  })}
                </IonRow>
              </IonGrid>
            )}
          </div>
        </div>

        {/* --- MODAL SINOPSIS --- */}
        {/* Opt: Breakpoint awal jadi 0.95 biar lega, mencegah rubber-banding */}
        <IonModal isOpen={selectedItem !== null} onDidDismiss={() => setSelectedItem(null)} breakpoints={[0, 0.6, 0.95]} initialBreakpoint={0.95}>
          <IonHeader className="ion-no-border">
            <IonToolbar style={{ '--background': '#16161c' }}>
              <IonTitle style={{ fontSize: '16px' }}>{selectedItem?.title}</IonTitle>
              <IonButtons slot="end"><IonButton onClick={() => setSelectedItem(null)} color="light"><IonIcon icon={closeOutline} size="large" /></IonButton></IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding" style={{ '--background': '#16161c' }}>
            {isFetchingDetails ? (
              <div style={{ textAlign: 'center', marginTop: '50px' }}><IonSpinner name="crescent" color="primary" /><p style={{ color: '#888' }}>Extracting data from satellite...</p></div>
            ) : (() => {
              const modalCtxParts = selectedItem?.weather_context?.split(' | ') || [];
              const modalWeatherTxt = modalCtxParts[0] || 'Unknown';
              const modalTagsTxt = modalCtxParts.length > 1 && modalCtxParts[1] ? modalCtxParts[1].split(', ') : [];

              return (
                /* FIX: Padding bottom dinaikkan jadi 80px agar tombol di bawah tidak tersangkut tepi layar */
                <div style={{ paddingBottom: '80px' }}>
                  {/* Opt: Tambah loading lazy pada modal image */}
                  <img src={selectedItem?.image_url} alt="Poster" loading="lazy" style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '15px', marginBottom: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
                  
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <IonBadge color={getBadgeColor(selectedItem?.media_type || '')}>{selectedItem?.media_type.toUpperCase()}</IonBadge>
                    <IonBadge color="dark" style={{ border: '1px solid #333' }}>Weather: {modalWeatherTxt.toUpperCase()}</IonBadge>
                    
                    {itemDetails?.creator && (
                      <IonBadge color="tertiary" style={{ border: '1px solid #333', display: 'flex', alignItems: 'center' }}>
                        <IonIcon icon={businessOutline} style={{marginRight: '4px'}}/> 
                        {itemDetails.creator}
                      </IonBadge>
                    )}
                  </div>
                  
                  {modalTagsTxt.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '15px' }}>
                      {modalTagsTxt.map((tag, idx) => (
                        <IonBadge key={idx} className="genre-badge">{tag}</IonBadge>
                      ))}
                    </div>
                  )}

                  <h2 style={{ marginBottom: '10px', color: '#fff', fontWeight: 'bold' }}>Synopsis</h2>
                  <p style={{ lineHeight: '1.7', fontSize: '15px', textAlign: 'justify', color: '#ccc' }}>{itemDetails?.text}</p>

                  {itemDetails?.url && (
                    <IonButton 
                      expand="block" 
                      color="danger" 
                      href={itemDetails.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ marginTop: '25px', '--border-radius': '12px', height: '50px', fontWeight: 'bold', letterSpacing: '1px' }}
                    >
                      <IonIcon icon={selectedItem?.media_type === 'anime' ? playCircleOutline : globeOutline} slot="start" />
                      {selectedItem?.media_type === 'anime' ? 'WATCH TRAILER' : 'VISIT WEBSITE'}
                    </IonButton>
                  )}
                </div>
              );
            })()}
          </IonContent>
        </IonModal>

        {/* --- MODAL PENGATURAN --- */}
        <IonModal isOpen={showSettings} onDidDismiss={closeSettingsModal}>
          <IonHeader className="ion-no-border">
            <IonToolbar style={{ '--background': '#0d0d12' }}>
              <IonButtons slot="start">
                <IonButton onClick={closeSettingsModal} color="medium">
                  <IonIcon icon={closeOutline} slot="start" /> Close
                </IonButton>
              </IonButtons>
              <IonTitle style={{ color: '#fff', fontWeight: 'bold' }}>Profile Setting</IonTitle>
              <IonButtons slot="end">
                {isUploading ? (
                  <IonSpinner name="crescent" color="primary" style={{ marginRight: '15px' }} />
                ) : (
                  <IonButton onClick={handleUpdateProfile} color="primary" strong={true}>
                    <IonIcon icon={checkmarkOutline} slot="start" /> Save
                  </IonButton>
                )}
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          
          <IonContent className="ion-padding" style={{ '--background': 'radial-gradient(circle at top, #1a1a2e 0%, #0d0d12 100%)' }}>
            <div style={{ textAlign: 'center', marginTop: '40px', padding: '0 20px' }}>
              
              <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto 40px', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                <IonAvatar style={{ width: '100%', height: '100%', border: '3px solid #00d2ff', boxShadow: '0 0 30px rgba(0, 210, 255, 0.4)' }}>
                  <img src={profilePreview || currentAvatarUrl} alt="Profile" loading="lazy" style={{ objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }} />
                </IonAvatar>
                <div style={{ position: 'absolute', bottom: '0', right: '5px', backgroundColor: '#3a7bd5', borderRadius: '50%', padding: '10px', display: 'flex', border: '3px solid #0d0d12' }}>
                  <IonIcon icon={cameraOutline} style={{ color: '#fff', fontSize: '22px' }} />
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
              </div>

              <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                <IonInput 
                  className="modern-input"
                  mode="md"
                  fill="outline"
                  label="New Username"
                  labelPlacement="floating"
                  type="text" 
                  value={newUsername} 
                  onIonInput={e => setNewUsername(e.detail.value as string)} 
                  minlength={3}
                />
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', marginBottom: '40px' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Registered Account</p>
                <p style={{ margin: '0', fontSize: '15px', color: '#fff' }}>{session?.user?.email}</p>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px' }}>
                <IonButton 
                  expand="block" 
                  color="danger" 
                  fill="outline" 
                  style={{ '--border-radius': '12px', height: '50px', borderWidth: '2px' }}
                  onClick={async () => { closeSettingsModal(); onLogout(); }}
                >
                  <IonIcon icon={logOutOutline} slot="start" /> LOGOUT FROM ATMOSFERA
                </IonButton>
              </div>

            </div>
          </IonContent>
        </IonModal>

      </IonContent>
    </>
  );
};

export default Profile;