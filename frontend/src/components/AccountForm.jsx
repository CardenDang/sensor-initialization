import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Moon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
export default function AccountForm({register=false}) {
  const {user,loading,authenticate,configured,serviceError} = useAuth();
  const navigate=useNavigate();
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');
  if (loading) return <main className="account-page"><p role="status">Checking your session…</p></main>;
  if (user) return <Navigate to="/" replace/>;
  async function submit(event) {
    event.preventDefault();
    const values=Object.fromEntries(new FormData(event.currentTarget));
    if (register && values.password!==values.confirm) {setError('Passwords do not match.');return;}
    setBusy(true);setError('');setNotice('');
    try {
      const result=await authenticate(register?'register':'login',{name:values.name,email:values.email,password:values.password});
      if(result.confirmationRequired) setNotice('Check your email for a confirmation link. After confirming, sign in to your account.');
      else navigate('/',{replace:true});
    }
    catch (err) {setError(err.message);}
    finally {setBusy(false);}
  }
  return <main className="account-page"><section className="account-card"><Link to="/" className="account-brand"><Moon size={24}/> Sleep Monitor</Link><h1>{register?'Create your account':'Welcome back'}</h1><p>{register?'Create a personal profile for your sleep monitoring.':'Sign in to your sleep monitoring account.'}</p>
    {serviceError && <p className="account-error" role="alert">{serviceError}</p>}
    {notice && <p className="account-notice" role="status">{notice}</p>}
    <form onSubmit={submit}>
      {register && <label>Full name<input name="name" autoComplete="name" required maxLength={80}/></label>}
      <label>Email<input type="email" name="email" autoComplete="email" required maxLength={254}/></label>
      <label>Password<input type="password" name="password" autoComplete={register?'new-password':'current-password'} required minLength={register?12:1} maxLength={128} aria-describedby={register?'password-help':undefined}/></label>
      {register && <><small id="password-help">Use 12–128 characters.</small><label>Confirm password<input type="password" name="confirm" autoComplete="new-password" required minLength={12} maxLength={128}/></label></>}
      {error && <p className="account-error" role="alert">{error}</p>}
      <button className="account-primary" disabled={busy || !configured}>{busy?'Please wait…':register?'Create account':'Sign in'}</button>
    </form>
    <p className="account-switch">{register?'Already have an account?':'New to Sleep Monitor?'} <Link to={register?'/login':'/register'}>{register?'Sign in':'Create account'}</Link></p>
    <p className="account-note">Accounts and personal sleep records are stored in Supabase. Overview and ML charts currently show sample data.</p>
    <Link className="back-to-preview" to="/">Back to preview</Link>
  </section></main>;
}
