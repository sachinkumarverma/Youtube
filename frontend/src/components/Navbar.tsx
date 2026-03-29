import { Search, Bell, Video, User, Menu, Mic, Sun, Moon, X, Languages, LogOut, Trash2 } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../constants';
import { useToast } from './Toast';

// Declare SpeechRecognition types for TypeScript
interface SpeechRecognitionEvent {
  results: { [key: number]: { [key: number]: { transcript: string } } };
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

const Navbar = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [notifications, setNotifications] = useState<any[]>([]);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  // Voice search state
  const [isListening, setIsListening] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const navigate = useNavigate();
  const { language, setLanguage, t } = useTranslation();
  const { showToast } = useToast();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
        setShowNotificationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updateUser = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try { setUser(JSON.parse(userStr)); } catch (e) { }
      } else {
        setUser(null);
      }
    };

    updateUser();
    window.addEventListener('storage', updateUser);
    return () => window.removeEventListener('storage', updateUser);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchNotifications();
    }
  }, [isLoggedIn]);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setShowUserDropdown(false);
    navigate('/');
    window.location.reload();
  };

  const markAsRead = async (id: string) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API_BASE_URL}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) { console.error(err); }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_BASE_URL}/notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/`);
    }
  };

  // ─── Voice Search ────────────────────────────────────────
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startVoiceSearch = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Voice search is not supported in your browser. Please use Chrome.', 'info');
      return;
    }

    // If already listening, stop
    if (isListening) {
      stopListening();
      setShowVoiceModal(false);
      return;
    }

    const recognition: SpeechRecognitionInstance = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    recognitionRef.current = recognition;

    setVoiceTranscript('');
    setShowVoiceModal(true);
    setIsListening(true);

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < Object.keys(event.results).length; i++) {
        const result = event.results[i];
        if (result && result[0]) {
          const transcript = result[0].transcript;
          // Check if result is final
          if ((event.results[i] as any).isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
      }
      const currentTranscript = finalTranscript || interimTranscript;
      setVoiceTranscript(currentTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error);
      if (event.error !== 'aborted') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-search with the final transcript
      setVoiceTranscript(prev => {
        if (prev.trim()) {
          setSearchQuery(prev.trim());
          navigate(`/?q=${encodeURIComponent(prev.trim())}`);
          setTimeout(() => setShowVoiceModal(false), 600);
        } else {
          setTimeout(() => setShowVoiceModal(false), 1500);
        }
        return prev;
      });
    };

    recognition.start();
  }, [isListening, language, navigate, stopListening]);

  const closeVoiceModal = useCallback(() => {
    stopListening();
    setShowVoiceModal(false);
    setVoiceTranscript('');
  }, [stopListening]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      <nav className="navbar">
        <div className="nav-left">
          <button className="icon-btn" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <Link to="/" className="logo">
            <Video className="logo-icon" size={28} />
            <span className="logo-text">ViewTube</span>
          </Link>
        </div>

        <div className="nav-middle" style={{ display: 'flex', gap: '12px' }}>
          <form className="search-bar" onSubmit={handleSearch}>
            <input type="text" className="search-input" placeholder={t('search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            {searchQuery && (
              <button type="button" className="icon-btn" onClick={() => { setSearchQuery(''); navigate('/'); }} title="Clear search">
                <X size={20} />
              </button>
            )}
            <button type="submit" className="icon-btn" style={{ padding: '4px' }}>
              <Search size={20} />
            </button>
          </form>
          <button
            className="icon-btn"
            onClick={startVoiceSearch}
            title="Search with your voice"
            style={{
              background: isListening ? 'rgba(234, 67, 53, 0.2)' : 'var(--bg-secondary)',
              border: isListening ? '2px solid #ea4335' : 'none',
              transition: 'all 0.3s ease',
              width: '40px',
              height: '40px',
              display: 'grid',
              placeItems: 'center',
              borderRadius: '50%',
              flexShrink: 0
            }}
          >
            <Mic size={20} color={isListening ? '#ea4335' : undefined} />
          </button>
        </div>

        <div className="nav-right">
          {!isMobile && (
            <>
              <button className="icon-btn" onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')} title="Change Language" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: 'bold' }}>
                <Languages size={24} />
                <span style={{ textTransform: 'uppercase' }}>{language}</span>
              </button>
              <button className="icon-btn" onClick={toggleTheme} title="Toggle Theme">
                {theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
              </button>
              {isLoggedIn && (
                <Link to="/upload" className="icon-btn" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
                  <Video size={24} />
                </Link>
              )}
            </>
          )}

          <div style={{ position: 'relative' }} ref={notificationDropdownRef}>
            <button className="icon-btn" onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}>
              <Bell size={24} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '4px', right: '4px', background: '#cc0000', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', display: 'grid', placeItems: 'center', fontWeight: 'bold' }}>
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotificationDropdown && (
              <div
                className="user-dropdown"
                style={isMobile ? {
                  position: 'fixed',
                  top: '60px',
                  left: '12px',
                  right: '12px',
                  width: 'calc(100vw - 24px)',
                  maxWidth: '360px',
                  maxHeight: '480px',
                  overflowY: 'auto',
                  margin: '0 auto',
                  zIndex: 1000,
                  transform: 'none',
                } : {
                  right: 0,
                  width: '360px',
                  maxHeight: '480px',
                  overflowY: 'auto',
                }}
              >
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: 'bold', fontSize: '16px' }}>
                  {t('notifications')}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>{t('noNotifications' as any)}</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => { markAsRead(n.id); if (n.video_id) navigate(`/video/${n.video_id}`); }}
                      style={{
                        padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                        background: n.is_read ? 'transparent' : 'rgba(62, 166, 255, 0.05)',
                        display: 'flex', gap: '12px', position: 'relative'
                      }}
                      className="notification-item"
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: n.is_read ? 'normal' : 'bold', color: 'var(--text-primary)', fontSize: '14px' }}>{n.title}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{n.content}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(62, 166, 255, 0.8)', marginTop: '4px' }}>{new Date(n.created_at).toLocaleDateString()}</div>
                      </div>
                      <button onClick={(e) => deleteNotification(n.id, e)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
                        <Trash2 size={16} />
                      </button>
                      {!n.is_read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3ea6ff', position: 'absolute', left: '4px', top: '24px' }}></div>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {isLoggedIn ? (
            <div style={{ position: 'relative' }} ref={userDropdownRef}>
              <button className="icon-btn" onClick={() => setShowUserDropdown(!showUserDropdown)} title="Account" style={{ background: 'var(--bg-hover)', borderRadius: '50%', padding: user?.avatar_url ? '0' : '8px', overflow: 'hidden', width: '40px', height: '40px' }}>
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={24} color="var(--text-primary)" />
                )}
              </button>
              {showUserDropdown && (
                <div className="user-dropdown">
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--text-primary)' }}>{user?.username || 'User'}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>{user?.email || ''}</div>
                  </div>

                  <Link to={`/channel/${user?.id}`} onClick={() => setShowUserDropdown(false)} style={{ textDecoration: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', fontSize: '15px' }}>
                    <User size={18} />
                    {t('yourChannel')}
                  </Link>

                  <div style={{ height: '1px', background: 'var(--border)' }}></div>

                  <button onClick={handleLogout} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px' }}>
                    <LogOut size={18} />
                    {t('logout')}
                  </button>

                  {isMobile && (
                    <>
                      <div style={{ height: '1px', background: 'var(--border)' }}></div>
                      <Link to="/upload" onClick={() => setShowUserDropdown(false)} style={{ textDecoration: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', fontSize: '15px' }}>
                        <Video size={18} />
                        {t('upload')}
                      </Link>
                      <button onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px' }}>
                        <Languages size={18} />
                        {language === 'en' ? 'हिन्दी (Hindi)' : 'English'}
                      </button>
                      <button onClick={toggleTheme} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px' }}>
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        {theme === 'dark' ? t('lightMode' as any) || 'Light Mode' : t('darkMode' as any) || 'Dark Mode'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ position: 'relative' }} ref={userDropdownRef}>
              {isMobile ? (
                <button className="icon-btn" onClick={() => setShowUserDropdown(!showUserDropdown)}>
                  <User size={24} />
                </button>
              ) : (
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'transparent', border: '1px solid #3ea6ff', color: '#3ea6ff', borderRadius: '18px', cursor: 'pointer', fontWeight: 'bold' }}>
                    <User size={20} />
                    {t('login')}
                  </button>
                </Link>
              )}

              {isMobile && showUserDropdown && (
                <div className="user-dropdown">
                  <Link to="/login" onClick={() => setShowUserDropdown(false)} style={{ textDecoration: 'none', color: '#3ea6ff', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', fontSize: '15px', fontWeight: 'bold' }}>
                    <User size={18} />
                    {t('login')}
                  </Link>
                  <div style={{ height: '1px', background: 'var(--border)' }}></div>
                  <button onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px' }}>
                    <Languages size={18} />
                    {language === 'en' ? 'हिन्दी (Hindi)' : 'English'}
                  </button>
                  <button onClick={toggleTheme} style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px' }}>
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Voice Search Modal - YouTube Style */}
      {showVoiceModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(8px)'
          }}
          onClick={closeVoiceModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-primary)', borderRadius: '24px', padding: '48px 64px',
              textAlign: 'center', maxWidth: '500px', width: '90%',
              boxShadow: '0 25px 100px rgba(0,0,0,0.5)',
              animation: 'fadeInScale 0.3s ease-out'
            }}
          >
            {/* Close Button */}
            <button
              onClick={closeVoiceModal}
              style={{
                position: 'absolute', top: '24px', right: '24px',
                background: 'transparent', border: 'none', color: 'white',
                cursor: 'pointer', opacity: 0.7
              }}
            >
              <X size={28} />
            </button>

            {/* Listening text */}
            <p style={{
              color: 'var(--text-secondary)', fontSize: '24px', marginBottom: '32px',
              fontWeight: '300'
            }}>
              {isListening ? (voiceTranscript ? 'Listening...' : 'Listening...') : (voiceTranscript ? 'Processing...' : "Didn't catch that. Try again.")}
            </p>

            {/* Transcript */}
            {voiceTranscript && (
              <p style={{
                color: 'var(--text-primary)', fontSize: '28px', fontWeight: 'bold',
                marginBottom: '32px', minHeight: '40px', lineHeight: '1.3'
              }}>
                "{voiceTranscript}"
              </p>
            )}

            {/* Mic Button with animated rings */}
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              {isListening && (
                <>
                  <div style={{
                    position: 'absolute', width: '120px', height: '120px', borderRadius: '50%',
                    background: 'rgba(234, 67, 53, 0.1)', animation: 'voicePulse 1.5s ease-in-out infinite'
                  }} />
                  <div style={{
                    position: 'absolute', width: '160px', height: '160px', borderRadius: '50%',
                    background: 'rgba(234, 67, 53, 0.05)', animation: 'voicePulse 1.5s ease-in-out infinite 0.3s'
                  }} />
                </>
              )}
              <button
                onClick={isListening ? closeVoiceModal : startVoiceSearch}
                style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: isListening ? '#ea4335' : 'var(--bg-secondary)',
                  border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center',
                  transition: 'all 0.3s ease', position: 'relative', zIndex: 1,
                  boxShadow: isListening ? '0 0 30px rgba(234, 67, 53, 0.4)' : 'none'
                }}
              >
                <Mic size={36} color={isListening ? 'white' : 'var(--text-primary)'} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '24px', opacity: 0.6 }}>
              {isListening ? 'Tap microphone to cancel' : 'Tap microphone to try again'}
            </p>
          </div>
        </div>
      )}

      {/* Voice animations CSS */}
      <style>{`
        @keyframes voicePulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes fadeInScale {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default Navbar;
