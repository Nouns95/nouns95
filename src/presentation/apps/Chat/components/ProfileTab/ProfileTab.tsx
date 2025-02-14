import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useProfile } from '../../hooks/feature/useProfile';
import { ProfileService } from '../../services/profileService';
import { StreamService } from '../../services/streamService';
import styles from './ProfileTab.module.css';

interface ProfileTabProps {
  profileService: ProfileService;
  stream: StreamService | null;
  isStreamConnected: boolean;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  profileService,
  stream,
  isStreamConnected
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    about: '',
    profilePicture: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    profile,
    isLoading,
    error,
    updateProfile,
    reloadProfile
  } = useProfile(profileService, stream, isStreamConnected);

  const handleEditClick = () => {
    setFormData({
      name: profile?.name || '',
      about: profile?.about || '',
      profilePicture: profile?.profilePicture || ''
    });
    setIsEditing(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Clear URL input when file is selected
      setFormData(prev => ({ ...prev, profilePicture: '' }));
    }
  };

  const handleUrlInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(null); // Clear selected file when URL is input
    handleInputChange(e);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let pictureUrl = formData.profilePicture;
    
    if (selectedFile) {
      try {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
        pictureUrl = base64;
      } catch (error) {
        console.error('Error converting file to base64:', error);
        return;
      }
    }

    await updateProfile({
      name: formData.name,
      desc: formData.about,
      picture: pictureUrl
    });
    
    setIsEditing(false);
    setSelectedFile(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      name: '',
      about: '',
      profilePicture: ''
    });
    setSelectedFile(null);
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading profile...</div>;
  }

  if (error) {
    return (
      <div className={styles.error}>
        Error: {error.message}
        <button 
          onClick={reloadProfile}
          className={styles.win95Button}
          style={{ marginLeft: '8px' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.profileTab}>
      <div className={styles.content}>
        <div className={styles.previewContent}>
          <Image
            src={profile?.profilePicture || '/default-avatar.png'}
            alt="Profile"
            className={styles.previewImage}
            width={96}
            height={96}
          />
        </div>

        <div className={styles.settingsSection}>
          <div className={styles.sectionTitle}>Settings</div>
          <div className={styles.settingsContent}>
            {!isEditing ? (
              <>
                <div className={styles.settingsGroup}>
                  <label>Name:</label>
                  <span>{profile?.name || 'Unnamed User'}</span>
                </div>
                <div className={styles.settingsGroup}>
                  <label>About:</label>
                  <span>{profile?.about || 'No description provided'}</span>
                </div>
                <div className={styles.settingsGroup}>
                  <label>Address:</label>
                  <span className={styles.address}>
                    {profile?.did ? profile.did.replace('eip155:', '') : 'Not available'}
                  </span>
                </div>
                <button
                  onClick={handleEditClick}
                  className={styles.win95Button}
                >
                  Change...
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className={styles.settingsGroup}>
                  <label htmlFor="name">Name:</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className={styles.settingsGroup}>
                  <label htmlFor="about">About:</label>
                  <textarea
                    id="about"
                    name="about"
                    value={formData.about}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
                <div className={styles.settingsGroup}>
                  <label>Picture:</label>
                  <div className={styles.pictureInputs}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={styles.win95Button}
                    >
                      Browse...
                    </button>
                    <span className={styles.selectedFileName}>
                      {selectedFile?.name || 'No file selected'}
                    </span>
                  </div>
                </div>
                <div className={styles.settingsGroup}>
                  <label htmlFor="profilePicture">Or URL:</label>
                  <input
                    type="text"
                    id="profilePicture"
                    name="profilePicture"
                    value={formData.profilePicture}
                    onChange={handleUrlInput}
                    placeholder="Enter image URL"
                    disabled={!!selectedFile}
                  />
                </div>
                <div className={styles.buttonGroup}>
                  <button type="submit" className={styles.win95Button}>
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className={styles.win95Button}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 