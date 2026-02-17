import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Plus, Search, Tag, Image, Lock, Menu, X, ChevronLeft, ChevronRight, Trash2, Edit2, Save, Upload, Video, Music, FileText, XCircle, ZoomIn, LogOut, User } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import './storage';

const JournalApp = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editMedia, setEditMedia] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState('timeline');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [hoveredCalendarImage, setHoveredCalendarImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showTherapist, setShowTherapist] = useState(false);
const [therapistMessages, setTherapistMessages] = useState([]);
const [therapistInput, setTherapistInput] = useState('');
const [therapistLoading, setTherapistLoading] = useState(false);
const [currentLocation, setCurrentLocation] = useState(null);
const [showMapView, setShowMapView] = useState(false);
const [contentBlocks, setContentBlocks] = useState([{ type: 'text', content: '' }]);
  const fileInputRef = useRef(null);

  //Simulate Firebase Auth (replace with actual Firebase when you set it up)
  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('journalUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  const handleGoogleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Get user info from Google
        const res = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );
  
        const userInfo = {
          uid: res.data.sub,
          email: res.data.email,
          displayName: res.data.name,
          photoURL: res.data.picture,
        };
  
        setUser(userInfo);
        localStorage.setItem('journalUser', JSON.stringify(userInfo));
      } catch (err) {
        console.error('Google sign-in failed:', err);
        alert('Sign-in failed. Try again.');
      }
    },
    onError: () => {
      alert('Google Sign-In failed');
    },
  });

  const handleSignOut = () => {
    setUser(null);
    setEntries([]);
    localStorage.removeItem('journalUser');
  };
  


  const loadEntries = async () => {
    if (!user) return;
    
    try {
      const result = await window.storage.list(`entry:${user.uid}:`);
      if (result && result.keys) {
        const loadedEntries = await Promise.all(
          result.keys.map(async (key) => {
            try {
              const data = await window.storage.get(key);
              return data ? JSON.parse(data.value) : null;
            } catch (e) {
              return null;
            }
          })
        );
        const validEntries = loadedEntries.filter(e => e !== null);
        setEntries(validEntries.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }
    } catch (error) {
      console.log('No existing entries found');
    }
  };

  const saveEntry = async (entry) => {
    if (!user) return false;
    
    try {
      await window.storage.set(`entry:${user.uid}:${entry.id}`, JSON.stringify(entry));
      return true;
    } catch (error) {
      console.error('Failed to save entry:', error);
      return false;
    }
  };

  
  // const saveEntry = async (entry) => {
  //   try {
  //     await window.storage.set(`entry:${entry.id}`, JSON.stringify(entry));
  //     return true;
  //   } catch (error) {
  //     console.error('Failed to save entry:', error);
  //     return false;
  //   }
  // };



  const deleteEntryFromStorage = async (entryId) => {
    if (!user) return false;
    
    try {
      await window.storage.delete(`entry:${user.uid}:${entryId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete entry:', error);
      return false;
    }
  };

  // const createNewEntry = () => {
  //   const newEntry = {
  //     id: Date.now().toString(),
  //     title: '',
  //     content: '',
  //     date: new Date().toISOString(),
  //     tags: [],
  //     media: [],
  //     mood: null,
  //     userId: user.uid
  //   };
  //   setCurrentEntry(newEntry);
  //   setIsEditing(true);
  //   setEditTitle('');
  //   setEditContent('');
  //   setEditTags('');
  //   setEditMedia([]);
  //   setView('timeline');
  // };

  const createNewEntry = () => {
    const newEntry = {
      id: Date.now().toString(),
      title: '',
      content: '',
      contentBlocks: [{ type: 'text', content: '' }],
      date: new Date().toISOString(),
      tags: [],
      media: [],
      location: null,
      mood: null,
      userId: user.uid
    };
    
    // Get current location
// Get current location with place name
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      // Get place name from coordinates
      let placeName = 'Unknown Location';
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        
        // Build readable place name
        const address = data.address;
        const parts = [];
        
        if (address.road) parts.push(address.road);
        if (address.suburb || address.neighbourhood) parts.push(address.suburb || address.neighbourhood);
        if (address.city || address.town || address.village) parts.push(address.city || address.town || address.village);
        if (address.state) parts.push(address.state);
        if (address.country) parts.push(address.country);
        
        placeName = parts.slice(0, 3).join(', ') || data.display_name;
      } catch (error) {
        console.log('Could not get place name:', error);
      }
      
      newEntry.location = {
        lat: lat,
        lng: lng,
        placeName: placeName,
        timestamp: new Date().toISOString()
      };
      setCurrentLocation(newEntry.location);
    },
    (error) => {
      console.log('Location permission denied or unavailable');
    }
  );
}
    
    setCurrentEntry(newEntry);
    setIsEditing(true);
    setEditTitle('');
    setEditContent('');
    setEditTags('');
    setEditMedia([]);
    setContentBlocks([{ type: 'text', content: '' }]);
    setView('timeline');
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize if too large
          const maxDimension = 1920;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.8 quality
          const compressedData = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressedData);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // const handleFileUpload = (e) => {
  //   const files = Array.from(e.target.files);
    
  //   files.forEach(file => {
  //     const reader = new FileReader();
      
  //     reader.onload = (event) => {
  //       const mediaItem = {
  //         id: Date.now() + Math.random(),
  //         type: file.type.startsWith('image/') ? 'image' : 
  //               file.type.startsWith('video/') ? 'video' :
  //               file.type.startsWith('audio/') ? 'audio' : 'file',
  //         data: event.target.result,
  //         name: file.name,
  //         size: file.size
  //       };
        
  //       setEditMedia(prev => [...prev, mediaItem]);
  //     };
      
  //     reader.readAsDataURL(file);
  //   });
  // };

  const handleFileUpload = async (e, insertAtIndex = null) => {
    setUploading(true);
    const files = Array.from(e.target.files);
    
    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      
      // Check file size (limit 10MB for videos, 5MB for others)
      const maxSize = file.type.startsWith('video/') ? 200 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Max size: ${maxSize / (1024 * 1024)}MB`);
        continue;
      }
      
      try {
        let mediaData;
        
        // Compress images
        if (file.type.startsWith('image/')) {
          mediaData = await compressImage(file);
        } else {
          // For videos and audio, use as-is
          mediaData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.readAsDataURL(file);
          });
        }
        
        const mediaItem = {
          id: Date.now() + Math.random(),
          type: file.type.startsWith('image/') ? 'image' : 
                file.type.startsWith('video/') ? 'video' :
                file.type.startsWith('audio/') ? 'audio' : 'file',
          data: mediaData,
          name: file.name,
          size: file.size
        };
        
        if (insertAtIndex !== null) {
          // For future block-based editor
          setEditMedia(prev => [...prev, mediaItem]);
        } else {
          setEditMedia(prev => [...prev, mediaItem]);
        }
      } catch (error) {
        console.error('Error processing file:', error);
        alert(`Failed to process "${file.name}"`);
      }
    }
    
    // Clear the input
    setUploading(false);
    e.target.value = '';
  };

  

  const removeMedia = (mediaId) => {
    setEditMedia(prev => prev.filter(m => m.id !== mediaId));
  };

  const handleSaveEntry = async () => {
    if (!editContent.trim() && editMedia.length === 0) return;

    const entryToSave = {
      ...currentEntry,
      title: editTitle || new Date(currentEntry.date).toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      content: editContent,
      tags: editTags.split(',').map(t => t.trim()).filter(t => t),
      media: editMedia,
      lastModified: new Date().toISOString()
    };

    const saved = await saveEntry(entryToSave);
    if (saved) {
      const existingIndex = entries.findIndex(e => e.id === entryToSave.id);
      let newEntries;
      if (existingIndex >= 0) {
        newEntries = [...entries];
        newEntries[existingIndex] = entryToSave;
      } else {
        newEntries = [entryToSave, ...entries];
      }
      setEntries(newEntries);
      setCurrentEntry(entryToSave);
      setIsEditing(false);
    }
  };

  const handleEditEntry = () => {
    setEditTitle(currentEntry.title);
    setEditContent(currentEntry.content);
    setEditTags(currentEntry.tags.join(', '));
    setEditMedia(currentEntry.media || []);
    setIsEditing(true);
  };

  const handleDeleteEntry = async () => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      const deleted = await deleteEntryFromStorage(currentEntry.id);
      if (deleted) {
        setEntries(entries.filter(e => e.id !== currentEntry.id));
        setCurrentEntry(null);
        setIsEditing(false);
      }
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = searchQuery === '' || 
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const getDatesWithEntries = () => {
    const dates = new Set();
    entries.forEach(entry => {
      const date = new Date(entry.date);
      dates.add(date.toDateString());
    });
    return dates;
  };

  const getEntriesForDate = (date) => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.toDateString() === date.toDateString();
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const renderMediaItem = (media, showRemove = false) => {
    if (media.type === 'image') {
      return (
        <div key={media.id} className="relative group">
          <div className="w-full rounded-lg overflow-hidden bg-gray-800"></div>
          <img 
            src={media.data} 
            alt={media.name}
            className="w-full h-auto max-h-96 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setSelectedImage(media.data)}
          />
          {showRemove && (
            <button
              onClick={() => removeMedia(media.id)}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <XCircle size={20} />
            </button>
          )}
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {formatFileSize(media.size)}
          </div>
        </div>
      );
    }

    if (media.type === 'video') {
      return (
        <div key={media.id} className="relative group">
          <video 
            src={media.data} 
            controls
            className="w-full  max-h-80 object-contain rounded-lg"
          />
          {showRemove && (
            <button
              onClick={() => removeMedia(media.id)}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <XCircle size={20} />
            </button>
          )}
        </div>
      );
    }

    if (media.type === 'audio') {
      return (
        <div key={media.id} className="relative bg-gray-800 p-4 rounded-lg group">
          <div className="flex items-center gap-3 mb-2">
            <Music size={24} className="text-blue-400" />
            <div className="flex-1">
              <div className="text-sm font-medium">{media.name}</div>
              <div className="text-xs text-gray-400">{formatFileSize(media.size)}</div>
            </div>
            {showRemove && (
              <button
                onClick={() => removeMedia(media.id)}
                className="text-red-400 hover:text-red-300"
              >
                <XCircle size={20} />
              </button>
            )}
          </div>
          <audio src={media.data} controls className="w-full" />
        </div>
      );
    }

    return (
      <div key={media.id} className="relative bg-gray-800 p-4 rounded-lg flex items-center gap-3 group">
        <FileText size={24} className="text-gray-400" />
        <div className="flex-1">
          <div className="text-sm font-medium">{media.name}</div>
          <div className="text-xs text-gray-400">{formatFileSize(media.size)}</div>
        </div>
        {showRemove && (
          <button
            onClick={() => removeMedia(media.id)}
            className="text-red-400 hover:text-red-300"
          >
            <XCircle size={20} />
          </button>
        )}
      </div>
    );
  };

  // const renderCalendar = () => {
  //   const year = selectedDate.getFullYear();
  //   const month = selectedDate.getMonth();
  //   const firstDay = new Date(year, month, 1);
  //   const lastDay = new Date(year, month + 1, 0);
  //   const daysInMonth = lastDay.getDate();
  //   const startingDayOfWeek = firstDay.getDay();
    
  //   const days = [];
  //   const datesWithEntries = getDatesWithEntries();

  //   for (let i = 0; i < startingDayOfWeek; i++) {
  //     days.push(<div key={`empty-${i}`} className="h-20 border border-gray-700"></div>);
  //   }

  //   for (let day = 1; day <= daysInMonth; day++) {
  //     const date = new Date(year, month, day);
  //     const hasEntry = datesWithEntries.has(date.toDateString());
  //     const isToday = date.toDateString() === new Date().toDateString();
      
  //     days.push(
  //       <div 
  //         key={day}
  //         onClick={() => {
  //           const dayEntries = getEntriesForDate(date);
  //           if (dayEntries.length > 0) {
  //             setCurrentEntry(dayEntries[0]);
  //             setIsEditing(false);
  //           }
  //         }}
  //         className={`h-20 border border-gray-700 p-2 cursor-pointer hover:bg-gray-800 transition-colors ${
  //           hasEntry ? 'bg-blue-900/20' : ''
  //         } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
  //       >
  //         <div className={`text-sm ${isToday ? 'font-bold text-blue-400' : 'text-gray-400'}`}>
  //           {day}
  //         </div>
  //         {hasEntry && (
  //           <div className="mt-1">
  //             <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
  //           </div>
  //         )}
  //       </div>
  //     );
  //   }

  //   return days;
  // };

  const renderCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    const datesWithEntries = getDatesWithEntries();
  
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 border border-gray-700"></div>);
    }
  
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const hasEntry = datesWithEntries.has(date.toDateString());
      const isToday = date.toDateString() === new Date().toDateString();
      const dayEntries = getEntriesForDate(date);
      
      // Collect all images from entries for this day
      let allImages = [];
      if (dayEntries.length > 0) {
        dayEntries.forEach(entry => {
          if (entry.media && entry.media.length > 0) {
            const images = entry.media.filter(m => m.type === 'image');
            allImages = [...allImages, ...images];
          }
        });
      }
      
      // Randomly select one image if multiple exist
      let thumbnailImage = null;
      if (allImages.length > 0) {
        const randomIndex = Math.floor(Math.random() * allImages.length);
        thumbnailImage = allImages[randomIndex].data;
      }
      
      days.push(
        <div 
          key={day}
          onClick={() => {
            if (dayEntries.length > 0) {
              setCurrentEntry(dayEntries[0]);
              setIsEditing(false);
              setView('timeline');
              setHoveredCalendarImage(null);

            }
          }}
          onMouseEnter={() => thumbnailImage && setHoveredCalendarImage(thumbnailImage)}
          onMouseLeave={() => setHoveredCalendarImage(null)}
          className={`h-32 border border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors overflow-hidden relative ${
            hasEntry ? 'bg-blue-900/20' : ''
          } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
        >
          {/* Day number */}
          <div className={`relative z-10 p-2 text-sm font-semibold ${isToday ? 'text-blue-400' : 'text-gray-300'}`}>
            {day}
          </div>
          
          {/* Entry indicator or thumbnail */}
          {hasEntry && (
            <div className="relative z-10 px-2">
              {thumbnailImage ? (
                <img 
                  src={thumbnailImage} 
                  alt="Entry thumbnail"
                  className="w-full h-full object-cover rounded transition-transform hover:scale-105"
                />
              ) : (
                <div className="flex gap-1 mt-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  {dayEntries.length > 1 && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  )}
                </div>
              )}
              {dayEntries.length > 1 && (
                <div className="text-xs text-gray-400 mt-1">{dayEntries.length} entries</div>
              )}
            </div>
          )}
        </div>
      );
    }
  
    return days;
  };

  const changeMonth = (offset) => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + offset, 1));
  };

  const sendTherapistMessage = async () => {
    if (!therapistInput.trim()) return;
  
    const userMessage = { role: 'user', content: therapistInput };
    const updatedMessages = [...therapistMessages, userMessage];
    setTherapistMessages(updatedMessages);
    setTherapistInput('');
    setTherapistLoading(true);
  
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are a warm, empathetic, and supportive therapist helping someone with their journal. Your role is to:
  - Listen actively and validate their feelings
  - Ask thoughtful, open-ended questions to help them explore their emotions
  - Provide gentle guidance and coping strategies when appropriate
  - Be non-judgmental and create a safe space
  - Help them gain insights into their thoughts and feelings
  - Encourage self-reflection and personal growth
  - Be conversational and natural, not clinical
  - Show genuine care and compassion
  
  Keep responses concise (2-4 sentences) and focused on the person's emotional wellbeing.`,
          messages: updatedMessages,
        }),
      });
  
      const data = await response.json();
      const assistantMessage = {
        role: 'assistant',
        content: data.content[0].text,
      };
  
      setTherapistMessages([...updatedMessages, assistantMessage]);
    } catch (error) {
      console.error('Therapist AI error:', error);
      setTherapistMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content: "I'm here to listen. Could you tell me more about what's on your mind?",
        },
      ]);
    } finally {
      setTherapistLoading(false);
    }
  };
  
  const startTherapistSession = () => {
    setShowTherapist(true);
    if (therapistMessages.length === 0) {
      setTherapistMessages([
        {
          role: 'assistant',
          content: "Hello! I'm here to listen and support you. How are you feeling today? What's on your mind?",
        },
      ]);
    }
  };

  // Login Screen
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">My Journal</h1>
            <p className="text-gray-400">Your personal space for thoughts and memories</p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-3 transition-colors shadow-lg"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

          <p className="text-gray-500 text-sm text-center mt-6">
            Sign in to sync your journal across devices
          </p>
        </div>
      </div>
    );
  }

  // Main Journal App (when logged in)
  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
    {/* AI Therapist Modal */}
    {showTherapist && (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl w-full max-w-2xl h-[600px] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                💙
              </div>
              <div>
                <h3 className="font-semibold text-lg">Speak Your Heart</h3>
                <p className="text-sm text-gray-400">A safe space to share your feelings</p>
              </div>
            </div>
            <button
              onClick={() => setShowTherapist(false)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {therapistMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {therapistLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={therapistInput}
                onChange={(e) => setTherapistInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendTherapistMessage()}
                placeholder="Share what's on your mind..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={therapistLoading}
              />
              <button
                onClick={sendTherapistMessage}
                disabled={therapistLoading || !therapistInput.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                Send
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              This is an AI assistant, not a replacement for professional therapy
            </p>
          </div>
        </div>
      </div>
    )}


    {/* Hover Preview Modal */}
    {hoveredCalendarImage && (
      <div 
        className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center pointer-events-none"
      >
        <div className="bg-gray-800 p-2 rounded-lg shadow-2xl max-w-md">
          <img 
            src={hoveredCalendarImage} 
            alt="Preview"
            className="max-w-full max-h-96 object-contain rounded"
          />
        </div>
      </div>
    )}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X size={32} />
          </button>
          <img 
            src={selectedImage} 
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-gray-800 flex flex-col`}>
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-blue-400">My Journal</h1>
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <User size={16} />
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
          <button
            onClick={createNewEntry}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={20} />
            New Entry
          </button>

          {/* <button
  onClick={startTherapistSession}
  className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
>
  💙 Speak Your Heart
</button> */}
        </div>

        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="p-4 border-b border-gray-800">
          <div className="flex gap-2">
            {/* <button
              onClick={() => setView('timeline')}
              className={`flex-1 py-2 px-3 rounded-lg transition-colors ${
                view === 'timeline' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex-1 py-2 px-3 rounded-lg transition-colors ${
                view === 'calendar' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Calendar size={16} className="inline mr-1" />
              Calendar
            </button> */}
            <button
  onClick={() => {
    setView('timeline');
    setShowMapView(false);
  }}
  className={`flex-1 py-2 px-3 rounded-lg transition-colors ${
    view === 'timeline' && !showMapView ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
  }`}
>
  Timeline
</button>
<button
  onClick={() => {
    setView('calendar');
    setShowMapView(false);
  }}
  className={`flex-1 py-2 px-3 rounded-lg transition-colors ${
    view === 'calendar' && !showMapView ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
  }`}
>
  <Calendar size={16} className="inline mr-1" />
  Calendar
</button>
<button
  onClick={() => {
    setView('calendar');
    setShowMapView(true);
  }}
  className={`flex-1 py-2 px-3 rounded-lg transition-colors ${
    showMapView ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
  }`}
>
🌍 Map
</button>
            
          </div>
        </div>

        {view === 'timeline' && (
          <div className="flex-1 overflow-y-auto">
            {filteredEntries.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                <p>No entries yet</p>
                <p className="text-sm mt-2">Start journaling to see your timeline</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredEntries.map(entry => (
                  <div
                    key={entry.id}
                    onClick={() => {
                      setCurrentEntry(entry);
                      setIsEditing(false);
                    }}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      currentEntry?.id === entry.id ? 'bg-blue-900/30 border border-blue-600' : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    <div className="text-sm text-gray-400 mb-1">
                      {new Date(entry.date).toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    {/* <div className="font-medium mb-1">{entry.title}</div>
                    <div className="text-sm text-gray-400 line-clamp-2">{entry.content}</div> */}
                    <div className="font-medium mb-1">{entry.title}</div>
{entry.location && entry.location.placeName && (
  <div className="text-xs text-gray-500 mb-1">
    📍 {entry.location.placeName}
  </div>
)}
<div className="text-sm text-gray-400 line-clamp-2">{entry.content}</div>
                    
                    {entry.media && entry.media.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {entry.media.slice(0, 3).map(media => (
                          media.type === 'image' ? (
                            <img 
                              key={media.id}
                              src={media.data} 
                              alt=""
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div key={media.id} className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                              {media.type === 'video' ? <Video size={16} /> : <Music size={16} />}
                            </div>
                          )
                        ))}
                        {entry.media.length > 3 && (
                          <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center text-xs">
                            +{entry.media.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {entry.tags.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {entry.tags.map((tag, idx) => (
                          <span key={idx} className="text-xs bg-gray-700 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          {view === 'calendar' && (
            <div className="flex items-center gap-4">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-800 rounded-lg">
                <ChevronLeft size={20} />
              </button>
              <span className="font-semibold">
                {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-800 rounded-lg">
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {currentEntry && !isEditing && (
            <div className="flex gap-2">
              <button
                onClick={handleEditEntry}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Edit2 size={20} />
              </button>
              <button
                onClick={handleDeleteEntry}
                className="p-2 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )}

          {isEditing && (
            <div className="flex gap-2">
              {/* <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Upload size={20} />
                Add Media
              </button> */}
              <button
  onClick={() => fileInputRef.current?.click()}
  disabled={uploading}
  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
    uploading ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600'
  }`}
>
  <Upload size={20} />
  {uploading ? 'Processing...' : 'Add Media'}
</button>
              <button
                onClick={handleSaveEntry}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Save size={20} />
                Save Entry
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="flex-1 overflow-y-auto">
          {/* {view === 'calendar' ? ( */}
          {view === 'calendar' && showMapView ? (
  <div className="h-full p-4">
    <div className="bg-gray-800 rounded-lg h-full flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold">Entry Locations</h3>
        <p className="text-sm text-gray-400">See where you wrote your entries</p>
      </div>
      <div className="flex-1 relative">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps/embed/v1/view?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&center=${
            entries.filter(e => e.location).length > 0
              ? `${entries.filter(e => e.location)[0].location.lat},${entries.filter(e => e.location)[0].location.lng}`
              : '40.7128,-74.0060'
          }&zoom=10`}
          allowFullScreen
          className="rounded-b-lg"
        />
        {entries.filter(e => e.location).length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-b-lg">
            <div className="text-center">
              <div className="text-4xl mb-2">🗺️</div>
              <p className="text-gray-400">No entries with location data yet</p>
              <p className="text-sm text-gray-500 mt-2">Create entries to see them on the map</p>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-700 max-h-48 overflow-y-auto">
        <h4 className="text-sm font-semibold mb-2">Entries with Locations ({entries.filter(e => e.location).length})</h4>
        <div className="space-y-2">
          {entries.filter(e => e.location).slice(0, 5).map(entry => (
            <div
              key={entry.id}
              onClick={() => {
                setCurrentEntry(entry);
                setIsEditing(false);
                setView('timeline');
                setShowMapView(false);
              }}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded cursor-pointer text-sm"
            >
              <div className="font-medium">{entry.title}</div>
              <div className="text-xs text-gray-400">
  {new Date(entry.date).toLocaleDateString()} • 
  📍 {entry.location.placeName || `${entry.location.lat.toFixed(4)}, ${entry.location.lng.toFixed(4)}`}
</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
) : view === 'calendar' ? (
            <div className="p-8">
              <div className="grid grid-cols-7 gap-0 max-w-5xl mx-auto">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="h-12 flex items-center justify-center font-semibold text-gray-400 border border-gray-800">
                    {day}
                  </div>
                ))}
                {renderCalendar()}
              </div>
            </div>
          ) : (
            <>
              {!currentEntry && !isEditing ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Calendar size={64} className="mx-auto mb-4 opacity-50" />
                    <p className="text-xl mb-2">Select an entry or create a new one</p>
                    <button
                      onClick={createNewEntry}
                      className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Start Writing
                    </button>
                  </div>
                </div>
              ) : isEditing ? (
                <div className="p-8 max-w-4xl mx-auto">
                  <input
                    type="text"
                    placeholder="Entry Title (optional)"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-3xl font-bold bg-transparent border-none outline-none mb-2 placeholder-gray-600"
                  />
                  <div className="text-sm text-gray-400 mb-6">
                    {new Date(currentEntry.date).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>

                  {editMedia.length > 0 && (
                    <div className="mb-6 grid grid-cols-2 gap-4">
                      {editMedia.map(media => renderMediaItem(media, true))}
                    </div>
                  )}

                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full h-96 bg-transparent border border-gray-700 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="mt-4">
                    <label className="block text-sm text-gray-400 mb-2">Tags (comma-separated)</label>
                    <input
                      type="text"
                      placeholder="work, personal, ideas..."
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-8 max-w-4xl mx-auto">
                  <h2 className="text-3xl font-bold mb-2">{currentEntry.title}</h2>
                  <div className="text-sm text-gray-400 mb-6">
                    {new Date(currentEntry.date).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>

                  <div className="prose prose-invert max-w-none mb-6">
  {currentEntry.content.split('{{image}}').map((textPart, index) => (
    <React.Fragment key={index}>
      <div className="whitespace-pre-wrap">{textPart}</div>
      {index < currentEntry.media?.length && currentEntry.media[index] && (
        <div className="my-4">
          {renderMediaItem(currentEntry.media[index], false)}
        </div>
      )}
    </React.Fragment>
  ))}
</div>
                  {currentEntry.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {currentEntry.tags.map((tag, idx) => (
                        <span key={idx} className="bg-blue-900/30 text-blue-300 px-3 py-1 rounded-full text-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalApp;