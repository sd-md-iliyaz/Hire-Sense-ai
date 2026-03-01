import React, { useState, useEffect, useCallback } from "react";
import "./Avatar.css";

const Avatar = () => {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [voices, setVoices] = useState([]);
  const [recognition, setRecognition] = useState(null);

  const questions = [
    "Tell me about yourself.",
    "What are your strengths?",
    "Why should we hire you?"
  ];

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error("Speech Recognition not supported");
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.lang = "en-US";
    recognitionInstance.interimResults = true;
    recognitionInstance.maxAlternatives = 1;
    recognitionInstance.continuous = false;
    
    setRecognition(recognitionInstance);

    // Request microphone permission
    requestMicrophonePermission();

    // Cleanup
    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionGranted(true);
      // Stop the stream immediately after permission is granted
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error("Microphone permission denied:", error);
      setPermissionGranted(false);
    }
  };

  // Text to Speech
  const speak = useCallback((text) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;
    
    // Select a professional voice
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google UK') || 
      voice.name.includes('Microsoft') || 
      voice.name.includes('Female')
    );
    
    if (preferredVoice) {
      speech.voice = preferredVoice;
    }
    
    speech.onstart = () => setIsSpeaking(true);
    speech.onend = () => setIsSpeaking(false);
    speech.onerror = (event) => {
      console.error("Speech error:", event);
      setIsSpeaking(false);
    };
    
    // Ensure speech synthesis is not paused
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    
    window.speechSynthesis.speak(speech);
  }, [voices]);

  // Speak automatically when question changes
  useEffect(() => {
    if (questions[questionIndex]) {
      // Small delay to ensure any previous speech is cancelled
      setTimeout(() => {
        speak(questions[questionIndex]);
      }, 100);
    }
  }, [questionIndex, speak]);

  // Speech Recognition
  const startListening = () => {
    if (!permissionGranted) {
      alert("Please allow microphone access to use voice features.");
      requestMicrophonePermission();
      return;
    }

    if (!recognition) {
      alert("Speech Recognition not supported in this browser. Please use Chrome.");
      return;
    }

    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    try {
      // Set up recognition handlers
      recognition.onstart = () => {
        setIsListening(true);
        console.log("Recognition started");
      };

      recognition.onresult = (event) => {
        const userSpeech = event.results[0][0].transcript;
        setTranscript(userSpeech);
        
        if (event.results[0].isFinal) {
          // Save answer
          setAnswers(prev => [...prev, {
            question: questions[questionIndex],
            answer: userSpeech
          }]);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log("Recognition ended");
        // Move to next question after 2 seconds
        setTimeout(() => {
          nextQuestion();
        }, 2000);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          alert("Microphone access denied. Please allow microphone access and try again.");
          setPermissionGranted(false);
        }
      };

      // Start recognition
      recognition.start();
    } catch (error) {
      console.error("Error starting recognition:", error);
      setIsListening(false);
    }
  };

  const nextQuestion = () => {
    setTranscript("");
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
    } else {
      speak("Interview completed. Thank you for your time.");
    }
  };

  const restartInterview = () => {
    setQuestionIndex(0);
    setTranscript("");
    setAnswers([]);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, [recognition]);

  return (
    <div className="avatar-container">
      <div className="avatar-header">
        <h1>AI Interview Assistant</h1>
        <p>Practice your interview skills with our AI avatar</p>
      </div>

      <div className="avatar-card">
        <div className="avatar-section">
          <div className="avatar-image-wrapper">
            <img
              src="https://i.imgur.com/6VBx3io.png"
              alt="Interview Avatar"
              className="avatar-image"
            />
            {(isSpeaking || isListening) && (
              <div className="avatar-status">
                <span className={`status-indicator ${isSpeaking ? 'speaking' : 'listening'}`}>
                  {isSpeaking ? '🔊 Speaking' : '🎤 Listening'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="interview-section">
          <div className="question-container">
            <span className="question-label">Question {questionIndex + 1} of {questions.length}</span>
            <h2 className="question-text">{questions[questionIndex]}</h2>
          </div>

          <div className="answer-container">
            {!permissionGranted && (
              <button onClick={requestMicrophonePermission} className="permission-button">
                🎤 Allow Microphone Access
              </button>
            )}
            
            <button 
              onClick={startListening} 
              className={`listen-button ${isListening ? 'listening' : ''} ${!permissionGranted ? 'disabled' : ''}`}
              disabled={isListening || isSpeaking || !permissionGranted}
            >
              {isListening ? (
                <>
                  <span className="pulse-dot"></span>
                  Listening...
                </>
              ) : (
                <>
                  🎤 Start Answering
                </>
              )}
            </button>

            {transcript && (
              <div className="transcript-box">
                <h3>Your Answer:</h3>
                <p className="transcript-text">{transcript}</p>
              </div>
            )}
          </div>

          {answers.length > 0 && (
            <div className="answers-history">
              <h3>Interview Progress</h3>
              <div className="answers-list">
                {answers.map((item, index) => (
                  <div key={index} className="answer-item">
                    <span className="answer-question">Q{index + 1}: {item.question}</span>
                    <p className="answer-response">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {questionIndex === questions.length - 1 && transcript && (
            <button onClick={restartInterview} className="restart-button">
              🔄 Start New Interview
            </button>
          )}
        </div>
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Avatar;