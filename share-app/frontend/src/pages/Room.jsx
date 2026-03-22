import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Send, File, Download, X, Copy, Check } from 'lucide-react';
import clsx from 'clsx';

const Room = () => {
  const { code } = useParams();
  const { socket } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket || !user) return;

    // Join room
    socket.emit('join_room', { code, userId: user._id, username: user.username });

    // Load local messages
    const localMsgs = localStorage.getItem(`messages_${code}`);
    if (localMsgs) {
      try { setMessages(JSON.parse(localMsgs)); } catch(e) {}
    }

    // Listen for messages
    const handleReceiveMessage = (data) => {
      setMessages((prev) => {
        const newMsgs = [...prev, data];
        localStorage.setItem(`messages_${code}`, JSON.stringify(newMsgs));
        return newMsgs;
      });
    };

    // Listen for typing
    const handleTyping = (data) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        if (data.isTyping) {
          newSet.add(data.username);
        } else {
          newSet.delete(data.username);
        }
        return newSet;
      });
    };

    const handleUserJoined = (data) => {
      // System message
      setMessages((prev) => [...prev, { system: true, text: `${data.username || 'A user'} joined the session` }]);
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleTyping);
    socket.on('user_joined', handleUserJoined);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleTyping);
      socket.off('user_joined', handleUserJoined);
    };
  }, [socket, code, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    const messageData = {
      code,
      senderId: user._id,
      senderName: user.username,
      text: inputText,
      isFile: false,
      timestamp: new Date().toISOString(),
    };

    socket.emit('send_message', messageData);
    setMessages((prev) => {
      const newMsgs = [...prev, messageData];
      localStorage.setItem(`messages_${code}`, JSON.stringify(newMsgs));
      return newMsgs;
    });
    setInputText('');
    
    // Clear typing
    socket.emit('typing', { code, username: user.username, isTyping: false });
    if(typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    
    if (socket) {
      socket.emit('typing', { code, username: user.username, isTyping: true });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { code, username: user.username, isTyping: false });
      }, 2000);
    }
  };

  // Setup Dropzone
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Check if file is too large for websocket
    if (file.size > 50 * 1024 * 1024) {
      alert('File is too large! Maximum size is 50MB for real-time WebSocket transfer.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10); // Start progress

    const reader = new FileReader();
    reader.onload = (e) => {
        setUploadProgress(50); // Reading done
        try {
            const fileData = e.target.result;
            
            const fileMessage = {
                code,
                senderId: user._id,
                senderName: user.username,
                isFile: true,
                fileId: Date.now().toString(), // local unique ID
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                fileData: fileData, // The base64 string
                timestamp: new Date().toISOString(),
            };

            setUploadProgress(80); // Processing done, emitting

            socket.emit('send_message', fileMessage);
            setMessages((prev) => {
                const newMsgs = [...prev, fileMessage];
                localStorage.setItem(`messages_${code}`, JSON.stringify(newMsgs));
                return newMsgs;
            });
            setUploadProgress(100);
        } catch (error) {
            console.error('File sharing failed', error);
            alert('File sharing failed');
        } finally {
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
            }, 500);
        }
    };
    
    reader.onerror = () => {
        alert('Failed to read file');
        setIsUploading(false);
        setUploadProgress(0);
    };
    
    reader.readAsDataURL(file);
  }, [code, socket, user]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    noClick: true, 
    noKeyboard: true 
  });

  const handleDownload = (fileData, fileName) => {
    try {
        if (!fileData) {
            alert('File data is not available.');
            return;
        }
        const link = document.createElement('a');
        link.href = fileData;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch(err) {
        console.error('Download failed', err);
        alert('File download failed');
    }
  };

  const copyCode = () => {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  }

  const formatFileSize = (bytes) => {
      if(bytes === 0) return '0 Bytes';
      const k = 1024, dm = 2, sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  return (
    <div className="w-full max-w-5xl h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden relative" {...getRootProps()}>
      
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center z-10">
        <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
                Session Active
            </h2>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-mono bg-white px-2 py-1 rounded border tracking-widest text-primary-700">{code}</span>
                <button onClick={copyCode} className="text-gray-400 hover:text-gray-600 transition">
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                </button>
            </div>
        </div>
        <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-gray-900 border px-3 py-1.5 rounded-lg bg-white">
            Leave Room
        </button>
      </div>

      {/* Drag overlay */}
      {isDragActive && (
        <div className="absolute inset-0 z-50 bg-primary-50/90 backdrop-blur-sm border-4 border-dashed border-primary-500 rounded-2xl flex flex-col items-center justify-center animate-pulse">
            <input {...getInputProps()} />
            <div className="bg-white p-6 rounded-full text-primary-600 shadow-xl mb-4">
                <File size={48} />
            </div>
            <h3 className="text-2xl font-bold text-primary-700">Drop files here to Share</h3>
            <p className="text-primary-600 mt-2">Any file type, unlimited size*</p>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-custom bg-white">
        {messages.map((msg, idx) => {
            if (msg.system) {
                return (
                    <div key={idx} className="flex justify-center my-4">
                        <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">{msg.text}</span>
                    </div>
                )
            }

            const isMine = msg.senderId === user._id;

            return (
                <div key={idx} className={clsx("flex max-w-[80%]", isMine ? "ml-auto flex-row-reverse" : "")}>
                    <div className={clsx(
                        "flex flex-col",
                        isMine ? "items-end" : "items-start"
                    )}>
                        <span className="text-xs text-gray-400 mb-1 px-1">{msg.senderName}</span>
                        
                        <div className={clsx(
                            "px-4 py-2.5 rounded-2xl shadow-sm",
                            isMine ? "bg-primary-600 text-white rounded-tr-sm" : "bg-gray-100 text-gray-900 rounded-tl-sm",
                            msg.isFile ? "p-0 overflow-hidden" : ""
                        )}>
                            {msg.isFile ? (
                                <div className="bg-gray-50 border border-gray-200 w-64 cursor-pointer hover:bg-gray-100 group transition-colors" onClick={() => handleDownload(msg.fileData, msg.fileName)}>
                                    <div className="p-4 flex items-start gap-4">
                                        <div className="bg-primary-100 p-2 rounded text-primary-600">
                                            <File size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-gray-900 truncate">{msg.fileName}</h4>
                                            <p className="text-xs text-gray-500 mt-1">{formatFileSize(msg.fileSize)}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between group-hover:bg-primary-50 transition-colors">
                                        <span className="text-xs font-medium text-primary-600">Download</span>
                                        <Download size={16} className="text-primary-600" />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm leading-relaxed">{msg.text}</p>
                            )}
                        </div>
                    </div>
                </div>
            )
        })}

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
            <div className="flex max-w-[80%] items-center text-gray-500 text-sm italic">
                {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-4">
            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-primary-500 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-right">{uploadProgress}%</span>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200 z-10">
        <form onSubmit={handleSendMessage} className="flex gap-4">
            {/* hidden upload input for button click instead of drop */}
            <input {...getInputProps()} id="file-upload" className="hidden" />
            <label htmlFor="file-upload" className="flex items-center justify-center p-3 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer transition-colors">
                <File size={20} />
            </label>
            <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder="Type a message or drag a file here..."
                className="flex-1 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent px-4 py-3 text-gray-900 transition-all outline-none"
            />
            <button
                type="submit"
                disabled={!inputText.trim()}
                className="flex items-center justify-center p-3 rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <Send size={20} className="ml-1" />
            </button>
        </form>
      </div>
    </div>
  );
};

export default Room;
