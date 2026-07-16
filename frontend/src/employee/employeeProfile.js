import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './employeeProfile.css';
import { employeeApi } from '../services/api';

const Profile = ({ user, onPhotoUpdate, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [photoHistory, setPhotoHistory] = useState([]);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  
  const isInitialLoad = useRef(true);
  const fetchInProgress = useRef(false);
  const cachedProfileData = useRef(null);
  
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
  
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    profilePhoto: null,
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    department: '',
    position: '',
    employeeId: '',
    joinDate: '',
    bloodGroup: 'O+',
    dateOfBirth: '',
    address: '',
    skills: [],
    languages: [],
    socialLinks: {
      linkedin: '',
      github: '',
      twitter: ''
    }
  });

  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  // ============================================
  // TRIGGER PHOTO UPDATE ACROSS APP
  // ============================================
  const triggerPhotoUpdate = useCallback((photoData) => {
    localStorage.setItem('employeeprofilePhoto', photoData);
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    currentUser.profilePhoto = photoData;
    localStorage.setItem('user', JSON.stringify(currentUser));
    window.dispatchEvent(new Event('photoUpdated'));
    if (onPhotoUpdate) {
      onPhotoUpdate(photoData);
    }
  }, [onPhotoUpdate]);

  // ============================================
  // LOAD PHOTO HISTORY FROM BACKEND
  // ============================================
  const loadPhotoHistory = useCallback(async () => {
    try {
      const response = await employeeApi.getPhotoHistory();
      setPhotoHistory(response.data || []);
    } catch (err) {
      console.error('❌ Error loading photo history:', err);
      setPhotoHistory([]);
    }
  }, []);

  // ============================================
  // LOAD PROFILE FROM BACKEND (WITH CACHING)
  // ============================================
  const loadProfile = useCallback(async (forceRefresh = false) => {
    if (fetchInProgress.current) {
      console.log('⏳ Profile fetch already in progress, skipping...');
      return;
    }

    if (!forceRefresh && cachedProfileData.current) {
      console.log('📦 Using cached profile data');
      setProfileData(cachedProfileData.current);
      if (cachedProfileData.current.profilePhoto) {
        setPhotoPreview(cachedProfileData.current.profilePhoto);
      }
      setLoading(false);
      return;
    }

    try {
      fetchInProgress.current = true;
      setLoading(true);
      
      console.log('📤 Fetching profile from backend...');
      const response = await employeeApi.getProfile();
      console.log('📥 Profile response received');
      
      if (response && response.data) {
        const data = response.data;
        const newProfileData = {
          fullName: data.fullName || user?.fullName || '',
          email: data.email || user?.email || '',
          phone: data.phone || '',
          alternatePhone: data.alternatePhone || '',
          profilePhoto: data.profilePhoto || null,
          emergencyContact: {
            name: data.emergencyContact?.name || '',
            relationship: data.emergencyContact?.relationship || '',
            phone: data.emergencyContact?.phone || ''
          },
          department: data.department || '',
          position: data.position || '',
          employeeId: data.employeeId || user?.employeeId || '',
          joinDate: data.joinDate || user?.joinDate || '',
          bloodGroup: data.bloodGroup || 'O+',
          dateOfBirth: data.dateOfBirth || '',
          address: data.address || '',
          skills: data.skills || [],
          languages: data.languages || [],
          socialLinks: {
            linkedin: data.socialLinks?.linkedin || '',
            github: data.socialLinks?.github || '',
            twitter: data.socialLinks?.twitter || ''
          }
        };
        
        cachedProfileData.current = newProfileData;
        setProfileData(newProfileData);
        
        if (data.profilePhoto) {
          setPhotoPreview(data.profilePhoto);
          triggerPhotoUpdate(data.profilePhoto);
        }
        
        await loadPhotoHistory();
      }
    } catch (err) {
      console.error('❌ Error loading profile:', err);
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [user, loadPhotoHistory, triggerPhotoUpdate]);

  // ============================================
  // USE EFFECT - INITIAL LOAD ONLY
  // ============================================
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      loadProfile(false);
    }
  }, [loadProfile]);

  // ============================================
  // SAVE PHOTO TO HISTORY
  // ============================================
  const savePhotoToHistory = useCallback(async (photoData, type = 'UPLOADED') => {
    try {
      const response = await employeeApi.savePhotoHistory({
        photo: photoData,
        type: type
      });
      await loadPhotoHistory();
      return response.data;
    } catch (err) {
      console.error('❌ Error saving photo history:', err);
      throw err;
    }
  }, [loadPhotoHistory]);

  // ============================================
  // REVERT TO PREVIOUS PHOTO
  // ============================================
  const revertToPhoto = useCallback(async (historyEntry) => {
    if (window.confirm('Revert to this profile photo?')) {
      try {
        await employeeApi.revertToPhoto(historyEntry.id);
        setPhotoPreview(historyEntry.photo);
        setProfileData(prev => ({ ...prev, profilePhoto: historyEntry.photo }));
        
        if (cachedProfileData.current) {
          cachedProfileData.current.profilePhoto = historyEntry.photo;
        }
        
        triggerPhotoUpdate(historyEntry.photo);
        await loadPhotoHistory();
        alert('✅ Photo reverted successfully!');
      } catch (err) {
        console.error('❌ Error reverting photo:', err);
        alert('❌ Failed to revert photo: ' + (err.response?.data?.message || err.message));
      }
    }
  }, [triggerPhotoUpdate, loadPhotoHistory]);

  // ============================================
  // DELETE PHOTO HISTORY
  // ============================================
  const deletePhotoHistory = useCallback(async (historyId) => {
    if (window.confirm('Delete this photo from history?')) {
      try {
        await employeeApi.deletePhotoHistory(historyId);
        await loadPhotoHistory();
      } catch (err) {
        console.error('❌ Error deleting photo history:', err);
        alert('❌ Failed to delete photo: ' + (err.response?.data?.message || err.message));
      }
    }
  }, [loadPhotoHistory]);

  // ============================================
  // CLEAR ALL PHOTO HISTORY
  // ============================================
  const clearPhotoHistory = useCallback(async () => {
    if (window.confirm('Clear all photo history?')) {
      try {
        await employeeApi.clearPhotoHistory();
        await loadPhotoHistory();
      } catch (err) {
        console.error('❌ Error clearing photo history:', err);
        alert('❌ Failed to clear history: ' + (err.response?.data?.message || err.message));
      }
    }
  }, [loadPhotoHistory]);

  // ============================================
  // HANDLE CHANGE
  // ============================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfileData({
        ...profileData,
        [parent]: {
          ...profileData[parent],
          [child]: value
        }
      });
    } else {
      setProfileData({
        ...profileData,
        [name]: value
      });
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
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photoData = canvas.toDataURL('image/jpeg');
      setTempImage(photoData);
      setShowCamera(false);
      setShowCrop(true);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result);
        setShowCrop(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // ============================================
  // GET CROPPED IMAGE & UPLOAD
  // ============================================
  const getCroppedImg = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return;
    
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
    
    try {
      console.log('📸 Uploading cropped photo...');
      
      await employeeApi.uploadProfilePhoto(croppedImage);
      console.log('✅ Photo uploaded successfully');
      
      setPhotoPreview(croppedImage);
      setProfileData(prev => ({ ...prev, profilePhoto: croppedImage }));
      
      if (cachedProfileData.current) {
        cachedProfileData.current.profilePhoto = croppedImage;
      }
      
      const photoType = showCamera ? 'CAPTURED' : 'UPLOADED';
      await savePhotoToHistory(croppedImage, photoType);
      
      triggerPhotoUpdate(croppedImage);
      
      alert('✅ Photo uploaded successfully!');
    } catch (err) {
      console.error('❌ Error uploading photo:', err);
      alert('❌ Failed to upload photo: ' + (err.response?.data?.message || err.message));
    }
    setShowCrop(false);
    setTempImage(null);
  }, [completedCrop, showCamera, savePhotoToHistory, triggerPhotoUpdate]);

  const cancelCrop = () => {
    setShowCrop(false);
    setTempImage(null);
  };

  // ============================================
  // SKILLS & LANGUAGES
  // ============================================
  const addSkill = () => {
    if (newSkill.trim() && !profileData.skills.includes(newSkill.trim())) {
      setProfileData({
        ...profileData,
        skills: [...profileData.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setProfileData({
      ...profileData,
      skills: profileData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !profileData.languages.includes(newLanguage.trim())) {
      setProfileData({
        ...profileData,
        languages: [...profileData.languages, newLanguage.trim()]
      });
      setNewLanguage('');
    }
  };

  const removeLanguage = (languageToRemove) => {
    setProfileData({
      ...profileData,
      languages: profileData.languages.filter(lang => lang !== languageToRemove)
    });
  };

  // ============================================
  // SAVE PROFILE TO BACKEND
  // ============================================
  const handleSave = useCallback(async () => {
    try {
      console.log('📤 Sending profile data:', profileData);
      
      const payload = {
        fullName: profileData.fullName || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        alternatePhone: profileData.alternatePhone || '',
        department: profileData.department || '',
        position: profileData.position || '',
        employeeId: profileData.employeeId || '',
        joinDate: profileData.joinDate || '',
        dateOfBirth: profileData.dateOfBirth || null,
        bloodGroup: profileData.bloodGroup || 'O+',
        address: profileData.address || '',
        skills: profileData.skills || [],
        languages: profileData.languages || [],
        emergencyContact: {
          name: profileData.emergencyContact?.name || '',
          relationship: profileData.emergencyContact?.relationship || '',
          phone: profileData.emergencyContact?.phone || ''
        },
        socialLinks: {
          linkedin: profileData.socialLinks?.linkedin || '',
          github: profileData.socialLinks?.github || '',
          twitter: profileData.socialLinks?.twitter || ''
        }
      };
      
      await employeeApi.updateProfile(payload);
      
      if (cachedProfileData.current) {
        cachedProfileData.current = { ...cachedProfileData.current, ...payload };
      }
      
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      currentUser.fullName = payload.fullName;
      currentUser.email = payload.email;
      currentUser.employeeId = payload.employeeId;
      currentUser.joinDate = payload.joinDate;
      localStorage.setItem('user', JSON.stringify(currentUser));
      
      if (onProfileUpdate) {
        onProfileUpdate(payload);
      }
      
      alert('✅ Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('❌ Error saving profile:', err);
      if (err.response) {
        alert(`❌ Failed to update profile: ${err.response.data?.message || 'Please check console for details'}`);
      } else {
        alert('❌ Failed to update profile: ' + err.message);
      }
    }
  }, [profileData, onProfileUpdate]);

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getPhotoTypeLabel = (type) => {
    switch(type) {
      case 'UPLOADED': return '📁 Uploaded';
      case 'CAPTURED': return '📸 Captured';
      case 'REVERTED': return '↩️ Reverted';
      case 'PREVIOUS': return '🔄 Previous';
      default: return '📷 Photo';
    }
  };

  const tabs = [
    { id: 'personal', label: '👤 Personal' },
    { id: 'work', label: '💼 Work' },
    { id: 'skills', label: '🛠️ Skills' },
    { id: 'emergency', label: '🚨 Emergency' },
    { id: 'social', label: '🔗 Social' },
    { id: 'photohistory', label: '📸 Photo History' }
  ];

  if (loading) return <div className="loading">Loading profile...</div>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        {/* Profile Header with Photo */}
        <div className="profile-header">
          <div className="profile-photo-section">
            <div className="profile-photo" onClick={handlePhotoClick}>
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="profile-photo-img" />
              ) : (
                <div className="profile-avatar">
                  {profileData.fullName?.charAt(0).toUpperCase() || '👤'}
                </div>
              )}
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              onChange={handleFileChange}
            />
            
            {showPhotoOptions && (
              <div className="photo-options-modal" onClick={() => setShowPhotoOptions(false)}>
                <div className="photo-options-content" onClick={(e) => e.stopPropagation()}>
                  <h4>Choose Photo</h4>
                  <button onClick={handleUploadPhoto} className="photo-option-btn">📁 Upload from Gallery</button>
                  <button onClick={handleTakePhoto} className="photo-option-btn">📸 Take a Photo</button>
                  <button onClick={() => setShowPhotoOptions(false)} className="photo-option-btn cancel">Cancel</button>
                </div>
              </div>
            )}
            
            {showCamera && (
              <div className="camera-modal" onClick={closeCamera}>
                <div className="camera-content" onClick={(e) => e.stopPropagation()}>
                  <h4>Take a Photo</h4>
                  <video ref={videoRef} autoPlay playsInline className="camera-video" />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <div className="camera-buttons">
                    <button onClick={capturePhoto} className="capture-btn">📸 Capture</button>
                    <button onClick={closeCamera} className="close-camera-btn">Cancel</button>
                  </div>
                </div>
              </div>
            )}
            
            {showCrop && tempImage && (
              <div className="crop-modal" onClick={cancelCrop}>
                <div className="crop-content" onClick={(e) => e.stopPropagation()}>
                  <h4>✂️ Crop Your Photo</h4>
                  <ReactCrop
                    crop={crop}
                    onChange={(newCrop) => setCrop(newCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={1}
                    circularCrop
                    className="crop-container"
                  >
                    <img
                      src={tempImage}
                      alt="Crop preview"
                      ref={imgRef}
                      className="crop-image"
                      style={{ maxWidth: '100%', maxHeight: '400px' }}
                    />
                  </ReactCrop>
                  <div className="crop-buttons">
                    <button onClick={cancelCrop} className="crop-cancel">Cancel</button>
                    <button onClick={getCroppedImg} className="crop-save">Apply Crop</button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <h3>{profileData.fullName || user?.fullName}</h3>
          <p className="role-badge-profile">{user?.role}</p>
        </div>
        
        {/* Tabs */}
        <div className="profile-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="profile-body">
          {/* Personal Tab */}
          {activeTab === 'personal' && (
            <div className="tab-content">
              {!isEditing ? (
                <div className="info-section">
                  <div className="info-row"><label>Full Name:</label><span>{profileData.fullName}</span></div>
                  <div className="info-row"><label>Email:</label><span>{profileData.email}</span></div>
                  <div className="info-row"><label>Phone:</label><span>{profileData.phone}</span></div>
                  <div className="info-row"><label>Date of Birth:</label><span>{profileData.dateOfBirth || 'N/A'}</span></div>
                  <div className="info-row"><label>Blood Group:</label><span>{profileData.bloodGroup}</span></div>
                  <div className="info-row"><label>Address:</label><span>{profileData.address || 'N/A'}</span></div>
                </div>
              ) : (
                <div className="edit-section">
                  <div className="edit-row"><label>Full Name</label><input type="text" name="fullName" value={profileData.fullName} onChange={handleChange} /></div>
                  <div className="edit-row"><label>Phone</label><input type="text" name="phone" value={profileData.phone} onChange={handleChange} /></div>
                  <div className="edit-row"><label>Date of Birth</label><input type="date" name="dateOfBirth" value={profileData.dateOfBirth} onChange={handleChange} /></div>
                  <div className="edit-row"><label>Blood Group</label>
                    <select name="bloodGroup" value={profileData.bloodGroup} onChange={handleChange}>
                      <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                      <option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                    </select>
                  </div>
                  <div className="edit-row"><label>Address</label><textarea name="address" value={profileData.address} onChange={handleChange} rows="2" /></div>
                </div>
              )}
            </div>
          )}

          {/* Work Tab */}
          {activeTab === 'work' && (
            <div className="tab-content">
              {!isEditing ? (
                <div className="info-section">
                  <div className="info-row"><label>Department:</label><span>{profileData.department || 'N/A'}</span></div>
                  <div className="info-row"><label>Position:</label><span>{profileData.position || 'N/A'}</span></div>
                  <div className="info-row"><label>Employee ID:</label><span>{profileData.employeeId || 'N/A'}</span></div>
                  <div className="info-row"><label>Join Date:</label><span>{profileData.joinDate || 'N/A'}</span></div>
                </div>
              ) : (
                <div className="edit-section">
                  <div className="edit-row">
                    <label>Department</label>
                    <input 
                      type="text" 
                      name="department" 
                      value={profileData.department} 
                      onChange={handleChange} 
                      placeholder="Enter department"
                    />
                  </div>
                  <div className="edit-row">
                    <label>Position</label>
                    <input 
                      type="text" 
                      name="position" 
                      value={profileData.position} 
                      onChange={handleChange} 
                      placeholder="Enter position"
                    />
                  </div>
                  <div className="edit-row">
                    <label>Employee ID</label>
                    <input 
                      type="text" 
                      name="employeeId" 
                      value={profileData.employeeId} 
                      onChange={handleChange} 
                      placeholder="Enter employee ID"
                    />
                    <small style={{ color: '#6c757d', fontSize: '12px' }}>
                      Unique employee identifier
                    </small>
                  </div>
                  <div className="edit-row">
                    <label>Join Date</label>
                    <input 
                      type="date" 
                      name="joinDate" 
                      value={profileData.joinDate} 
                      onChange={handleChange} 
                    />
                    <small style={{ color: '#6c757d', fontSize: '12px' }}>
                      Date when employee joined the company
                    </small>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="tab-content">
              {!isEditing ? (
                <div className="info-section">
                  <div className="info-row"><label>Skills:</label>
                    <div className="skills-container">
                      {profileData.skills.length > 0 ? (
                        profileData.skills.map((skill, i) => <span key={i} className="skill-tag">{skill}</span>)
                      ) : (
                        <span className="no-data-text">No skills added</span>
                      )}
                    </div>
                  </div>
                  <div className="info-row"><label>Languages:</label>
                    <div className="languages-container">
                      {profileData.languages.length > 0 ? (
                        profileData.languages.map((lang, i) => <span key={i} className="language-tag">{lang}</span>)
                      ) : (
                        <span className="no-data-text">No languages added</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="edit-section">
                  <div className="edit-row"><label>Skills</label>
                    <div className="skills-list">
                      {profileData.skills.map((skill, i) => (
                        <span key={i} className="skill-tag editable">
                          {skill}
                          <button onClick={() => removeSkill(skill)} className="remove-skill">✕</button>
                        </span>
                      ))}
                    </div>
                    <div className="add-skill">
                      <input type="text" placeholder="Add skill..." value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addSkill()} />
                      <button onClick={addSkill}>+ Add</button>
                    </div>
                  </div>
                  <div className="edit-row"><label>Languages</label>
                    <div className="languages-list">
                      {profileData.languages.map((lang, i) => (
                        <span key={i} className="language-tag editable">
                          {lang}
                          <button onClick={() => removeLanguage(lang)} className="remove-language">✕</button>
                        </span>
                      ))}
                    </div>
                    <div className="add-language">
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
            <div className="tab-content">
              {!isEditing ? (
                <div className="info-section">
                  <div className="info-row"><label>Emergency Contact:</label><span>{profileData.emergencyContact.name || 'N/A'}</span></div>
                  <div className="info-row"><label>Relationship:</label><span>{profileData.emergencyContact.relationship || 'N/A'}</span></div>
                  <div className="info-row"><label>Emergency Phone:</label><span>{profileData.emergencyContact.phone || 'N/A'}</span></div>
                </div>
              ) : (
                <div className="edit-section">
                  <div className="edit-row"><label>Contact Name</label><input type="text" name="emergencyContact.name" value={profileData.emergencyContact.name} onChange={handleChange} /></div>
                  <div className="edit-row"><label>Relationship</label><input type="text" name="emergencyContact.relationship" value={profileData.emergencyContact.relationship} onChange={handleChange} /></div>
                  <div className="edit-row"><label>Phone Number</label><input type="text" name="emergencyContact.phone" value={profileData.emergencyContact.phone} onChange={handleChange} /></div>
                </div>
              )}
            </div>
          )}

          {/* Social Tab */}
          {activeTab === 'social' && (
            <div className="tab-content">
              {!isEditing ? (
                <div className="info-section">
                  <div className="social-links">
                    {profileData.socialLinks.linkedin && <a href={profileData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="social-link linkedin">🔗 LinkedIn</a>}
                    {profileData.socialLinks.github && <a href={profileData.socialLinks.github} target="_blank" rel="noopener noreferrer" className="social-link github">🐙 GitHub</a>}
                    {profileData.socialLinks.twitter && <a href={profileData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="social-link twitter">🐦 Twitter</a>}
                  </div>
                </div>
              ) : (
                <div className="edit-section">
                  <div className="edit-row"><label>LinkedIn</label><input type="url" name="socialLinks.linkedin" value={profileData.socialLinks.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/username" /></div>
                  <div className="edit-row"><label>GitHub</label><input type="url" name="socialLinks.github" value={profileData.socialLinks.github} onChange={handleChange} placeholder="https://github.com/username" /></div>
                  <div className="edit-row"><label>Twitter</label><input type="url" name="socialLinks.twitter" value={profileData.socialLinks.twitter} onChange={handleChange} placeholder="https://twitter.com/username" /></div>
                </div>
              )}
            </div>
          )}

          {/* Photo History Tab */}
          {activeTab === 'photohistory' && (
            <div className="tab-content history-tab">
              <div className="history-header">
                <h4>📸 Profile Photo History</h4>
                {photoHistory.length > 0 && (
                  <button onClick={clearPhotoHistory} className="clear-history-btn">
                    Clear All
                  </button>
                )}
              </div>
              
              {photoHistory.length === 0 ? (
                <div className="no-history">No photo history available</div>
              ) : (
                <div className="history-list">
                  {photoHistory.map((history, index) => (
                    <div key={history.id} className="history-item photo-history-item">
                      <div className="history-photo-preview">
                        <img src={history.photo} alt="Profile" className="history-photo-thumbnail" />
                      </div>
                      <div className="history-details">
                        <div className="history-action">{getPhotoTypeLabel(history.type)}</div>
                        <div className="history-time">{formatDate(history.timestamp)}</div>
                      </div>
                      {index === 0 ? (
                        <div className="history-current-badge">Current</div>
                      ) : (
                        <div className="history-actions">
                          <button onClick={() => revertToPhoto(history)} className="history-revert-btn">
                            Revert
                          </button>
                          <button onClick={() => deletePhotoHistory(history.id)} className="history-delete-btn">
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="profile-actions">
            {activeTab !== 'photohistory' && (
              !isEditing ? (
                <button className="btn-edit" onClick={() => setIsEditing(true)}>✏️ Edit Profile</button>
              ) : (
                <>
                  <button className="btn-save" onClick={handleSave}>💾 Save Changes</button>
                  <button className="btn-cancel-profile" onClick={() => setIsEditing(false)}>Cancel</button>
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