import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { adminApi } from '../../services/api';
import './adminProfile.css';

const Profile = ({ user }) => {
  // ============================================
  // STATE DECLARATIONS
  // ============================================
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [stream, setStream] = useState(null);
  const [tempImage, setTempImage] = useState(null);
  const [crop, setCrop] = useState({
    unit: '%',
    width: 80,
    height: 80,
    x: 10,
    y: 10,
    aspect: 1
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  
  const [profileHistory, setProfileHistory] = useState([]);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    username: '',
    phone: '',
    alternatePhone: '',
    profilePhoto: null,
    department: '',
    position: '',
    adminId: '',
    joinDate: '',
    bloodGroup: '',
    dateOfBirth: '',
    address: '',
    skills: [],
    languages: [],
    socialLinks: {
      linkedin: '',
      github: '',
      twitter: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    permissions: [],
    lastLogin: ''
  });

  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  // ============================================
  // LOAD PROFILE HISTORY FROM LOCALSTORAGE
  // ============================================
  const loadHistory = useCallback((currentProfileData) => {
    try {
      const savedHistory = localStorage.getItem('adminProfileHistory');
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        setProfileHistory(parsed);
        console.log('📜 History loaded:', parsed.length, 'entries');
        return parsed;
      } else {
        // Initialize with current profile only if profileData is not empty
        if (currentProfileData && currentProfileData.fullName) {
          const initialHistory = [{
            id: Date.now(),
            timestamp: new Date().toISOString(),
            data: { ...currentProfileData },
            action: 'PROFILE_CREATED',
            changedFields: []
          }];
          setProfileHistory(initialHistory);
          localStorage.setItem('adminProfileHistory', JSON.stringify(initialHistory));
          return initialHistory;
        }
        return [];
      }
    } catch (err) {
      console.error('Error loading history:', err);
      return [];
    }
  }, []);

  // ============================================
  // SAVE TO HISTORY
  // ============================================
  const saveToHistory = useCallback((action, changedData = null) => {
    try {
      const historyEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        data: changedData || { ...profileData },
        action: action,
        changedFields: changedData ? Object.keys(changedData) : []
      };
      
      const updatedHistory = [historyEntry, ...profileHistory];
      setProfileHistory(updatedHistory);
      localStorage.setItem('adminProfileHistory', JSON.stringify(updatedHistory));
      console.log('✅ History saved:', action, '| Entries:', updatedHistory.length);
      return updatedHistory;
    } catch (err) {
      console.error('Error saving history:', err);
      return profileHistory;
    }
  }, [profileHistory, profileData]);

  // ============================================
  // LOAD PROFILE FROM BACKEND (FIXED)
  // ============================================
  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📡 Fetching admin profile...');
      const response = await adminApi.getProfile();
      console.log('📡 Response:', response.data);
      
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        const newProfileData = {
          fullName: data.fullName || data.name || '',
          email: data.email || '',
          username: data.username || data.fullName || data.name || '',
          phone: data.phone || '',
          alternatePhone: data.alternatePhone || '',
          profilePhoto: data.profilePhoto || data.photo || null,
          department: data.department || 'Administration',
          position: data.position || 'System Administrator',
          adminId: data.employeeId || data.id || 'ADM001',
          joinDate: data.joinDate || new Date().toLocaleDateString(),
          bloodGroup: data.bloodGroup || '',
          dateOfBirth: data.dateOfBirth || '',
          address: data.address || '',
          skills: data.skills || ['System Administration', 'Security', 'Leadership'],
          languages: data.languages || ['English'],
          socialLinks: {
            linkedin: data.socialLinks?.linkedin || '',
            github: data.socialLinks?.github || '',
            twitter: data.socialLinks?.twitter || ''
          },
          emergencyContact: {
            name: data.emergencyContact?.name || '',
            relationship: data.emergencyContact?.relationship || '',
            phone: data.emergencyContact?.phone || ''
          },
          permissions: data.permissions || ['Full Access'],
          lastLogin: data.lastLogin || new Date().toLocaleString()
        };
        
        // Set profile data first
        setProfileData(newProfileData);
        
        // Set photo preview
        if (newProfileData.profilePhoto) {
          setPhotoPreview(newProfileData.profilePhoto);
          localStorage.setItem('adminProfilePhoto', newProfileData.profilePhoto);
        }
        
        // ✅ Load history AFTER profile data is set (pass the data directly)
        const history = loadHistory(newProfileData);
        console.log('📜 History loaded:', history.length, 'entries');
        
        return newProfileData;
      } else {
        console.warn('No profile data found');
        setError('No profile data found');
      }
    } catch (err) {
      console.error('❌ Error loading profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [loadHistory]);

  // ============================================
  // SAVE PROFILE TO BACKEND
  // ============================================
  const saveProfileToBackend = async (data) => {
    try {
      console.log('📡 Saving admin profile...');
      const response = await adminApi.updateProfile(data);
      console.log('📡 Response:', response.data);
      
      if (response.data.success) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        currentUser.fullName = data.fullName;
        currentUser.username = data.username;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        window.dispatchEvent(new Event('profileUpdated'));
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to save profile');
      }
    } catch (err) {
      console.error('❌ Error saving profile:', err);
      alert(`Failed to save profile: ${err.message}`);
      return false;
    }
  };

  // ============================================
  // SAVE PHOTO TO BACKEND
  // ============================================
  const savePhotoToBackend = async (photoData) => {
    try {
      console.log('📡 Saving profile photo...');
      const response = await adminApi.uploadProfilePhoto(photoData);
      console.log('📡 Response:', response.data);
      
      if (response.data.success) {
        localStorage.setItem('adminProfilePhoto', photoData);
        window.dispatchEvent(new Event('profilePhotoUpdated'));
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to save photo');
      }
    } catch (err) {
      console.error('❌ Error saving photo:', err);
      alert(`Failed to save photo: ${err.message}`);
      return false;
    }
  };

  // ============================================
  // LOAD SAVED PHOTO FROM LOCALSTORAGE
  // ============================================
  useEffect(() => {
    const savedPhoto = localStorage.getItem('adminProfilePhoto');
    if (savedPhoto) {
      setPhotoPreview(savedPhoto);
      setProfileData(prev => ({ ...prev, profilePhoto: savedPhoto }));
    }
  }, []);

  // ============================================
  // LOAD PROFILE ON MOUNT (ONLY ONCE)
  // ============================================
  useEffect(() => {
    let isMounted = true;
    
    const fetchProfile = async () => {
      if (isMounted) {
        await loadProfile();
      }
    };
    
    fetchProfile();
    
    return () => {
      isMounted = false;
    };
    // ✅ Empty dependency array - only runs once on mount
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================
  // HANDLE CHANGE
  // ============================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // ============================================
  // PHOTO HANDLING
  // ============================================
  const handlePhotoClick = () => setShowPhotoOptions(true);

  const handleUploadPhoto = () => {
    setShowPhotoOptions(false);
    fileInputRef.current.click();
  };

  const handleTakePhoto = async () => {
    setShowPhotoOptions(false);
    setShowCamera(true);
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Unable to access camera. Please make sure you have granted camera permission.");
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const photoData = canvas.toDataURL('image/jpeg');
      setPhotoPreview(photoData);
      setProfileData(prev => ({ ...prev, profilePhoto: photoData }));
      
      await savePhotoToBackend(photoData);
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      setShowCamera(false);
      alert('✅ Photo captured successfully!');
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const photoData = reader.result;
        setTempImage(photoData);
        setShowCrop(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImg = async () => {
    if (!completedCrop || !imgRef.current) {
      alert('Please select a crop area first');
      return;
    }
    
    try {
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;
      const ctx = canvas.getContext('2d');
      
      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );
      
      const croppedImage = canvas.toDataURL('image/jpeg');
      setPhotoPreview(croppedImage);
      setProfileData(prev => ({ ...prev, profilePhoto: croppedImage }));
      
      await savePhotoToBackend(croppedImage);
      
      setShowCrop(false);
      setTempImage(null);
      setCompletedCrop(null);
      alert('✅ Photo cropped successfully!');
    } catch (err) {
      console.error('Error cropping image:', err);
      alert('Failed to crop image. Please try again.');
    }
  };

  const cancelCrop = () => {
    setShowCrop(false);
    setTempImage(null);
    setCompletedCrop(null);
  };

  // ============================================
  // SKILLS & LANGUAGES
  // ============================================
  const addSkill = () => {
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      const updatedSkills = [...profileData.skills, newSkill.trim()];
      setProfileData({ ...profileData, skills: updatedSkills });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    const updatedSkills = profileData.skills.filter(skill => skill !== skillToRemove);
    setProfileData({ ...profileData, skills: updatedSkills });
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !profileData.languages.includes(newLanguage.trim())) {
      const updatedLanguages = [...profileData.languages, newLanguage.trim()];
      setProfileData({ ...profileData, languages: updatedLanguages });
      setNewLanguage('');
    }
  };

  const removeLanguage = (languageToRemove) => {
    const updatedLanguages = profileData.languages.filter(lang => lang !== languageToRemove);
    setProfileData({ ...profileData, languages: updatedLanguages });
  };

  // ============================================
  // SAVE PROFILE
  // ============================================
  const handleSave = async () => {
    const success = await saveProfileToBackend(profileData);
    
    if (success) {
      saveToHistory('PROFILE_UPDATED', profileData);
      setIsEditing(false);
      alert('✅ Profile updated successfully!');
      // ✅ Reload profile to get latest data
      await loadProfile();
    }
  };

  // ============================================
  // REVERT TO HISTORY
  // ============================================
  const revertToHistory = (historyEntry) => {
    if (window.confirm(`Revert to profile from ${new Date(historyEntry.timestamp).toLocaleString()}?`)) {
      setProfileData(historyEntry.data);
      if (historyEntry.data.profilePhoto) {
        setPhotoPreview(historyEntry.data.profilePhoto);
        localStorage.setItem('adminProfilePhoto', historyEntry.data.profilePhoto);
        savePhotoToBackend(historyEntry.data.profilePhoto);
      }
      
      saveToHistory('PROFILE_REVERTED', historyEntry.data);
      saveProfileToBackend(historyEntry.data);
      
      alert('✅ Profile reverted successfully!');
    }
  };

  // ============================================
  // CLEAR HISTORY
  // ============================================
  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all profile history? This cannot be undone.')) {
      setProfileHistory([]);
      localStorage.removeItem('adminProfileHistory');
      alert('✅ History cleared!');
    }
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getActionIcon = (action) => {
    switch(action) {
      case 'PROFILE_CREATED': return '🎉';
      case 'PROFILE_UPDATED': return '✏️';
      case 'PROFILE_REVERTED': return '↩️';
      default: return '📝';
    }
  };

  const tabs = [
    { id: 'personal', label: '👤 Personal' },
    { id: 'work', label: '💼 Work' },
    { id: 'skills', label: '🛠️ Skills' },
    { id: 'emergency', label: '🚨 Emergency' },
    { id: 'social', label: '🔗 Social' },
    { id: 'history', label: '📜 History' }
  ];

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="admin-profile-loading-container">
        <div className="admin-profile-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-profile-error-container">
        <div className="admin-profile-error-icon">⚠️</div>
        <h3>Failed to Load Profile</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="admin-profile-retry-btn">
          🔄 Retry
        </button>
      </div>
    );
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="admin-profile-container">
      <div className="admin-profile-card">
        {/* Profile Header with Photo */}
        <div className="admin-profile-header">
          <div className="admin-profile-photo-section">
            <div className="admin-profile-photo" onClick={handlePhotoClick}>
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="admin-profile-photo-img" />
              ) : (
                <div className="admin-profile-avatar">
                  {profileData.fullName?.charAt(0).toUpperCase() || 'A'}
                </div>
              )}
            </div>
          </div>
          <h3>{profileData.fullName || 'Administrator'}</h3>
       
          <p className="admin-profile-id-badge">🆔 Admin ID: {profileData.adminId}</p>
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleFileChange}
        />
        
        {/* Photo Options Modal */}
        {showPhotoOptions && (
          <div className="admin-profile-photo-options-modal" onClick={() => setShowPhotoOptions(false)}>
            <div className="admin-profile-photo-options-content" onClick={(e) => e.stopPropagation()}>
              <h4>📸 Choose Photo</h4>
              <button onClick={handleUploadPhoto} className="admin-profile-photo-option-btn">
                📁 Upload from Gallery
              </button>
              <button onClick={handleTakePhoto} className="admin-profile-photo-option-btn">
                📷 Take a Photo
              </button>
              <button onClick={() => setShowPhotoOptions(false)} className="admin-profile-photo-option-btn admin-profile-cancel">
                ❌ Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Camera Modal */}
        {showCamera && (
          <div className="admin-profile-camera-modal" onClick={closeCamera}>
            <div className="admin-profile-camera-content" onClick={(e) => e.stopPropagation()}>
              <h4>📸 Take a Photo</h4>
              <video ref={videoRef} autoPlay playsInline className="admin-profile-camera-video" />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div className="admin-profile-camera-buttons">
                <button onClick={capturePhoto} className="admin-profile-capture-btn">📸 Capture</button>
                <button onClick={closeCamera} className="admin-profile-close-camera-btn">❌ Cancel</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Crop Modal */}
        {showCrop && tempImage && (
          <div className="admin-profile-crop-modal" onClick={cancelCrop}>
            <div className="admin-profile-crop-content" onClick={(e) => e.stopPropagation()}>
              <h4>✂️ Crop Your Photo</h4>
              <div className="admin-profile-crop-container-wrapper">
                <ReactCrop
                  crop={crop}
                  onChange={(newCrop) => setCrop(newCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                >
                  <img
                    src={tempImage}
                    alt="Crop preview"
                    ref={imgRef}
                    className="admin-profile-crop-image"
                    style={{ maxWidth: '100%', maxHeight: '400px' }}
                  />
                </ReactCrop>
              </div>
              <div className="admin-profile-crop-buttons">
                <button onClick={cancelCrop} className="admin-profile-crop-cancel">❌ Cancel</button>
                <button onClick={getCroppedImg} className="admin-profile-crop-save">✅ Apply Crop</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="admin-profile-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`admin-profile-tab ${activeTab === tab.id ? 'admin-profile-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="admin-profile-body">
          {/* Personal Tab */}
          {activeTab === 'personal' && (
            <div className="admin-profile-tab-content">
              {!isEditing ? (
                <div className="admin-profile-info-section">
                  <div className="admin-profile-info-row"><label>Full Name:</label><span>{profileData.fullName || 'Not set'}</span></div>
                  <div className="admin-profile-info-row"><label>Username:</label><span>{profileData.username || 'Not set'}</span></div>
                  <div className="admin-profile-info-row"><label>Email:</label><span>{profileData.email || 'Not set'}</span></div>
                  <div className="admin-profile-info-row"><label>Phone:</label><span>{profileData.phone || 'Not set'}</span></div>
                  <div className="admin-profile-info-row"><label>Alternate Phone:</label><span>{profileData.alternatePhone || 'Not set'}</span></div>
                  <div className="admin-profile-info-row"><label>Date of Birth:</label><span>{profileData.dateOfBirth || 'Not set'}</span></div>
                  <div className="admin-profile-info-row"><label>Blood Group:</label><span>{profileData.bloodGroup || 'Not set'}</span></div>
                  <div className="admin-profile-info-row"><label>Address:</label><span>{profileData.address || 'Not set'}</span></div>
                </div>
              ) : (
                <div className="admin-profile-edit-section">
                  <div className="admin-profile-edit-row"><label>Full Name</label><input type="text" name="fullName" value={profileData.fullName} onChange={handleChange} /></div>
                  <div className="admin-profile-edit-row"><label>Username</label><input type="text" name="username" value={profileData.username} onChange={handleChange} /></div>
                  <div className="admin-profile-edit-row"><label>Email</label><input type="email" name="email" value={profileData.email} onChange={handleChange} /></div>
                  <div className="admin-profile-edit-row"><label>Phone</label><input type="text" name="phone" value={profileData.phone} onChange={handleChange} /></div>
                  <div className="admin-profile-edit-row"><label>Alternate Phone</label><input type="text" name="alternatePhone" value={profileData.alternatePhone} onChange={handleChange} /></div>
                  <div className="admin-profile-edit-row"><label>Date of Birth</label><input type="date" name="dateOfBirth" value={profileData.dateOfBirth} onChange={handleChange} /></div>
                  <div className="admin-profile-edit-row"><label>Blood Group</label>
                    <select name="bloodGroup" value={profileData.bloodGroup} onChange={handleChange}>
                      <option value="">Select</option>
                      <option value="A+">A+</option><option value="A-">A-</option>
                      <option value="B+">B+</option><option value="B-">B-</option>
                      <option value="O+">O+</option><option value="O-">O-</option>
                      <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div className="admin-profile-edit-row"><label>Address</label>
                    <textarea name="address" value={profileData.address} onChange={handleChange} rows="2" placeholder="Enter your address" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Work Tab */}
          {activeTab === 'work' && (
            <div className="admin-profile-tab-content">
              {!isEditing ? (
                <div className="admin-profile-info-section">
                  <div className="admin-profile-info-row"><label>Department:</label><span>{profileData.department}</span></div>
                  <div className="admin-profile-info-row"><label>Position:</label><span>{profileData.position}</span></div>
                  <div className="admin-profile-info-row"><label>Admin ID:</label><span>{profileData.adminId}</span></div>
                  <div className="admin-profile-info-row"><label>Join Date:</label><span>{profileData.joinDate}</span></div>
                  <div className="admin-profile-info-row"><label>Last Login:</label><span>{profileData.lastLogin}</span></div>
                  <div className="admin-profile-info-row"><label>Permissions:</label>
                    <div className="admin-profile-permissions-container">
                      {profileData.permissions.map((perm, i) => (
                        <span key={i} className="admin-profile-permission-tag">🔑 {perm}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="admin-profile-edit-section">
                  <div className="admin-profile-edit-row"><label>Department</label>
                    <input type="text" name="department" value={profileData.department} onChange={handleChange} />
                  </div>
                  <div className="admin-profile-edit-row"><label>Position</label>
                    <input type="text" name="position" value={profileData.position} onChange={handleChange} />
                  </div>
                  <div className="admin-profile-edit-row"><label>Admin ID</label>
                    <input type="text" name="adminId" value={profileData.adminId} onChange={handleChange} disabled />
                    <small className="admin-profile-field-note">Admin ID cannot be changed</small>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="admin-profile-tab-content">
              {!isEditing ? (
                <div className="admin-profile-info-section">
                  <div className="admin-profile-info-row"><label>Skills:</label>
                    <div className="admin-profile-skills-container">
                      {profileData.skills.map((skill, i) => <span key={i} className="admin-profile-skill-tag">🛠️ {skill}</span>)}
                      {profileData.skills.length === 0 && <span className="admin-profile-no-data">No skills added</span>}
                    </div>
                  </div>
                  <div className="admin-profile-info-row"><label>Languages:</label>
                    <div className="admin-profile-languages-container">
                      {profileData.languages.map((lang, i) => <span key={i} className="admin-profile-language-tag">🌐 {lang}</span>)}
                      {profileData.languages.length === 0 && <span className="admin-profile-no-data">No languages added</span>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="admin-profile-edit-section">
                  <div className="admin-profile-edit-row"><label>Skills</label>
                    <div className="admin-profile-skills-list">
                      {profileData.skills.map((skill, i) => (
                        <span key={i} className="admin-profile-skill-tag admin-profile-editable">
                          🛠️ {skill}
                          <button onClick={() => removeSkill(skill)} className="admin-profile-remove-skill">✕</button>
                        </span>
                      ))}
                    </div>
                    <div className="admin-profile-add-skill">
                      <input type="text" placeholder="Add skill..." value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addSkill()} />
                      <button onClick={addSkill}>+ Add</button>
                    </div>
                  </div>
                  <div className="admin-profile-edit-row"><label>Languages</label>
                    <div className="admin-profile-languages-list">
                      {profileData.languages.map((lang, i) => (
                        <span key={i} className="admin-profile-language-tag admin-profile-editable">
                          🌐 {lang}
                          <button onClick={() => removeLanguage(lang)} className="admin-profile-remove-language">✕</button>
                        </span>
                      ))}
                    </div>
                    <div className="admin-profile-add-language">
                      <input type="text" placeholder="Add language..." value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addLanguage()} />
                      <button onClick={addLanguage}>+ Add</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Emergency Tab */}
          {activeTab === 'emergency' && (
            <div className="admin-profile-tab-content">
              {!isEditing ? (
                <div className="admin-profile-info-section">
                  <div className="admin-profile-info-row"><label>Emergency Contact:</label><span>{profileData.emergencyContact.name || 'Not set'}</span></div>
                  <div className="admin-profile-info-row"><label>Relationship:</label><span>{profileData.emergencyContact.relationship || 'Not set'}</span></div>
                  <div className="admin-profile-info-row"><label>Emergency Phone:</label><span>{profileData.emergencyContact.phone || 'Not set'}</span></div>
                </div>
              ) : (
                <div className="admin-profile-edit-section">
                  <div className="admin-profile-edit-row"><label>Contact Name</label><input type="text" name="emergencyContact.name" value={profileData.emergencyContact.name} onChange={handleChange} /></div>
                  <div className="admin-profile-edit-row"><label>Relationship</label>
                    <select name="emergencyContact.relationship" value={profileData.emergencyContact.relationship} onChange={handleChange}>
                      <option value="">Select</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Friend">Friend</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="admin-profile-edit-row"><label>Phone Number</label><input type="text" name="emergencyContact.phone" value={profileData.emergencyContact.phone} onChange={handleChange} /></div>
                </div>
              )}
            </div>
          )}

          {/* Social Tab */}
          {activeTab === 'social' && (
            <div className="admin-profile-tab-content">
              {!isEditing ? (
                <div className="admin-profile-info-section">
                  <div className="admin-profile-social-links">
                    {profileData.socialLinks.linkedin && (
                      <a href={profileData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="admin-profile-social-link admin-profile-linkedin">
                        🔗 LinkedIn
                      </a>
                    )}
                    {profileData.socialLinks.github && (
                      <a href={profileData.socialLinks.github} target="_blank" rel="noopener noreferrer" className="admin-profile-social-link admin-profile-github">
                        🐙 GitHub
                      </a>
                    )}
                    {profileData.socialLinks.twitter && (
                      <a href={profileData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="admin-profile-social-link admin-profile-twitter">
                        🐦 Twitter
                      </a>
                    )}
                    {!profileData.socialLinks.linkedin && !profileData.socialLinks.github && !profileData.socialLinks.twitter && (
                      <span className="admin-profile-no-data">No social links added</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="admin-profile-edit-section">
                  <div className="admin-profile-edit-row"><label>LinkedIn</label>
                    <input type="url" name="socialLinks.linkedin" value={profileData.socialLinks.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/username" />
                  </div>
                  <div className="admin-profile-edit-row"><label>GitHub</label>
                    <input type="url" name="socialLinks.github" value={profileData.socialLinks.github} onChange={handleChange} placeholder="https://github.com/username" />
                  </div>
                  <div className="admin-profile-edit-row"><label>Twitter</label>
                    <input type="url" name="socialLinks.twitter" value={profileData.socialLinks.twitter} onChange={handleChange} placeholder="https://twitter.com/username" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="admin-profile-tab-content admin-profile-history-tab">
              <div className="admin-profile-history-header">
                <h4>📜 Profile Change History</h4>
                {profileHistory.length > 1 && (
                  <button onClick={clearHistory} className="admin-profile-clear-history-btn">🗑️ Clear History</button>
                )}
              </div>
              
              {profileHistory.length === 0 ? (
                <div className="admin-profile-no-history">No profile history available</div>
              ) : (
                <div className="admin-profile-history-list">
                  {profileHistory.map((history, index) => (
                    <div key={history.id} className="admin-profile-history-item">
                      <div className="admin-profile-history-icon">{getActionIcon(history.action)}</div>
                      <div className="admin-profile-history-details">
                        <div className="admin-profile-history-action">{history.action.replace('_', ' ')}</div>
                        <div className="admin-profile-history-time">{formatDate(history.timestamp)}</div>
                        {history.changedFields && history.changedFields.length > 0 && (
                          <div className="admin-profile-history-fields">
                            Changed: {history.changedFields.join(', ')}
                          </div>
                        )}
                      </div>
                      {index === 0 ? (
                        <div className="admin-profile-history-current-badge">✅ Current</div>
                      ) : (
                        <button onClick={() => revertToHistory(history)} className="admin-profile-history-revert-btn">
                          ↩️ Revert
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="admin-profile-actions">
            {activeTab !== 'history' && (
              !isEditing ? (
                <button className="admin-profile-btn-edit" onClick={() => setIsEditing(true)}>✏️ Edit Profile</button>
              ) : (
                <>
                  <button className="admin-profile-btn-save" onClick={handleSave}>💾 Save Changes</button>
                  <button className="admin-profile-btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;