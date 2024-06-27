// src/components/Login.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    return () => {
      if (authListener && typeof authListener.unsubscribe === 'function') {
        authListener.unsubscribe();
      }
    };
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setMessage('An unexpected error occurred. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('Redirecting to Google sign-in...');
      }
    } catch (error) {
      setMessage('An unexpected error occurred. Please try again.');
    }
  };
 
  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
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
        <button type="submit">Login</button>
      </form>
      <hr />
      <button onClick={handleGoogleLogin}>Login with Google</button>
      {message && <p>{message}</p>}
      <button onClick={() => navigate('/signup')}>Sign Up</button>
    </div>
  );
};

export default Login;
