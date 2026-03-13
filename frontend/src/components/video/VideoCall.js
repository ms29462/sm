import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSocket from '@/hooks/useSocket';
import useWebRTC from '@/hooks/useWebRTC';
import { Button } from '@/components/ui/button';
import { Video as VideoIcon, VideoOff, Mic, MicOff, PhoneOff, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const VideoCall = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});

  const { socket, emit, on, off, isConnected } = useSocket();
  const {
    localStream,
    remoteStreams,
    getLocalMedia,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    closeConnection,
    stopLocalStream,
    toggleVideo,
    toggleAudio
  } = useWebRTC(socket, sessionId, user?.userId);

  // Initialize media and join session
  useEffect(() => {
    const initialize = async () => {
      try {
        await getLocalMedia();
        setIsInitialized(true);

        if (socket && isConnected) {
          emit('join_video_session', {
            session_id: sessionId,
            user_id: user.userId,
            username: user.email,
            role: user.role,
            is_observer: false
          });
        }
      } catch (error) {
        console.error('Failed to initialize media:', error);
        toast.error('Failed to access camera/microphone');
      }
    };

    if (socket && isConnected && !isInitialized) {
      initialize();
    }

    return () => {
      stopLocalStream();
      participants.forEach(p => closeConnection(p.user_id));
    };
  }, [socket, isConnected]);

  // Set local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set remote video streams
  useEffect(() => {
    Object.entries(remoteStreams).forEach(([peerId, stream]) => {
      if (remoteVideoRefs.current[peerId]) {
        remoteVideoRefs.current[peerId].srcObject = stream;
      }
    });
  }, [remoteStreams]);

  // Handle WebRTC signaling
  useEffect(() => {
    if (!socket) return;

    const handleParticipantJoined = async (data) => {
      console.log('Participant joined:', data);
      setParticipants(data.participants);

      // Create offer for new participant (if not observer)
      if (data.user_id !== user.userId && !data.is_observer && localStream) {
        const offer = await createOffer(data.user_id);
        emit('webrtc_offer', {
          session_id: sessionId,
          from_user: user.userId,
          target_user: data.user_id,
          offer: offer
        });
      }
    };

    const handleParticipantLeft = (data) => {
      console.log('Participant left:', data.user_id);
      closeConnection(data.user_id);
      setParticipants(prev => prev.filter(p => p.user_id !== data.user_id));
    };

    const handleWebRTCOffer = async (data) => {
      console.log('Received offer from:', data.from_user);
      const answer = await handleOffer(data.from_user, data.offer);
      emit('webrtc_answer', {
        session_id: sessionId,
        from_user: user.userId,
        answer: answer
      });
    };

    const handleWebRTCAnswer = async (data) => {
      console.log('Received answer from:', data.from_user);
      await handleAnswer(data.from_user, data.answer);
    };

    const handleICECandidate = async (data) => {
      console.log('Received ICE candidate from:', data.from_user);
      await handleIceCandidate(data.from_user, data.candidate);
    };

    on('participant_joined', handleParticipantJoined);
    on('participant_left', handleParticipantLeft);
    on('webrtc_offer', handleWebRTCOffer);
    on('webrtc_answer', handleWebRTCAnswer);
    on('webrtc_ice_candidate', handleICECandidate);

    return () => {
      off('participant_joined', handleParticipantJoined);
      off('participant_left', handleParticipantLeft);
      off('webrtc_offer', handleWebRTCOffer);
      off('webrtc_answer', handleWebRTCAnswer);
      off('webrtc_ice_candidate', handleICECandidate);
    };
  }, [socket, on, off, emit, sessionId, user, localStream, createOffer, handleOffer, handleAnswer, handleIceCandidate, closeConnection]);

  const handleToggleVideo = () => {
    const enabled = toggleVideo();
    setVideoEnabled(enabled);
  };

  const handleToggleAudio = () => {
    const enabled = toggleAudio();
    setAudioEnabled(enabled);
  };

  const handleLeaveCall = () => {
    stopLocalStream();
    participants.forEach(p => closeConnection(p.user_id));
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-heading font-bold uppercase">VIDEO INTERVIEW</h2>
            <p className="text-sm text-muted-foreground">
              {isConnected ? `${participants.length} participant(s)` : 'Connecting...'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">{participants.length}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
          {/* Local Video */}
          <div data-testid="local-video" className="relative bg-card border border-border rounded-sm overflow-hidden aspect-video">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-sm">
              <span className="text-sm font-medium text-white">You</span>
            </div>
            {!videoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <VideoOff className="w-12 h-12 text-white" />
              </div>
            )}
          </div>

          {/* Remote Videos */}
          {participants
            .filter(p => p.user_id !== user.userId && !p.is_observer)
            .map((participant) => (
              <div
                key={participant.user_id}
                data-testid={`remote-video-${participant.user_id}`}
                className="relative bg-card border border-border rounded-sm overflow-hidden aspect-video"
              >
                <video
                  ref={el => remoteVideoRefs.current[participant.user_id] = el}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-sm">
                  <span className="text-sm font-medium text-white">
                    {participant.username}
                  </span>
                </div>
                {!remoteStreams[participant.user_id] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <Users className="w-12 h-12 text-white/50" />
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Call Controls */}
      <div className="bg-card border-t border-border p-6">
        <div className="flex items-center justify-center space-x-4">
          <Button
            data-testid="toggle-video-btn"
            size="lg"
            onClick={handleToggleVideo}
            className={`rounded-full w-14 h-14 ${
              videoEnabled
                ? 'bg-muted hover:bg-muted/80'
                : 'bg-destructive hover:bg-destructive/90'
            }`}
          >
            {videoEnabled ? <VideoIcon className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>

          <Button
            data-testid="toggle-audio-btn"
            size="lg"
            onClick={handleToggleAudio}
            className={`rounded-full w-14 h-14 ${
              audioEnabled
                ? 'bg-muted hover:bg-muted/80'
                : 'bg-destructive hover:bg-destructive/90'
            }`}
          >
            {audioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>

          <Button
            data-testid="leave-call-btn"
            size="lg"
            onClick={handleLeaveCall}
            className="rounded-full w-14 h-14 bg-destructive hover:bg-destructive/90"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;