import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import './Dashboard.css';  // Ensure you have the corresponding CSS file for styling

const BASE_URL = 'http://localhost:3200';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [service, setService] = useState('GOOGLE_DRIVE');
  const [oauthUrl, setOauthUrl] = useState('');
  const [dataSources, setDataSources] = useState([]);
  const [files, setFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
        return;
      }
      setUser(user);
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
      return;
    }
    window.location.href = '/login';  // Redirect to login page after logout
  };

  const makePostRequest = async (url, payload, setState) => {
    setLoading(true);
    try {
      const response = await axios.post(url, payload);
      setState(response.data);
    } catch (error) {
      console.error(`Error during ${url} request`, error);
      alert(`Failed to complete the request. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetOauthUrl = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/get_oauth_url`, { service, customer_id: user.id });
      setOauthUrl(response.data.oauth_url);
    } catch (error) {
      console.error('Error fetching OAuth URL', error);
    }
  };

  useEffect(() => {
    if (oauthUrl) {
      window.open(oauthUrl, '_blank');
    }
  }, [oauthUrl]);

  const handleListDataSources = () => makePostRequest(`${BASE_URL}/list_user_data_sources`, { customer_id: user.id }, data => setDataSources(data.data_sources));

  const handleListFiles = () => makePostRequest(`${BASE_URL}/list_files`, { service, customer_id: user.id }, data => setFiles(data.files));

  const handleListUploadedFiles = () => makePostRequest(`${BASE_URL}/list_uploaded_files`, { service, customer_id: user.id }, data => setUploadedFiles(data.uploaded_files));

  const handleSearchDocuments = () => {
    const fileIds = uploadedFiles.map(file => file.id);
    makePostRequest(`${BASE_URL}/search_documents`, { query, file_ids: fileIds, customer_id: user.id }, data => setSearchResults(data.search_results));
  };

  if (!user) {
    return <div>Loading...</div>;  // Display a loading message until the user data is fetched
  }

  return (
    <div className="container">
      <h1>Welcome, {user.email}</h1>
      <button onClick={handleLogout}>Logout</button>
      <div>
        <label>Select Data Source:</label>
        <select value={service} onChange={(e) => setService(e.target.value)}>
          <option value="GOOGLE_DRIVE">Google Drive</option>
          <option value="DROPBOX">Dropbox</option>
          <option value="NOTION">Notion</option>
          <option value="ONE_DRIVE">OneDrive</option>
        </select>
        <button onClick={handleGetOauthUrl} disabled={loading}>Connect</button>
      </div>
      <div>
        <button onClick={handleListDataSources} disabled={loading}>List Data Sources</button>
        <ul>
          {dataSources.map(ds => (
            <li key={ds.id}>
              ID: {ds.id}, External ID: {ds.external_id}, Type: {ds.type}, Sync Status: {ds.sync_status},
              Created At: {ds.created_at}, Updated At: {ds.updated_at}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <button onClick={handleListFiles} disabled={loading}>List Files</button>
        <ul>
          {files.map(file => (
            <li key={file.name}>{file.name}</li>
          ))}
        </ul>
      </div>
      <div>
        <button onClick={handleListUploadedFiles} disabled={loading}>Show Uploaded Files</button>
        <ul>
          {uploadedFiles.map(file => (
            <li key={file.id}>
              ID: {file.id}, Organization Supplied User ID: {file.organization_supplied_user_id},
              Organization User Data Source ID: {file.organization_user_data_source_id},
              External URL: <a href={file.external_url} target="_blank" rel="noopener noreferrer">{file.external_url}</a>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your search query"
        />
        <button onClick={handleSearchDocuments} disabled={loading}>Search</button>
        <ul>
          {searchResults.map((result, index) => (
            <li key={index}>
              Source: {result.source}, Source URL: <a href={result.source_url} target="_blank" rel="noopener noreferrer">{result.source_url}</a>,
              Source Type: {result.source_type}, Presigned URL: <a href={result.presigned_url} target="_blank" rel="noopener noreferrer">{result.presigned_url}</a>,
              Tags: {JSON.stringify(result.tags)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
