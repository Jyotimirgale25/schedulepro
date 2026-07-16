// fronted/src/manager/ManagerProfile.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './managerProfile.css';
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
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    alternatePhone: '',
    profilePhoto: user?.profilePhoto || null,
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    department: user?.department || '',
    position: user?.position || '',
    employeeId: user?.employeeId || '',
    managerId: user?.id || user?.managerId || '',
    joinDate: user?.joinDate || '',
    bloodGroup: 'O+',
    dateOfBirth: '',
    address: '',
    skills: [],
    languages: [],
    socialLinks: {
      linkedin: '',
      github: '',
      twitter: ''
    },
    teamSize: user?.teamSize || 0,
    departmentHead: user?.departmentHead || false,
    managerLevel: user?.managerLevel || 'Senior',
    reportsTo: user?.reportsTo || '',
    managedDepartments: user?.managedDepartments || ['IT'],
    employeeCount: user?.employeeCount || 0,
    officeLocation: user?.officeLocation || '',
    workEmail: user?.workEmail || ''
  });

  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newDepartment, setNewDepartment] = useState('');

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
  // LOAD PROFILE FROM BACKEND
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
      
      console.log('📤 Fetching manager profile from backend...');
      const response = await employeeApi.getProfile();
      console.log('📥 Profile response received:', response);
      
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
          managerId: data.id || data.managerId || user?.id || '',
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
          },
          teamSize: data.teamSize || data.employeeCount || 0,
          departmentHead: data.departmentHead || false,
          managerLevel: data.managerLevel || 'Senior',
          reportsTo: data.reportsTo || '',
          managedDepartments: data.managedDepartments || ['IT'],
          employeeCount: data.employeeCount || data.teamSize || 0,
          officeLocation: data.officeLocation || '',
          workEmail: data.workEmail || ''
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
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setProfileData({
        ...profileData,
        [name]: checked
      });
      return;
    }
    
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
      if (type === 'number') {
        setProfileData({
          ...profileData,
          [name]: parseInt(value) || 0
        });
      } else {
        setProfileData({
          ...profileData,
          [name]: value
        });
      }
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
  // MANAGER-SPECIFIC: MANAGED DEPARTMENTS
  // ============================================
  const addManagedDepartment = () => {
    if (newDepartment.trim() && !profileData.managedDepartments.includes(newDepartment.trim())) {
      setProfileData({
        ...profileData,
        managedDepartments: [...profileData.managedDepartments, newDepartment.trim()]
      });
      setNewDepartment('');
    }
  };

  const removeManagedDepartment = (deptToRemove) => {
    setProfileData({
      ...profileData,
      managedDepartments: profileData.managedDepartments.filter(dept => dept !== deptToRemove)
    });
  };

  // ============================================
  // SAVE PROFILE TO BACKEND
  // ============================================
  const handleSave = useCallback(async () => {
    try {
      console.log('📤 Sending manager profile data:', profileData);
      
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
        officeLocation: profileData.officeLocation || '',
        workEmail: profileData.workEmail || '',
        skills: profileData.skills || [],
        languages: profileData.languages || [],
        teamSize: profileData.teamSize || 0,
        departmentHead: profileData.departmentHead || false,
        managerLevel: profileData.managerLevel || 'Senior',
        reportsTo: profileData.reportsTo || '',
        managedDepartments: profileData.managedDepartments || [],
        employeeCount: profileData.employeeCount || 0,
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

  // ============================================
  // TABS - Manager Specific
  // ============================================
  const tabs = [
    { id: 'personal', label: '👤 Personal' },
    { id: 'work', label: '💼 Work' },
    { id: 'management', label: '👔 Management' },
    { id: 'skills', label: '🛠️ Skills' },
    { id: 'emergency', label: '🚨 Emergency' },
    { id: 'social', label: '🔗 Social' },
    { id: 'photohistory', label: '📸 Photo History' }
  ];

  if (loading) return <div className="manager-profile-loading">Loading profile...</div>;

  return (
    <div className="manager-profile-container">
      <div className="manager-profile-card">
        {/* Profile Header with Photo */}
        <div className="manager-profile-header">
          <div className="manager-profile-photo-section">
            <div className="manager-profile-photo" onClick={handlePhotoClick}>
              {photoPreview ? (
                <img src={photoPreview} alt="Profile" className="manager-profile-photo-img" />
              ) : (
                <div className="manager-profile-avatar">
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
              <div className="manager-profile-photo-options-modal" onClick={() => setShowPhotoOptions(false)}>
                <div className="manager-profile-photo-options-content" onClick={(e) => e.stopPropagation()}>
                  <h4>Choose Photo</h4>
                  <button onClick={handleUploadPhoto} className="manager-profile-photo-option-btn">📁 Upload from Gallery</button>
                  <button onClick={handleTakePhoto} className="manager-profile-photo-option-btn">📸 Take a Photo</button>
                  <button onClick={() => setShowPhotoOptions(false)} className="manager-profile-photo-option-btn manager-profile-cancel">Cancel</button>
                </div>
              </div>
            )}
            
            {showCamera && (
              <div className="manager-profile-camera-modal" onClick={closeCamera}>
                <div className="manager-profile-camera-content" onClick={(e) => e.stopPropagation()}>
                  <h4>Take a Photo</h4>
                  <video ref={videoRef} autoPlay playsInline className="manager-profile-camera-video" />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <div className="manager-profile-camera-buttons">
                    <button onClick={capturePhoto} className="manager-profile-capture-btn">📸 Capture</button>
                    <button onClick={closeCamera} className="manager-profile-close-camera-btn">Cancel</button>
                  </div>
                </div>
              </div>
            )}
            
            {showCrop && tempImage && (
              <div className="manager-profile-crop-modal" onClick={cancelCrop}>
                <div className="manager-profile-crop-content" onClick={(e) => e.stopPropagation()}>
                  <h4>✂️ Crop Your Photo</h4>
                  <ReactCrop
                    crop={crop}
                    onChange={(newCrop) => setCrop(newCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={1}
                    circularCrop
                    className="manager-profile-crop-container"
                  >
                    <img
                      src={tempImage}
                      alt="Crop preview"
                      ref={imgRef}
                      className="manager-profile-crop-image"
                      style={{ maxWidth: '100%', maxHeight: '400px' }}
                    />
                  </ReactCrop>
                  <div className="manager-profile-crop-buttons">
                    <button onClick={cancelCrop} className="manager-profile-crop-cancel">Cancel</button>
                    <button onClick={getCroppedImg} className="manager-profile-crop-save">Apply Crop</button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <h3>{profileData.fullName}</h3>
          <p className="manager-profile-role-badge">👔 {user?.role || 'MANAGER'}</p>
        </div>
        
        {/* Tabs */}
        <div className="manager-profile-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`manager-profile-tab ${activeTab === tab.id ? 'manager-profile-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="manager-profile-body">
          {/* Personal Tab */}
          {activeTab === 'personal' && (
            <div className="manager-profile-tab-content">
              {!isEditing ? (
                <div className="manager-profile-info-section">
                  <div className="manager-profile-info-row"><label>Full Name:</label><span>{profileData.fullName}</span></div>
                  <div className="manager-profile-info-row"><label>Email:</label><span>{profileData.email}</span></div>
                  <div className="manager-profile-info-row"><label>Phone:</label><span>{profileData.phone}</span></div>
                  <div className="manager-profile-info-row"><label>Work Email:</label><span>{profileData.workEmail || 'N/A'}</span></div>
                  <div className="manager-profile-info-row"><label>Date of Birth:</label><span>{profileData.dateOfBirth || 'N/A'}</span></div>
                  <div className="manager-profile-info-row"><label>Blood Group:</label><span>{profileData.bloodGroup}</span></div>
                  <div className="manager-profile-info-row"><label>Address:</label><span>{profileData.address || 'N/A'}</span></div>
                  <div className="manager-profile-info-row"><label>Office Location:</label><span>{profileData.officeLocation || 'N/A'}</span></div>
                </div>
              ) : (
                <div className="manager-profile-edit-section">
                  <div className="manager-profile-edit-row"><label>Full Name</label><input type="text" name="fullName" value={profileData.fullName} onChange={handleChange} /></div>
                  <div className="manager-profile-edit-row"><label>Email</label><input type="email" name="email" value={profileData.email} onChange={handleChange} /></div>
                  <div className="manager-profile-edit-row"><label>Phone</label><input type="text" name="phone" value={profileData.phone} onChange={handleChange} /></div>
                  <div className="manager-profile-edit-row"><label>Work Email</label><input type="email" name="workEmail" value={profileData.workEmail} onChange={handleChange} placeholder="work@company.com" /></div>
                  <div className="manager-profile-edit-row"><label>Date of Birth</label><input type="date" name="dateOfBirth" value={profileData.dateOfBirth} onChange={handleChange} /></div>
                  <div className="manager-profile-edit-row"><label>Blood Group</label><select name="bloodGroup" value={profileData.bloodGroup} onChange={handleChange}>
                    <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
                    <option>O+</option><option>O-</option><option>AB+</option><option>AB-</option>
                  </select></div>
                  <div className="manager-profile-edit-row"><label>Address</label><textarea name="address" value={profileData.address} onChange={handleChange} rows="2" /></div>
                  <div className="manager-profile-edit-row"><label>Office Location</label><input type="text" name="officeLocation" value={profileData.officeLocation} onChange={handleChange} placeholder="Building A, Floor 3" /></div>
                </div>
              )}
            </div>
          )}

          {/* Work Tab */}
          {activeTab === 'work' && (
            <div className="manager-profile-tab-content">
              {!isEditing ? (
                <div className="manager-profile-info-section">
                  <div className="manager-profile-info-row"><label>Manager ID:</label><span>{profileData.managerId || 'N/A'}</span></div>
                  <div className="manager-profile-info-row"><label>Employee ID:</label><span>{profileData.employeeId || 'N/A'}</span></div>
                  <div className="manager-profile-info-row"><label>Department:</label><span>{profileData.department || 'N/A'}</span></div>
                  <div className="manager-profile-info-row"><label>Position:</label><span>{profileData.position || 'N/A'}</span></div>
                  <div className="manager-profile-info-row"><label>Join Date:</label><span>{profileData.joinDate || 'N/A'}</span></div>
                  <div className="manager-profile-info-row"><label>Department Head:</label><span>{profileData.departmentHead ? '✅ Yes' : '❌ No'}</span></div>
                  <div className="manager-profile-info-row"><label>Manager Level:</label><span>{profileData.managerLevel || 'N/A'}</span></div>
                  <div className="manager-profile-info-row"><label>Reports To:</label><span>{profileData.reportsTo || 'N/A'}</span></div>
                </div>
              ) : (
                <div className="manager-profile-edit-section">
                  <div className="manager-profile-edit-row"><label>Manager ID</label>
                    <input type="text" name="managerId" value={profileData.managerId || ''} disabled style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }} />
                    <small style={{ color: '#6c757d', fontSize: '12px' }}>Manager ID cannot be changed</small>
                  </div>
                  <div className="manager-profile-edit-row"><label>Employee ID</label>
                    <input type="text" name="employeeId" value={profileData.employeeId || ''} disabled style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }} />
                    <small style={{ color: '#6c757d', fontSize: '12px' }}>Employee ID cannot be changed</small>
                  </div>
                  <div className="manager-profile-edit-row"><label>Department</label>
                    <input type="text" name="department" value={profileData.department || ''} onChange={handleChange} />
                  </div>
                  <div className="manager-profile-edit-row"><label>Position</label>
                    <input type="text" name="position" value={profileData.position || ''} onChange={handleChange} />
                  </div>
                  <div className="manager-profile-edit-row"><label>Join Date</label>
                    <input type="date" name="joinDate" value={profileData.joinDate || ''} onChange={handleChange} />
                  </div>
                  <div className="manager-profile-edit-row"><label>Department Head</label>
                    <select name="departmentHead" value={profileData.departmentHead} onChange={handleChange}>
                      <option value={true}>✅ Yes</option>
                      <option value={false}>❌ No</option>
                    </select>
                  </div>
                  <div className="manager-profile-edit-row"><label>Manager Level</label>
                    <select name="managerLevel" value={profileData.managerLevel || 'Senior'} onChange={handleChange}>
                      <option value="Junior">Junior</option>
                      <option value="Mid">Mid</option>
                      <option value="Senior">Senior</option>
                      <option value="Lead">Lead</option>
                      <option value="Director">Director</option>
                      <option value="VP">VP</option>
                      <option value="Executive">Executive</option>
                    </select>
                  </div>
                  <div className="manager-profile-edit-row"><label>Reports To</label>
                    <input type="text" name="reportsTo" value={profileData.reportsTo || ''} onChange={handleChange} placeholder="CEO / VP" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Management Tab */}
          {activeTab === 'management' && (
            <div className="manager-profile-tab-content">
              {!isEditing ? (
                <div className="manager-profile-info-section">
                  <div className="manager-profile-info-row"><label>👥 Team Size:</label><span>{profileData.teamSize || 0} members</span></div>
                  <div className="manager-profile-info-row"><label>📊 Employee Count:</label><span>{profileData.employeeCount || 0}</span></div>
                  <div className="manager-profile-info-row"><label>🏢 Managed Departments:</label>
                    <div className="manager-profile-departments-container">
                      {profileData.managedDepartments.length > 0 ? (
                        profileData.managedDepartments.map((dept, i) => <span key={i} className="manager-profile-department-tag">{dept}</span>)
                      ) : <span>No departments managed</span>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="manager-profile-edit-section">
                  <div className="manager-profile-edit-row"><label>Team Size</label>
                    <input type="number" name="teamSize" value={profileData.teamSize} onChange={handleChange} min="0" />
                  </div>
                  <div className="manager-profile-edit-row"><label>Employee Count</label>
                    <input type="number" name="employeeCount" value={profileData.employeeCount} onChange={handleChange} min="0" />
                  </div>
                  <div className="manager-profile-edit-row"><label>Managed Departments</label>
                    <div className="manager-profile-departments-container">
                      {profileData.managedDepartments.map((dept, i) => (
                        <span key={i} className="manager-profile-department-tag manager-profile-editable">
                          {dept}
                          <button onClick={() => removeManagedDepartment(dept)} className="manager-profile-remove-dept">✕</button>
                        </span>
                      ))}
                    </div>
                    <div className="manager-profile-add-dept">
                      <input type="text" placeholder="Add department..." value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addManagedDepartment()} />
                      <button onClick={addManagedDepartment}>+ Add</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="manager-profile-tab-content">
              {!isEditing ? (
                <div className="manager-profile-info-section">
                  <div className="manager-profile-info-row"><label>Skills:</label>
                    <div className="manager-profile-skills-container">
                      {profileData.skills.map((skill, i) => <span key={i} className="manager-profile-skill-tag">{skill}</span>)}
                    </div>
                  </div>
                  <div className="manager-profile-info-row"><label>Languages:</label>
                    <div className="manager-profile-languages-container">
                      {profileData.languages.map((lang, i) => <span key={i} className="manager-profile-language-tag">{lang}</span>)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="manager-profile-edit-section">
                  <div className="manager-profile-edit-row"><label>Skills</label>
                    <div className="manager-profile-skills-container">
                      {profileData.skills.map((skill, i) => (
                        <span key={i} className="manager-profile-skill-tag manager-profile-editable">
                          {skill}
                          <button onClick={() => removeSkill(skill)} className="manager-profile-remove-skill">✕</button>
                        </span>
                      ))}
                    </div>
                    <div className="manager-profile-add-skill">
                      <input type="text" placeholder="Add skill..." value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addSkill()} />
                      <button onClick={addSkill}>+ Add</button>
                    </div>
                  </div>
                  <div className="manager-profile-edit-row"><label>Languages</label>
                    <div className="manager-profile-languages-container">
                      {profileData.languages.map((lang, i) => (
                        <span key={i} className="manager-profile-language-tag manager-profile-editable">
                          {lang}
                          <button onClick={() => removeLanguage(lang)} className="manager-profile-remove-language">✕</button>
                        </span>
                      ))}
                    </div>
                    <div className="manager-profile-add-language">
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
            <div className="manager-profile-tab-content">
              {!isEditing ? (
                <div className="manager-profile-info-section">
                  <div className="manager-profile-info-row"><label>Emergency Contact:</label><span>{profileData.emergencyContact.name || 'N/A'}</span></div>
                  <div className="manager-profile-info-row"><label>Relationship:</label><span>{profileData.emergencyContact.relationship || 'N/A'}</span></div>
                  <div className="manager-profile-info-row"><label>Emergency Phone:</label><span>{profileData.emergencyContact.phone || 'N/A'}</span></div>
                </div>
              ) : (
                <div className="manager-profile-edit-section">
                  <div className="manager-profile-edit-row"><label>Contact Name</label><input type="text" name="emergencyContact.name" value={profileData.emergencyContact.name} onChange={handleChange} /></div>
                  <div className="manager-profile-edit-row"><label>Relationship</label><input type="text" name="emergencyContact.relationship" value={profileData.emergencyContact.relationship} onChange={handleChange} /></div>
                  <div className="manager-profile-edit-row"><label>Phone Number</label><input type="text" name="emergencyContact.phone" value={profileData.emergencyContact.phone} onChange={handleChange} /></div>
                </div>
              )}
            </div>
          )}

          {/* Social Tab */}
          {activeTab === 'social' && (
            <div className="manager-profile-tab-content">
              {!isEditing ? (
                <div className="manager-profile-info-section">
                  <div className="manager-profile-social-links">
                    {profileData.socialLinks.linkedin && <a href={profileData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="manager-profile-social-link manager-profile-linkedin">🔗 LinkedIn</a>}
                    {profileData.socialLinks.github && <a href={profileData.socialLinks.github} target="_blank" rel="noopener noreferrer" className="manager-profile-social-link manager-profile-github">🐙 GitHub</a>}
                    {profileData.socialLinks.twitter && <a href={profileData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="manager-profile-social-link manager-profile-twitter">🐦 Twitter</a>}
                  </div>
                </div>
              ) : (
                <div className="manager-profile-edit-section">
                  <div className="manager-profile-edit-row"><label>LinkedIn</label><input type="url" name="socialLinks.linkedin" value={profileData.socialLinks.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/username" /></div>
                  <div className="manager-profile-edit-row"><label>GitHub</label><input type="url" name="socialLinks.github" value={profileData.socialLinks.github} onChange={handleChange} placeholder="https://github.com/username" /></div>
                  <div className="manager-profile-edit-row"><label>Twitter</label><input type="url" name="socialLinks.twitter" value={profileData.socialLinks.twitter} onChange={handleChange} placeholder="https://twitter.com/username" /></div>
                </div>
              )}
            </div>
          )}

          {/* Photo History Tab */}
          {activeTab === 'photohistory' && (
            <div className="manager-profile-tab-content">
              <div className="manager-profile-history-header">
                <h4>📸 Profile Photo History</h4>
                {photoHistory.length > 0 && (
                  <button onClick={clearPhotoHistory} className="manager-profile-clear-history-btn">
                    Clear All
                  </button>
                )}
              </div>
              
              {photoHistory.length === 0 ? (
                <div className="manager-profile-no-history">No photo history available</div>
              ) : (
                <div className="manager-profile-history-list">
                  {photoHistory.map((history, index) => (
                    <div key={history.id} className="manager-profile-history-item photo-history-item">
                      <div className="manager-profile-history-photo-preview">
                        <img src={history.photo} alt="Profile" className="manager-profile-history-photo-thumbnail" />
                      </div>
                      <div className="manager-profile-history-details">
                        <div className="manager-profile-history-action">{getPhotoTypeLabel(history.type)}</div>
                        <div className="manager-profile-history-time">{formatDate(history.timestamp)}</div>
                      </div>
                      {index === 0 ? (
                        <div className="manager-profile-history-current-badge">Current</div>
                      ) : (
                        <div className="manager-profile-history-actions">
                          <button onClick={() => revertToPhoto(history)} className="manager-profile-history-revert-btn">
                            Revert
                          </button>
                          <button onClick={() => deletePhotoHistory(history.id)} className="manager-profile-history-delete-btn">
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
          
          <div className="manager-profile-actions">
            {activeTab !== 'photohistory' && (
              !isEditing ? (
                <button className="manager-profile-btn-edit" onClick={() => setIsEditing(true)}>✏️ Edit Profile</button>
              ) : (
                <>
                  <button className="manager-profile-btn-save" onClick={handleSave}>💾 Save Changes</button>
                  <button className="manager-profile-btn-cancel" onClick={() => setIsEditing(false)}>Cancel</button>
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