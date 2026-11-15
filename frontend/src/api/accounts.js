// Client injection keeps the account behavior independently testable.
export function createAccountService(client) {
  function required() {
    if (!client) throw new Error('Supabase is not configured. Add your project URL and publishable key to frontend/.env.local and restart npm run dev.');
    return client;
  }
  return {
    async authenticate(action,values,redirectTo) {
      const auth=required().auth;
      let result;
      if(action==='register') {
        const name=values.name?.trim();
        if(!name || name.length>80) throw new Error('Enter your name (up to 80 characters).');
        if(!values.password || values.password.length<12 || values.password.length>128) throw new Error('Use a password of 12–128 characters.');
        result=await auth.signUp({email:values.email.trim().toLowerCase(),password:values.password,options:{data:{full_name:name},emailRedirectTo:redirectTo}});
      } else if(action==='login') {
        result=await auth.signInWithPassword({email:values.email.trim().toLowerCase(),password:values.password});
      } else throw new Error('Unknown account action.');
      if(result.error) throw result.error;
      return {session:result.data.session,confirmationRequired:action==='register'&&!result.data.session};
    },
    async logout() { const {error}=await required().auth.signOut(); if(error) throw error; },
  };
}
export function accountUser(user) {
  if(!user) return null;
  return {id:user.id,email:user.email,name:user.user_metadata?.full_name || user.email?.split('@')[0] || 'Sleeper'};
}
