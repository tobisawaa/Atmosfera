import { useState } from 'react';
import { IonContent, IonPage, IonInput, IonButton, useIonToast, IonSpinner, IonIcon } from '@ionic/react';
import { mailOutline, chevronForwardOutline } from 'ionicons/icons';
import { supabase } from '../supabaseClient';
import './Auth.css';

const ForgotPassword = ({ onSwitchView }: { onSwitchView: (view: 'login' | 'register' | 'forgot_password') => void }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [presentToast] = useIonToast();

  const handleReset = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (error) throw error;
      presentToast({ message: 'Password reset link has been sent to your email.', duration: 4000, color: 'success', position: 'top' });
      onSwitchView('login');
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
              <h1 className="auth-logo-text">Reset <span className="auth-logo-highlight">Password</span></h1>
              <p className="auth-subtitle">Enter your email to receive recovery link.</p>
            </div>

            <div className="input-group">
              <IonIcon icon={mailOutline} className="input-icon" />
              <IonInput 
                className="minimal-input"
                type="email" 
                placeholder="Registered Email"
                value={email} 
                onIonInput={e => setEmail(e.detail.value as string)} 
              />
            </div>

            <IonButton className="auth-btn-pill" expand="block" onClick={handleReset} disabled={loading}>
              {loading ? <IonSpinner name="crescent" /> : (
                <>
                  SEND LINK <IonIcon icon={chevronForwardOutline} slot="end" />
                </>
              )}
            </IonButton>

            <div className="auth-footer-flex" style={{ justifyContent: 'center' }}>
              <span className="text-muted">Remember your password? <span className="auth-link" onClick={() => onSwitchView('login')}>Sign In</span></span>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ForgotPassword;