import React, { useState, useRef, useEffect, useCallback } from "react";
import Avatar from "../Components/Avatar";
import { Link } from "react-router-dom";
import "./interview.css";

const Interview = () => {
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [showAvatarSelect, setShowAvatarSelect] = useState(true);
  const [interviewMode, setInterviewMode] = useState(null);
  const [interviewActive, setInterviewActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [answerAnalysis, setAnswerAnalysis] = useState(null);
  const [grammarChecked, setGrammarChecked] = useState(false);
  const [autoListenEnabled, setAutoListenEnabled] = useState(true);
  const [voiceTranscript, setVoiceTranscript] = useState("");

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const autoListenTimeoutRef = useRef(null);

  // LanguageTool API endpoint
  const GRAMMAR_API_URL = "https://api.languagetoolplus.com/v2/check";

  const avatars = [
    { id: 1, name: "Emma", role: "HR Manager", color: "#1e3a8a", expertise: "HR & Behavioral" },
    { id: 2, name: "John", role: "Technical Lead", color: "#0f172a", expertise: "Technical & System Design" },
    { id: 3, name: "Sophia", role: "Senior Recruiter", color: "#1e293b", expertise: "Career & Strategy" }
  ];

  const questions = [
    { 
      id: 1,
      question: "Tell me about yourself.",
      context: "Opening question to understand background",
      keywords: ["experience", "skills", "background", "education", "career"],
      idealAnswer: "A strong answer includes: current role, relevant experience, key achievements, and career goals."
    },
    { 
      id: 2,
      question: "What are your strengths?",
      context: "Understanding self-awareness and value proposition",
      keywords: ["communication", "problem-solving", "teamwork", "leadership", "dedicated", "analytical"],
      idealAnswer: "Focus on strengths relevant to the role with specific examples."
    },
    { 
      id: 3,
      question: "Describe a challenging project you worked on.",
      context: "Assessing problem-solving and project management skills",
      keywords: ["challenge", "problem", "solution", "team", "completed", "success", "deadline"],
      idealAnswer: "Use STAR method: Situation, Task, Action, Result."
    },
    { 
      id: 4,
      question: "Why should we hire you?",
      context: "Evaluating fit and motivation",
      keywords: ["value", "skills", "contribute", "company", "experience", "passion", "growth"],
      idealAnswer: "Connect your unique value to company needs and culture."
    }
  ];

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check permissions on mount
  useEffect(() => {
    checkMicrophonePermission();
    
    return () => {
      cleanupResources();
    };
  }, []);

  const cleanupResources = () => {
    window.speechSynthesis.cancel();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (autoListenTimeoutRef.current) {
      clearTimeout(autoListenTimeoutRef.current);
    }
  };

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionGranted(true);
      mediaStreamRef.current = stream;
    } catch (error) {
      console.log("Microphone permission not granted");
      setPermissionGranted(false);
    }
  };

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionGranted(true);
      mediaStreamRef.current = stream;
      return true;
    } catch (error) {
      console.error("Permission denied:", error);
      alert("Microphone access is required for the interview. Please allow access and try again.");
      return false;
    }
  };

  // Grammar checking function
  const checkGrammar = async (text) => {
    try {
      const formData = new URLSearchParams();
      formData.append('text', text);
      formData.append('language', 'en-US');
      
      const response = await fetch(GRAMMAR_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.matches && data.matches.length > 0) {
        const corrections = data.matches.map(match => ({
          message: match.message,
          replacements: match.replacements.map(r => r.value),
          offset: match.offset,
          length: match.length
        }));
        return corrections;
      }
      return [];
    } catch (error) {
      console.error("Grammar check failed:", error);
      return [];
    }
  };

  // Improve text with grammar corrections
  const improveText = async (text, corrections) => {
    let improvedText = text;
    const sortedCorrections = [...corrections].sort((a, b) => b.offset - a.offset);
    
    for (const correction of sortedCorrections) {
      if (correction.replacements.length > 0) {
        const before = improvedText.substring(0, correction.offset);
        const after = improvedText.substring(correction.offset + correction.length);
        improvedText = before + correction.replacements[0] + after;
      }
    }
    
    return improvedText !== text ? improvedText : null;
  };

  // Analyze answer quality
  const analyzeAnswer = (answer, questionIndex) => {
    const question = questions[questionIndex];
    if (!question) return null;

    const answerLower = answer.toLowerCase();
    
    const keywordMatches = question.keywords.filter(keyword => 
      answerLower.includes(keyword.toLowerCase())
    );
    
    const keywordScore = Math.min(100, (keywordMatches.length / question.keywords.length) * 100);
    const lengthScore = Math.min(100, (answer.length / 200) * 100);
    const sentenceScore = Math.min(100, (answer.split('.').length / 3) * 100);
    
    const overallScore = Math.round(
      (keywordScore * 0.5) + (lengthScore * 0.25) + (sentenceScore * 0.25)
    );

    let feedback = "";
    let suggestions = [];

    if (overallScore >= 85) {
      feedback = "🌟 Excellent answer! You've covered key points effectively.";
    } else if (overallScore >= 70) {
      feedback = "👍 Good answer! Here are some suggestions to make it even better:";
      if (keywordScore < 70) {
        suggestions.push("Include more relevant keywords like: " + question.keywords.slice(0, 3).join(", "));
      }
      if (lengthScore < 70) {
        suggestions.push("Add more detail to your answer (aim for 2-3 sentences).");
      }
    } else if (overallScore >= 50) {
      feedback = "📝 Decent attempt. Let's work on improving:";
      suggestions.push("Try to structure your answer better.");
      suggestions.push(`Key points to cover: ${question.idealAnswer}`);
    } else {
      feedback = "💡 Let's strengthen your answer:";
      suggestions.push("Start with a clear introduction of your relevant experience.");
      suggestions.push("Use specific examples to support your points.");
      suggestions.push(`Consider including: ${question.keywords.slice(0, 4).join(", ")}`);
    }

    return {
      score: overallScore,
      feedback,
      suggestions,
      keywordMatches: keywordMatches.length,
      totalKeywords: question.keywords.length,
      length: answer.length,
      grammarIssues: grammarChecked
    };
  };

  // Professional AI speech
  const speak = useCallback((text, callback) => {
    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = 0.9;
    speech.pitch = 1.1;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google UK Female') || 
      voice.name.includes('Microsoft Susan') ||
      voice.name.includes('Samantha')
    );
    
    if (preferredVoice) {
      speech.voice = preferredVoice;
    }

    speech.onstart = () => setIsAISpeaking(true);
    speech.onend = () => {
      setIsAISpeaking(false);
      // Auto-start listening in voice mode after AI finishes speaking
      if (interviewMode === 'voice' && interviewActive && autoListenEnabled) {
        // Small delay before starting to listen
        autoListenTimeoutRef.current = setTimeout(() => {
          startVoiceRecognition();
        }, 500);
      }
      if (callback) callback();
    };
    speech.onerror = () => setIsAISpeaking(false);

    window.speechSynthesis.speak(speech);
  }, [interviewMode, interviewActive, autoListenEnabled]);

  // Voice recognition setup
  const startVoiceRecognition = useCallback(() => {
    // Don't start if already listening or processing or if AI is speaking
    if (isListening || isProcessing || isAISpeaking || !interviewActive) {
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice recognition is not supported. Please use Chrome, Edge, or Safari.");
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors
      }
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.maxAlternatives = 1;

    let finalTranscript = '';
    setVoiceTranscript("");

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event) => {
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          setVoiceTranscript(finalTranscript);
        } else {
          interimTranscript += transcript;
          setVoiceTranscript(interimTranscript + "...");
        }
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setVoiceTranscript("");
      
      // Retry listening after error if interview is still active
      if (interviewMode === 'voice' && interviewActive && !isProcessing) {
        autoListenTimeoutRef.current = setTimeout(() => {
          startVoiceRecognition();
        }, 1000);
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      if (finalTranscript.trim() && interviewActive) {
        processVoiceInput(finalTranscript.trim());
      } else if (interviewMode === 'voice' && interviewActive && !isProcessing && !isAISpeaking) {
        // Restart listening if no speech detected
        autoListenTimeoutRef.current = setTimeout(() => {
          startVoiceRecognition();
        }, 500);
      }
      setVoiceTranscript("");
    };

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error("Failed to start recognition:", error);
      setIsListening(false);
    }
  }, [interviewMode, interviewActive, isListening, isProcessing, isAISpeaking]);

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors
      }
      setIsListening(false);
      setVoiceTranscript("");
    }
    if (autoListenTimeoutRef.current) {
      clearTimeout(autoListenTimeoutRef.current);
    }
  };

  // Process voice input
  const processVoiceInput = async (transcript) => {
    setIsProcessing(true);
    stopVoiceRecognition();
    
    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      sender: "user",
      message: transcript,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, userMessage]);

    // Check grammar
    const corrections = await checkGrammar(transcript);
    let improvedText = transcript;
    let grammarMessage = "";
    
    if (corrections.length > 0) {
      const improved = await improveText(transcript, corrections);
      if (improved) {
        improvedText = improved;
        setGrammarChecked(true);
        grammarMessage = "📝 I've analyzed your grammar. ";
      }
    }

    // Analyze answer
    const analysis = analyzeAnswer(improvedText, currentQuestion);
    setAnswerAnalysis(analysis);

    // Prepare AI response with feedback
    let aiResponse = grammarMessage;
    aiResponse += analysis.feedback;
    
    if (analysis.suggestions.length > 0) {
      aiResponse += ` Here are some suggestions: ${analysis.suggestions.join(' ')}`;
    }

    // Add AI response to chat
    setTimeout(() => {
      const feedbackMessage = {
        id: Date.now() + 1,
        sender: "ai",
        message: aiResponse,
        timestamp: new Date().toLocaleTimeString(),
        isFeedback: true,
        score: analysis.score
      };
      
      setMessages(prev => [...prev, feedbackMessage]);
      
      // Speak the feedback
      speak(aiResponse, () => {
        setTimeout(() => {
          moveToNextQuestion();
        }, 2000);
      });
    }, 1000);

    setIsProcessing(false);
  };

  const startStandardInterview = async (avatar) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setSelectedAvatar(avatar);
    setInterviewMode('standard');
    setShowAvatarSelect(false);
    setInterviewActive(true);
    setMessages([]);
    setCurrentQuestion(0);
    setAutoListenEnabled(false);

    const welcomeMessage = `Hello! I'm ${avatar.name}, your ${avatar.role}. I specialize in ${avatar.expertise}. Let's begin your interview.`;

    setMessages([{
      id: Date.now(),
      sender: "ai",
      message: welcomeMessage,
      timestamp: new Date().toLocaleTimeString()
    }]);

    speak(welcomeMessage, () => {
      setTimeout(() => askQuestion(0), 1500);
    });
  };

  const startVoiceInterview = async (avatar) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setSelectedAvatar(avatar);
    setInterviewMode('voice');
    setShowAvatarSelect(false);
    setInterviewActive(true);
    setMessages([]);
    setCurrentQuestion(0);
    setAutoListenEnabled(true);

    const welcomeMessage = `Hello! I'm ${avatar.name}, your ${avatar.role}. I'll be conducting your voice interview. Speak clearly and I'll provide feedback on your answers.`;

    setMessages([{
      id: Date.now(),
      sender: "ai",
      message: welcomeMessage,
      timestamp: new Date().toLocaleTimeString()
    }]);

    speak(welcomeMessage, () => {
      setTimeout(() => askQuestion(0), 2000);
    });
  };

  const askQuestion = (index) => {
    if (index < questions.length) {
      const questionData = questions[index];
      
      const aiMessage = {
        id: Date.now(),
        sender: "ai",
        message: questionData.question,
        timestamp: new Date().toLocaleTimeString(),
        context: questionData.context
      };

      setMessages(prev => [...prev, aiMessage]);
      setCurrentQuestion(index);
      
      speak(questionData.question);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    if (isListening) {
      stopVoiceRecognition();
    }

    setIsProcessing(true);
    const userInput = input;
    setInput("");

    const userMessage = {
      id: Date.now(),
      sender: "user",
      message: userInput,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setMessages(prev => [...prev, userMessage]);

    const corrections = await checkGrammar(userInput);
    let improvedText = userInput;
    
    if (corrections.length > 0) {
      const improved = await improveText(userInput, corrections);
      if (improved) {
        improvedText = improved;
        setGrammarChecked(true);
      }
    }

    const analysis = analyzeAnswer(improvedText, currentQuestion);
    setAnswerAnalysis(analysis);

    let feedback = "";
    
    if (corrections.length > 0 && improvedText !== userInput) {
      feedback += `📝 Grammar suggestions applied. `;
    }
    
    feedback += analysis.feedback;
    
    if (analysis.suggestions.length > 0) {
      feedback += `\n\nSuggestions:\n• ${analysis.suggestions.join('\n• ')}`;
    }

    feedback += `\n\nScore: ${analysis.score}%`;

    setTimeout(() => {
      const feedbackMessage = {
        id: Date.now() + 1,
        sender: "ai",
        message: feedback,
        timestamp: new Date().toLocaleTimeString(),
        isFeedback: true,
        score: analysis.score
      };
      
      setMessages(prev => [...prev, feedbackMessage]);
      
      setTimeout(() => moveToNextQuestion(), 3000);
    }, 1000);

    setIsProcessing(false);
  };

  const moveToNextQuestion = () => {
    const nextIndex = currentQuestion + 1;

    if (nextIndex < questions.length) {
      setCurrentQuestion(nextIndex);
      askQuestion(nextIndex);
    } else {
      const completionMessage = {
        id: Date.now(),
        sender: "ai",
        message: "🌟 Congratulations on completing the interview! Let me calculate your overall performance...",
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, completionMessage]);
      
      speak("Thank you for completing the interview! I'll now evaluate your overall performance.", () => {
        setTimeout(() => endInterview(), 2000);
      });
    }
  };

  const endInterview = () => {
    stopVoiceRecognition();
    cleanupResources();
    setInterviewActive(false);
    setShowResults(true);
    setAutoListenEnabled(false);
  };

  const goBackToSelection = () => {
    stopVoiceRecognition();
    cleanupResources();
    setShowAvatarSelect(true);
    setInterviewMode(null);
    setSelectedAvatar(null);
    setInterviewActive(false);
    setMessages([]);
    setCurrentQuestion(0);
    setAnswerAnalysis(null);
    setAutoListenEnabled(false);
  };

  const restartInterview = () => {
    stopVoiceRecognition();
    cleanupResources();
    setShowResults(false);
    setShowAvatarSelect(true);
    setInterviewMode(null);
    setSelectedAvatar(null);
    setMessages([]);
    setCurrentQuestion(0);
    setAnswerAnalysis(null);
    setAutoListenEnabled(false);
  };

  // Calculate overall performance
  const calculateOverallScore = () => {
    if (!messages.length) return 0;
    
    const feedbackMessages = messages.filter(m => m.isFeedback && m.score);
    if (feedbackMessages.length === 0) return 0;
    
    const totalScore = feedbackMessages.reduce((sum, msg) => sum + (msg.score || 0), 0);
    return Math.round(totalScore / feedbackMessages.length);
  };

  // Avatar Selection Screen
  if (showAvatarSelect) {
    return (
      <div className="interview-wrapper">
        <div className="selection-container">
          <div className="selection-header">
            <h1>Choose Your Interview Experience</h1>
            <p>Select an interviewer and practice mode with AI feedback</p>
          </div>

          <div className="interviewers-grid">
            {avatars.map((avatar) => (
              <div key={avatar.id} className="interviewer-card">
                <div className="interviewer-avatar" style={{ background: avatar.color }}>
                  {avatar.name.charAt(0)}
                </div>
                <h3>{avatar.name}</h3>
                <p className="interviewer-role">{avatar.role}</p>
                <p className="interviewer-expertise">{avatar.expertise}</p>
                
                <div className="mode-buttons">
                  <button 
                    className="mode-btn standard-btn"
                    onClick={() => startStandardInterview(avatar)}
                  >
                    <span className="btn-icon">💬</span>
                    <div className="btn-content">
                      <strong>Text Interview</strong>
                      <small>Type responses + Grammar check</small>
                    </div>
                  </button>
                  
                  <button 
                    className="mode-btn voice-btn"
                    onClick={() => startVoiceInterview(avatar)}
                    disabled={!permissionGranted}
                  >
                    <span className="btn-icon">🎤</span>
                    <div className="btn-content">
                      <strong>Voice Interview</strong>
                      <small>Speak + Instant feedback</small>
                    </div>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!permissionGranted && (
            <div className="permission-warning">
              <p>⚠️ Microphone access required for voice interviews</p>
              <button onClick={requestPermissions} className="permission-btn">
                Allow Microphone
              </button>
            </div>
          )}

          <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  // Voice Interview Mode - FIXED: Now shows fullscreen avatar without chat interface
  if (interviewMode === 'voice' && interviewActive) {
    return (
      <div className="interview-wrapper">
        <div className="voice-interview-container">
          <div className="voice-interview-header">
            <button onClick={goBackToSelection} className="back-btn">
              ← Change
            </button>
            <div className="header-info">
              <span className="interviewer-badge">
                {selectedAvatar?.name} • {selectedAvatar?.role}
              </span>
              <span className="mode-badge">
                {isListening ? "🎤 Listening..." : isAISpeaking ? "🔊 Speaking..." : "Ready..."}
              </span>
            </div>
            <button onClick={endInterview} className="end-btn">End Interview</button>
          </div>
          
          <div className="avatar-fullscreen">
            <Avatar 
              key={selectedAvatar?.id}
              isSpeaking={isAISpeaking}
              isListening={isListening}
              avatarColor={selectedAvatar?.color}
            />
            
            {/* Voice Transcript Overlay */}
            {voiceTranscript && (
              <div className="voice-transcript-overlay">
                <p>{voiceTranscript}</p>
              </div>
            )}
            
            {/* Status Indicators */}
            {isListening && (
              <div className="listening-indicator-overlay">
                <div className="wave-animation">
                  <span></span><span></span><span></span><span></span><span></span>
                </div>
                <p>Listening... Speak clearly</p>
              </div>
            )}
            
            {isProcessing && (
              <div className="processing-indicator-overlay">
                <div className="spinner"></div>
                <p>Analyzing your answer...</p>
              </div>
            )}
          </div>

          {/* Minimal message display at bottom */}
          <div className="voice-message-minimal">
            {messages.slice(-2).map((msg) => (
              <div key={msg.id} className={`minimal-message ${msg.sender}`}>
                <span className="minimal-sender">{msg.sender === 'ai' ? selectedAvatar?.name : 'You'}:</span>
                <span className="minimal-text">{msg.message.substring(0, 50)}...</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Results Screen
  if (showResults) {
    const overallScore = calculateOverallScore();
    
    return (
      <div className="interview-wrapper">
        <div className="results-card">
          <div className="results-icon">🎉</div>
          <h2>Interview Completed!</h2>
          <p>Great job! Here's your performance summary</p>
          
          <div className="score-circle">
            <svg viewBox="0 0 36 36" className="score-svg">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#1e3a8a"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#00ccff"
                strokeWidth="3"
                strokeDasharray={`${overallScore}, 100`}
                strokeLinecap="round"
              />
              <text x="18" y="20.35" className="score-text">{overallScore}%</text>
            </svg>
          </div>

          <div className="results-stats">
            <div className="stat-item">
              <span className="stat-label">Questions Answered</span>
              <span className="stat-value">{questions.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Interviewer</span>
              <span className="stat-value">{selectedAvatar?.name}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Grammar Checked</span>
              <span className="stat-value">{grammarChecked ? "✅" : "✓"}</span>
            </div>
          </div>

          <div className="results-actions">
            <button onClick={restartInterview} className="action-btn primary">
              Try Another Interview
            </button>
            <Link to="/dashboard" className="action-btn secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Standard Interview Screen (Text Mode)
  return (
    <div className="interview-wrapper">
      <div className="standard-interview">
        <div className="interview-header">
          <div className="header-left">
            <button onClick={goBackToSelection} className="back-button">
              ← Change
            </button>
            <div className="interviewer-info">
              <div className="interviewer-mini-avatar" style={{ background: selectedAvatar?.color }}>
                {selectedAvatar?.name.charAt(0)}
              </div>
              <div>
                <h3>{selectedAvatar?.name}</h3>
                <span className="role-tag">{selectedAvatar?.role}</span>
              </div>
            </div>
          </div>
          <button onClick={endInterview} className="end-btn">End Interview</button>
        </div>

        <div className="interview-main">
          <div className="ai-visualization">
            <div className={`ai-status-indicator ${isAISpeaking ? 'speaking' : 'listening'}`}>
              <div className="pulse-ring"></div>
              <div className="avatar-circle-large" style={{ background: selectedAvatar?.color }}>
                {selectedAvatar?.name.charAt(0)}
              </div>
            </div>
            <p className="ai-status-text">
              {isAISpeaking ? "AI is speaking..." : isProcessing ? "Analyzing..." : "Waiting for your response..."}
            </p>
          </div>

          <div className="chat-container">
            {messages.map((msg) => (
              <div key={msg.id} className={`message-wrapper ${msg.sender}`}>
                <div className="message-bubble">
                  <p>{msg.message}</p>
                  {msg.score && (
                    <span className="message-score-badge">Score: {msg.score}%</span>
                  )}
                  <span className="message-time">{msg.timestamp}</span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {interviewActive && (
            <div className="input-container">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your answer here... (Grammar will be checked)"
                onKeyPress={(e) => e.key === 'Enter' && !isProcessing && sendMessage()}
                className="message-input"
                disabled={isProcessing}
              />
              <button 
                onClick={sendMessage} 
                className={`send-btn ${isProcessing ? 'processing' : ''}`}
                disabled={isProcessing || !input.trim()}
              >
                {isProcessing ? 'Analyzing...' : 'Send'}
              </button>
            </div>
          )}

          {isProcessing && (
            <div className="analysis-indicator">
              <div className="spinner-small"></div>
              <span>Checking grammar and analyzing response...</span>
            </div>
          )}
        </div>

        <div className="progress-indicator">
          <div className="progress-steps">
            {questions.map((_, index) => (
              <div 
                key={index}
                className={`step ${index === currentQuestion ? 'active' : ''} ${index < currentQuestion ? 'completed' : ''}`}
              >
                {index + 1}
                {index < currentQuestion && <span className="check-mark">✓</span>}
              </div>
            ))}
          </div>
          <p className="progress-text">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Interview;