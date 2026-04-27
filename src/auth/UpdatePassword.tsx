import { useState } from 'react';
import { IonContent, IonPage, IonInput, IonButton, useIonToast, IonSpinner, IonIcon } from '@ionic/react';
import { lockClosedOutline, checkmarkDoneOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { supabase } from '../supabaseClient';
import './Auth.css';

const UpdatePassword = ({ onPasswordUpdated }: { onPasswordUpdated: () => void }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [presentToast] = useIonToast();

  const handleUpdate = async () => {
    if (password.length < 6) {
      presentToast({ message: 'Password must be at least 6 characters', duration: 3000, color: 'warning', position: 'top' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: password });
      if (error) throw error;
      presentToast({ message: 'Password updated successfully!', duration: 3000, color: 'success', position: 'top' });
      onPasswordUpdated(); 
    } catch (error: any) {
      presentToast({ message: `Failed: ${error.message}`, duration: 3000, color: 'danger', position: 'top' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage className="auth-page">
      <IonContent fullscreen>
        <div className="auth-container">
          <div className="auth-diagonal-slash"></div>
          <div className="auth-glow-orb"></div>

          <div className="auth-card-modern">
            <div className="auth-header-left">
              <h1 className="auth-logo-text">Update <span className="auth-logo-highlight">Password</span></h1>
              <p className="auth-subtitle">Secure your account with a new password.</p>
            </div>

            <div className="input-group">
              <IonIcon icon={lockClosedOutline} className="input-icon" />
              <IonInput 
                className="minimal-input"
                type={showPassword ? 'text' : 'password'} 
                placeholder="Enter New Password"
                value={password} 
                onIonInput={e => setPassword(e.detail.value as string)} 
              />
              <IonIcon 
                icon={showPassword ? eyeOffOutline : eyeOutline} 
                className="password-toggle-icon" 
                onClick={() => setShowPassword(!showPassword)} 
              />
            </div>

            <IonButton className="auth-btn-pill" expand="block" onClick={handleUpdate} disabled={loading}>
              {loading ? <IonSpinner name="crescent" /> : (
                <>
                  SAVE PASSWORD <IonIcon icon={checkmarkDoneOutline} slot="end" />
                </>
              )}
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default UpdatePassword;