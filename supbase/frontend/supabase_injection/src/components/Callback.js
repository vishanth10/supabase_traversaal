// // src/components/Callback.js
// import React, { useEffect } from 'react';
// import { useHistory } from 'react-router-dom';
// import { supabase } from '../supabaseClient';

// const Callback = () => {
//   const history = useHistory();

//   useEffect(() => {
//     const handleOAuthCallback = async () => {
//       const { error } = await supabase.auth.handleAuthResponse(window.location.hash);
//       if (error) {
//         console.error('Error handling OAuth callback:', error.message);
//       } else {
//         history.push('/dashboard');
//       }
//     };

//     handleOAuthCallback();
//   }, [history]);

//   return <div>Loading...</div>;
// };

// export default Callback;
