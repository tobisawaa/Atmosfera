import { useState } from 'react';
import { IonContent, IonPage, IonInput, IonButton, useIonToast, IonSpinner, IonIcon } from '@ionic/react';
import { mailOutline, lockClosedOutline, personOutline, chevronForwardOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { supabase } from '../supabaseClient';
import './Auth.css';

const Register = ({ onSwitchView }: { onSwitchView: (view: 'login' | 'register' | 'forgot_password') => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [presentToast] = useIonToast();

  const handleRegister = async () => {
    if (password.length < 6) {
      presentToast({ message: 'Password must be at least 6 characters', duration: 3000, color: 'warning', position: 'top' });
      return;
    }
    setLoading(true);
    try {
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username || 'User')}&background=random&color=fff`;
      const { error } = await supabase.auth.signUp({
        email: email.trim(), password, options: { data: { username: username || 'User Baru', avatar_url: avatarUrl } }
      });
      if (error) throw error;
      presentToast({ message: 'Registration successful! Welcome.', duration: 3000, color: 'success', position: 'top' });
    } catch (error: any) {
      presentToast({ message: error.message, duration: 3000, color: 'danger', position: 'top' });
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
              <h1 className="auth-logo-text">Create <span className="auth-logo-highlight">Account</span></h1>
              <p className="auth-subtitle">Join us and start discovering vibes.</p>
            </div>

            <div className="input-group">
              <IonIcon icon={personOutline} className="input-icon" />
              <IonInput 
                className="minimal-input"
                type="text" 
                placeholder="Username"
                value={username} 
                onIonInput={e => setUsername(e.detail.value as string)} 
              />
            </div>

            <div className="input-group">
              <IonIcon icon={mailOutline} className="input-icon" />
              <IonInput 
                className="minimal-input"
                type="email" 
                placeholder="Email Address"
                value={email} 
                onIonInput={e => setEmail(e.detail.value as string)} 
              />
            </div>

            <div className="input-group">
              <IonIcon icon={lockClosedOutline} className="input-icon" />
              <IonInput 
                className="minimal-input"
                type={showPassword ? 'text' : 'password'} 
                placeholder="Password"
                value={password} 
                onIonInput={e => setPassword(e.detail.value as string)} 
              />
              <IonIcon 
                icon={showPassword ? eyeOffOutline : eyeOutline} 
                className="password-toggle-icon" 
                onClick={() => setShowPassword(!showPassword)} 
              />
            </div>

            <IonButton className="auth-btn-pill" expand="block" onClick={handleRegister} disabled={loading}>
              {loading ? <IonSpinner name="crescent" /> : (
                <>
                  REGISTER NOW <IonIcon icon={chevronForwardOutline} slot="end" />
                </>
              )}
            </IonButton>

            <div className="auth-footer-flex" style={{ justifyContent: 'center' }}>
              <span className="text-muted">Already have an account? <span className="auth-link" onClick={() => onSwitchView('login')}>Sign In</span></span>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Register;  