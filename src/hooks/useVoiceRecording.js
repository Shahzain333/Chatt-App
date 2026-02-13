import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import firebaseService from '../services/firebaseServices';
import { addMessage } from '../store/chatSlice';

const useVoiceRecording = ({ chatId, currentUser, selectedUser, setIsSending, dispatch }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isRecordingAllowed, setIsRecordingAllowed] = useState(false);
    const [playingAudio, setPlayingAudio] = useState(null);
    
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioRefs = useRef({});

    useEffect(() => {
        checkMicrophonePermission();
        
        return () => {
            if (isRecording) {
                stopRecording();
            }
        };
    }, []);

    const checkMicrophonePermission = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                toast.error('Your browser does not support voice recording');
                setIsRecordingAllowed(false);
                return;
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            setIsRecordingAllowed(true);
        } catch (error) {
            console.error('Microphone permission error:', error);
            setIsRecordingAllowed(false);
            toast.error('Microphone access is required for voice messages');
        }
    };

    const startRecording = async () => {
        try {
            if (!isRecordingAllowed) {
                await checkMicrophonePermission();
                if (!isRecordingAllowed) return;
            }

            audioChunksRef.current = [];
            setIsRecording(true);
            toast.info('Recording started... Speak now! Click stop to send.');

            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm;codecs=opus' 
                : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';

            if (!mimeType) {
                toast.error('Your browser does not support audio recording');
                setIsRecording(false);
                return;
            }

            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                if (audioChunksRef.current.length === 0) {
                    toast.error('No audio recorded');
                    return;
                }
                
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                await sendVoiceMessage(audioBlob);
                
                stream.getTracks().forEach(track => {
                    track.stop();
                    track.enabled = false;
                });
            };

            mediaRecorderRef.current.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                toast.error('Recording error occurred');
                stopRecording();
            };

            mediaRecorderRef.current.start(100);
        } catch (error) {
            console.error('Error starting recording:', error);
            toast.error('Failed to start recording: ' + error.message);
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            
            if (mediaRecorderRef.current.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => {
                    track.stop();
                    track.enabled = false;
                });
            }
        }
    };

    const sendVoiceMessage = async (audioBlob) => {
        if (!audioBlob || !selectedUser?.uid || !currentUser?.uid || !chatId) {
            toast.error('No recording to send');
            return;
        }

        try {
            setIsSending(true);
            
            const timestamp = new Date().getTime();
            const filename = `voice_message_${timestamp}.webm`;
            
            const audioFile = new File([audioBlob], filename, { 
                type: audioBlob.type,
                lastModified: timestamp 
            });

            const uploadedAttachment = await firebaseService.uploadFile(audioFile, chatId, currentUser.uid);
            
            await firebaseService.sendMessage(
                'Voice message', 
                chatId, 
                currentUser.uid, 
                selectedUser.uid,
                [uploadedAttachment]
            );

            const newMessage = {
                id: chatId,
                text: 'Voice message',
                sender: currentUser.email,
                attachments: [uploadedAttachment],
                timestamp: new Date().toISOString(),
            };
            
            dispatch(addMessage(newMessage));
            toast.success('Voice message sent!');
        } catch (error) {
            console.error('Error sending voice message:', error);
            toast.error('Failed to send voice message: ' + error.message);
        } finally {
            setIsSending(false);
        }
    };

    const toggleAudioPlay = (messageId, audioUrl) => {
        const audioElement = audioRefs.current[messageId];

        if (!audioElement) return;

        if (playingAudio === messageId) {
            audioElement.pause();
            setPlayingAudio(null);
        } else {
            if (playingAudio) {
                const currentAudio = audioRefs.current[playingAudio];
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio.currentTime = 0;
                }
            }

            audioElement.play();
            setPlayingAudio(messageId);

            audioElement.onended = () => {
                setPlayingAudio(null);
            };
            
            audioElement.onerror = () => {
                toast.error('Failed to play audio');
                setPlayingAudio(null);
            };
        }
    };

    return {
        isRecording,
        isRecordingAllowed,
        playingAudio,
        audioRefs,
        startRecording,
        stopRecording,
        toggleAudioPlay,
        checkMicrophonePermission,
    };
};

export default useVoiceRecording;