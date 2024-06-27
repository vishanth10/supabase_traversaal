// src/components/SignUp.js
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const SignUp = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) {
        console.error('Error signing up:', error);
        setMessage(`Error: ${error.message}`);
      } else {
        console.log('User signed up:', data);
        setMessage('Check your email for the confirmation link.');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setMessage('An unexpected error occurred. Please try again.');
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      }, {
        redirectTo: 'https://bkqotxkglmgpnrjmiwmc.supabase.co/auth/v1/callback'
      });

      if (error) {
        console.error('Error signing up with Google:', error);
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('Redirecting to Google sign-in...');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setMessage('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div>
      <h2>Sign Up</h2>
      <form onSubmit={handleSignUp}>
        <input
          type="text"
          placeholder="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Sign Up</button>
      </form>
      <hr />
      <button onClick={handleGoogleSignUp}>Sign Up with Google</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default SignUp;


