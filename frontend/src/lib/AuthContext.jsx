import { useEffect, useState } from 'react';
import { createAccountService, accountUser } from '@/api/accounts';
import { supabase, supabaseConfigured, setupMessage } from '@/api/supabase';
import { AuthContext } from './auth-context';
const accounts=createAccountService(supabase);
export function AuthProvider({children}) {
  const [user,setUser]=useState(null);
  const [loading,setLoading]=useState(supabaseConfigured);
  const [serviceError,setServiceError]=useState(supabaseConfigured?'':setupMessage);
  useEffect(()=>{
    if(!supabase) return;
    let active=true;
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
      if(active) {setUser(accountUser(session?.user));setLoading(false);}
    });
    supabase.auth.getSession().then(({error})=>{if(active && error) {setServiceError(error.message);setLoading(false);}}).catch(error=>{if(active) {setServiceError(error.message);setLoading(false);}});
    return ()=>{active=false;subscription.unsubscribe();};
  },[]);
  async function authenticate(action,values) {
    const result=await accounts.authenticate(action,values,`${window.location.origin}/login`);
    setUser(accountUser(result.session?.user));setServiceError('');
    return result;
  }
  async function logout() {await accounts.logout();setUser(null);}
  return <AuthContext.Provider value={{user,loading,serviceError,configured:supabaseConfigured,authenticate,logout}}>{children}</AuthContext.Provider>;
}
