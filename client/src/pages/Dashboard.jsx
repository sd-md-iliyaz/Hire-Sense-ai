import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "./dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeScore, setResumeScore] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [skillMatchResults, setSkillMatchResults] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const fileInputRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);

  // Initialize state FIRST before any functions that use them
  const [certificateFiles, setCertificateFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadError, setUploadError] = useState("");

  // Resume form state
  const [resumeData, setResumeData] = useState({
    fullName: "",
    email: "",
    phone: "",
    summary: "",
    skills: "",
    experience: "",
    education: "",
    certifications: "",
    projects: ""
  });

  // Job suggestions with required skills (move this up before functions that use it)
  const jobSuggestions = [
    {
      id: 1,
      title: "Frontend Developer",
      requiredSkills: ["JavaScript", "React", "HTML", "CSS", "TypeScript", "Responsive Design"],
      icon: "🎨",
      color: "#4f9eff"
    },
    {
      id: 2,
      title: "Backend Developer",
      requiredSkills: ["Python", "Java", "Node.js", "SQL", "API Design", "Database Management"],
      icon: "⚙️",
      color: "#9f7aea"
    },
    {
      id: 3,
      title: "Full Stack Developer",
      requiredSkills: ["JavaScript", "React", "Node.js", "MongoDB", "Express", "REST APIs"],
      icon: "🔄",
      color: "#48bb78"
    },
    {
      id: 4,
      title: "Data Scientist",
      requiredSkills: ["Python", "Machine Learning", "SQL", "Statistics", "TensorFlow", "Data Visualization"],
      icon: "📊",
      color: "#f687b3"
    },
    {
      id: 5,
      title: "DevOps Engineer",
      requiredSkills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Terraform"],
      icon: "🚀",
      color: "#fc8181"
    },
    {
      id: 6,
      title: "Mobile Developer",
      requiredSkills: ["React Native", "Swift", "Kotlin", "Mobile UI", "API Integration", "App Store Deployment"],
      icon: "📱",
      color: "#f6ad55"
    }
  ];

  // Mock user data
  const user = {
    name: "Alex Johnson",
    avatar: "👨‍💻",
    level: "Advanced",
    streak: 15,
    interviewsCompleted: 24,
    averageScore: 87,
    notifications: 3
  };

  // Daily tasks
  const dailyTasks = [
    { id: 1, task: "Complete 1 mock interview", progress: 0, total: 1, icon: "🎯" },
    { id: 2, task: "Review feedback from yesterday", progress: 0, total: 1, icon: "📊" },
    { id: 3, task: "Practice behavioral questions", progress: 3, total: 5, icon: "💬" },
    { id: 4, task: "Learn new industry terms", progress: 2, total: 10, icon: "📚" }
  ];

  // AI Avatars
  const aiAvatars = [
    { id: 1, name: "Nova", role: "Technical Mentor", avatar: "🧠", status: "online", color: "#4f9eff" },
    { id: 2, name: "Atlas", role: "Career Coach", avatar: "🌟", status: "busy", color: "#9f7aea" },
    { id: 3, name: "Echo", role: "Industry Expert", avatar: "💼", status: "available", color: "#48bb78" },
    { id: 4, name: "Sage", role: "Feedback Analyst", avatar: "📊", status: "online", color: "#f687b3" }
  ];

  // Upcoming interviews
  const upcomingInterviews = [
    { company: "Google", position: "Software Engineer", date: "Tomorrow, 10:00 AM", color: "#4285f4" },
    { company: "Microsoft", position: "Product Manager", date: "Mar 15, 2:00 PM", color: "#00a4ef" },
    { company: "Amazon", position: "Data Scientist", date: "Mar 18, 11:00 AM", color: "#ff9900" }
  ];

  // Recent feedback
  const recentFeedback = [
    { id: 1, type: "Technical Interview", score: 85, feedback: "Good problem-solving, needs more optimization", date: "2 hours ago" },
    { id: 2, type: "Behavioral Interview", score: 92, feedback: "Excellent STAR method responses", date: "Yesterday" },
    { id: 3, type: "System Design", score: 78, feedback: "Work on scalability concepts", date: "3 days ago" }
  ];

  // Recommended courses
  const recommendedCourses = [
    { id: 1, title: "Advanced Algorithms", progress: 45, instructor: "Nova", duration: "6 hours", icon: "🧮" },
    { id: 2, title: "System Design Masterclass", progress: 20, instructor: "Atlas", duration: "8 hours", icon: "🏗️" },
    { id: 3, title: "Behavioral Interview Prep", progress: 60, instructor: "Echo", duration: "4 hours", icon: "🗣️" }
  ];

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  // Load saved data from localStorage on initial load
  useEffect(() => {
    loadSavedData();
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (showResumeModal) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        saveResumeData();
      }, 2000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [resumeData, certificateFiles, showResumeModal]);

  const handleLogout = () => {
    navigate("/login");
  };

  // Save data to localStorage
  const saveResumeData = () => {
    try {
      setIsSaving(true);
      
      const dataToSave = {
        resumeData,
        certificateFiles: certificateFiles.map(cert => ({
          id: cert.id,
          name: cert.name,
          type: cert.type,
          size: cert.size,
          uploadDate: cert.uploadDate,
          verified: cert.verified
        })),
        selectedJob: selectedJob ? {
          id: selectedJob.id,
          title: selectedJob.title
        } : null,
        skillMatchResults: skillMatchResults ? {
          matchPercentage: skillMatchResults.matchPercentage,
          matchedSkills: skillMatchResults.matchedSkills,
          missingSkills: skillMatchResults.missingSkills,
          skillScores: skillMatchResults.skillScores
        } : null,
        lastUpdated: new Date().toISOString()
      };

      localStorage.setItem('resumeData', JSON.stringify(dataToSave));
      setLastSaved(new Date());
      
      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    } catch (error) {
      console.error('Error saving resume data:', error);
      setIsSaving(false);
    }
  };

  // Load data from localStorage
  const loadSavedData = () => {
    try {
      const savedData = localStorage.getItem('resumeData');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        
        setResumeData(parsed.resumeData || {
          fullName: "",
          email: "",
          phone: "",
          summary: "",
          skills: "",
          experience: "",
          education: "",
          certifications: "",
          projects: ""
        });

        setCertificateFiles(parsed.certificateFiles || []);

        if (parsed.selectedJob) {
          const fullJob = jobSuggestions.find(j => j.id === parsed.selectedJob.id);
          setSelectedJob(fullJob || null);
        }

        if (parsed.skillMatchResults) {
          setSkillMatchResults(parsed.skillMatchResults);
        }

        if (parsed.lastUpdated) {
          setLastSaved(new Date(parsed.lastUpdated));
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  // Clear saved data
  const clearSavedData = () => {
    localStorage.removeItem('resumeData');
    setLastSaved(null);
    resetResumeForm();
  };

  // Export data as JSON file
  const exportResumeData = () => {
    try {
      const dataToExport = {
        resumeData,
        certificateFiles,
        selectedJob: selectedJob ? {
          id: selectedJob.id,
          title: selectedJob.title
        } : null,
        skillMatchResults,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export resume data');
    }
  };

  // Import data from JSON file
  const importResumeData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        
        setResumeData(imported.resumeData || resumeData);
        setCertificateFiles(imported.certificateFiles || []);
        
        if (imported.selectedJob) {
          const fullJob = jobSuggestions.find(j => j.id === imported.selectedJob.id);
          setSelectedJob(fullJob || null);
        }
        
        if (imported.skillMatchResults) {
          setSkillMatchResults(imported.skillMatchResults);
        }

        saveResumeData();
        
        alert('Resume data imported successfully!');
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Failed to import resume data. Invalid file format.');
      }
    };
    reader.readAsText(file);
  };

  // Handle resume form input changes with auto-save
  const handleResumeInputChange = (e) => {
    const { name, value } = e.target;
    setResumeData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file upload for certificates
  const handleCertificateUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Please upload PDF or images only.`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name}: File size exceeds 5MB limit.`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setUploadError(errors.join('\n'));
      setTimeout(() => setUploadError(""), 5000);
    }

    validFiles.forEach(file => {
      const fileId = Date.now() + file.name;
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: 0
      }));

      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[fileId] || 0;
          if (currentProgress >= 100) {
            clearInterval(interval);
            return prev;
          }
          return {
            ...prev,
            [fileId]: currentProgress + 10
          };
        });
      }, 200);

      setTimeout(() => {
        setCertificateFiles(prev => [...prev, {
          id: fileId,
          name: file.name,
          type: file.type,
          size: (file.size / 1024).toFixed(2),
          uploadDate: new Date().toLocaleDateString(),
          verified: Math.random() > 0.3
        }]);
        
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });

        saveResumeData();
      }, 2000);
    });
  };

  // Remove certificate
  const removeCertificate = (certId) => {
    setCertificateFiles(prev => prev.filter(cert => cert.id !== certId));
    saveResumeData();
  };

  // Compare skills with selected job
  const compareSkillsWithJob = (job) => {
    setSelectedJob(job);
    
    const userSkills = resumeData.skills
      .split(',')
      .map(skill => skill.trim().toLowerCase())
      .filter(skill => skill.length > 0);

    const requiredSkills = job.requiredSkills.map(skill => skill.toLowerCase());
    
    const matchedSkills = [];
    const missingSkills = [];

    requiredSkills.forEach(requiredSkill => {
      const matched = userSkills.some(userSkill => 
        userSkill.includes(requiredSkill) || requiredSkill.includes(userSkill)
      );
      
      if (matched) {
        matchedSkills.push(requiredSkill);
      } else {
        missingSkills.push(requiredSkill);
      }
    });

    const matchPercentage = Math.round((matchedSkills.length / requiredSkills.length) * 100);

    const skillScores = {};
    matchedSkills.forEach(skill => {
      const hasCertification = certificateFiles.some(cert => 
        cert.name.toLowerCase().includes(skill)
      );
      
      const baseScore = 60 + Math.floor(Math.random() * 30);
      skillScores[skill] = hasCertification ? Math.min(100, baseScore + 15) : baseScore;
    });

    const results = {
      matchPercentage,
      matchedSkills,
      missingSkills,
      skillScores,
      recommendations: generateRecommendations(matchedSkills, missingSkills, job)
    };

    setSkillMatchResults(results);
    saveResumeData();
  };

  // Generate recommendations based on skill gaps
  const generateRecommendations = (matched, missing, job) => {
    const recommendations = [];

    if (missing.length > 0) {
      recommendations.push({
        type: "skill_gap",
        message: `You're missing ${missing.length} key skills for ${job.title}: ${missing.join(', ')}`,
        action: "Take recommended courses"
      });
    }

    const relevantCerts = certificateFiles.filter(cert => 
      job.requiredSkills.some(skill => 
        cert.name.toLowerCase().includes(skill.toLowerCase())
      )
    );

    if (relevantCerts.length === 0) {
      recommendations.push({
        type: "certification",
        message: `Upload relevant certificates for ${job.title} to boost your profile`,
        action: "Upload certificates"
      });
    }

    return recommendations;
  };

  // Analyze resume and calculate score
  const analyzeResume = () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const scores = calculateResumeScore(resumeData);
      setResumeScore(scores);
      setIsAnalyzing(false);
      saveResumeData();
    }, 2000);
  };

  // Calculate resume score based on various factors
  const calculateResumeScore = (data) => {
    const weights = {
      personal: 10,
      summary: 15,
      skills: 25,
      experience: 25,
      education: 15,
      certifications: 5,
      projects: 5
    };

    const personalScore = [
      data.fullName.trim().length > 0,
      data.email.includes('@'),
      data.phone.replace(/\D/g, '').length >= 10
    ].filter(Boolean).length * (weights.personal / 3);

    const summaryWords = data.summary.trim().split(/\s+/).length;
    const summaryScore = Math.min(weights.summary, (summaryWords / 50) * weights.summary);

    const skillsList = data.skills.split(',').filter(s => s.trim().length > 0);
    const skillsScore = Math.min(weights.skills, (skillsList.length / 10) * weights.skills);

    const experienceLines = data.experience.split('\n').filter(line => line.trim().length > 0);
    const experienceScore = Math.min(weights.experience, (experienceLines.length / 5) * weights.experience);

    const educationScore = data.education.trim().length > 20 ? weights.education : weights.education * 0.5;

    const certsList = data.certifications.split(',').filter(c => c.trim().length > 0);
    const uploadedCertsBonus = Math.min(10, certificateFiles.length * 2);
    const certsScore = Math.min(weights.certifications + uploadedCertsBonus, 
      (certsList.length / 3) * weights.certifications + uploadedCertsBonus);

    const projectsList = data.projects.split('\n').filter(p => p.trim().length > 0);
    const projectsScore = Math.min(weights.projects, (projectsList.length / 3) * weights.projects);

    const totalScore = Math.round(
      personalScore + summaryScore + skillsScore + 
      experienceScore + educationScore + certsScore + projectsScore
    );

    const breakdown = {
      personal: Math.round(personalScore),
      summary: Math.round(summaryScore),
      skills: Math.round(skillsScore),
      experience: Math.round(experienceScore),
      education: Math.round(educationScore),
      certifications: Math.round(certsScore),
      projects: Math.round(projectsScore),
      total: Math.min(100, totalScore)
    };

    const feedback = [];
    if (skillsScore < weights.skills * 0.7) {
      feedback.push("Add more relevant skills to improve your score");
    }
    if (experienceScore < weights.experience * 0.7) {
      feedback.push("Provide more detailed experience descriptions");
    }
    if (summaryScore < weights.summary * 0.7) {
      feedback.push("Write a more comprehensive professional summary");
    }
    if (projectsScore < weights.projects * 0.7) {
      feedback.push("Include more project details to showcase your work");
    }
    if (certificateFiles.length === 0) {
      feedback.push("Upload certificates to verify your skills and boost your score");
    }

    return {
      ...breakdown,
      feedback: feedback.length > 0 ? feedback : ["Your resume looks great! Consider adding more quantifiable achievements."]
    };
  };

  // Get score color
  const getScoreColor = (score) => {
    if (score >= 80) return "#48bb78";
    if (score >= 60) return "#ecc94b";
    return "#f56565";
  };

  // Reset resume form
  const resetResumeForm = () => {
    setResumeData({
      fullName: "",
      email: "",
      phone: "",
      summary: "",
      skills: "",
      experience: "",
      education: "",
      certifications: "",
      projects: ""
    });
    setCertificateFiles([]);
    setResumeScore(null);
    setSelectedJob(null);
    setSkillMatchResults(null);
    localStorage.removeItem('resumeData');
    setLastSaved(null);
  };

  // Format last saved time
  const getLastSavedText = () => {
    if (!lastSaved) return null;
    const now = new Date();
    const diff = Math.floor((now - lastSaved) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return lastSaved.toLocaleDateString();
  };

  return (
    <div className="dashboard-container">
      {/* Neural Network Background */}
      <div className="dashboard-bg">
        <div className="bg-grid"></div>
        <div className="bg-glow glow-1"></div>
        <div className="bg-glow glow-2"></div>
        <div className="bg-glow glow-3"></div>
      </div>

      {/* Navigation Bar */}
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <Link to="/dashboard" className="brand-logo">
            <span className="logo-icon">🎯</span>
            <span className="logo-text">InterviewAI</span>
          </Link>
        </div>

        <div className="nav-menu">
          <Link 
            to="/dashboard" 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span>Overview</span>
          </Link>
          <Link 
            to="/Planning" 
            className={`nav-item ${activeTab === 'Planning' ? 'active' : ''}`}
            onClick={() => setActiveTab('Planning')}
          >
            <span className="nav-icon">🎙️</span>
            <span>Interviews</span>
          </Link>
          <Link 
            to="/Results" 
            className={`nav-item ${activeTab === 'Results' ? 'active' : ''}`}
            onClick={() => setActiveTab('Results')}
          >
            <span className="nav-icon">📝</span>
            <span>Feedback</span>
          </Link>
          <Link 
            to="/History" 
            className={`nav-item ${activeTab === 'History' ? 'active' : ''}`}
            onClick={() => setActiveTab('History')}
          >
            <span className="nav-icon">📚</span>
            <span>History</span>
          </Link>
          <Link 
            to="/Courses" 
            className={`nav-item ${activeTab === 'Courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('Courses')}
          >
            <span className="nav-icon">🎓</span>
            <span>Courses</span>
          </Link>
          <Link 
            to="/Practice" 
            className={`nav-item ${activeTab === 'Practice' ? 'active' : ''}`}
            onClick={() => setActiveTab('Practice')}
          >
            <span className="nav-icon">⚡</span>
            <span>Practice</span>
          </Link>
          <Link 
            to="/Results" 
            className={`nav-item ${activeTab === 'Results' ? 'active' : ''}`}
            onClick={() => setActiveTab('Results')}
          >
            <span className="nav-icon">📈</span>
            <span>Results</span>
          </Link>
          <Link 
            to="/Settings" 
            className={`nav-item ${activeTab === 'Settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('Settings')}
          >
            <span className="nav-icon">⚙️</span>
            <span>Settings</span>
          </Link>
        </div>

        <div className="nav-right">
          {/* Resume Button */}
          <button className="resume-btn" onClick={() => setShowResumeModal(true)}>
            <span className="resume-icon">📄</span>
            <span>Resume Score</span>
          </button>

          {/* Notifications */}
          <div className="notifications-dropdown">
            <button 
              className="notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <span className="notification-icon">🔔</span>
              {user.notifications > 0 && (
                <span className="notification-badge">{user.notifications}</span>
              )}
            </button>
            {showNotifications && (
              <div className="dropdown-menu notifications-menu">
                <div className="dropdown-header">
                  <h4>Notifications</h4>
                  <span className="mark-read">Mark all as read</span>
                </div>
                <div className="notification-item unread">
                  <span className="noti-icon">📊</span>
                  <div className="noti-content">
                    <p>Your interview feedback is ready</p>
                    <span className="noti-time">5 min ago</span>
                  </div>
                </div>
                <div className="notification-item">
                  <span className="noti-icon">🎯</span>
                  <div className="noti-content">
                    <p>New practice session available</p>
                    <span className="noti-time">1 hour ago</span>
                  </div>
                </div>
                <div className="notification-item">
                  <span className="noti-icon">🏆</span>
                  <div className="noti-content">
                    <p>You've completed 25 interviews!</p>
                    <span className="noti-time">Yesterday</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="profile-dropdown">
            <button 
              className="profile-btn"
              onClick={() => setShowProfile(!showProfile)}
            >
              <span className="profile-avatar">{user.avatar}</span>
              <span className="profile-name">{user.name.split(' ')[0]}</span>
            </button>
            {showProfile && (
              <div className="dropdown-menu profile-menu">
                <div className="profile-header">
                  <span className="profile-avatar-large">{user.avatar}</span>
                  <div className="profile-info">
                    <h4>{user.name}</h4>
                    <p>{user.level} Level</p>
                  </div>
                </div>
                <div className="profile-stats">
                  <div className="profile-stat">
                    <span className="stat-value">{user.streak}</span>
                    <span className="stat-label">Day Streak</span>
                  </div>
                  <div className="profile-stat">
                    <span className="stat-value">{user.interviewsCompleted}</span>
                    <span className="stat-label">Interviews</span>
                  </div>
                  <div className="profile-stat">
                    <span className="stat-value">{user.averageScore}%</span>
                    <span className="stat-label">Avg. Score</span>
                  </div>
                </div>
                <div className="profile-links">
                  <Link to="/profile">View Profile</Link>
                  <Link to="/settings">Settings</Link>
                  <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Resume Modal */}
      {showResumeModal && (
        <div className="modal-overlay" onClick={() => setShowResumeModal(false)}>
          <div className="resume-modal resume-modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <span className="modal-icon">📄</span>
                Resume Analyzer & Job Matcher
              </h2>
              <div className="header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {/* Save Status Indicator */}
                <div className="save-status">
                  {isSaving ? (
                    <span className="saving-indicator" style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                      <span className="spinner-small" style={{ marginRight: '0.3rem' }}></span>
                      Saving...
                    </span>
                  ) : lastSaved && (
                    <span className="saved-indicator" style={{ color: '#48bb78', fontSize: '0.9rem' }}>
                      ✓ Saved {getLastSavedText()}
                    </span>
                  )}
                </div>
                
                {/* Import/Export Buttons */}
                <div className="data-management" style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="file"
                    id="import-file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={importResumeData}
                  />
                  <button 
                    className="icon-btn"
                    onClick={() => document.getElementById('import-file').click()}
                    title="Import Resume Data"
                    style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    📂
                  </button>
                  <button 
                    className="icon-btn"
                    onClick={exportResumeData}
                    title="Export Resume Data"
                    style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    💾
                  </button>
                  <button 
                    className="icon-btn"
                    onClick={clearSavedData}
                    title="Clear All Data"
                    style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#f56565' }}
                  >
                    🗑️
                  </button>
                </div>
                
                <button className="close-modal" onClick={() => setShowResumeModal(false)}>×</button>
              </div>
            </div>

            <div className="modal-content">
              {!resumeScore ? (
                <div className="resume-form">
                  {/* Personal Information */}
                  <div className="form-section">
                    <h3>Personal Information</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          name="fullName"
                          value={resumeData.fullName}
                          onChange={handleResumeInputChange}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="form-group">
                        <label>Email *</label>
                        <input
                          type="email"
                          name="email"
                          value={resumeData.email}
                          onChange={handleResumeInputChange}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          value={resumeData.phone}
                          onChange={handleResumeInputChange}
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Summary */}
                  <div className="form-section">
                    <h3>Professional Summary</h3>
                    <div className="form-group">
                      <textarea
                        name="summary"
                        value={resumeData.summary}
                        onChange={handleResumeInputChange}
                        placeholder="Write a brief professional summary (2-3 sentences)"
                        rows="4"
                      />
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div className="form-section">
                    <h3>Skills</h3>
                    <div className="form-group">
                      <textarea
                        name="skills"
                        value={resumeData.skills}
                        onChange={handleResumeInputChange}
                        placeholder="List your skills (comma separated) e.g., JavaScript, React, Node.js"
                        rows="3"
                      />
                    </div>
                  </div>

                  {/* Job Suggestions Section */}
                  <div className="job-suggestions-section">
                    <h3>
                      <span className="section-icon">🎯</span>
                      Job Suggestions
                    </h3>
                    <p className="section-subtitle">Select a job to compare with your skills above</p>
                    <div className="job-grid">
                      {jobSuggestions.map(job => (
                        <button
                          key={job.id}
                          className={`job-card ${selectedJob?.id === job.id ? 'selected' : ''}`}
                          onClick={() => compareSkillsWithJob(job)}
                          style={{ borderColor: selectedJob?.id === job.id ? job.color : 'transparent' }}
                        >
                          <div className="job-icon" style={{ backgroundColor: `${job.color}20` }}>
                            {job.icon}
                          </div>
                          <h4>{job.title}</h4>
                          <div className="job-skills-preview">
                            {job.requiredSkills.slice(0, 3).map((skill, i) => (
                              <span key={i} className="skill-tag-small">{skill}</span>
                            ))}
                            {job.requiredSkills.length > 3 && (
                              <span className="skill-tag-small">+{job.requiredSkills.length - 3}</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Skill Match Results */}
                  {selectedJob && skillMatchResults && (
                    <div className="skill-match-results">
                      <h3>
                        <span className="section-icon">📊</span>
                        Skill Match for {selectedJob.title}
                      </h3>
                      
                      <div className="match-percentage">
                        <div className="match-circle">
                          <svg viewBox="0 0 36 36" className="match-svg">
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#1e3a8a"
                              strokeWidth="3"
                            />
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke={getScoreColor(skillMatchResults.matchPercentage)}
                              strokeWidth="3"
                              strokeDasharray={`${skillMatchResults.matchPercentage}, 100`}
                              strokeLinecap="round"
                            />
                            <text x="18" y="20.35" className="match-text">{skillMatchResults.matchPercentage}%</text>
                          </svg>
                        </div>
                        <div className="match-details">
                          <p>Match Score</p>
                          <div className="match-stats">
                            <span className="match-stat good">
                              <span className="stat-dot"></span>
                              Matched: {skillMatchResults.matchedSkills.length}
                            </span>
                            <span className="match-stat missing">
                              <span className="stat-dot"></span>
                              Missing: {skillMatchResults.missingSkills.length}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="skills-comparison">
                        <div className="matched-skills">
                          <h4>✅ Matched Skills</h4>
                          <div className="skills-list">
                            {skillMatchResults.matchedSkills.map((skill, index) => (
                              <div key={index} className="skill-item">
                                <span className="skill-name">{skill}</span>
                                <div className="skill-level">
                                  <div className="skill-bar">
                                    <div 
                                      className="skill-bar-fill" 
                                      style={{ 
                                        width: `${skillMatchResults.skillScores[skill]}%`,
                                        backgroundColor: getScoreColor(skillMatchResults.skillScores[skill])
                                      }}
                                    ></div>
                                  </div>
                                  <span className="skill-score">{skillMatchResults.skillScores[skill]}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {skillMatchResults.missingSkills.length > 0 && (
                          <div className="missing-skills">
                            <h4>❌ Skills to Develop</h4>
                            <div className="missing-list">
                              {skillMatchResults.missingSkills.map((skill, index) => (
                                <div key={index} className="missing-item">
                                  <span>{skill}</span>
                                  <button className="learn-more-btn">Learn</button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {skillMatchResults.recommendations.length > 0 && (
                        <div className="match-recommendations">
                          <h4>💡 Recommendations</h4>
                          <ul>
                            {skillMatchResults.recommendations.map((rec, index) => (
                              <li key={index}>
                                <span className="rec-message">{rec.message}</span>
                                <button className="rec-action">{rec.action}</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Work Experience */}
                  <div className="form-section">
                    <h3>Work Experience</h3>
                    <div className="form-group">
                      <textarea
                        name="experience"
                        value={resumeData.experience}
                        onChange={handleResumeInputChange}
                        placeholder="Describe your work experience (one line per position)"
                        rows="5"
                      />
                    </div>
                  </div>

                  {/* Education */}
                  <div className="form-section">
                    <h3>Education</h3>
                    <div className="form-group">
                      <textarea
                        name="education"
                        value={resumeData.education}
                        onChange={handleResumeInputChange}
                        placeholder="Your educational background"
                        rows="3"
                      />
                    </div>
                  </div>

                  {/* Certifications Section */}
                  <div className="form-section">
                    <h3>
                      <span className="section-icon">📜</span>
                      Certifications & Professional Documents
                    </h3>
                    
                    <div className="certificate-upload">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleCertificateUpload}
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        style={{ display: 'none' }}
                      />
                      
                      <div 
                        className="upload-area"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="upload-icon">📤</div>
                        <h4>Upload Certificates</h4>
                        <p>Click to browse or drag and drop</p>
                        <span className="upload-hint">
                          Supports: PDF, JPEG, PNG (Max 5MB each)
                        </span>
                      </div>

                      {Object.keys(uploadProgress).length > 0 && (
                        <div className="upload-progress">
                          {Object.entries(uploadProgress).map(([fileId, progress]) => (
                            <div key={fileId} className="progress-item">
                              <span>Uploading...</span>
                              <div className="progress-bar">
                                <div 
                                  className="progress-fill" 
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                              <span className="progress-percent">{progress}%</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {uploadError && (
                        <div className="upload-error">
                          ⚠️ {uploadError}
                        </div>
                      )}

                      {certificateFiles.length > 0 && (
                        <div className="certificates-list">
                          <h4>Uploaded Certificates ({certificateFiles.length})</h4>
                          {certificateFiles.map(cert => (
                            <div key={cert.id} className="certificate-item">
                              <div className="certificate-icon">
                                {cert.type.includes('pdf') ? '📄' : '🖼️'}
                              </div>
                              <div className="certificate-details">
                                <div className="certificate-name">{cert.name}</div>
                                <div className="certificate-meta">
                                  <span>{cert.size} KB</span>
                                  <span>•</span>
                                  <span>Uploaded: {cert.uploadDate}</span>
                                  {cert.verified && (
                                    <span className="verified-badge">✓ Verified</span>
                                  )}
                                </div>
                              </div>
                              <button 
                                className="remove-cert"
                                onClick={() => removeCertificate(cert.id)}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Additional Certifications (Optional)</label>
                      <textarea
                        name="certifications"
                        value={resumeData.certifications}
                        onChange={handleResumeInputChange}
                        placeholder="List any additional certifications not uploaded above (comma separated)"
                        rows="2"
                      />
                    </div>
                  </div>

                  {/* Projects */}
                  <div className="form-section">
                    <h3>Projects</h3>
                    <div className="form-group">
                      <textarea
                        name="projects"
                        value={resumeData.projects}
                        onChange={handleResumeInputChange}
                        placeholder="Describe your key projects (one per line)"
                        rows="4"
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="form-actions">
                    <button className="cancel-btn" onClick={resetResumeForm}>
                      Clear Form
                    </button>
                    <button 
                      className="analyze-btn"
                      onClick={analyzeResume}
                      disabled={isAnalyzing || !resumeData.fullName || !resumeData.email}
                    >
                      {isAnalyzing ? (
                        <>
                          <span className="spinner-small"></span>
                          Analyzing...
                        </>
                      ) : (
                        'Analyze Resume'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                // Resume Score Results
                <div className="resume-score-results">
                  <div className="score-circle-large">
                    <svg viewBox="0 0 36 36" className="score-svg-large">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#1e3a8a"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={getScoreColor(resumeScore.total)}
                        strokeWidth="3"
                        strokeDasharray={`${resumeScore.total}, 100`}
                        strokeLinecap="round"
                      />
                      <text x="18" y="20.35" className="score-text-large">{resumeScore.total}%</text>
                    </svg>
                  </div>

                  <h3>Resume Score Breakdown</h3>
                  
                  <div className="score-breakdown">
                    <div className="score-item">
                      <span>Personal Info</span>
                      <div className="score-bar">
                        <div 
                          className="score-bar-fill" 
                          style={{ 
                            width: `${resumeScore.personal}%`, 
                            backgroundColor: getScoreColor(resumeScore.personal) 
                          }}
                        ></div>
                      </div>
                      <span className="score-value">{resumeScore.personal}%</span>
                    </div>

                    <div className="score-item">
                      <span>Professional Summary</span>
                      <div className="score-bar">
                        <div 
                          className="score-bar-fill" 
                          style={{ 
                            width: `${resumeScore.summary}%`, 
                            backgroundColor: getScoreColor(resumeScore.summary) 
                          }}
                        ></div>
                      </div>
                      <span className="score-value">{resumeScore.summary}%</span>
                    </div>

                    <div className="score-item">
                      <span>Skills</span>
                      <div className="score-bar">
                        <div 
                          className="score-bar-fill" 
                          style={{ 
                            width: `${resumeScore.skills}%`, 
                            backgroundColor: getScoreColor(resumeScore.skills) 
                          }}
                        ></div>
                      </div>
                      <span className="score-value">{resumeScore.skills}%</span>
                    </div>

                    <div className="score-item">
                      <span>Work Experience</span>
                      <div className="score-bar">
                        <div 
                          className="score-bar-fill" 
                          style={{ 
                            width: `${resumeScore.experience}%`, 
                            backgroundColor: getScoreColor(resumeScore.experience) 
                          }}
                        ></div>
                      </div>
                      <span className="score-value">{resumeScore.experience}%</span>
                    </div>

                    <div className="score-item">
                      <span>Education</span>
                      <div className="score-bar">
                        <div 
                          className="score-bar-fill" 
                          style={{ 
                            width: `${resumeScore.education}%`, 
                            backgroundColor: getScoreColor(resumeScore.education) 
                          }}
                        ></div>
                      </div>
                      <span className="score-value">{resumeScore.education}%</span>
                    </div>

                    <div className="score-item">
                      <span>Certifications</span>
                      <div className="score-bar">
                        <div 
                          className="score-bar-fill" 
                          style={{ 
                            width: `${resumeScore.certifications}%`, 
                            backgroundColor: getScoreColor(resumeScore.certifications) 
                          }}
                        ></div>
                      </div>
                      <span className="score-value">{resumeScore.certifications}%</span>
                    </div>

                    <div className="score-item">
                      <span>Projects</span>
                      <div className="score-bar">
                        <div 
                          className="score-bar-fill" 
                          style={{ 
                            width: `${resumeScore.projects}%`, 
                            backgroundColor: getScoreColor(resumeScore.projects) 
                          }}
                        ></div>
                      </div>
                      <span className="score-value">{resumeScore.projects}%</span>
                    </div>
                  </div>

                  <div className="feedback-section">
                    <h4>📝 Improvement Suggestions</h4>
                    <ul className="feedback-list">
                      {resumeScore.feedback.map((tip, index) => (
                        <li key={index}>
                          <span className="feedback-bullet">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {selectedJob && skillMatchResults && (
                    <div className="job-match-summary">
                      <h4>🎯 Job Match Summary</h4>
                      <div className="job-match-card">
                        <div className="job-match-header">
                          <span className="job-match-title">{selectedJob.title}</span>
                          <span 
                            className="job-match-score"
                            style={{ color: getScoreColor(skillMatchResults.matchPercentage) }}
                          >
                            {skillMatchResults.matchPercentage}% Match
                          </span>
                        </div>
                        <div className="job-match-skills">
                          <div className="match-skills-matched">
                            <strong>Matched:</strong> {skillMatchResults.matchedSkills.join(', ')}
                          </div>
                          {skillMatchResults.missingSkills.length > 0 && (
                            <div className="match-skills-missing">
                              <strong>Need Improvement:</strong> {skillMatchResults.missingSkills.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="certificate-summary">
                    <h4>📜 Uploaded Certificates</h4>
                    {certificateFiles.length > 0 ? (
                      <div className="certificate-summary-list">
                        {certificateFiles.map(cert => (
                          <div key={cert.id} className="certificate-summary-item">
                            <span className="cert-summary-icon">
                              {cert.type.includes('pdf') ? '📄' : '🖼️'}
                            </span>
                            <span className="cert-summary-name">{cert.name}</span>
                            {cert.verified && (
                              <span className="verified-badge-small">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-certificates">No certificates uploaded yet</p>
                    )}
                  </div>

                  <div className="score-actions">
                    <button 
                      className="edit-resume-btn" 
                      onClick={() => setResumeScore(null)}
                    >
                      ✏️ Edit Resume
                    </button>
                    <button 
                      className="download-report-btn"
                      onClick={() => {
                        alert('Resume report downloaded! Check your downloads folder.');
                      }}
                    >
                      📥 Download Report
                    </button>
                    <button 
                      className="new-analysis-btn"
                      onClick={resetResumeForm}
                    >
                      🔄 New Analysis
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      <main className="dashboard-main">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-text">
            <h1>{greeting}, {user.name}! 👋</h1>
            <p>Ready to ace your next interview? Here's your progress overview.</p>
          </div>
          <div className="quick-actions">
            <button className="action-btn primary" onClick={() => navigate("/planning")}>
              <span>🎯</span>
              New Interview
            </button>
            <button className="action-btn secondary" onClick={() => navigate("/practice")}>
              <span>⚡</span>
              Quick Practice
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-details">
              <span className="stat-label">Interviews Completed</span>
              <span className="stat-value-large">{user.interviewsCompleted}</span>
              <span className="stat-trend positive">+12% this week</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-details">
              <span className="stat-label">Average Score</span>
              <span className="stat-value-large">{user.averageScore}%</span>
              <span className="stat-trend positive">+5% improvement</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-details">
              <span className="stat-label">Current Streak</span>
              <span className="stat-value-large">{user.streak} days</span>
              <span className="stat-trend">Keep it up!</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-details">
              <span className="stat-label">Achievements</span>
              <span className="stat-value-large">12</span>
              <span className="stat-trend">3 new this month</span>
            </div>
          </div>
        </div>

        {/* AI Avatars Section */}
        <div className="ai-avatars-section">
          <h2>Your AI Mentors</h2>
          <div className="avatars-grid">
            {aiAvatars.map(avatar => (
              <div key={avatar.id} className="avatar-card">
                <div className="avatar-status" style={{ backgroundColor: avatar.color }}>
                  <span className="status-dot"></span>
                </div>
                <div className="avatar-icon-large" style={{ background: `${avatar.color}20` }}>
                  {avatar.avatar}
                </div>
                <h3>{avatar.name}</h3>
                <p>{avatar.role}</p>
                <span className="avatar-status-text" style={{ color: avatar.color }}>
                  ● {avatar.status}
                </span>
                <button className="avatar-chat-btn">Chat Now</button>
              </div>
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="dashboard-grid">
          {/* Left Column */}
          <div className="grid-left">
            {/* Daily Tasks */}
            <div className="tasks-section">
              <h2>Today's Tasks</h2>
              <div className="tasks-list">
                {dailyTasks.map(task => (
                  <div key={task.id} className="task-item">
                    <span className="task-icon">{task.icon}</span>
                    <div className="task-content">
                      <span className="task-name">{task.task}</span>
                      <div className="task-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${(task.progress / task.total) * 100}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">{task.progress}/{task.total}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Feedback */}
            <div className="feedback-section">
              <h2>Recent Feedback</h2>
              <div className="feedback-list">
                {recentFeedback.map(feedback => (
                  <div key={feedback.id} className="feedback-item">
                    <div className="feedback-header">
                      <span className="feedback-type">{feedback.type}</span>
                      <span className="feedback-score" style={{
                        color: feedback.score >= 85 ? '#48bb78' : feedback.score >= 70 ? '#ecc94b' : '#f56565'
                      }}>{feedback.score}%</span>
                    </div>
                    <p className="feedback-comment">{feedback.feedback}</p>
                    <span className="feedback-time">{feedback.date}</span>
                  </div>
                ))}
              </div>
              <Link to="/feedback" className="view-all-link">View All Feedback →</Link>
            </div>
          </div>

          {/* Right Column */}
          <div className="grid-right">
            {/* Upcoming Interviews */}
            <div className="upcoming-section">
              <h2>Upcoming Interviews</h2>
              <div className="upcoming-list">
                {upcomingInterviews.map((interview, index) => (
                  <div key={index} className="upcoming-item">
                    <div className="company-color" style={{ backgroundColor: interview.color }}></div>
                    <div className="interview-details">
                      <h3>{interview.company}</h3>
                      <p>{interview.position}</p>
                      <span className="interview-date">{interview.date}</span>
                    </div>
                    <button className="prepare-btn">Prepare</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Courses */}
            <div className="courses-section">
              <h2>Recommended Courses</h2>
              <div className="courses-list">
                {recommendedCourses.map(course => (
                  <div key={course.id} className="course-item">
                    <span className="course-icon">{course.icon}</span>
                    <div className="course-details">
                      <h3>{course.title}</h3>
                      <p>By {course.instructor} • {course.duration}</p>
                      <div className="course-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${course.progress}%` }}></div>
                        </div>
                        <span className="progress-text">{course.progress}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/courses" className="view-all-link">Browse All Courses →</Link>
            </div>

            {/* Quick Tips */}
            <div className="tips-section">
              <h2>Quick Tips</h2>
              <div className="tips-list">
                <div className="tip-item">
                  <span className="tip-icon">💡</span>
                  <p>Use the STAR method for behavioral questions</p>
                </div>
                <div className="tip-item">
                  <span className="tip-icon">🎯</span>
                  <p>Practice 15 minutes daily to build confidence</p>
                </div>
                <div className="tip-item">
                  <span className="tip-icon">📝</span>
                  <p>Review feedback after each interview session</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}