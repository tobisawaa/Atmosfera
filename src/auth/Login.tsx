import { useState } from 'react';
import { IonContent, IonPage, IonInput, useIonToast, IonSpinner, IonIcon } from '@ionic/react';
import { mailOutline, lockClosedOutline, arrowForwardOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { supabase } from '../supabaseClient';
import './Auth.css';

const Login = ({ onSwitchView }: { onSwitchView: (view: 'login' | 'register' | 'forgot_password') => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [presentToast] = useIonToast();

  const handleLogin = async () => {
    if (!email || !password) {
      presentToast({ message: 'Email and Password cannot be empty!', duration: 2000, color: 'warning', position: 'top' });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: password.trim() });
      if (error) throw error;
      presentToast({ message: 'Login Successful!', duration: 2000, color: 'success', position: 'top' });
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
              <h1 className="auth-logo-text">Atmos<span className="auth-logo-highlight">fera</span></h1>
              <p className="auth-subtitle">Get recommendations based on Today's Weather</p>
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

            {/* --- TOMBOL DIAMOND PANAH BESAR --- */}
            <div className="auth-btn-diamond-wrapper">
              <button className="auth-btn-diamond" onClick={handleLogin} disabled={loading}>
                {loading ? (
                  <IonSpinner name="crescent" className="auth-btn-diamond-icon" />
                ) : (
                  <IonIcon icon={arrowForwardOutline} className="auth-btn-diamond-icon" />
                )}
              </button>
            </div>

            <div className="auth-footer-flex">
              <span className="text-muted">New user? <span className="auth-link" onClick={() => onSwitchView('register')}>Sign Up</span></span>
              <span className="auth-link" onClick={() => onSwitchView('forgot_password')}>Forgot Password?</span>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;